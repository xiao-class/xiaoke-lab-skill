# 器材库

`XiaokeLab.apparatus` 的工厂创建独立器材：返回 `{id,label,object,anchors,setState?,update?,dispose}`。`object` 为 THREE.Group；锚点为其层级下的 Object3D，用 `anchor.getWorldPosition(new THREE.Vector3())` 取得世界坐标。注册用 `ctx.addApparatus(item)`；同一上下文的 ID 必须唯一。位置以场景单位表示，桌面 y=0，向上为正；数字不是自动换算的真实厘米。`setState` 的连续量除特别注明为实际尺寸或角度外通常为 0–1；未知 key 会被忽略。表中列出的尺寸是默认建模参数或锚点坐标，不是精确外接尺寸；缩放或旋转后应通过世界坐标对齐。

| 工厂（参数默认值；省略 id 表示可设独立 ID） | 用途、默认尺寸 | 锚点 | `setState(key,value)` |
|---|---|---|---|
| `labBench({id:'bench',width:24,depth:6})` | 桌面和实验室背景 | surface | `theme` 对象 `{dark}`；`quality` |
| `alcoholLamp({id:'lamp'})`、`alcoholLampDetailed({id:'lamp'})` | 酒精灯，灯芯高 0.86 | wick, cap | `lit` 布尔；`cap` 0–1 |
| `alcoholBlowtorch({id:'blowtorch'})` | 喷灯，灯芯高 1.09 | wick | `lit` 布尔 |
| `ironStand({id:'stand',height:2.5,angle:-Math.PI/2-.09,clampRadius:.345})` | 铁架台与夹具 | clamp | — |
| `testTube({id:'test-tube',length:3.5,radius:.3})` | 试管 | mouth, bottom, sample | — |
| `hardGlassTube({id:'hard-tube',length:3.6,radius:.34})` | 水平硬质玻璃管 | inlet, outlet, sample | — |
| `deliveryTube({id:'delivery',points,radius:.055})` | 导气管；`points` 为至少两个 THREE.Vector3 | inlet, outlet | `points` 新 Vector3 数组 |
| `rubberStopper({id:'stopper',radius:.305,holes:1})`、`twoHoleStopper({id:'stopper',radius:.27})` | 单孔、双孔塞 | inlet, outlet | — |
| `beaker({id:'beaker',radius:.62,height:1.35,liquidHeight:.8,color:0xe6f4f8})` | 烧杯及液体 | liquid, surface | `liquidHeight`、`empty` 布尔、`color` |
| `waterTrough({id:'water-trough',radius:1.35,height:.95,liquidHeight:.78})` | 水槽 | liquid, surface | `liquidHeight`、`color` |
| `gasJar({id:'gas-jar',radius:.46,height:1.65,waterLevel:1,inverted:true})` | 集气瓶 | mouth, gas, surface, liquid | `waterLevel` 0–1、`inverted` 布尔 |
| `glassPlate({id:'glass-plate',size:1.12})` | 盖气瓶玻璃片 | center | — |
| `conicalFlask({id:'flask'})` | 锥形瓶，瓶口高 1.87 | mouth, sample, surface | — |
| `longStemFunnel({id:'funnel',length:2.25})` | 长颈漏斗 | tip, mouth, column | `waterColumn` 长度、`pouring` |
| `springClip({id:'clip',closed:false})` | 弹簧夹 | center | `closed` 布尔 |
| `marbleChips({id:'marble',count:6})` | 大理石颗粒 | sample | `reaction`、`coating` |
| `acidLiquid({id:'acid',height:0,bottomRadius:.68,slope:.43,shoulderStart:.29,maxHeight:1.25})` | 瓶内液体 | liquid, surface | `height` 场景单位 |
| `litmusSolution({id:'litmus',height:1.3,liquidHeight:.7,radius:.55})` | 石蕊溶液 | liquid, surface | 烧杯状态另加 `acidity` |
| `cottonPlug({id:'cotton',radius:.25,length:.3})` | 棉塞 | center | — |
| `gasSource({id:'gas-source',label:'CO'})` | 储气装置 | outlet, label | `flowing` 布尔 |
| `nozzleTube({id:'nozzle',height:.4})` | 喷嘴玻璃管 | inlet, tip, sample | — |
| `magnet({id:'magnet'})` | 磁铁 | pole | — |
| `sampleTray({id:'sample-tray'})` | 检验产物白纸 | sample | — |
| `splint({id:'splint',length:1.3})` | 木条 | tip | `burning` 布尔、`extinction` |
| `candle({id:'candle',height:.48,lit:false})` | 蜡烛 | wick | `lit` 布尔、`extinction` |
| `candleStand({id:'candle-stand',low:.12,high:.65})` | 阶梯烛架 | low, high | — |
| `matchStick({id:'match'})` | 火柴 | tip | `lit` 布尔 |
| `opticalBench({id:'optical-bench',length:100,scale:.1})` | 光具座，长度单位映射为场景单位 | center | `targets` 数值数组 |
| `railSlider(id)` | 光具座滑块 | mount | — |
| `convexLens({id:'lens',center:1.7,radius:.65})` | 凸透镜 | center | `blocked` 遮挡比例 |
| `lightScreen({id:'screen',center:1.7,width:1.8,height:2})` | 光屏 | center | — |
| `microscope(id)` | 显微镜，高约 3.3 | center, stage, ocular, arm, base, nosepiece, low, high, tube, clips, hole, diaphragm, coarse, fine, mirror | `height`、`objective` 10/40、`parked`、`concave`、`turn`、`mirror`、`aperture`、`highlight` 部件 ID |
| `glassSlide(id)` | 载玻片 | center | `water` |
| `coverSlip(id)` | 盖玻片 | edge | `lower` |
| `tweezers(id)` | 镊子 | tip | — |
| `dropper(id)` | 滴管 | tip, bulb | `iodine` 布尔、`drip` |
| `blottingPaper(id)` | 吸水纸 | — | — |
| `onionScale(id)` | 洋葱鳞片叶 | film | `peel` |
| `epidermis(id)` | 表皮薄膜 | — | `flat` |
| `operationHand(id)` | 操作手 | — | — |
| `instrumentCase(id)` | 镜箱，初始隐藏 | center | `close` |

