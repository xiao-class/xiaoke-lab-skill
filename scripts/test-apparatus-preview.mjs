#!/usr/bin/env node
// Headless software-rasterizer smoke tests; no browser or image library required.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'xiaoke-apparatus-preview-'));
const names=['dcPowerSupply','wire','switch','bulb','electrolysisApparatus','thermometer','waterBath','asbestosGauze','ceramicGauze','tripod','stopwatch','pottedPlant','leaf','blackPaper','petriDish','dropper','label','tray'];
try {
 for(const name of names){
  const input=path.join(dir,name+'.js'),output=path.join(dir,name+'.png');
  const init=name==='dropper'?"'item'":"{id:'item'}";
  const state=name==='electrolysisApparatus'?"a.setState('progress',1);":name==='leaf'?"a.setState('covered',true);a.setState('covered',false);a.setState('decolorized',true);a.setState('blue',true);":name==='waterBath'||name==='thermometer'?"a.setState('temperature',80);":"a.setState('visible',true);";
  fs.writeFileSync(input,`export default XiaokeLab.defineExperiment({id:'test',subject:'physics',title:'器材预览',minimums:false,framingApparatus:['item'],setup(ctx){ctx.addApparatus(XiaokeLab.apparatus.${name}(${init}));},steps:[{id:'observe',title:'观察',description:'观察器材',action:{label:'观察',target:'item'},run(ctx){const a=ctx.getApparatus('item');${state}},observation:'观察器材。'}]});`);
  execFileSync(process.execPath,[path.join(here,'preview-course.mjs'),input,'--step','1','--out',output],{stdio:'pipe'});
  const png=fs.readFileSync(output);if(png.length<1000||png.readUInt32BE(0)!==0x89504e47)throw Error(`${name}: 无效预览 PNG`);
 }
 console.log(`通过 ${names.length} 项器材预览生成测试`);
} finally {fs.rmSync(dir,{recursive:true,force:true});}
