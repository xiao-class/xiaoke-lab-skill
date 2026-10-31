#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {root,load,fail,readIncludes,includeArgs} from './common.mjs';
try {
  const args = process.argv.slice(2), input = args[0], oi = args.indexOf('-o');
  if (!input || oi < 0 || !args[oi+1]) throw new Error('用法：node scripts/build-course.mjs 课件.js -o 课件.html [--include 附加.js] [--skip-validate]');
  const includes=includeArgs(args);
  if(args.includes('--skip-validate')) console.warn('⚠️  警告：已使用 --skip-validate，课件未经校验！');
  else {
    const checked=spawnSync(process.execPath,[path.join(root,'scripts/validate-course.mjs'),input,...includes.flatMap(x=>['--include',x])],{stdio:'inherit'});
    if(checked.error) throw checked.error;
    if(checked.status!==0) throw new Error('校验失败，未生成课件；修复错误后重试。');
  }
  const {config,source} = load(input,includes);
  const extras=readIncludes(input,includes);
  if (!config || typeof config.title !== 'string' || !config.title.trim()) throw new Error('配置必须提供非空 title');
  const htmlEscape = s => s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const scriptEscape = s => s.replace(/<\/script/gi, '<\\/script');
  const runtime = fs.readFileSync(path.join(root,'runtime/xiaoke-lab.runtime.js'),'utf8');
  const assets = fs.readFileSync(path.join(root,'runtime/assets.js'),'utf8');
  const color = ({chemistry:'#008b82',physics:'#4f55ad',biology:'#438456'})[config.subject] || '#4f55ad';
  const html = `<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="${color}"><title>${htmlEscape(config.title)}</title><style>html,body,#xiaoke-root{width:100%;height:100%;margin:0}body{font-family:system-ui,-apple-system,sans-serif}</style></head><body><main id="xiaoke-root"></main><script>${scriptEscape(assets)}</script><script>${scriptEscape(runtime)}</script>${extras.map(x=>`<script>${scriptEscape(x.source)}</script>`).join('')}<script>${scriptEscape(source)}\n;XiaokeLab.mount(document.getElementById('xiaoke-root'),globalThis.__xiaokeConfig);</script></body></html>`;
  fs.writeFileSync(args[oi+1],html); console.log(`已生成 ${args[oi+1]} (${(Buffer.byteLength(html)/1048576).toFixed(2)} MiB)`);
} catch(error) { fail(error); }
