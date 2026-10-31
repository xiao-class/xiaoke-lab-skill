const {THREE,apparatus:A,views}=XiaokeLab;
const prediction=(question,options,explain)=>({question,options:options.map((text,i)=>({id:String(i),text})),answer:'0',explain});

// 一片叶在同一位置形成自身对照，颜色和黑纸随实验阶段变化。
function comparison(g,state,{width:w,height:h}){
 const stage=state.stage||0;
 g.fillStyle='#f3f7ef';g.fillRect(0,0,w,h);
 g.fillStyle='#263c31';g.textAlign='center';g.font=`${Math.max(11,w*.045)}px sans-serif`;
 g.fillText('同一片叶：局部遮光对照',w*.5,h*.1);
 const sx=x=>w*(.5+.46*x), sy=y=>h*(.78-.41*y);
 const leafPath=()=>{g.beginPath();for(let i=0;i<=112;i++){const angle=-Math.PI/2+2*Math.PI*i/112;const delta=Math.atan2(Math.sin(angle+Math.PI/2),Math.cos(angle+Math.PI/2));const radius=.68*(1+.055*Math.cos(7*(angle-Math.PI/2)))-.12*Math.exp(-Math.pow(delta/.27,2));const x=sx(radius*Math.cos(angle)),y=sy(.85+radius*Math.sin(angle));if(i===0)g.moveTo(x,y);else g.lineTo(x,y);}g.closePath();};
 leafPath();g.fillStyle=stage>=7?'#334985':stage>=5?'#e8dfa9':'#72ad69';g.fill();
 if(stage>=7){g.fillStyle='#e5d4a0';g.fillRect(sx(-.275),sy(.96),w*.46*.55,h*.41*.42);}
 g.strokeStyle=stage>=7?'#a1adbb':'#b7d390';g.lineWidth=2;g.beginPath();g.moveTo(sx(0),sy(-.2));g.lineTo(sx(0),sy(.42));
 for(const [x,y] of [[-.58,.67],[-.52,.98],[-.33,1.28],[0,1.46],[.33,1.28],[.52,.98],[.58,.67]]){g.moveTo(sx(0),sy(.42));g.lineTo(sx(x),sy(y));}g.stroke();
 if(stage>=2&&stage<4){g.fillStyle='#262b2a';g.fillRect(sx(-.275),sy(.96),w*.46*.55,h*.41*.42);}
 g.fillStyle='#263c31';g.font=`${Math.max(10,w*.04)}px sans-serif`;
 g.fillText(stage>=7?'见光区：蓝黑　 遮光区：未变蓝黑':stage>=5?'脱色后叶片黄白，保留遮光位置':stage>=2?'黑纸遮住中央，其余部分见光':'暗处理前后，叶片仍呈绿色',w*.5,h*.91);
}
function mistake(id,title,lesson,focus){return {id,trigger:id,title,lesson,async consequence(ctx){
 const plant=ctx.getApparatus('plant'),leaf=ctx.getApparatus('leaf');
 ctx.detailCamera={amount:.5,focus,apparatus:[id==='direct'?'alcohol':'plant']};
 await ctx.tween(1,p=>{if(id==='skip-dark'){ctx.state.stage=p>.5?7:1;ctx.state.branch='residual';if(p>.5){plant.leaves[0].setState('decolorized',true);plant.leaves[0].setState('blue',true);}}
 if(id==='one-side'){ctx.state.branch='leak';if(p>.5){plant.leaves[0].setState('resetExposure',true);plant.leaves[0].setState('decolorized',true);plant.leaves[0].setState('blue',true);}}
 if(id==='direct'){ctx.getApparatus('lamp').setState('lit',true);}
 ctx.demonstration={progress:p,caption:id==='skip-dark'?'原有淀粉可能干扰检验结果（示意）':id==='one-side'?'只遮一面可能漏光，对照不可靠（示意）':'酒精蒸气遇明火可能燃烧（危险示意）'};});
 }};}
