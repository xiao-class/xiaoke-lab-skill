# 第二视图

配置 `secondView` 是可辨别联合类型，只有一个 `type`。视图由网页宿主创建和布局；不要假定它与主场景使用相同相机。三种类型：

- `micro`：`{type:'micro',data}`。data 是 `{channel,source:{apparatus,anchor},elements,particles,captions,speciesColors?,surfaces?,bonds?}`。每个 element 为 `{color,label,metalness?,roughness?}`；粒子 `{id,element,radius?,frames:[{at,position:[x,y,z],species,side:'reactant'|'product'}]}`，帧 `at` 为 0–1，按时间升序；caption 为 `{at,text}`；bond 为 `{a,b,from,to,order?}`。`ctx.setProgress(channel,p)` 控制播放；源器材与锚点必须存在。
- `rayDiagram`：`{type:'rayDiagram',sample(ctx),screenCloseup?,setObserving?(ctx,boolean)}`。sample 返回 `{f,lens,candle,screen,height,offset,blocked,parallel,lit,observing}`；位置和 f 为同一光学坐标单位（常用 cm），height 为物高，blocked 为 0–1，其余为布尔值。`XiaokeLab.optics` 包含 `lensImage`、`opticalReading` 等纯计算方法；可参考 lens 范例。
- `eyepieceView`：`{type:'eyepieceView',sample(ctx),parts,select(ctx,part),adjust(ctx,control,value?),layout?(ctx,aspect)}`。sample 返回目镜状态；`XiaokeLab.biology.initialEyepieceState()` 返回完整初始状态，包括 objective 10/40、ocular、aligned、aperture、mirrorAngle、concave、height、stageX、stageY、stained、specimen、mounted、bubbles、cracked、targetMarked、labels、covered、flattened、water。parts 是 `{id,name,role}[]`；可使用 `apparatus.microscopeParts`。详见 microscope 范例。

下面配置展示微观视图及其进度通道：

```js
const { apparatus, defineExperiment } = XiaokeLab;
export default defineExperiment({
  id:'micro-demo',subject:'chemistry',title:'微粒示意',equation:'',minimums:false,
  setup(ctx){ctx.addApparatus(apparatus.beaker({id:'cup'}));},
  secondView:{type:'micro',data:{channel:'reaction',source:{apparatus:'cup',anchor:'surface'},
    elements:{A:{color:'#36b5a4',label:'示意粒子'}},
    particles:[{id:'a',element:'A',frames:[
      {at:0,position:[0,0,0],species:'A',side:'reactant'},
      {at:1,position:[1,0,0],species:'A',side:'reactant'}]}],
    captions:[{at:0,text:'反应前'},{at:1,text:'移动后'}]}},
  steps:[{id:'observe',title:'观察',description:'放大观察',camera:{focus:'cup.surface'},
    action:{label:'观察',target:'cup'},async run(ctx){await ctx.tween(1,p=>ctx.setProgress('reaction',p));},
    observation:'粒子位置变化。'}]
});
```

## 化学分子与反应的快捷接口

化学课第二视图**优先使用内置微观粒子视图**；使用 `views.molecules` 按化学式生成球棍或比例球模型。`custom2d` 用于图表或示意图，例如温度—时间图、光路、叶片对照，而非自行绘制化学粒子。

以下为配置字段片段，完整课程见 `examples/water-electrolysis.js`。

```text
const {views} = XiaokeLab;
// 分子式重复表示系数；source 必须是场景里已有的器材和锚点。
secondView: views.molecules({
  channel:'electrolysis', source:{apparatus:'cell',anchor:'center'},
  reactants:['H2O','H2O'], products:['H2','H2','O2'],
  model:'ball-and-stick' // 或 'space-filling'；默认球棍
})
// 宏观动画中调用 ctx.setProgress('electrolysis', p)，p 为 0–1。
```

支持 `H2O`、`H2`、`O2`、`CO2`、`CH4`、`NH3`、`HCl`、`NaCl`（晶格片段）、`Cu`（面心立方晶格片段）、`Fe`（体心立方晶格片段）和 `CaCO3`（示意片段）；晶格不表示独立分子；NaCl 交替排列 Na⁺/Cl⁻，CaCO₃ 片段用等价的 C–O 连线示意碳酸根，并单独显示 Ca²⁺，不是完整方解石晶格。水为约 104.5° 的 V 形，二氧化碳线形，甲烷四面体，氨为约 106.7° 的三角锥形；模型尺寸用于教学示意，并非严格原子半径或键长比例。省略 `products` 得到静态模型。提供产物时会验证每种元素的原子数守恒：前后不等或式子不支持会抛错。播放依次断键、分散原子、重组、成键；面板显示各元素总原子数。也可调用 `views.atomCounts(view.data, progress)` 获取每种元素的 `{before,reactant,product,total}`，统计保留原子身份。可选 `captions:[{at:0,text:'...'}, ...]` 定义阶段文字。晶格片段是有限个原子，参与反应时必须据此配平；比例球模式隐藏键。

