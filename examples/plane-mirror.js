const { THREE, apparatus, defineExperiment } = XiaokeLab;
function box(w,h,d,color,opts={}) { return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.65,...opts})); }
function custom(id,label,parts,anchors) {
  const object=new THREE.Group(); object.userData.apparatusId=id;
  for (const part of parts) object.add(part);
  const points={}; for (const [key,pos] of Object.entries(anchors)) {const a=new THREE.Object3D(); a.position.set(...pos); object.add(a); points[key]=a;}
  return {id,label,object,anchors:points,dispose(){apparatus.disposeObject(object);}};
}
function imageCandle(id='image'){const body=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.48,24),new THREE.MeshStandardMaterial({color:0x67b6e9,transparent:true,opacity:.43,depthWrite:false}));body.position.y=.24;
 const flame=new THREE.Mesh(new THREE.SphereGeometry(.11,16,12),new THREE.MeshBasicMaterial({color:0xffd175,transparent:true,opacity:.6,depthWrite:false}));flame.scale.set(.65,1.45,.65);flame.position.y=.64;
 return custom(id,'虚像（示意）',[body,flame],{center:[0,.45,0]});}
function marker(id,color){const p=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.001,20),new THREE.MeshStandardMaterial({color}));p.position.y=.0255;return custom(id,'位置标记',[p],{center:[0,.026,0]});}
function sync(ctx){
 const s=ctx.state.mirror;const A=ctx.getApparatus('a'),B=ctx.getApparatus('b'),im=ctx.getApparatus('image');
 A.object.position.set(-s.distance,.026,0); B.object.position.set(s.bx,.026,s.bz); B.object.scale.y=s.short? .65:1;
 A.setState('lit',s.lit); B.setState('lit',s.bLit); im.object.position.set(s.distance,.026+s.tilt*2,0); im.object.visible=s.lit && !s.screen;const im2=ctx.getApparatus('image2');im2.object.position.set(s.distance+.14,.026+s.tilt*2,0);im2.object.visible=s.lit && s.thick && !s.screen;B.object.visible=!s.screen;
 ctx.getApparatus('glass').setState('tilt',s.tilt);ctx.getApparatus('screen').object.visible=s.screen;ctx.getApparatus('screen').object.position.x=s.distance;
 const ma=ctx.getApparatus('mark-a'),mi=ctx.getApparatus('mark-i');ma.object.visible=s.marks;mi.object.visible=s.marks;ma.object.position.x=-s.distance;mi.object.position.x=s.distance;
 
}
function patch(ctx,v){Object.assign(ctx.state.mirror,v);sync(ctx);}
async function close(ctx,id,caption,fn){const point=ctx.getApparatus(id).anchors.center.getWorldPosition(new THREE.Vector3()).toArray();await ctx.tween(2.4,p=>{fn(p);sync(ctx);ctx.detailCamera={amount:p,focus:point,apparatus:[id],focusRadius:1.05};ctx.demonstration={progress:p,caption};});}
const config={id:'plane-mirror',subject:'physics',title:'探究平面镜成像的特点',orientation:'landscape',equation:'像与物关于镜面成对称',
 framingApparatus:['paper','glass','a','b'],frameDirection:[-1.1,1.1,1.5],
 secondView:XiaokeLab.views.custom2d({title:'俯视光路示意',aspect:1,legend:'实线：实际光线　虚线：反向延长线',draw(ctx,state,size){
  const s=state.mirror;if(!s)return;const w=size.width,h=size.height;ctx.clearRect(0,0,w,h);ctx.fillStyle='#f7fafb';ctx.fillRect(0,0,w,h);
  const mx=w*.5, cy=h*.48, unit=w*.17, ax=mx-s.distance*unit, ix=mx+s.distance*unit, ey=cy+h*.32, ex=mx-w*.37;
  ctx.lineWidth=3;ctx.strokeStyle='#4b7383';ctx.beginPath();ctx.moveTo(mx,h*.1);ctx.lineTo(mx,h*.9);ctx.stroke();
  if(s.lit){for(const eyeY of [ey-h*.09,ey+h*.09]){const y=eyeY+(cy-eyeY)*(mx-ex)/(ix-ex);ctx.strokeStyle='#dd8c32';ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(ax,cy);ctx.lineTo(mx,y);ctx.lineTo(ex,eyeY);ctx.stroke();ctx.strokeStyle='#4e8cb0';ctx.setLineDash([5,4]);ctx.beginPath();ctx.moveTo(mx,y);ctx.lineTo(ix,cy);ctx.stroke();}ctx.setLineDash([]);}
  function dot(x,y,color,label){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.font='13px sans-serif';ctx.fillText(label,x+7,y-7);}
  dot(ax,cy,'#d96f42','A');if(s.lit)dot(ix,cy,'#4e8cb0','A′');dot(ex,ey,'#364d61','眼');ctx.fillStyle='#405764';ctx.font='12px sans-serif';ctx.fillText('玻璃板',mx+6,h*.13);
 }}),
 modelNote:'虚像与光路为教学示意，不是实时镜面反射；每 0.5 场景单位示意 5 cm。薄玻璃板两面反射可能产生重影。',
 conclusion:'平面镜成正立、等大的虚像；像到镜面的距离等于物到镜面的距离，像与物的连线垂直镜面。虚像不能用光屏承接。',
 safetyNotes:['玻璃边缘易割手，拿放轻稳。','点燃蜡烛注意防火，实验结束熄灭。'],
 setup(ctx){
  ctx.state.mirror={distance:1.5,bx:1.5,bz:1.15,lit:false,bLit:false,short:false,tilt:0,screen:false,marks:false,thick:false,stage:0};
  ctx.addApparatus(apparatus.labBench({width:24,depth:12}));
  const paper=ctx.addApparatus(apparatus.paperSheet({width:5,depth:3.9}));paper.drawLine([0,-1.8],[0,1.8]);
  const glass=ctx.addApparatus(apparatus.glassPlateStand({id:'glass'}));glass.object.position.y=.025;glass.mountedOn='paper';
  const a=ctx.addApparatus(apparatus.candle({id:'a',height:.48,lit:false}));a.mountedOn='paper';const b=ctx.addApparatus(apparatus.candle({id:'b',height:.48,lit:false}));b.mountedOn='paper';
  const image=ctx.addApparatus(imageCandle());image.contains=['b','image2'];image.mountedOn='paper';const image2=ctx.addApparatus(imageCandle('image2'));image2.contains='b';image2.mountedOn='paper';const ma=ctx.addApparatus(marker('mark-a',0xea6a48));ma.mountedOn='paper';const mi=ctx.addApparatus(marker('mark-i',0x4c92d7));mi.mountedOn='paper';
  const rulerItem=ctx.addApparatus(apparatus.ruler({length:3.5,centimeters:35}));rulerItem.object.position.set(0,.025,-1.75);rulerItem.mountedOn='paper';
  const screen=ctx.addApparatus(apparatus.lightScreen({id:'screen',center:1.7,width:1.8,height:2}));screen.mountedOn='paper';screen.object.scale.set(.55,.55,.55);screen.object.position.set(1.5,0,-.15);
  const match=ctx.addApparatus(apparatus.matchStick({id:'match'}));match.mountedOn='paper';match.object.rotation.z=-Math.PI/2;match.object.position.set(-2,.08,1.4);
  sync(ctx);
 },
 steps:[
 {id:'prepare',title:'竖直放置玻璃板',description:'将薄玻璃板竖直放在白纸上，沿板面画线。薄玻璃既能反射成像，也能透过它寻找像的位置。',camera:{focus:'glass.center'},action:{label:'摆放玻璃板',target:'glass'},run(ctx){ctx.callout('薄玻璃板竖直放置','glass','center');},observation:'薄玻璃板竖直立在白纸上，白纸上的线表示板面位置。',warning:'轻拿玻璃，注意边缘。',mistakes:[{id:'tilt',trigger:'tilt',title:'玻璃板没有竖直',lesson:'板倾斜时像会偏高或偏低，同高的蜡烛难以重合；应让玻璃板垂直纸面。',async consequence(ctx){patch(ctx,{lit:true,bx:1.5,bz:0});await close(ctx,'glass','玻璃板倾斜：像的位置偏离，难以完全重合（示意）',p=>{ctx.state.mirror.tilt=.25*p;});}},{id:'thick',trigger:'thick',title:'使用厚玻璃板',lesson:'厚玻璃板的前后表面都能反射光，可能看到两个错开的像；应选用薄玻璃板减轻重影。',async consequence(ctx){patch(ctx,{lit:true,thick:true});ctx.callout('前后表面反射：可能出现重影（示意）','glass','center');await ctx.wait(1);}}]},
 {id:'light',title:'点燃板前蜡烛 A',description:'点燃 A，眼睛从 A 所在的一侧透过玻璃板观察；像画为淡蓝色示意。',camera:{focus:'a.wick'},action:{label:'点燃 A',target:'a'},run(ctx){patch(ctx,{lit:true,stage:1});ctx.callout('从 A 的一侧观察','a','wick');},observation:'从 A 一侧看，玻璃板后方出现烛焰的像。',warning:'小心火焰，勿触碰烛焰。'},
 {id:'match',title:'移动 B 与像重合',description:'保持 B 不点燃，从 A 一侧观察，移动与 A 完全相同的 B，直至它与 A 的像完全重合。',camera:{focus:'b.wick'},action:{label:'移动 B',target:'b'},predict:{question:'B 与 A 的像完全重合时，像与 A 大小有什么关系？',options:[{id:'equal',text:'大小相等'},{id:'big',text:'像比 A 大'},{id:'small',text:'像比 A 小'}],answer:'equal',explain:'B 与 A 完全相同，B 又与像完全重合，因此像与 A 等大。'},async run(ctx){const s=ctx.state.mirror;await ctx.tween(2,p=>{s.bz=1.15*(1-p);sync(ctx);});patch(ctx,{stage:2});ctx.callout('B 与像重合','b','wick');},observation:'未点燃的 B 与玻璃板后方 A 的像完全重合。',mistakes:[{id:'unequal',trigger:'unequal',title:'选用较短的 B',lesson:'用与 A 完全相同的蜡烛 B，才能利用重合法比较像与物的大小。',async consequence(ctx){patch(ctx,{lit:true,bx:1.5,bz:0});await close(ctx,'b','B 较短：即使位置对齐，也不能与像完全重合',p=>{ctx.state.mirror.short=p>.5;});}}]},
 {id:'measure',title:'标记位置并测距',description:'标记 A 和重合时 B 的位置；测量两点到玻璃板所在直线的垂直距离。每 0.5 场景单位示意 5 cm。',camera:{focus:'paper.center'},action:{label:'标记并测量',target:'paper'},run(ctx){patch(ctx,{marks:true,stage:3});ctx.callout('物距 15 cm · 像距 15 cm（示意）','paper','center');},observation:'示例记录：A 到板面 15 cm，像到板面 15 cm；两点连线与板面垂直。'},
 {id:'repeat',title:'改变物距再次定位',description:'将 A 向玻璃板靠近，重新从 A 一侧观察并移动未点燃的 B 至重合，再标记、测量。',camera:{focus:'glass.center'},action:{label:'改变位置',target:'a'},predict:{question:'A 向玻璃板靠近后，像到板面的距离如何变化？',options:[{id:'near',text:'也变小，仍等于物距'},{id:'far',text:'变大'},{id:'fixed',text:'保持不变'}],answer:'near',explain:'像与物关于镜面成对称；物距减小，像距也减小，二者仍相等。'},async run(ctx){const s=ctx.state.mirror;await ctx.tween(2,p=>{s.distance=1.5-.5*p;s.bx=s.distance;sync(ctx);});patch(ctx,{stage:4});ctx.callout('物距 10 cm · 像距 10 cm（示意）','paper','center');},observation:'第二组示例：物距 10 cm、像距 10 cm；像随 A 靠近板面。'},
 {id:'screen',title:'用光屏检验像',description:'在像的位置放光屏，从玻璃板后面观察光屏，判断光屏上是否承接到烛焰像。',camera:{focus:'screen.center'},action:{label:'放置光屏',target:'screen'},predict:{question:'光屏放在像的位置，能承接到烛焰像吗？',options:[{id:'no',text:'不能，像是虚像'},{id:'yes',text:'能，像是实像'},{id:'closer',text:'移动光屏一定能找到清晰像'}],answer:'no',explain:'反射光线实际没有在镜后会聚；反向延长线相交形成虚像，因此光屏不能承接。'},run(ctx){patch(ctx,{screen:true,stage:5});ctx.observationCamera={position:[4,1.7,1.6],target:[1,1,0]};ctx.callout('光屏上没有烛焰像','screen','center');},observation:'从玻璃板后观察，光屏上没有承接到烛焰像；从 A 一侧仍可观察虚像。'},
 {id:'finish',title:'熄灭蜡烛，归纳规律',description:'熄灭 A，整理两次测量结果，归纳像的大小、位置和虚实。',camera:{focus:'a.wick'},action:{label:'熄灭并总结',target:'a'},run(ctx){patch(ctx,{lit:false,screen:false,stage:6});ctx.observationCamera=null;ctx.callout('等大、等距、连线垂直','paper','center');},observation:'两组记录中像与物等大、到板面的距离相等，连线垂直板面；光屏不能承接虚像。'}]
};
export default defineExperiment(config);
