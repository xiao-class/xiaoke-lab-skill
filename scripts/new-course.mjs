#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {root,fail} from './common.mjs';
try {
 const args=process.argv.slice(2), get=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1]};
 const id=get('--id'),subject=get('--subject'),title=get('--title'),out=get('-o') || `${id}.js`;
 if(!id||!/^[-a-z0-9]+$/.test(id)||!['physics','chemistry','biology'].includes(subject)||!title) throw new Error('用法：node scripts/new-course.mjs --id plane-mirror --subject physics --title "标题" [-o 文件.js]；id 只能使用小写字母、数字、连字符');
 const template=fs.readFileSync(path.join(root,'templates/course.template.js'),'utf8');
 const source=template.replaceAll('__ID__',JSON.stringify(id)).replaceAll('__SUBJECT__',JSON.stringify(subject)).replaceAll('__TITLE__',JSON.stringify(title));
 fs.writeFileSync(out,source,{flag:'wx'});console.log(`已生成 ${out}`);
} catch(error){fail(error)}
