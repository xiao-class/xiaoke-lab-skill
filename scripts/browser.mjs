// Dependency-free driver for a locally installed Chromium-family browser (Chrome, Edge,
// Chromium, Brave) over the DevTools protocol. Used only by the optional real-render
// scripts (screenshot-course, record-course); validate/preview/build never need a browser.
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {root} from './common.mjs';

export function findBrowser() {
  const explicit = process.env.XIAOKE_BROWSER || process.env.CHROME_PATH;
  if (explicit) { if (fs.existsSync(explicit)) return explicit; throw new Error(`XIAOKE_BROWSER 指向的浏览器不存在：${explicit}`); }
  const home = os.homedir(), candidates = [];
  if (process.platform === 'darwin') {
    for (const base of ['/Applications', path.join(home, 'Applications')]) candidates.push(
      `${base}/Google Chrome.app/Contents/MacOS/Google Chrome`, `${base}/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`,
      `${base}/Chromium.app/Contents/MacOS/Chromium`, `${base}/Brave Browser.app/Contents/MacOS/Brave Browser`);
  } else if (process.platform === 'win32') {
    for (const base of [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean)) candidates.push(
      path.join(base, 'Google/Chrome/Application/chrome.exe'), path.join(base, 'Microsoft/Edge/Application/msedge.exe'), path.join(base, 'Chromium/Application/chrome.exe'));
  } else {
    for (const dir of (process.env.PATH || '').split(path.delimiter)) for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'brave-browser']) candidates.push(path.join(dir, name));
  }
  return candidates.find(file => fs.existsSync(file)) || null;
}

/** Opens one headless page. Throws a readable message when no browser or WebSocket is available. */
export async function openPage({width = 1280, height = 720, scale = 1} = {}) {
  if (typeof WebSocket === 'undefined') throw new Error('真实渲染脚本需要 Node.js ≥ 22（使用内置 WebSocket）。当前版本：' + process.version);
  const executable = findBrowser();
  if (!executable) throw new Error('未找到 Chrome / Edge / Chromium。请安装其一，或用环境变量 XIAOKE_BROWSER 指定浏览器可执行文件。');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoke-browser-'));
  const args = ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--hide-scrollbars', '--mute-audio', '--ignore-gpu-blocklist', '--enable-webgl', '--enable-unsafe-swiftshader',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--force-color-profile=srgb', `--window-size=${width},${height}`, 'about:blank'];
  const child = spawn(executable, args, {stdio: ['ignore', 'ignore', 'pipe']});
  const cleanup = () => { try { child.kill(); } catch {} try { fs.rmSync(profile, {recursive: true, force: true, maxRetries: 5, retryDelay: 100}); } catch {} };
  try {
    const port = await new Promise((resolve, reject) => {
      let log = '';
      const timer = setTimeout(() => reject(new Error('浏览器启动超时：\n' + log.slice(-600))), 30000);
      child.stderr.on('data', chunk => { log += chunk; const m = log.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//); if (m) { clearTimeout(timer); resolve(Number(m[1])); } });
      child.on('exit', code => { clearTimeout(timer); reject(new Error(`浏览器提前退出（${code}）：\n` + log.slice(-600))); });
      child.on('error', error => { clearTimeout(timer); reject(error); });
    });
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const target = targets.find(t => t.type === 'page');
    if (!target) throw new Error('浏览器没有可用页面');
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = () => reject(new Error('无法连接浏览器调试端口')); });
    let serial = 0;
    const pending = new Map(), listeners = new Map(), errors = [];
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id) { const job = pending.get(message.id); pending.delete(message.id); if (!job) return; message.error ? job.reject(new Error(`${job.method}: ${message.error.message}`)) : job.resolve(message.result); }
      else (listeners.get(message.method) || []).forEach(fn => fn(message.params));
    };
    const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++serial; pending.set(id, {resolve, reject, method}); socket.send(JSON.stringify({id, method, params})); });
    const on = (method, fn) => { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(fn); };
    on('Runtime.exceptionThrown', p => errors.push(p.exceptionDetails?.exception?.description || p.exceptionDetails?.text || '页面异常'));
    on('Runtime.consoleAPICalled', p => { if (p.type === 'error') errors.push(p.args.map(a => a.value ?? a.description ?? '').join(' ')); });
    await send('Page.enable'); await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: scale, mobile: false});
    return {
      send, on, errors, width, height, scale,
      async goto(url) { const loaded = new Promise(resolve => on('Page.loadEventFired', resolve)); await send('Page.navigate', {url}); await loaded; },
      async evaluate(expression) {
        const result = await send('Runtime.evaluate', {expression, awaitPromise: true, returnByValue: true});
        if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
        return result.result.value;
      },
      async screenshot({format = 'png', quality} = {}) {
        const result = await send('Page.captureScreenshot', {format, ...(quality ? {quality} : {}), captureBeyondViewport: false});
        return Buffer.from(result.data, 'base64');
      },
      close() { try { socket.close(); } catch {} cleanup(); },
    };
  } catch (error) { cleanup(); throw error; }
}