## 自定义二维视图

优先使用现有视图：微观粒子与反应过程用 `micro`；凸透镜成像用 `rayDiagram`；显微镜视野用 `eyepieceView`。需要其他二维示意（如平面镜俯视反射光路）时，使用 `views.custom2d({title, aspect, draw, legend?})`。它进入和内置视图相同的布局保留区，主场景取景会避让；不要另外创建浮窗或绝对定位覆盖场景。

微观数据可设 `background: '#d9e7e9'` 使用浅色背景；氢原子会有深色轮廓以便区分。`views.molecules` 返回值可通过 `view.data.background` 设置。

`aspect` 是宽 / 高，默认 1；实际画布在保留区内保持这个比例。`draw(ctx2d, state, size)` 每帧调用，`state` 是 `ctx.state`，`size` 为 `{width,height}` 的 CSS 像素尺寸；画布已按设备像素比缩放，使用这些尺寸绘图即可。每帧先清空画布；函数应自己绘制背景，避免副作用，不要修改状态。`title` 和可选文本 `legend` 显示在视图下方。适合简单演示的完整配置如下（教学正式课默认至少 6 步、3 个预测、3 个假如，示例用 `minimums:false` 关闭数量要求）：

```js
const {apparatus, views, defineExperiment} = XiaokeLab;
export default defineExperiment({
  id:'mirror-rays-demo', title:'平面镜光路示意', subject:'physics',
  minimums:false,
  setup(ctx) {
    ctx.addApparatus(apparatus.labBench({id:'bench'}));
    ctx.state.distance = 0.25;
  },
  secondView:views.custom2d({
    title:'平面镜俯视光路', aspect:1.2, legend:'实线：光线；虚线：反向延长线',
    draw(g, state, size) {
      const w=size.width, h=size.height, mirror=w*.5;
      const d=Math.max(.1, Math.min(.35, state.distance || .25))*w;
      const object={x:mirror-d,y:h*.68}, image={x:mirror+d,y:h*.68};
      const hit={x:mirror,y:h*.45}, eye={x:object.x,y:h*.22};
      g.fillStyle='#f3f7fb'; g.fillRect(0,0,w,h);
      g.lineWidth=3; g.strokeStyle='#305782';
      g.beginPath();g.moveTo(mirror,h*.1);g.lineTo(mirror,h*.9);g.stroke();
      g.strokeStyle='#df7d26';g.lineWidth=2;g.beginPath();
      g.moveTo(object.x,object.y);g.lineTo(hit.x,hit.y);g.lineTo(eye.x,eye.y);g.stroke();
      g.setLineDash([5,4]);g.beginPath();g.moveTo(hit.x,hit.y);g.lineTo(image.x,image.y);g.stroke();g.setLineDash([]);
      for(const [p,color,label] of [[object,'#c33','物'],[image,'#3987ae','像'],[eye,'#345','眼']]){
        g.fillStyle=color;g.beginPath();g.arc(p.x,p.y,4,0,Math.PI*2);g.fill();g.fillText(label,p.x+5,p.y-5);
      }
    }
  }),
  steps:[{id:'observe',title:'观察光路',description:'比较物与像相对镜面的位置。',
    camera:{focus:'bench'},action:{label:'观察',target:'bench'},
    async run(ctx){ctx.state.distance=.3;},observation:'虚像与物体关于镜面对称。'}]
});
```

若绘制逻辑分文件，把共享函数写成普通脚本（例如 `globalThis.drawMirror = ...`），课程中引用 `globalThis.drawMirror`。构建时可重复指定附加文件，按给定顺序在配置前执行和内联；路径相对课程配置所在目录，附加脚本不能用 `import/export`：

```sh
node scripts/validate-course.mjs examples/my-course.js --include mirror-draw.js
node scripts/build-course.mjs examples/my-course.js -o output.html --include mirror-draw.js
```

每次重新构建都会包含附加脚本，无须修改生成的 HTML。