## 组合与对齐

先把器材注册进相同父坐标系，再使用 `object.position`、`rotation`、`scale` 摆放；需要精确连接时，用 `getWorldPosition` 读取锚点并转换到目标父物体的局部坐标，不能直接相减不同层级的局部坐标。试管轴沿自身 +Y，铁架台 `clamp` 是夹持位置，酒精灯的 `wick` 对准预期受热处；要留出外焰高度，不要让灯芯插入试管。导管使用 `connectedDeliveryPath(inlet, outlet, root, lift?)` 与 `roundedTubePath(points,bend?)` 生成路径，移动端点后以 `setState('points', points)` 更新。现成布局参考相邻的 examples 目录中的 copper、oxygen、co2。

## 默认器材的参考包围盒

下表是默认实例用 `THREE.Box3.setFromObject` 测得的 x × y × z，四舍五入到 0.01 场景单位；包含隐藏子对象、粒子包围盒等，不是物理尺寸，也不保证其他状态尺寸相同。`acidLiquid` 初始高度为 0；`deliveryTube` 以下结果只适用于从原点到 (1,0,0) 的路径。`labBench` 包含背景与地面，不用于设备取景。

| 器材 | x × y × z | 器材 | x × y × z |
|---|---|---|---|
| acidLiquid | 1.36 × 0 × 1.36 | alcoholBlowtorch | 1.25 × 1.09 × 1.05 |
| alcoholLamp / alcoholLampDetailed | 1.25 × 1.03 × 1.10 | beaker | 1.86 × 1.40 × 1.74 |
| blottingPaper | 0.45 × 0.03 × 0.65 | candle | 0.23 × 0.89 × 0.23 |
| candleStand | 1.20 × 0.65 × 0.42 | conicalFlask | 2.20 × 1.89 × 1.90 |
| convexLens | 0.20 × 2.39 × 1.37 | cottonPlug | 0.36 × 0.41 × 0.34 |
| coverSlip | 0.30 × 0.51 × 0.58 | deliveryTube | 1.01 × 0.11 × 0.11 |
| dropper | 0.22 × 0.88 × 0.22 | epidermis | 0.42 × 0 × 0.30 |
| gasJar | 0.95 × 1.63 × 0.95 | gasSource | 0.80 × 1.78 × 0.82 |
| glassPlate | 1.12 × 0.04 × 1.12 | glassSlide | 1.50 × 0.09 × 0.65 |
| hardGlassTube | 3.64 × 0.69 × 0.69 | instrumentCase | 4.32 × 3.71 × 4.21 |
| ironStand | 2.25 × 3.01 × 2.26 | labBench | 160 × 35 × 160 |
| lightScreen | 0.09 × 2.76 × 1.92 | litmusSolution | 1.65 × 1.35 × 1.54 |
| longStemFunnel | 0.58 × 2.25 × 0.58 | magnet | 1.00 × 0.18 × 0.22 |
| marbleChips | 0.97 × 0.21 × 0.97 | matchStick | 0.13 × 0.70 × 0.13 |
| microscope | 2.41 × 3.31 × 1.50 | nozzleTube | 0.13 × 0.40 × 0.13 |
| onionScale | 1.25 × 0.16 × 0.96 | operationHand | 0.36 × 0.12 × 0.52 |
| opticalBench | 10.40 × 0.56 × 0.77 | railSlider | 0.45 × 0.14 × 0.65 |
| rubberStopper | 0.61 × 0.30 × 0.61 | sampleTray | 1.80 × 0.01 × 0.85 |
| splint | 0.23 × 1.40 × 0.23 | springClip | 0.48 × 0.32 × 0.12 |
| testTube | 0.65 × 3.52 × 0.65 | tweezers | 0.33 × 0.04 × 0.95 |
| twoHoleStopper | 0.54 × 0.30 × 0.54 | waterTrough | 3.38 × 0.94 × 3.24 |

