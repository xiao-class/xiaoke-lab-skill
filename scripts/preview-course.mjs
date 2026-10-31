#!/usr/bin/env node
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import {load,fail} from './common.mjs';
import {geometry,shot} from './geometry.mjs';

// A small dependency-free software renderer. It intentionally favors diagnostic
// geometry over the WebGL material/effect fidelity of the actual presentation.
const W=1000,H=850, MAIN=600;
function png(pixels){
 const crc=b=>{let c=0xffffffff;for(const n of b){c^=n;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;};
 const chunk=(name,data)=>{const n=Buffer.from(name),b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);n.copy(b,4);data.copy(b,8);b.writeUInt32BE(crc(Buffer.concat([n,data])),8+data.length);return b;};
 const raw=Buffer.alloc((W*4+1)*H);for(let y=0;y<H;y++)pixels.copy(raw,y*(W*4+1)+1,y*W*4,(y+1)*W*4);
 const header=Buffer.alloc(13);header.writeUInt32BE(W);header.writeUInt32BE(H,4);header[8]=8;header[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
function renderer(){
 const p=Buffer.alloc(W*H*4),z=new Float64Array(W*H).fill(Infinity);for(let i=0;i<W*H;i++){p[i*4]=235;p[i*4+1]=240;p[i*4+2]=237;p[i*4+3]=255;}
 const pixel=(x,y,c,d=-Infinity,alpha=1,depthWrite=true)=>{x=Math.round(x);y=Math.round(y);if(x<0||x>=W||y<0||y>=H)return;const k=y*W+x;if(d>z[k])return;if(depthWrite)z[k]=d;const i=k*4;for(let n=0;n<3;n++)p[i+n]=Math.round(c[n]*alpha+p[i+n]*(1-alpha));};
 const line=(a,b,c)=>{const n=Math.ceil(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1])));for(let i=0;i<=n;i++){const t=i/Math.max(1,n);pixel(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,c,-Infinity);}};
 const rect=(x,y,w,h,c,fill=false)=>{if(fill){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)pixel(xx,yy,c);}else{line([x,y],[x+w,y],c);line([x+w,y],[x+w,y+h],c);line([x+w,y+h],[x,y+h],c);line([x,y+h],[x,y],c);}};
 const tri=(a,b,c,col,clip,alpha=1,depthWrite=true,overlay=false,sample=null)=>{if(![...a,...b,...c].every(Number.isFinite))return;const area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(area)<.001)return;const minX=Math.max(clip.x,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(clip.x+clip.w-1,Math.ceil(Math.max(a[0],b[0],c[0]))),minY=Math.max(clip.y,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(clip.y+clip.h-1,Math.ceil(Math.max(a[1],b[1],c[1])));for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const v=((b[0]-x)*(c[1]-y)-(b[1]-y)*(c[0]-x))/area,w=((c[0]-x)*(a[1]-y)-(c[1]-y)*(a[0]-x))/area,u=1-v-w;if(v>=0&&w>=0&&u>=0)pixel(x,y,sample?sample(v,w,u):col,overlay?-Infinity:v*a[2]+w*b[2]+u*c[2],alpha,depthWrite);}};
 return {p,pixel,line,rect,tri};
}
// ASCII labels remain readable without fonts, browser APIs, or image dependencies.
const font={'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['110','001','111','100','111'],'3':['110','001','011','001','110'],'4':['101','101','111','001','001'],'5':['111','100','110','001','110'],'6':['011','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],'9':['111','101','111','001','110'],'.':['000','000','000','000','010'],'%':['101','001','010','100','101'],':':['000','010','000','010','000'],A:['010','101','111','101','101'],B:['110','101','110','101','110'],C:['011','100','100','100','011'],D:['110','101','101','101','110'],E:['111','100','110','100','111'],F:['111','100','110','100','100'],H:['101','101','111','101','101'],I:['111','010','010','010','111'],L:['100','100','100','100','111'],M:['101','111','111','101','101'],N:['101','111','111','111','101'],O:['010','101','101','101','010'],P:['110','101','110','100','100'],R:['110','101','110','101','101'],S:['011','100','010','001','110'],T:['111','010','010','010','010'],V:['101','101','101','101','010'],W:['101','101','111','111','101'],Y:['101','101','010','010','010'],' ':['000','000','000','000','000']};
function label(r,text,x,y,color=[35,48,52]){for(const ch of text){const rows=font[ch]||font[' '];rows.forEach((row,yy)=>[...row].forEach((v,xx)=>{if(v==='1')for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)r.pixel(x+xx*2+dx,y+yy*2+dy,color);}));x+=8;}}
// Minimal Canvas 2D subset for diagnostic previews. Chinese text is represented
// by outlined glyph boxes; geometry and colours are drawn from the course itself.
function drawCustom2d(r,view,state,box){
 const aspect=view.aspect||1,w=aspect>=1?box.width:box.width*aspect,h=aspect>=1?box.height/aspect:box.height;
 const ox=box.x+(box.width-w)/2,oy=box.y+(box.height-h)/2,clip={x:Math.ceil(ox),y:Math.ceil(oy),w:Math.floor(w),h:Math.floor(h)};
 const col=value=>{let s=String(value||'#000').trim().toLowerCase(),m=s.match(/^#([0-9a-f]{6}|[0-9a-f]{3})/i);if(m){let v=m[1];if(v.length===3)v=[...v].map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16));}m=s.match(/^rgba?\(([^)]+)\)/);if(m)return m[1].split(',').slice(0,3).map(Number);return ({white:[255,255,255],black:[0,0,0],red:[220,40,40],blue:[50,90,200],green:[40,145,60],orange:[235,150,35],transparent:[235,240,237]})[s]||[80,95,100];};
 let paths=[],current=null,matrix=[1,0,0,1,0,0],stack=[];const point=(x,y)=>[ox+matrix[0]*x+matrix[2]*y+matrix[4],oy+matrix[1]*x+matrix[3]*y+matrix[5],0];
 const segment=(a,b,color,width=1)=>{const n=Math.ceil(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1])));for(let i=0;i<=n;i++){const t=i/Math.max(1,n),x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;for(let dy=-Math.floor(width/2);dy<=Math.floor(width/2);dy++)for(let dx=-Math.floor(width/2);dx<=Math.floor(width/2);dx++)if(x+dx>=clip.x&&x+dx<clip.x+clip.w&&y+dy>=clip.y&&y+dy<clip.y+clip.h)r.pixel(x+dx,y+dy,color);}};
 const polygon=(p,color)=>{if(p.length<3)return;for(let i=1;i<p.length-1;i++)r.tri(p[0],p[i],p[i+1],color,clip,1,true,true);};
 const g={fillStyle:'#000',strokeStyle:'#000',lineWidth:1,globalAlpha:1,font:'10px sans-serif',textAlign:'start',textBaseline:'alphabetic',
  beginPath(){paths=[];current=null;},moveTo(x,y){current=[point(x,y)];paths.push(current);},lineTo(x,y){if(!current)this.moveTo(x,y);else current.push(point(x,y));},closePath(){if(current?.length)current.push(current[0]);},
  arc(x,y,rad,start,end,ccw=false){this.ellipse(x,y,rad,rad,0,start,end,ccw);},ellipse(x,y,rx,ry,rot,start,end,ccw=false){let span=end-start;if(!ccw&&span<0)span+=2*Math.PI;if(ccw&&span>0)span-=2*Math.PI;const n=Math.max(8,Math.ceil(Math.abs(span)*12));for(let i=0;i<=n;i++){const a=start+span*i/n,xx=x+Math.cos(a)*rx*Math.cos(rot)-Math.sin(a)*ry*Math.sin(rot),yy=y+Math.cos(a)*rx*Math.sin(rot)+Math.sin(a)*ry*Math.cos(rot);if(!current)this.moveTo(xx,yy);else this.lineTo(xx,yy);}},
  rect(x,y,ww,hh){this.moveTo(x,y);this.lineTo(x+ww,y);this.lineTo(x+ww,y+hh);this.lineTo(x,y+hh);this.closePath();},
  fill(){for(const p of paths)polygon(p,col(this.fillStyle));},stroke(){for(const p of paths)for(let i=1;i<p.length;i++)segment(p[i-1],p[i],col(this.strokeStyle),this.lineWidth);},
  fillRect(x,y,ww,hh){polygon([point(x,y),point(x+ww,y),point(x+ww,y+hh),point(x,y+hh)],col(this.fillStyle));},strokeRect(x,y,ww,hh){const p=[point(x,y),point(x+ww,y),point(x+ww,y+hh),point(x,y+hh),point(x,y)];for(let i=1;i<p.length;i++)segment(p[i-1],p[i],col(this.strokeStyle),this.lineWidth);},clearRect(){},setLineDash(){},
  fillText(text,x,y){text=String(text);let start=this.textAlign==='center'?x-text.length*3:this.textAlign==='right'?x-text.length*6:x;const c=col(this.fillStyle);for(const ch of text){const p=point(start,y-8);if(/[A-Za-z0-9 .:%]/.test(ch))label(r,ch.toUpperCase(),p[0],p[1],c);else{segment(p,[p[0]+5,p[1],-Infinity],c);segment(p,[p[0],p[1]+8,-Infinity],c);segment([p[0]+5,p[1],-Infinity],[p[0]+5,p[1]+8,-Infinity],c);segment([p[0],p[1]+8,-Infinity],[p[0]+5,p[1]+8,-Infinity],c);}start+=7;}},measureText(text){return {width:String(text).length*7};},
  save(){stack.push({matrix:[...matrix],fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,lineWidth:this.lineWidth});},restore(){const a=stack.pop();if(a){matrix=a.matrix;Object.assign(this,a);}},translate(x,y){matrix[4]+=matrix[0]*x+matrix[2]*y;matrix[5]+=matrix[1]*x+matrix[3]*y;},scale(x,y){matrix[0]*=x;matrix[1]*=x;matrix[2]*=y;matrix[3]*=y;},rotate(a){const [A,B,C,D]=matrix,co=Math.cos(a),si=Math.sin(a);matrix[0]=A*co+C*si;matrix[1]=B*co+D*si;matrix[2]=C*co-A*si;matrix[3]=D*co-B*si;}
 };
 try{view.draw(g,state,{width:w,height:h});}catch(e){console.warn('预览 custom2d 失败：'+e.message);label(r,'DRAW ERROR',box.x+8,box.y+8,[180,40,40]);}
}

