#!/usr/bin/env node
// Offline video of a lesson. The course runs on a manual clock in a local headless
// Chrome/Edge: every frame is advanced by exactly 1/fps, rendered at the top quality tier,
// captured and piped to ffmpeg. Speed of this machine changes how long the export takes,
// never how the video looks. Optional — needs a Chromium-family browser, Node ≥ 22 and ffmpeg.
import fs from 'node:fs';
import path from 'node:path';
import {spawn, spawnSync} from 'node:child_process';
import {fail, includeArgs} from './common.mjs';
import {courseHtml, openCourse} from './browser.mjs';

const usage = `用法：node scripts/record-course.mjs 课件.js|课件.html --out 视频.mp4
  --size 1920x1080     成片分辨率（默认 1920x1080）
  --fps 30             帧率（默认 30）
  --supersample 2      以 2 倍像素渲染再缩小，边缘更干净（1 或 2，默认 1）
  --steps 3-6          只录制这些步骤（从 1 开始；也可写 4 或 2,5）
  --hold 1.5           每一步完成后停留的秒数（默认 1.5）
  --ui                 保留右侧面板与标题（默认只录三维画面并叠加字幕）
  --no-captions        不叠加步骤字幕
  --frames 目录         不调用 ffmpeg，改为输出 JPEG 序列
  --include 附加.js     与 build-course.mjs 相同`;

const option = (args, name, fallback) => { const i = args.indexOf(name); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback; };
function stepSet(text, count) {
  if (!text) return null;
  const set = new Set();
  for (const part of text.split(',')) { const [a, b = a] = part.split('-').map(Number); if (!(a >= 1 && b >= a && b <= count)) throw new Error(`--steps 超出范围：课件共有 ${count} 步`); for (let i = a; i <= b; i++) set.add(i - 1); }
  return set;
}
const FLUSH = 'const flush=async()=>{for(let i=0;i<24;i++)await null;};';

try {
  const args = process.argv.slice(2), input = args[0], out = option(args, '--out'), framesDir = option(args, '--frames');
  if (!input || input.startsWith('--') || (!out && !framesDir)) throw new Error(usage);
  const [width, height] = option(args, '--size', '1920x1080').split('x').map(Number);
  if (!(width > 0 && height > 0) || width % 2 || height % 2) throw new Error('--size 需要形如 1920x1080，宽高为偶数');
  const fps = Number(option(args, '--fps', '30')), hold = Number(option(args, '--hold', '1.5'));
  const supersample = Number(option(args, '--supersample', '1')) >= 2 ? 2 : 1;
  if (!(fps >= 1 && fps <= 60)) throw new Error('--fps 需要在 1–60 之间');
  const ui = args.includes('--ui'), captions = !ui && !args.includes('--no-captions');
  if (!framesDir && spawnSync('ffmpeg', ['-version'], {stdio: 'ignore'}).status !== 0) throw new Error('未找到 ffmpeg。请安装 ffmpeg，或改用 --frames 目录 输出图片序列。');

  const {file, temporary} = courseHtml(input, includeArgs(args));
  const page = await openCourse(file, {width, height, scale: supersample, clean: !ui, quality: 'ultra'});
  let encoder, written = 0;
  try {
    const steps = page.info.steps, selected = stepSet(option(args, '--steps'), steps.length);
    console.log(`渲染设备：${page.info.gpu}`);
    if (framesDir) fs.mkdirSync(framesDir, {recursive: true});
    else {
      fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true});
      encoder = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
        ...(supersample > 1 ? ['-vf', `scale=${width}:${height}:flags=lanczos`] : []), '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], {stdio: ['pipe', 'inherit', 'inherit']});
      encoder.on('error', error => { throw error; });
    }
    const emit = async () => {
      const image = await page.screenshot({format: 'jpeg', quality: 95});
      if (framesDir) fs.writeFileSync(path.join(framesDir, `frame-${String(written).padStart(6, '0')}.jpg`), image);
      else if (!encoder.stdin.write(image)) await new Promise(resolve => encoder.stdin.once('drain', resolve));
      written++;
    };
    const dt = 1 / fps;
    const caption = (title, text = '') => captions ? page.evaluate(`__xiaokeLab.auto.caption(${JSON.stringify(title)},${JSON.stringify(text)})`) : null;
    const config = await page.evaluate(`__xiaokeLab.auto.engine.config.steps.map(s=>({title:s.title,observation:s.observation||''}))`);
    for (let i = 0; i < steps.length; i++) {
      const record = !selected || selected.has(i);
      if (selected && [...selected].every(n => n < i)) break;
      if (record) await caption(`第 ${i + 1} 步 · ${config[i].title}`);
      for (let frame = 0; ; frame++) {
        if (frame > fps * 600) throw new Error(`第 ${i + 1} 步超过 10 分钟仍未完成`);
        // Unrecorded steps are fast-forwarded without drawing.
        const state = await page.evaluate(`(async()=>{${FLUSH}const a=__xiaokeLab.auto,s=__xiaokeLab.state();if(s.error)return {error:s.error};
          if(s.index>${i}||(s.index===${i}&&s.completed.includes(${i})&&!s.busy))return {done:true};a.poke();await flush();a.tick(${dt},1,${record});await flush();return {done:false};})()`);
        if (state.error) throw new Error(`第 ${i + 1} 步：${state.error}`);
        if (state.done) break;
        if (record) await emit();
      }
      if (record) {
        await caption(`第 ${i + 1} 步 · ${config[i].title}`, config[i].observation);
        for (let frame = 0; frame < Math.round(hold * fps); frame++) { await page.evaluate(`__xiaokeLab.auto.tick(${dt},1)`); await emit(); }
        process.stdout.write(`\r已录制 ${i + 1}/${steps.length} 步，${written} 帧（${(written / fps).toFixed(1)} 秒）`);
      }
    }
    process.stdout.write('\n');
    if (encoder) { encoder.stdin.end(); const code = await new Promise(resolve => encoder.on('close', resolve)); if (code !== 0) throw new Error('ffmpeg 编码失败'); console.log(`已生成 ${out}`); }
    else console.log(`已输出 ${written} 帧到 ${framesDir}`);
    if (page.errors.length) console.warn('页面报告了错误：\n' + [...new Set(page.errors)].slice(0, 5).join('\n'));
  } finally { try { encoder?.stdin.destroy(); } catch {} page.close(); if (temporary) fs.rmSync(path.dirname(file), {recursive: true, force: true}); }
} catch (error) { fail(error.message && /^用法/.test(error.message) ? error.message : error); }
