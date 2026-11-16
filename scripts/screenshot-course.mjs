#!/usr/bin/env node
// Real-render screenshots: opens the packed course in a local headless Chrome/Edge and saves
// what a teacher will actually see after each step. Optional — needs a Chromium-family
// browser and Node ≥ 22; validate/preview/build work without either.
import fs from 'node:fs';
import path from 'node:path';
import {fail, includeArgs} from './common.mjs';
import {courseHtml, openCourse, finishStep, playMistake} from './browser.mjs';

const usage = `用法：node scripts/screenshot-course.mjs 课件.js|课件.html --out 截图.png
  --all                每一步结束后各截一张（默认）
  --steps 2,5          只截指定步骤（从 1 开始）
  --mistakes           同时截取每个“假如这样做”演示结束时的画面
  --closeup 器材.锚点   在每张截图后追加一张对准该锚点的特写，可重复（如 --closeup lamp.wick）
  --distance 3.2       特写时相机到锚点的距离（场景单位，默认 3.2）
  --clean              隐藏面板与标题，只留三维画面
  --size 1280x720      视口尺寸；--scale 2 为设备像素比
  --quality standard   用标准画质渲染（默认高画质）
  --include 附加.js     与 build-course.mjs 相同`;

function option(args, name, fallback) { const i = args.indexOf(name); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback; }
function options(args, name) { const out = []; args.forEach((a, i) => { if (a === name && args[i + 1]) out.push(args[i + 1]); }); return out; }

try {
  const args = process.argv.slice(2), input = args[0];
  const out = option(args, '--out');
  if (!input || input.startsWith('--') || !out) throw new Error(usage);
  const [width, height] = option(args, '--size', '1280x720').split('x').map(Number);
  if (!(width > 0 && height > 0)) throw new Error('--size 需要形如 1280x720');
  const scale = Number(option(args, '--scale', '1')), distance = Number(option(args, '--distance', '3.2'));
  const closeups = options(args, '--closeup');
  const {file, temporary} = courseHtml(input, includeArgs(args));
  const page = await openCourse(file, {width, height, scale, clean: args.includes('--clean'), quality: option(args, '--quality')});
  try {
    const steps = page.info.steps, wanted = option(args, '--steps');
    const selected = wanted ? new Set(wanted.split(',').map(n => Number(n) - 1)) : null;
    if (selected) for (const i of selected) if (!(i >= 0 && i < steps.length)) throw new Error(`--steps 超出范围：课件共有 ${steps.length} 步`);
    const base = out.replace(/\.(png|jpe?g)$/i, ''), jpeg = /\.jpe?g$/i.test(out), ext = jpeg ? '.jpg' : '.png';
    fs.mkdirSync(path.dirname(path.resolve(base)), {recursive: true});
    const save = async name => { const target = `${base}-${name}${ext}`; fs.writeFileSync(target, await page.screenshot(jpeg ? {format: 'jpeg', quality: 88} : {})); console.log('已保存 ' + target); };
    const shoot = async name => {
      await save(name);
      for (const [k, anchor] of closeups.entries()) {
        const done = await page.evaluate(`(()=>{const a=__xiaokeLab.auto,p=a.anchor(${JSON.stringify(anchor)});if(!p)return false;const c=a.scene.camera,t=a.scene.controls.target;window.__xklPose={position:c.position.toArray(),target:t.toArray(),view:c.view?{...c.view}:null};const d=c.position.clone().sub(t).normalize().multiplyScalar(${distance});a.view([p[0]+d.x,p[1]+d.y,p[2]+d.z],p);a.tick(0,1);return true;})()`);
        if (!done) { console.warn(`警告：找不到特写锚点 ${anchor}`); continue; }
        await save(`${name}-closeup${closeups.length > 1 ? k + 1 : ''}`);
        await page.evaluate(`(()=>{const a=__xiaokeLab.auto,p=window.__xklPose,c=a.scene.camera;c.position.fromArray(p.position);a.scene.controls.target.fromArray(p.target);c.view=p.view;c.updateProjectionMatrix();c.lookAt(a.scene.controls.target);a.tick(0,1);})()`);
      }
    };
    console.log(`渲染设备：${page.info.gpu}`);
    for (let i = 0; i < steps.length; i++) {
      const want = !selected || selected.has(i), number = String(i + 1).padStart(2, '0');
      if (want && args.includes('--mistakes')) for (const [j, mistake] of steps[i].mistakes.entries()) {
        await page.evaluate(`(async()=>{const a=__xiaokeLab.auto;for(let n=0;n<400;n++){const s=__xiaokeLab.state();if(s.index>=${i}&&!s.busy)break;a.poke();for(let k=0;k<24;k++)await null;a.tick(1/30,1,false);for(let k=0;k<24;k++)await null;}})()`);
        await playMistake(page, mistake.trigger, () => shoot(`${number}-mistake${j + 1}`));
      }
      await finishStep(page, i);
      if (want) await shoot(number);
      if (selected && [...selected].every(n => n <= i)) break;
    }
    if (page.errors.length) console.warn('页面报告了错误：\n' + [...new Set(page.errors)].slice(0, 5).join('\n'));
  } finally { page.close(); if (temporary) fs.rmSync(path.dirname(file), {recursive: true, force: true}); }
} catch (error) { fail(error.message && /^用法/.test(error.message) ? error.message : error); }
