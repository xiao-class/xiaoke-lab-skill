// Shared, deliberately conservative geometry diagnostics for the standalone tools.
export function geometry(ctx, api) {
 const T=api.THREE, entries=[];
 for(const [id,item] of ctx.apparatus){
  const object=item.object;if(!object?.visible)continue;
  const box=api.scene.apparatusBounds([object]);if(box.isEmpty())continue;
  entries.push({id,item,box,size:box.getSize(new T.Vector3())});
 }
 return entries;
}
export function shot(ctx,config,api,step,width=1000,height=600){
 const T=api.THREE, selected=api.scene.framingObjects ? api.scene.framingObjects(ctx,config,step) : (config.framingApparatus||[...ctx.apparatus.keys()].filter(id=>id!=='bench')).map(id=>ctx.apparatus.get(id)?.object).filter(Boolean);
 let bounds=api.scene.apparatusBounds(selected);if(bounds.isEmpty())bounds=api.scene.apparatusBounds([...ctx.apparatus.values()].filter(a=>a.id!=='bench').map(a=>a.object));
 const secondType=config.secondView?.type, micro=secondType==='micro'?config.secondView.data:config.micro;
 const hasSecond=Boolean(micro)||['rayDiagram','eyepieceView','custom2d'].includes(secondType);
 const compact=height<=500,gap=compact?8:16,head=compact?58:72,panelWidth=Math.min(compact?290:360,width*(compact?.34:.3));
 const panel={x:width-gap-panelWidth,y:head+gap,width:panelWidth,height:height-head-2*gap};
 const side=hasSecond?Math.max(0,Math.min(compact?height*.4:height*.56,Math.max(0,panel.x-3*gap)*.5,height-head-3*gap)):0;
 const second=hasSecond?{x:gap,y:head+gap,width:side,height:side}:null;
 const insets={left:second?second.x+second.width+gap:0,right:width-panel.x+gap,top:head,bottom:gap};
 const [id,anchor]=(step?.camera?.focus||'').split('.'), item=ctx.apparatus.get(id), point=item?(item.anchors?.[anchor]||item.object).getWorldPosition(new T.Vector3()):null;
 const focus=item&&point?{bounds:api.scene.apparatusBounds([item.object]),point,zoom:1.035}:undefined;
 const direction=new T.Vector3(...(config.frameDirection||[.16,.28,1]));
 const pose=api.scene.solveFraming(bounds,width,height,40,insets,direction,undefined,focus);
 const camera=new T.PerspectiveCamera(40,width/height,.01,10000);camera.position.copy(pose.position);camera.lookAt(pose.target);camera.setViewOffset(width,height,pose.offsetX,pose.offsetY,width,height);camera.updateMatrixWorld(true);
 // Measure the actual geometry's projected extent, rather than a world-axis box:
 // a tilted or concave object must not acquire imaginary projected corners.
 ctx.root?.updateMatrixWorld(true);for(const object of selected)object.updateMatrixWorld(true);
 // Join touching or nearby components into an apparatus; a distant tool
 // must not turn empty tabletop into apparent apparatus width.
 const components=[];let depthClipped=false;
 for(const object of selected){let rect=null;object.traverse(node=>{const excluded=n=>!n.visible||n.userData.framingIgnore||n.userData.contactOpacity!==undefined;if(excluded(node)||!node.geometry?.attributes?.position)return;const materials=Array.isArray(node.material)?node.material:[node.material];if(materials.every(m=>m&&(!m.visible||(m.transparent&&m.opacity===0))))return;let parent=node.parent;while(parent){if(excluded(parent))return;parent=parent.parent;}const p=node.geometry.attributes.position;for(let i=0;i<p.count;i++){const q=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(node.matrixWorld).project(camera);if(q.z < -1||q.z > 1)depthClipped=true;if(q.z>=-1&&q.z<=1){const x=(q.x+1)*width/2,y=(1-q.y)*height/2;if(!rect)rect={minX:x,maxX:x,minY:y,maxY:y};else{rect.minX=Math.min(rect.minX,x);rect.maxX=Math.max(rect.maxX,x);rect.minY=Math.min(rect.minY,y);rect.maxY=Math.max(rect.maxY,y);}}}});if(rect)components.push(rect);}
 const groups=[];const remaining=new Set(components);
 while(remaining.size){const first=remaining.values().next().value;remaining.delete(first);const group=[first],queue=[first];while(queue.length){const a=queue.shift();for(const b of [...remaining]){const dx=Math.max(0,a.minX-b.maxX,b.minX-a.maxX),dy=Math.max(0,a.minY-b.maxY,b.minY-a.maxY),reach=.65*Math.max(a.maxX-a.minX,a.maxY-a.minY,b.maxX-b.minX,b.maxY-b.minY);if(Math.hypot(dx,dy)<=reach){remaining.delete(b);queue.push(b);group.push(b);}}}groups.push({minX:Math.min(...group.map(x=>x.minX)),maxX:Math.max(...group.map(x=>x.maxX)),minY:Math.min(...group.map(x=>x.minY)),maxY:Math.max(...group.map(x=>x.maxY))});}
 groups.sort((a,b)=>(b.maxX-b.minX)*(b.maxY-b.minY)-(a.maxX-a.minX)*(a.maxY-a.minY));
 // Separate but comparably sized apparatus (e.g. two water baths) form a
 // legitimate comparison. A tiny remote accessory cannot inflate the metric.
 const area=r=>(r.maxX-r.minX)*(r.maxY-r.minY),principal=groups.filter(g=>area(g)>=area(groups[0])*.35);
 const projected=principal.length?{minX:Math.min(...principal.map(r=>r.minX)),maxX:Math.max(...principal.map(r=>r.maxX)),minY:Math.min(...principal.map(r=>r.minY)),maxY:Math.max(...principal.map(r=>r.maxY))}:null;
 const envelope=components.length?{minX:Math.min(...components.map(r=>r.minX)),maxX:Math.max(...components.map(r=>r.maxX)),minY:Math.min(...components.map(r=>r.minY)),maxY:Math.max(...components.map(r=>r.maxY))}:null;
 const available={x:insets.left,y:insets.top,width:width-insets.left-insets.right,height:height-insets.top-insets.bottom};
 const occupancy=projected?{width:(projected.maxX-projected.minX)/available.width,height:(projected.maxY-projected.minY)/available.height}:null;
 return {camera,bounds,second,panel,insets,point,selected,available,projected,envelope,occupancy,depthClipped};
}
export function inspect(ctx,api,config,step){
 const T=api.THREE, all=geometry(ctx,api), messages=[];
 const bench=all.find(x=>x.id==='bench'), top=bench?.item.anchors?.surface?.getWorldPosition(new T.Vector3()).y ?? 0;
 const items=all.filter(x=>x.id!=='bench');
 // An explicitly documented AABB false positive may be acknowledged; it never
 // suppresses an error, and is not a substitute for a real support relation.
 const exception=(kind,ids)=>Array.isArray(config.geometryExceptions)&&config.geometryExceptions.some(e=>e?.kind===kind&&typeof e.reason==='string'&&e.reason.trim()&&Array.isArray(e.ids)&&e.ids.length===ids.length&&ids.every(id=>e.ids.includes(id)));
 const related=(a,b)=>{const insertion=(x,y)=>/(stopper|cotton|delivery|inlet|outlet|funnel|liquid|acid|marble)/i.test(x.id)&&/(tube|flask|bottle|jar|beaker|stopper|funnel)/i.test(y.id);const has=(item,key,id)=>{const v=item[key]??item.object.userData?.[key];return v===id||(Array.isArray(v)&&v.includes(id));};return ['contains','mountedOn'].some(k=>has(a.item,k,b.id)||has(b.item,k,a.id)) || insertion(a,b)||insertion(b,a) || a.item.object.parent===b.item.object || b.item.object.parent===a.item.object;};
 const touches=(a,b,t=.04)=>a.max.x+t>=b.min.x&&b.max.x+t>=a.min.x&&a.max.z+t>=b.min.z&&b.max.z+t>=a.min.z&&a.min.y>=b.min.y-t&&a.min.y<=b.max.y+t;
 const contact=(a,b,t=.04)=>a.max.x+t>=b.min.x&&b.max.x+t>=a.min.x&&a.max.y+t>=b.min.y&&b.max.y+t>=a.min.y&&a.max.z+t>=b.min.z&&b.max.z+t>=a.min.z;
 for(const a of items){
  if(!a.item.anchors||!Object.keys(a.item.anchors).length)messages.push({severity:'warning',text:`器材 ${a.id} 缺少 anchors`});
  const gap=a.box.min.y-top;
  if(gap>.12&&!items.some(b=>b!==a&&(touches(a.box,b.box)||(related(a,b)&&contact(a.box,b.box)))))messages.push({severity:gap>1?'error':'warning',text:`器材 ${a.id} 悬空：底部距台面 ${gap.toFixed(2)}，下方未找到接触的支撑物`});
 }
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){
  const a=items[i],b=items[j];if(related(a,b))continue;
  const intersection=a.box.clone().intersect(b.box);if(intersection.isEmpty())continue;
  const s=intersection.getSize(new T.Vector3()), volume=s.x*s.y*s.z,va=a.size.x*a.size.y*a.size.z,vb=b.size.x*b.size.y*b.size.z;
  if(Math.min(va,vb)>1e-8&&volume/Math.min(va,vb)>.65){const severity=volume/Math.max(va,vb)>.95?'error':'warning';if(severity==='error'||!exception('overlap',[a.id,b.id]))messages.push({severity,text:`器材 ${a.id} 与 ${b.id} 的包围盒大幅相交（可能为插入/容纳关系，检查并声明 contains 或 mountedOn）`});}
 }
 const scales=items.map(x=>Math.max(x.size.x,x.size.y,x.size.z)).filter(n=>n>0).sort((a,b)=>a-b),median=scales[Math.floor(scales.length/2)];
 if(scales.length>=3)for(const a of items){const n=Math.max(a.size.x,a.size.y,a.size.z);if((n>median*10||n<median/10)&&!exception('scale',[a.id]))messages.push({severity:'warning',text:`器材 ${a.id} 尺寸相对参照器材超过 10 倍（${n.toFixed(3)}，参照 ${median.toFixed(3)}）`});}
 try {const s=shot(ctx,config,api,step), p=s.point?.clone().project(s.camera);if(s.occupancy){const {width,height}=s.occupancy,ratio=Math.max(width,height);if(ratio<.6)messages.push({severity:ratio<.45?'error':'warning',text:`主装置投影占可用区域宽 ${(width*100).toFixed(1)}%、高 ${(height*100).toFixed(1)}%（最长边低于 ${(ratio<.45?45:60)}%）；设 framingApparatus 指定主装置、收拢布局或缩小台面上的距离`});}if(s.depthClipped)messages.push({severity:'warning',text:'完整装置投影被相机近远裁剪面裁切'});if(s.envelope){const e=s.envelope,a=s.available,w=(e.maxX-e.minX)/a.width,h=(e.maxY-e.minY)/a.height;if(Math.max(w,h)>.9)messages.push({severity:'warning',text:`完整装置投影占可用区域宽 ${(w*100).toFixed(1)}%、高 ${(h*100).toFixed(1)}%（超过 90%，目标 60%–85%）`});if(e.minX<a.x-.01||e.maxX>a.x+a.width+.01||e.minY<a.y-.01||e.maxY>a.y+a.height+.01)messages.push({severity:'warning',text:'完整装置投影被画面边缘或保留区裁切'});}if(p){const x=(p.x+1)*500,y=(1-p.y)*300,r=s.insets;if(p.z < -1||p.z > 1||x<r.left||x>1000-r.right||y<r.top||y>600-r.bottom)messages.push({severity:'warning',text:`camera.focus ${step.camera.focus} 投影出画或被保留区遮挡（${Math.round(x)}, ${Math.round(y)}）`});}}catch(e){messages.push({severity:'warning',text:`无法评估取景：${e.message}`});}
 return messages;
}