/** `.js` courses are validated and packed first; `.html` files are opened as they are. */
export function courseHtml(input, includes = []) {
  if (/\.html?$/i.test(input)) return {file: path.resolve(input), temporary: false};
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'xiaoke-course-')), path.basename(input).replace(/\.[^.]+$/, '') + '.html');
  const built = spawnSync(process.execPath, [path.join(root, 'scripts/build-course.mjs'), input, '-o', file, ...includes.flatMap(x => ['--include', x])], {stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8'});
  if (built.status !== 0) throw new Error('课件未通过校验，无法渲染。先运行 validate-course.mjs 修复错误。');
  return {file, temporary: true};
}

/** Opens a packed course with the manual clock engaged: nothing moves until `advance`. */
export async function openCourse(htmlFile, options = {}) {
  const page = await openPage(options);
  try {
    await page.goto(pathToFileURL(htmlFile).href);
    const ready = await page.evaluate(`new Promise(resolve=>{const started=Date.now();(function poll(){const lab=window.__xiaokeLab;if(lab&&lab.auto)resolve(true);else if(Date.now()-started>20000)resolve(false);else setTimeout(poll,50);})();})`);
    if (!ready) throw new Error('课件没有启动（未找到运行时自动化接口）。' + (page.errors.length ? '\n页面错误：' + page.errors.slice(0, 3).join('\n') : ''));
    const info = await page.evaluate(`(async()=>{const a=__xiaokeLab.auto;await Promise.race([a.ready(),new Promise(r=>setTimeout(r,15000))]);a.manual(true);a.hold(true);a.dialogs(false);${options.quality ? `a.quality(${JSON.stringify(options.quality)});` : ''}${options.clean ? 'a.clean(true);' : ''}const gl=a.scene.renderer.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');a.tick(1/30,30,false);a.tick(1/30,2);return {steps:a.engine.config.steps.map(s=>({id:s.id,title:s.title,mistakes:(s.mistakes||[]).map(m=>({id:m.id,trigger:m.trigger,title:m.title}))})),gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'unknown'};})()`);
    return Object.assign(page, {info});
  } catch (error) { page.close(); throw error; }
}

const FLUSH = 'const flush=async()=>{for(let i=0;i<24;i++)await null;};';
/** Advances the lesson until step `index` has finished and the camera has settled. */
export async function finishStep(page, index, {dt = 1 / 30, limit = 9000} = {}) {
  const result = await page.evaluate(`(async()=>{${FLUSH}const a=__xiaokeLab.auto,state=__xiaokeLab.state;let n=0;
    for(;n<${limit};n++){const s=state();if(s.error)return {error:s.error};if(s.index>${index})break;if(s.index===${index}&&s.completed.includes(${index})&&!s.busy)break;a.poke();await flush();a.tick(${dt},1,false);await flush();}
    if(n>=${limit})return {error:'步骤没有在限定帧数内完成'};a.tick(${dt},45,false);a.tick(${dt},2);return {frames:n};})()`);
  if (result.error) throw new Error(`第 ${index + 1} 步：${result.error}`);
  return result;
}
/** Runs one "假如这样做" branch to its lesson card, calls `capture`, then rewinds. */
export async function playMistake(page, trigger, capture, {dt = 1 / 30, limit = 9000} = {}) {
  const started = await page.evaluate(`(async()=>{${FLUSH}const a=__xiaokeLab.auto,state=__xiaokeLab.state;for(let i=0;i<200;i++){const s=state();if(s.busy){a.tick(${dt},1,false);await flush();continue;}if(s.prediction||s.explanations.length){a.poke();await flush();continue;}break;}
    void a.mistake(${JSON.stringify(trigger)});await flush();let n=0;for(;n<${limit};n++){const s=state();if(s.mistake&&s.mistake.phase==='lesson')break;if(!s.mistake&&n>5)return {error:'无法触发该分支'};a.tick(${dt},1,false);await flush();}a.tick(${dt},2);return {frames:n};})()`);
  if (started.error) throw new Error(started.error);
  await capture();
  await page.evaluate(`(async()=>{${FLUSH}const a=__xiaokeLab.auto,state=__xiaokeLab.state;a.poke();await flush();for(let n=0;n<${limit};n++){const s=state();if(!s.mistake&&!s.busy&&!s.restoring)break;a.tick(${dt},1,false);await flush();}a.tick(${dt},30,false);a.tick(${dt},2);})()`);
}
