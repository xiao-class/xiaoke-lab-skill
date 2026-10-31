# 现象库

从 `XiaokeLab.effects` 取工厂。可视现象有 `object`、`start()`、`stop()`、`update(dt)`、可选 `setProgress(p)`、`dispose()`；`ctx.addEffect(id,effect,parent?)` 自动加入 object 并逐帧更新，父节点可设为器材锚点。不得将同一实例注册两次。无 object 的现象也可注册。某些现象 start 后还需要每帧 update；时间单位秒。例子：

```js
const { apparatus, effects, defineExperiment } = XiaokeLab;
export default defineExperiment({
  minimums: false, // 独立 API 演示；完整课程默认检查教学数量
  id: 'lamp-demo', subject: 'chemistry', title: '点燃酒精灯', equation: '',
  setup(ctx) {
    const lamp = ctx.addApparatus(apparatus.alcoholLamp({id: 'lamp'}));
    ctx.addEffect('fire', effects.flame(), lamp.anchors.wick);
  },
  steps: [{id:'light', title:'点燃', description:'观察火焰',
    camera:{focus:'lamp.wick'}, action:{label:'点燃',target:'lamp'},
    run(ctx) { ctx.getApparatus('lamp').setState('lit', true); ctx.getEffect('fire').start(); },
    observation:'灯芯上方出现火焰。'}]
});
```

| 工厂 | 用途和参数 | 附加控制 |
|---|---|---|
| `flame({height:.385,width:.25,intensity:.75,torch:false})` | 酒精灯/喷灯火焰 | 通用接口 |
| `combustion({height:.36,width:.18})` | 蜡烛或木条燃烧 | `setProgress` 控制熄灭 |
| `bubbles({rise:.6,rate:6,count:24,surface?,size:1,rhythm:'continuous'})` | 水中气泡；surface 为返回液面高度的函数 | `setRate(n)`、`setRhythm('intermittent'|'continuous')` |
| `powderBed({count:320,length:1.65,heatCenter:.65,startColor:0x1d1d1d,endColor:0xb4532a,reactionSpan:1.8})` | 固体粉末反应 | `setAttraction(p,target,up?)`、`setPour(p,mouth,pile)`，坐标为 Vector3 |
| `turbidity(liquidMesh)` | 液体浑浊，传入器材 `anchors.liquid` | `setProgress` |
| `heatGlow()` | 受热发光 | `setProgress` |
| `gasFlow({points,count:18,direction:1,color:0x8ed9eb})` | 沿 Vector3 数组的示意气流 | `setDirection(n)` |
| `smokeCloud({color:0x7d858b,count:28,spread:5.5})` | 烟雾 | 通用接口 |
| `flashExplosion()` | 闪光和爆炸示意 | 通用接口 |
| `gasCollect({jar,surface})` | 集气示意；jar 为器材，surface 是返回高度的函数 | `setProgress` |
| `dyeSpread({origin,bounds,color:0xa82273})` | 染料扩散；origin 为 Vector3、bounds 为 Box3 | `setProgress` |
| `emberRelight()` | 带火星木条复燃 | `setBrightness(n)` |
| `powderStream({points,color:0x9b1e68,count:28})` | 沿 Vector3 数组倾倒粉末 | 通用接口 |
| `effervescence({radius:.4,rise:.5,count:64})` | 固体表面冒泡 | `setIntensity(n)` |
| `gasPour({points,radius:.8,height:1.4,bottom:.09})` | 倾倒气体示意 | 通用接口 |
| `screenImage(sample)` | 光屏成像；sample 返回 OpticalState | 通用接口 |
| `virtualImage(sample,{origin:50,scale:.1,axisHeight:1.7})` | 凸透镜虚像 | 通用接口 |
| `parallelLight({f:1,center:1.7,start:-4,end:4,screen:()=>end})` | 平行光束 | 通用接口 |
| `stainSpread()`、`slideCrack()`、`slideBubbles()` | 生物装片染色、裂纹、气泡 | 通用接口 |
| `airBubble(x,y)` | 计算视野中气泡边缘和内部 | 返回 `{edge,inside}` |

后果辅助：`demonstrateBackflow(ctx,points,{sourceId:'beaker',liquidName:'石灰水'})`；`demonstrateGasIgnition(ctx,{vessel,stopper,flame,airPath})`；`demonstrateUntreatedGas(ctx,{nozzle,flames,lamp})`。前者 points、后者 airPath 是 Vector3 数组，其余器材/现象用 ID。它们返回 Promise，放在 `mistake.consequence` 中 await；具体组合参考 examples。后果是教学示意，须写清模型边界。