## 平面镜实验器材

- `glassPlateStand({id:'glass-plate-stand',width:3.1,height:2.15,thickness:.045,tilt:0})`：竖直薄玻璃板和底座组成一个整体，`width` 沿局部 Z，板面位于局部 X=0。`anchors.mirrorPlane` 位于板面中心，其局部 +Z 指向板面法线（可用 `getWorldDirection` 获取世界法线）；`anchors.base` 是底部中心。`setState('tilt', radians)` 绕底边倾斜板面和锚点，底座不动。
- `ruler({id:'ruler',length:3,centimeters:30,width:.24})`：沿局部 X 的水平刻度尺，`length` 是场景单位、`centimeters` 是等分的厘米刻度数；两者自行指定映射。锚点 `start`、`end`、`center`。
- `paperSheet({id:'paper',width:5,depth:3.9})`：位于局部 X–Z 平面的纸，`surface`、`center` 锚点位于纸上表面。调用 `paper.drawLine([x,z],[x,z], color?, width?)` 和 `paper.markPoint([x,z], color?, radius?)` 在纸的局部坐标中绘线和点，绘图属于纸的对象层级，随纸移动。

例如将 `glassPlateStand` 底部放在 `paper.surface` 高度，同时在纸上画局部 X=0 的直线，就能让板面与纸上的基准线对齐。倾斜或旋转后应以世界矩阵计算锚点和法线。完整课程见 `examples/plane-mirror.js`。

## 电学、电解、热学与生物器材

以下工厂均支持独立 `id`，均含 `setState`；`visible` 状态控制相应器材显隐。锚点均属于器材对象层级。`switch` 是对象属性，可直接调用 `apparatus.switch()`。

| 工厂及主要参数 | 锚点 | 状态 / 说明 |
|---|---|---|
| `dcPowerSupply({id})` | positive, negative, center | `on`；正红负黑接线柱。 |
| `wire({id,from,to,color,sag,radius})` | start, end | 从 `THREE.Vector3` 局部端点生成下垂曲线；`points` 可更新两端，`color` 改颜色。连接不同父级的锚点时应先转换到导线父级局部坐标。 |
| `switch({id,closed})` | start, end | `closed` 布尔，改变开关臂。 |
| `bulb({id,lit})` | positive, negative, center | `lit` 布尔控制灯丝发光。 |
| `electrolysisApparatus({id,progress})` | positive, negative, oxygen, hydrogen, center | `progress` 0–1；负极氢气体积为正极氧气两倍，管内液面同步下降；默认是水槽及两支倒置集气管的示意。 |
| `thermometer({id,temperature,min:-10,max:110})` | bulb, top, center | `temperature` 为实际刻度值，改变红色液柱；示意刻度按 min/max 均分。 |
| `waterBath({id,sample,temperature})` | sample, thermometer, center | 水浴烧杯、样品试管及温度计；`temperature` 更新液柱，`sample` 记录样品名称。课程应自行提供对应样品与相变现象。 |
| `ceramicGauze({id})`、`asbestosGauze({id})` | center | 陶瓷网或石棉网的通用视觉模型；`visible`。 |
| `tripod({id})` | top, center | 三脚架；`visible`。 |
| `stopwatch({id,seconds})` | center | `seconds` 更新表针。 |
| `pottedPlant({id})` | leaf1…leaf5, center, soil | `leaves` 为叶片器材数组；`leafVisible` 接受 `{index:0,visible:false}`。需要单独移动叶片时另建 `leaf()` 并隐藏盆栽对应叶片。 |
| `leaf({id})` | stem, center, tip | `covered` 控制局部遮光纸，`decolorized` 控制脱色，`blue` 显示蓝色反应区并保留被遮光区，且隐藏遮光纸以供观察；取下纸后仍保留遮光区，`resetExposure` 清除记录；叶形、叶脉及局部颜色由程序生成。 |
| `blackPaper({id,closed})` | center | 两张遮光纸夹层；`closed` 控制开合。 |
| `petriDish({id})` | center, surface | 透明培养皿；`visible`。 |
| `label({id,text})` | center | 名牌；`visible`。 |
| `tray({id})` | center, surface | 器材托盘；`visible`。 |

现有 `dropper(id)` 可用于滴加碘液（`iodine`、`drip` 状态）。`sample` 和名牌文案不会自动替代教学说明；示意模型不是实验量具的精密仿真。