export default XiaokeLab.defineExperiment({
 id:'green-leaf',subject:'biology',title:'绿叶在光下制造有机物',equation:'',
 framingApparatus:['plant','paper','tripod','gauze','water','alcohol','lamp','dish','leaf','iodine'],
 conclusion:'见光部分遇碘变蓝黑，遮光部分不变蓝黑，说明见光部分产生了淀粉；本实验支持光是叶片制造淀粉的必要条件。',
 modelNote:'暗处理和数小时光照压缩呈现；叶片的颜色、脱色速度与显色范围为示意。碘液检验淀粉，不能直接证明其他产物。',
 safetyNotes:['酒精易燃，须隔水加热、远离火源；由教师操作并注意热水烫伤。','用镊子取放叶片，避免碘液接触皮肤或衣物。'],
 secondView:views.custom2d({title:'同一叶片的对照',draw:comparison}),
 setup(ctx){
  ctx.addApparatus(A.labBench());
  const plant=ctx.addApparatus(A.pottedPlant({id:'plant'}));plant.object.position.set(-1.35,0,0);
  const paper=ctx.addApparatus(A.blackPaper({id:'paper'}),plant.leaves[0].object);paper.object.position.set(0,.54,0);paper.object.scale.set(.55/.65,.42/.46,1);paper.mountedOn='plant';paper.object.visible=false;
  const tripod=ctx.addApparatus(A.tripod({id:'tripod'}));tripod.object.position.x=1.2;
  const gauze=ctx.addApparatus(A.ceramicGauze({id:'gauze'}));gauze.object.position.set(1.2,1.16,0);gauze.mountedOn='tripod';
  const water=ctx.addApparatus(A.beaker({id:'water',radius:.85,height:1.2,liquidHeight:.83}));water.object.position.set(1.2,1.23,0);water.mountedOn='gauze';
  const alcohol=ctx.addApparatus(A.beaker({id:'alcohol',radius:.39,height:.85,liquidHeight:.6,color:0xf3f4d9}));alcohol.object.position.set(1.2,1.34,0);alcohol.mountedOn='water';
  const lamp=ctx.addApparatus(A.alcoholLamp({id:'lamp'}));lamp.object.position.set(1.2,0,0);lamp.mountedOn='tripod';
  const dish=ctx.addApparatus(A.petriDish({id:'dish'}));dish.object.position.set(-.05,0,1.35);
  const leaf=ctx.addApparatus(A.leaf({id:'leaf'}));leaf.object.visible=false;leaf.object.scale.setScalar(.42);leaf.mountedOn=['alcohol','water','dish'];
  const dropper=ctx.addApparatus(A.dropper('iodine'));dropper.object.position.set(-.05,.8,1.35);dropper.mountedOn='dish';dropper.object.visible=false;dropper.setState('iodine',true);
  ctx.state.stage=0;
 },
 steps:[
  {id:'dark',title:'暗处理盆栽',description:'把生长旺盛的盆栽放在黑暗处一昼夜，让叶片原有淀粉运走或耗尽。',camera:{focus:'plant.center'},action:{label:'暗处理',target:'plant'},
   predict:prediction('为什么先进行暗处理？',['减少原有淀粉对检验的干扰','让叶片积累更多淀粉','让叶绿素直接褪去'],'暗处理使原有淀粉运走或耗尽，便于判断之后是否有新淀粉形成。'),
   mistakes:[mistake('skip-dark','省略暗处理','原有淀粉可能干扰判断，应先暗处理。',[-1.35,1.6,0])],run(ctx){ctx.state.stage=1;ctx.callout('暗处理一昼夜（时间压缩）','plant','center');},observation:'暗处理后叶片仍呈绿色，淀粉不能直接用肉眼判断。'},
  {id:'cover',title:'上下夹上黑纸',description:'选一片叶，用两片不透光黑纸从上下两面夹住相同区域，其余部分露出。',camera:{focus:'plant.leaf1'},action:{label:'夹住叶片',target:'plant'},
   mistakes:[mistake('one-side','只遮挡叶片一面','另一面可能漏光，应从上下两面遮住同一区域。',[-1.35,1.6,0])],run(ctx){ctx.state.stage=2;ctx.getApparatus('plant').leaves[0].setState('covered',true);ctx.getApparatus('plant').leaves[0].object.children.filter(o=>o.isMesh).at(-1).visible=false;ctx.getApparatus('paper').object.visible=true;},observation:'黑纸夹住叶片的一部分，其余部分露在外面。'},
  {id:'light',title:'放到阳光下',description:'将盆栽移到阳光下数小时，保持黑纸固定。',camera:{focus:'plant.leaf1'},action:{label:'充分光照',target:'plant'},
   predict:prediction('光照后哪一部分更可能积累淀粉？',['露出的见光部分','被完全遮光的部分','两部分一定一样多'],'暗处理后，见光部分能够进行光合作用并积累淀粉；遮光部分无法利用光。'),run(ctx){ctx.state.stage=3;ctx.callout('光照数小时（时间压缩）','plant','leaf1');},observation:'黑纸仍夹在叶片上，露出部分接受光照。'},
  {id:'pluck',title:'摘叶并取下黑纸',description:'摘下实验叶片，取下黑纸，记住原先遮光的位置。',camera:{focus:'plant.leaf1'},action:{label:'摘叶去纸',target:'plant'},run(ctx){ctx.state.stage=4;ctx.getApparatus('paper').object.visible=false;ctx.getApparatus('plant').setState('leafVisible',{index:0,visible:false});const leaf=ctx.getApparatus('leaf');leaf.object.visible=true;leaf.object.position.set(-.05,.17,1.55);leaf.object.rotation.x=-Math.PI/2;leaf.setState('covered',true);leaf.setState('covered',false);},observation:'取下黑纸后，叶片两部分外观仍可能相近。'},
  {id:'bleach',title:'酒精隔水脱色',description:'将叶片放入盛有酒精的小烧杯，再将小烧杯放入盛水的大烧杯中隔水加热。',camera:{focus:'alcohol.surface'},action:{label:'隔水脱色',target:'alcohol'},warning:'酒精易燃，严禁直接加热酒精；教师操作并远离火源。',
   predict:prediction('为什么要隔水加热酒精？',['酒精易燃，避免明火直接加热','水能替代酒精溶解叶绿素','加热使淀粉直接变蓝黑'],'酒精易燃，隔水加热可避免直接加热酒精，酒精仍应远离火源。'),
   mistakes:[mistake('direct','直接加热酒精','酒精易燃，不能直接加热，应隔水加热并远离火源。',[1.2,1.9,0])],async run(ctx){ctx.state.stage=5;const leaf=ctx.getApparatus('leaf');leaf.object.position.set(1.2,1.48,0);leaf.object.rotation.set(0,0,.25);ctx.getApparatus('lamp').setState('lit',true);await ctx.tween(2,p=>{const c=new THREE.Color(0xf3f4d9).lerp(new THREE.Color(0x70a54a),p);ctx.getApparatus('alcohol').setState('color',c);if(p>.5)leaf.setState('decolorized',true);});ctx.getApparatus('lamp').setState('lit',false);},observation:'叶片逐渐变黄白，杯中酒精变绿。'},
  {id:'rinse',title:'清水漂洗并展开',description:'用镊子取出叶片，在清水中漂洗，再平铺到白色浅皿中。',camera:{focus:'dish.center'},action:{label:'漂洗叶片',target:'dish'},run(ctx){ctx.state.stage=6;const leaf=ctx.getApparatus('leaf');leaf.object.position.set(-.05,.17,1.55);leaf.object.rotation.set(-Math.PI/2,0,0);},observation:'黄白色叶片漂洗后变柔软，平铺在浅皿中。'},
  {id:'iodine',title:'滴加碘液',description:'在叶片上滴加碘液，稍等片刻后用清水冲洗。',camera:{focus:'leaf.center'},action:{label:'滴加碘液',target:'leaf'},
   predict:prediction('滴碘并冲洗后，两部分会怎样？',['见光部分变蓝黑，遮光部分不变蓝黑','遮光部分变蓝黑，见光部分不变蓝黑','两部分都会变蓝黑'],'碘液遇淀粉变蓝黑；见光部分形成淀粉，遮光部分未出现蓝黑色。'),async run(ctx){const d=ctx.getApparatus('iodine');d.object.visible=true;await ctx.tween(1,p=>d.setState('drip',p));d.object.visible=false;ctx.getApparatus('leaf').setState('blue',true);ctx.state.stage=7;},observation:'见光部分呈蓝黑色，原遮光部分未变蓝黑。'},
  {id:'compare',title:'比较两部分',description:'比较原先遮光和见光的区域，解释光与淀粉形成的关系。',camera:{focus:'leaf.center'},action:{label:'比较结果',target:'leaf'},run(ctx){ctx.state.stage=8;ctx.callout('同一叶片形成对照','leaf','center');},observation:'同一叶片的见光部分蓝黑，遮光部分未变蓝黑。'}
 ]
});