function drawMicro(r,data,ctx,box){
 if(!data?.particles?.length)return;
 const progress=ctx.progress?.[data.channel]||0,all=data.particles.flatMap(p=>(p.frames||[]).map(f=>f.position)),extent=Math.max(1,...all.flatMap(p=>[Math.abs(p[0]),Math.abs(p[1])]));
 const view={aspect:1,draw(g,_state,{width:w,height:h}){g.fillStyle='#edf7fa';g.fillRect(0,0,w,h);const scale=Math.min(w,h)*.36/extent, positions=new Map();
 for(const p of data.particles){const frames=p.frames||[];if(!frames.length)continue;let a=frames[0],b=frames[frames.length-1];for(let i=1;i<frames.length;i++)if(progress<=frames[i].at){a=frames[i-1];b=frames[i];break;}const t=Math.max(0,Math.min(1,(progress-a.at)/(b.at-a.at||1)));positions.set(p.id,[w/2+(a.position[0]+(b.position[0]-a.position[0])*t)*scale,h/2-(a.position[1]+(b.position[1]-a.position[1])*t)*scale]);}
 g.strokeStyle='#78919b';g.lineWidth=3;for(const bond of data.bonds||[]){if(progress<(bond.from??0)||progress>(bond.to??1))continue;const a=positions.get(bond.a),b=positions.get(bond.b);if(a&&b){g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();}}
 for(const p of data.particles){const q=positions.get(p.id);if(!q)continue;g.fillStyle=data.elements?.[p.element]?.color||'#8aa';g.beginPath();g.arc(q[0],q[1],Math.max(4,(p.radius||.15)*scale),0,Math.PI*2);g.fill();g.strokeStyle='#60757d';g.lineWidth=1;g.stroke();}
 }};drawCustom2d(r,view,ctx.state,box);
}

