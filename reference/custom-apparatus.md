# 自定义器材

库中没有的器材可用 `XiaokeLab.THREE` 的几何体和材质程序化建模，在 `setup` 中通过 `ctx.addApparatus` 注册。工厂返回 `{id,label,object,anchors,dispose}`；需要变化时再提供 `setState`、`update`。给 `object.userData.apparatusId` 设置与器材一致的唯一 ID；每个锚点必须是加入该对象层级的 Object3D，名称描述功能而非位置。场景单位与现有器材一致、桌面 y=0，不能把场景单位直接当厘米。每次 setup 创建新对象和资源；dispose 释放几何、材质与贴图；回放可能重建器材。禁止使用 InstancedMesh。

材质优先 `MeshStandardMaterial`；透明材质按需设置 `transparent:true`、`depthWrite:false`。可高亮部件设独立材质和有意义的 `userData.partId`；被点击网格应处于器材 object 层级中。动画使用 `ctx.tween`，不要把可变状态保存在上下文以外。

## 完整例子：带底座的可倾斜玻璃板

保存为 `custom-stand.js`；此例为单步演示，显式关闭完整探究课最低数量要求。先将器材加入同一场景，再把支架的 `base` 与纸张 `surface` 对齐；对齐时通过世界坐标，再转换回目标父物体的局部坐标。镜面锚点属于转动的板组，倾斜时会跟着转动。旋转后通过 `mirrorPlane.getWorldDirection` 得到世界法线。

```js
const {THREE, apparatus, build, defineExperiment} = XiaokeLab;
function makeStand(id) {
  const object = new THREE.Group();
  object.userData.apparatusId = id;
  const base = new THREE.Mesh(build.roundedBox(.4,.1,2,.03),
    build.metalMaterial(0x40515c));
  base.position.y = .05; base.userData.partId = 'base'; object.add(base);
  const pivot = new THREE.Group(); pivot.position.y = .1; object.add(pivot);
  const pane = new THREE.Mesh(build.roundedBox(.04,1.5,1.8,.01),
    build.glassMaterial());
  pane.position.y = .75; pane.userData.partId = 'pane'; pivot.add(pane);
  const baseAnchor = new THREE.Object3D(); object.add(baseAnchor);
  const mirrorPlane = new THREE.Object3D(); mirrorPlane.position.y = .75;
  mirrorPlane.rotation.y = Math.PI / 2; pivot.add(mirrorPlane); // +Z 是法线
  return {id,label:'自制玻璃板支架',object,anchors:{base:baseAnchor,mirrorPlane},
    setState(key,value) { if (key === 'tilt') pivot.rotation.z = Number(value); },
    dispose() { apparatus.disposeObject(object); }};
}
export default defineExperiment({
  id:'custom-stand-demo',subject:'physics',title:'观察支架',minimums:false,
  framingApparatus:['paper','stand'],
  setup(ctx) {
    ctx.addApparatus(apparatus.labBench());
    const paper = ctx.addApparatus(apparatus.paperSheet({width:3,depth:3}));
    paper.drawLine([0,-1],[0,1]);
    const stand = ctx.addApparatus(makeStand('stand'));
    // 若是多层父对象，必须先更新矩阵，再统一到世界坐标。
    ctx.root.updateMatrixWorld(true);
    const target = paper.anchors.surface.getWorldPosition(new THREE.Vector3());
    const current = stand.anchors.base.getWorldPosition(new THREE.Vector3());
    const parent = stand.object.parent;
    const localTarget = parent.worldToLocal(target.clone());
    const localCurrent = parent.worldToLocal(current.clone());
    stand.object.position.add(localTarget.sub(localCurrent));
    stand.mountedOn = 'paper'; // 几何检查识别这项有意的支撑关系
  },
  steps:[{id:'observe',title:'观察',description:'检查玻璃板与纸上线是否对齐。',
    camera:{focus:'stand.mirrorPlane'},action:{label:'倾斜玻璃板',target:'stand'},
    run(ctx){ctx.getApparatus('stand').setState('tilt',.1);},observation:'板面及其锚点一起倾斜。'}]
});
```

运行 `node scripts/validate-course.mjs custom-stand.js`，再运行 `node scripts/preview-course.mjs custom-stand.js --step 1 --out stand.png`。查看主视图及俯视、侧视，核对底座接触纸面、纸上直线沿板面、倾斜后板面仍从底座转动；修正后重新预览。预览是示意而非真实材质渲染，不能代替科学和视觉判断。

## 常见错误

- **悬空或支架错位**：模型的局部原点并不一定在底部；用底部锚点与台面锚点对齐，同时检查前、侧视图。不要仅靠主视角猜测高度。
- **局部与世界坐标混用**：不同父节点下的 `anchor.position` 不能直接相减。先 `updateMatrixWorld(true)`，用 `getWorldPosition`，再用目标父节点的 `worldToLocal` 转换。
- **旋转后锚点错位**：让功能锚点成为真正转动部件的子对象；改变位置或旋转后重新计算世界坐标和法线，不能复用旋转前的缓存。
- **相交有意但检查报错**：容器内装物用 `contains`，支承关系用 `mountedOn` 声明器材 ID（或数组）；只为真实关系声明，不能用来掩盖穿插。

镜面外观不等于真实反射：如需呈现像或光路，应自行以几何或第二视图构造教学模型并标明示意。更多组合与材质约定见 apparatus.md、views.md。

## 建模辅助与写实度检查

`XiaokeLab.build` 提供 `tube(points, radius?, segments?)`（至少两个 `THREE.Vector3`，返回管状几何）、`roundedBox(width,height,depth,radius?)`、`lathe([[radius,y],...],segments?)`、`glassMaterial()`、`metalMaterial(color?)`、`plasticMaterial(color?)`、`liquidMaterial(color?)`、`decal(text,width?,height?)` 和 `scaleText(text,width?,height?)`（后二者返回带文字平面网格）。材质和几何每次均为新资源；应随对象一并释放。以下为 setup 中的建模片段（需自行注册器材）：

```text
const {THREE, build} = XiaokeLab;
const vessel = new THREE.Mesh(build.lathe([[0,.03],[.4,.03],[.4,1],[.36,1],[.36,.08],[0,.08]]), build.glassMaterial());
const base = new THREE.Mesh(build.roundedBox(1,.12,1,.03), build.plasticMaterial(0x476678));
const nameplate = build.decal('样品', .5, .2);
const tube = new THREE.Mesh(build.tube([new THREE.Vector3(0,1,0),new THREE.Vector3(.5,.8,0),new THREE.Vector3(1,1,0)],.035), build.metalMaterial());
```

写实度检查表：

- **倒角**：底座、边框与按钮应有适量圆角，避免所有物件都是锐边盒子。
- **厚度**：玻璃壁、容器底与夹具需要可辨别的厚度；透明材质保留边缘。
- **材质**：玻璃、金属、塑料与液体采用不同粗糙度、颜色和透明度，不把整件器材涂成同色。
- **比例**：对照真实器材，检查容器口径、壁厚、刻度与连接件的相对尺寸。
- **接触**：底座接触台面，夹具确实夹住对象，导线端点与接线柱重合；在前、侧、俯视中核对。
