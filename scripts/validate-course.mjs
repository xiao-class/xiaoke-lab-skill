#!/usr/bin/env node
import {load,fail,includeArgs} from './common.mjs';
import {inspect} from './geometry.mjs';

async function validate(file,includes=[]) {
 const {config:c,api}=load(file,includes), errors=[], warnings=[];
 const error=(where,msg)=>errors.push(`${where}: ${msg}`), warn=(where,msg)=>warnings.push(`${where}: ${msg}`);
 if(!c||typeof c!=='object') throw Error('export default 必须是实验配置对象');
 for(const k of ['id','title']) if(typeof c[k]!=='string'||!c[k].trim()) error(k,'必须是非空字符串');
 if(!['chemistry','physics','biology'].includes(c.subject)) error('subject','必须是 chemistry、physics 或 biology');
 if(typeof c.setup!=='function') error('setup','必须是函数');
 if(!Array.isArray(c.steps)||!c.steps.length) error('steps','必须是非空数组');
 if(errors.length){errors.forEach(x=>console.error('错误：'+x));return false;}
 const ids=new Set(), steps=c.steps;
 if(c.geometryExceptions!==undefined&&(!Array.isArray(c.geometryExceptions)||c.geometryExceptions.some(e=>!e||!['overlap','scale'].includes(e.kind)||!Array.isArray(e.ids)||e.ids.length!==(e.kind==='overlap'?2:1)||e.ids.some(id=>typeof id!=='string'||!id.trim())||typeof e.reason!=='string'||!e.reason.trim())))error('geometryExceptions','每项需要有效 kind、器材 ids 和非空 reason');
 for(const [i,s] of steps.entries()){
  const at=`steps[${i}]`;
  if(!s||typeof s!=='object'){error(at,'必须是对象');continue;}
  for(const k of ['id','title','description']) if(typeof s[k]!=='string'||!s[k].trim()) error(`${at}.${k}`,'必须是非空字符串');
  if(ids.has(s.id)) error(`${at}.id`,'步骤 id 重复');ids.add(s.id);
  if(typeof s.run!=='function') error(`${at}.run`,'必须是函数');
  if(s.action&&s.actions) error(at,'action 和 actions 不能同时提供');
  if(s.actions!==undefined && (!Array.isArray(s.actions)||!s.actions.length)) error(`${at}.actions`,'必须是非空数组');
  const actions=Array.isArray(s.actions)?s.actions:(s.action?[s.action]:[]);
  for(const [j,a] of actions.entries()) if(!a||typeof a.label!=='string'||!a.label.trim()||(a.run!==undefined&&typeof a.run!=='function')) error(`${at}.actions[${j}]`,'需要 label；run 若提供必须是函数');
  if(!s.camera) warn(at,'缺少 camera');
  if(!s.observation) warn(at,'缺少 observation');
  if(s.predict){const p=s.predict;
    if(typeof p.question!=='string'||!p.question.trim()||typeof p.explain!=='string'||!p.explain.trim()) error(`${at}.predict`,'需要 question 和 explain');
    if(!Array.isArray(p.options)||p.options.length<3||p.options.some(o=>!o||typeof o.id!=='string'||!o.id.trim()||typeof o.text!=='string'||!o.text.trim())||new Set(p.options.map(o=>o.id)).size!==p.options.length) error(`${at}.predict.options`,'至少需要三个 id 唯一且含非空 text 的选项');
    else if(!p.options.some(o=>o.id===p.answer)) error(`${at}.predict.answer`,'必须等于一个选项的 id');
  }
  if(s.mistakes!==undefined&&!Array.isArray(s.mistakes)) error(`${at}.mistakes`,'必须是数组');
  for(const [j,m] of (Array.isArray(s.mistakes)?s.mistakes:[]).entries()){
   for(const k of ['id','trigger','title','lesson']) if(typeof m?.[k]!=='string'||!m[k].trim())error(`${at}.mistakes[${j}].${k}`,'必须是非空字符串');
   if(typeof m?.consequence!=='function')error(`${at}.mistakes[${j}].consequence`,'必须是函数');
   if(m?.trigger && actions.filter(Boolean).some((a,k)=>k===0&&a.target===m.trigger))error(`${at}.mistakes[${j}].trigger`,'不能与首个主操作 target 相同，否则无法触发');
  }
 }
 for(const [i,s] of steps.entries()) if(s?.predict?.observeAt&&!ids.has(s.predict.observeAt)) error(`steps[${i}].predict.observeAt`,'引用的步骤不存在');
 const predictions=steps.filter(s=>s?.predict).length,mistakes=steps.reduce((n,s)=>n+(Array.isArray(s?.mistakes)?s.mistakes.length:0),0);
 if(c.minimums!==false){
  if(steps.length<6)error('steps',`只有 ${steps.length} 步，至少需要 6 步`);
  if(predictions<3)error('predict',`只有 ${predictions} 个预测，至少需要 3 个`);
  if(mistakes<3)error('mistakes',`只有 ${mistakes} 个假如分支，至少需要 3 个`);
 }
 if(errors.length){errors.forEach(x=>console.error('错误：'+x));warnings.forEach(x=>console.warn('警告：'+x));return false;}
 // A synchronous clock retains start/end frames and consequence recording while removing wall time.
 api.TweenClock.prototype.tween=function(_seconds,frame){frame(0);frame(1);return Promise.resolve();};
 const effectState=ctx=>JSON.stringify([...ctx.effects].map(([id,e])=>{const nodes=[];e.object?.traverse(o=>{const materials=Array.isArray(o.material)?o.material:(o.material?[o.material]:[]);nodes.push([o.visible,...o.position.toArray(),...o.rotation.toArray().slice(0,3),...o.scale.toArray(),materials.map(m=>[m.visible,m.opacity,m.color?.getHex()])]);});return [id,nodes];}));
 const flush=async()=>{for(let i=0;i<32;i++)await Promise.resolve();};
 const run=async (engine,promise,where)=>{await promise;await flush();if(engine.snapshot.error)throw Error(`${where}: ${engine.snapshot.error}`);};
 let engine;
 try{
  engine=new api.ExperimentEngine(c,new api.THREE.Group());
  // Stop at each completed step so automatic steps cannot skip branch checks.
  engine.subscribe(s=>{if(s.playing && !s.busy && s.completed.includes(s.index)) engine.pause();});
  const ctx=engine.ctx;
  for(const e of c.geometryExceptions||[])for(const id of e.ids)if(!ctx.apparatus.has(id))error('geometryExceptions',`器材 ${id} 不存在`);
  for(const [i,s] of steps.entries())if(s.camera){
   const focus=s.camera.focus;if(typeof focus!=='string'||!focus){error(`steps[${i}].camera.focus`,'必须是器材 id 或 器材id.锚点名');continue;}
   const [id,anchor,...rest]=focus.split('.'), item=ctx.apparatus.get(id);
   if(!item)error(`steps[${i}].camera.focus`,`器材 ${id} 不存在`);
   else if(rest.length||(anchor&&!item.anchors?.[anchor]))error(`steps[${i}].camera.focus`,`器材 ${id} 不存在锚点 ${anchor}`);
  }
  for(const id of c.framingApparatus||[])if(!ctx.apparatus.has(id))error('framingApparatus',`器材 ${id} 不存在`);
  const micro=c.secondView?.type==='micro'?c.secondView.data:c.micro;
  if(micro){
   if(typeof micro.channel!=='string'||!micro.channel.trim())error('micro.channel','必须是非空字符串');
   const source=micro.source, item=source&&ctx.apparatus.get(source.apparatus);
   if(!item)error('micro.source',`器材 ${source?.apparatus||'（未指定）'} 不存在`);
   else if(!source.anchor||!item.anchors?.[source.anchor])error('micro.source',`器材 ${source.apparatus} 不存在锚点 ${source.anchor||'（未指定）'}`);
   try{const view=api.views.createMicroView(micro);view.dispose();}catch(e){error('micro.data',e.message||String(e));}
  }else if(c.secondView?.type==='micro')error('micro.data','需要微观模型数据');

  const stateChanges=new Set();
  for(const [id,item] of ctx.apparatus)if(typeof item.setState==='function'){const original=item.setState;item.setState=function(key,value,...rest){stateChanges.add(`${id}.${String(key)}`);return original.call(this,key,value,...rest);};}
  console.log(`器材：${[...ctx.apparatus.keys()].join('、')||'无'}`);
  console.log(`内置现象：${[...ctx.effects.keys()].join('、')||'未使用（仍可能有自定义现象）'}`);
  // Save each step checkpoint before answering; separate engines exercise every branch independently.
  for(let i=0;i<steps.length;i++){
   if(engine.snapshot.index!==i)throw Error(`steps[${i}]：无法进入步骤（当前 ${engine.snapshot.index}）`);
   const stateBefore=Object.fromEntries(Object.entries(ctx.state).map(([k,v])=>[k,JSON.stringify(v)]));
   const checkpoint=engine.checkpoint();
   for(const [j,m] of (steps[i].mistakes||[]).entries()){
    const branch=new api.ExperimentEngine(c,new api.THREE.Group());
    try{
     await run(branch,branch.resume(checkpoint),`steps[${i}] 分支准备`);
     if(branch.snapshot.prediction){const play=branch.play;branch.play=()=>{};branch.answerPrediction(branch.snapshot.prediction.answer);branch.play=play;await flush();}
     if(branch.snapshot.index!==i||branch.snapshot.completed.includes(i)) throw Error('无法准备分支起点');
     if(branch.snapshot.explanations.length)branch.continueExplanation();
     const before={state:JSON.stringify(branch.ctx.state),progress:JSON.stringify(branch.ctx.progress),effects:effectState(branch.ctx),action:branch.snapshot.actionIndex};
     const acted=await branch.act(m.trigger);await flush();
     if(!acted||branch.snapshot.mistake?.phase!=='lesson')throw Error('无法触发分支或演示未结束');
     await run(branch,branch.rewindMistake(),`steps[${i}] rewind`);
     if(branch.snapshot.mistake||branch.snapshot.index!==i||branch.snapshot.actionIndex!==before.action)throw Error('倒带后分支、步骤或操作序号未恢复');
     if(JSON.stringify(branch.ctx.state)!==before.state||JSON.stringify(branch.ctx.progress)!==before.progress||effectState(branch.ctx)!==before.effects)throw Error('倒带后状态、进度或现象集合未恢复');
     if(branch.snapshot.action && !(await branch.act()))throw Error('倒带后主操作无法执行');
     await flush();if(branch.snapshot.error)throw Error(branch.snapshot.error);
    }catch(e){error(`steps[${i}].mistakes[${j}]`,e.message||String(e));}finally{branch.dispose();}
   }
   if(engine.snapshot.prediction){if(!engine.answerPrediction(engine.snapshot.prediction.answer))throw Error(`steps[${i}] 预测无法回答`);await flush();}
   for(let guard=0;guard<50&&engine.snapshot.index===i&&!engine.snapshot.finished;guard++){
    const s=engine.snapshot;
    if(s.explanations.length){engine.continueExplanation();await flush();continue;}
    if(s.busy){await flush();continue;}
    if(s.completed.includes(i)){engine.next();await flush();continue;}
    if(s.action){await run(engine,engine.act(),`steps[${i}] 主操作`);continue;}
    engine.play();await flush();if(engine.snapshot.error)throw Error(engine.snapshot.error);
   }
   if(!engine.snapshot.completed.includes(i))throw Error(`steps[${i}] 未完成，请检查步骤执行和门控`);
   for(const [key,value] of Object.entries(ctx.state))if(stateBefore[key]!==JSON.stringify(value))stateChanges.add(`state.${key}`);
   for(const issue of inspect(engine.ctx,api,c,steps[i])) (issue.severity==='error'?error:warn)(`steps[${i}].geometry`,issue.text);
  }
  console.log(`自定义状态变化（主流程）：${[...stateChanges].join('、')||'未检测到；器材变换和直接材质修改需人工检查'}`);
  if(engine.snapshot.explanations.length)engine.continueExplanation();
  if(!engine.snapshot.finished)throw Error('实验未能完成');
  for(const p of engine.snapshot.predictions)if(!p.observed)error('predict',`步骤 ${p.stepId} 的预测没有揭晓`);
 }catch(e){error('执行',e.stack||String(e));}finally{engine?.dispose();}
 console.log(`摘要：${steps.length} 步，${predictions} 个预测，${mistakes} 个假如分支`);
 warnings.forEach(x=>console.warn('警告：'+x));errors.forEach(x=>console.error('错误：'+x));
 if(!errors.length)console.log('校验通过');return !errors.length;
}
try {if(!process.argv[2])throw Error('用法：node scripts/validate-course.mjs 课件.js');if(!await validate(process.argv[2],includeArgs(process.argv.slice(3))))process.exitCode=1;}catch(error){fail(error)}