function render(ctx,api,config,step){
 const T=api.THREE,r=renderer(),s=shot(ctx,config,api,step,W,MAIN),entries=geometry(ctx,api).filter(e=>e.id!=='bench'),box=api.scene.apparatusBounds(entries.map(e=>e.item.object)), center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
 const views=[{clip:{x:0,y:0,w:W,h:MAIN},project:v=>{const q=v.clone().project(s.camera);return [(q.x+1)*W/2,(1-q.y)*MAIN/2,q.z];}},
 {clip:{x:0,y:620,w:495,h:220},project:v=>{const scale=Math.min(420/Math.max(size.x,.1),160/Math.max(size.z,.1));return [247+(v.x-center.x)*scale,730-(v.z-center.z)*scale,-v.y];}},
 {clip:{x:505,y:620,w:495,h:220},project:v=>{const scale=Math.min(420/Math.max(size.x,.1),160/Math.max(size.y,.1));return [752+(v.x-center.x)*scale,730-(v.y-center.y)*scale,v.z];}}];
 ctx.root.updateMatrixWorld(true);
 const opaque=[],transparent=[];
 const collect=object=>{if(!object.visible)return;if(object.geometry?.attributes?.position){const m=Array.isArray(object.material)?object.material[0]:object.material;if(m?.visible!==false&&!(m?.transparent&&m.opacity===0))(m?.transparent&&m.opacity<.98?transparent:opaque).push(object);}for(const child of object.children)collect(child);};
 for(const e of entries)collect(e.item.object);for(const effect of ctx.effects.values())if(effect.object)collect(effect.object);
 const draw=object=>{const geo=object.geometry,pos=geo.attributes.position,index=geo.index,material=Array.isArray(object.material)?object.material[0]:object.material,c=material?.color||new T.Color(0x8ba9a7),col=[c.r,c.g,c.b].map(v=>Math.max(30,Math.min(235,Math.round(50+v*175)))),isGlass=material?.transparent&&material.opacity<.98,points=[];
 for(let i=0;i<pos.count;i++)points.push(new T.Vector3().fromBufferAttribute(pos,i).applyMatrix4(object.matrixWorld));const count=index?index.count:pos.count;
 if(object.isMesh){for(let i=0;i+2<count;i+=3){const ia=index?index.getX(i):i,ib=index?index.getX(i+1):i+1,ic=index?index.getX(i+2):i+2,a=points[ia],b=points[ib],c=points[ic];
 const uv=geo.attributes.uv,texture=material?.map,img=texture?.image;let sample=null;if(uv&&img?.data&&img.width&&img.height){const channels=Math.floor(img.data.length/(img.width*img.height));if(channels>=3){sample=(v,w,u)=>{const xuv=uv.getX(ia)*v+uv.getX(ib)*w+uv.getX(ic)*u,yuv=uv.getY(ia)*v+uv.getY(ib)*w+uv.getY(ic)*u,tx=Math.max(0,Math.min(img.width-1,Math.floor(xuv*img.width))),ty=Math.max(0,Math.min(img.height-1,Math.floor((texture.flipY?1-yuv:yuv)*img.height))),k=(ty*img.width+tx)*channels;return [0,1,2].map(j=>Math.round(img.data[k+j]*1));};}}
 for(const v of views){const aa=v.project(a),bb=v.project(b),cc=v.project(c);if(v===views[0]&&(aa[2]<-1||bb[2]<-1||cc[2]<-1))continue;r.tri(aa,bb,cc,col,v.clip,isGlass?Math.min(.10,material.opacity*.18):1,!isGlass,false,sample);}}}
 else if(object.isLine||object.isLineSegments){for(let i=0;i+1<count;i+=object.isLineSegments?2:1){const a=points[index?index.getX(i):i],b=points[index?index.getX(i+1):i+1];for(const v of views)r.line(v.project(a),v.project(b),[46,65,71]);}}};
 opaque.forEach(draw);transparent.forEach(draw);
 // Thin outlines make transparent walls legible without covering the contents.
 for(const object of transparent){const b=api.scene.apparatusBounds([object]);if(b.isEmpty())continue;const corners=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])corners.push(new T.Vector3(x,y,z));for(const v of views)for(const [a,b] of [[0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7]]){const aa=v.project(corners[a]),bb=v.project(corners[b]);if(aa[0]>=v.clip.x&&aa[0]<v.clip.x+v.clip.w&&aa[1]>=v.clip.y&&aa[1]<v.clip.y+v.clip.h&&bb[0]>=v.clip.x&&bb[0]<v.clip.x+v.clip.w&&bb[1]>=v.clip.y&&bb[1]<v.clip.y+v.clip.h)r.line(aa,bb,[133,157,162]);}}

 r.rect(s.panel.x,s.panel.y,s.panel.width,s.panel.height,[222,194,176],true);r.rect(s.panel.x,s.panel.y,s.panel.width,s.panel.height,[128,77,55]);label(r,'PANEL',s.panel.x+10,s.panel.y+10);if(ctx.demonstration?.caption){const caption=String(ctx.demonstration.caption);drawCustom2d(r,{aspect:(s.panel.width-20)/100,draw(g){g.fillStyle='#733c28';for(let i=0;i<caption.length;i+=30)g.fillText(caption.slice(i,i+30),0,12+i/30*16);}},ctx.state,{x:s.panel.x+10,y:s.panel.y+30,width:s.panel.width-20,height:100});}
 if(s.second){r.rect(s.second.x,s.second.y,s.second.width,s.second.height,[179,207,224],true);r.rect(s.second.x,s.second.y,s.second.width,s.second.height,[55,99,128]);if(config.secondView?.type==='custom2d')drawCustom2d(r,config.secondView,ctx.state,s.second);else if(config.secondView?.type==='micro'||config.micro)drawMicro(r,config.secondView?.data||config.micro,ctx,s.second);else label(r,'SECOND VIEW',s.second.x+10,s.second.y+10);}
 const bench=ctx.apparatus.get('bench');const tabletop=bench?.anchors?.surface?.getWorldPosition(new T.Vector3()).y??0;const left=new T.Vector3(box.min.x,tabletop,center.z),right=new T.Vector3(box.max.x,tabletop,center.z);r.line(views[2].project(left),views[2].project(right),[150,85,55]);
 r.rect(0,0,W,72,[215,224,219],true);label(r,'MAIN CAMERA',10,10);if(s.occupancy)label(r,`W ${Math.round(s.occupancy.width*100)}% H ${Math.round(s.occupancy.height*100)}%`,10,32);r.rect(0,620,495,220,[116,137,137]);r.rect(505,620,494,220,[116,137,137]);label(r,'TOP VIEW',10,625);label(r,'SIDE VIEW',515,625);
 if(s.point){const q=s.point.clone().project(s.camera),x=(q.x+1)*W/2,y=(1-q.y)*MAIN/2;r.line([x-6,y],[x+6,y],[190,30,35]);r.line([x,y-6],[x,y+6],[190,30,35]);}
 return png(r.p);
}
try {
 const args=process.argv.slice(2),input=args[0],all=args.includes('--all'),si=args.indexOf('--step'),oi=args.indexOf('--out'), mi=args.indexOf('--mistake'), includes=[];
 for(let i=1;i<args.length;i++)if(args[i]==='--include'){if(!args[i+1])throw Error('--include 需要路径');includes.push(args[++i]);}
 if(!input||oi<0||!args[oi+1]||(!all&&si<0&&mi<0)||mi>=0&&!args[mi+1])throw Error('用法：node scripts/preview-course.mjs course.js (--step N | --all | --mistake id) --out preview.png [--include extra.js]');
 const {config,api}=load(input,includes),matches=mi>=0?config.steps.flatMap((s,i)=>(s.mistakes||[]).filter(m=>m.id===args[mi+1]).map(m=>({i,m}))):[];if(mi>=0&&matches.length!==1)throw Error(`--mistake ${args[mi+1]} 必须唯一存在（找到 ${matches.length} 个）`);const number=mi>=0?matches[0].i+1:si>=0?Number(args[si+1]):1;if(!all&&(!Number.isInteger(number)||number<1||number>config.steps.length))throw Error(`--step 应为 1 至 ${config.steps.length}`);
 api.TweenClock.prototype.tween=function(_seconds,frame){frame(0);frame(1);return Promise.resolve();};
 const engine=new api.ExperimentEngine(config,new api.THREE.Group());engine.subscribe(s=>{if(s.playing&&!s.busy&&s.completed.includes(s.index))engine.pause();});
 const flush=async()=>{for(let j=0;j<32;j++)await Promise.resolve();};
 try {for(let i=0;i<config.steps.length&&(all||i<number);i++){
  if(mi>=0&&i===number-1){
   if(engine.snapshot.prediction){const play=engine.play;engine.play=()=>{};engine.answerPrediction(engine.snapshot.prediction.answer);engine.play=play;await flush();}
   while(engine.snapshot.explanations.length){engine.continueExplanation();await flush();}
   let elapsed=0;const frames=[];api.TweenClock.prototype.tween=function(seconds,frame){frame(0);frame(.5);engine.ctx.update(0);frames.push({time:elapsed+seconds/2,png:render(engine.ctx,api,config,config.steps[i])});elapsed+=seconds;frame(1);return Promise.resolve();};
   const before=render(engine.ctx,api,config,config.steps[i]);if(!await engine.act(matches[0].m.trigger))throw Error('假如分支无法触发');await flush();if(engine.snapshot.error)throw Error(engine.snapshot.error);engine.ctx.update(0);
   const output=args[oi+1],mid=output.replace(/(\.png)?$/i,'-middle.png'),end=output.replace(/(\.png)?$/i,'-end.png');const middle=frames.reduce((best,f)=>!best||Math.abs(f.time-elapsed/2)<Math.abs(best.time-elapsed/2)?f:best,null);fs.writeFileSync(mid,middle?.png||before);fs.writeFileSync(end,render(engine.ctx,api,config,config.steps[i]));console.log(`已生成 ${mid} 和 ${end}`);break;
  }
  if(engine.snapshot.prediction){engine.answerPrediction(engine.snapshot.prediction.answer);await flush();}
  for(let guard=0;guard<50&&engine.snapshot.index===i&&!engine.snapshot.completed.includes(i);guard++){
   const s=engine.snapshot;if(s.explanations.length)engine.continueExplanation();else if(s.busy){}else if(s.action)await engine.act();else engine.play();await flush();if(engine.snapshot.error)throw Error(engine.snapshot.error);
  }
  if(!engine.snapshot.completed.includes(i))throw Error(`第 ${i+1} 步未完成`);
  engine.ctx.update(0);if(all||i===number-1){const output=all?args[oi+1].replace(/(\.png)?$/i,`-${String(i+1).padStart(2,'0')}.png`):args[oi+1];fs.writeFileSync(output,render(engine.ctx,api,config,config.steps[i]));console.log(`已生成 ${output}`);}
  if(i+1<config.steps.length){const play=engine.play;engine.play=()=>{};try{while(engine.snapshot.explanations.length){engine.continueExplanation();await flush();}}finally{engine.play=play;}if(engine.snapshot.index===i)engine.next();await flush();}
 }}finally{engine.dispose();}
}catch(error){fail(error);}
