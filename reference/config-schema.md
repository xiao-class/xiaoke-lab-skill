# 实验配置与上下文

配置是 ES2020 脚本，无 import；通过全局 `XiaokeLab` 获取 API，最后 `export default defineExperiment(config)`。`defineExperiment` 接收配置对象。`setup` 在初次创建及回放恢复时都会调用，必须可重复执行；不要在闭包中保存随步骤改变的全局状态。一个可运行的最小配置：

```js
const { apparatus, defineExperiment } = XiaokeLab;
export default defineExperiment({
  minimums: false, // 独立 API 演示；完整课程默认检查教学数量
  id: 'water-demo', subject: 'chemistry', title: '观察水面', equation: '',
  framingApparatus: ['cup'],
  setup(ctx) { ctx.addApparatus(apparatus.beaker({id: 'cup'})); },
  steps: [{
    id: 'observe', title: '观察', description: '观察杯中液面',
    camera: {focus: 'cup.surface'}, action: {label: '观察', target: 'cup'},
    run(ctx) { ctx.callout('液面', 'cup', 'surface'); }, observation: '杯中有液体。'
  }], conclusion: '观察到液面。'
});
```

## 顶层字段

| 字段 | 类型 | 作用 |
|---|---|---|
| `id`, `title` | string | 唯一英文标识、课件标题。 |
| `subject` | `chemistry` / `physics` / `biology` | 学科与主题色。 |
| `equation` | string | 主方程；不适用时可为空字符串。 |
| `condition` | string? | 反应条件。 |
| `orientation` | `landscape` / `portrait`? | 首选方向。 |
| `lampVariant` | `classic` / `detailed`? | 酒精灯样式选择。 |
| `framingApparatus` | string[]? | 初始取景的器材 ID；环境不应放入。 |
| `frameDirection` | `[number,number,number]`? | 初始与重置镜头方向。 |
| `setup(ctx)` | function | 同步创建、注册器材与现象。 |
| `steps` | Step[] | 默认至少五步，按顺序执行；还要求至少三个预测和三个假如分支。 |
| `minimums` | boolean? | 仅对简单演示设为 `false`，关闭步骤、预测与假如数量下限。 |
| `secondView` | SecondView? | 微观、光路或目镜视野，见 views.md。 |
| `micro` | MicroScene? | 原有微观配置字段；新课件优先使用 `secondView`。 |
| `summaryDiagram` | `{src,title,labels:string[]}`? | 小结图。自包含 HTML 中图像应使用 data URL。 |
| `rules` | `{id,object,image,distance,application}[]`? | 光学规律表。 |
| `modelNote`, `conclusion` | string? | 模型边界与实验结论。 |
| `substances` | `{id,label,side,targets,description}[]`? | 方程物质说明；`side` 为 `reactant` 或 `product`，`targets` 为器材 ID。 |
| `safetyNotes` | string[]? | 安全提示。 |
| `credit` | boolean? | 网页署名开关，默认显示。 |

## 步骤

`Step` 必填 `id`、`title`、`description`、`run(ctx)`。`action` 是 `{label, target?, run?(ctx)}`；或使用 `actions` 数组按顺序要求多个动作。动作的 `run` 在步骤 `run` 前执行，可返回 Promise。`target` 是点击目标；`camera: {focus:'器材ID.锚点名', distance?:number}`。`observation`、`warning`、`secondaryEquation`、`secondaryEquationLabel` 是字符串；`railTargets` 是导轨 ID 到目标数值的映射。

`predict` 为 `{question, options:[{id,text}], answer, explain, observeAt?}`：`answer` 是选项 ID，`observeAt` 是揭晓观察的步骤 ID，省略表示本步。`mistakes` 是 `{id, trigger, title, lesson, consequence(ctx)}` 数组；`trigger` 是错误操作 ID，不能与本步当前正确动作的 `target` 相同。`consequence` 返回 Promise，结束后可倒带。使用 `ctx.tween` 记录可逆过程；恢复会重建并回放先前步骤，因此不要依赖对象引用跨越恢复。

## ExperimentContext

- `root` 是当前实验根 Group；`apparatus`、`effects`、`rails`、`pointers` 是 Map。`addApparatus(item, parent=ctx.root)`、`addEffect(id,effect,parent=ctx.root)` 注册并返回对象；ID 不可重复。`getApparatus(id)`、`getEffect(id)` 找不到时抛错。
- `tween(seconds, frame)` 返回 Promise，frame 接收 0–1 进度；`wait(seconds)` 也是 Promise。`setProgress(channel,value)` 将进度限制到 0–1，可驱动微观视图。`update(dt)` 更新时钟、器材、现象与 callout；宿主负责逐帧调用。
- `callout(label,target,anchor)` 标注器材锚点，正常情况下持续 2.5 秒；回放时不创建。`state` 是普通对象；用 `ctx.state.key = value` 写入，不存在 `ctx.setState`。器材状态通过 `ctx.getApparatus(id).setState?.(key,value)` 设置。
- `addRail(options)`、`addPointer(id,interaction)`、`registerInteraction(id,{capture,restore})` 注册互动；`railValues()` / `restoreRails(values)`、`captureInteractions()` / `restoreInteractions(values)` 用于状态恢复。详情见 interactions.md。
- `observationCamera` 为 `{position:[x,y,z],target:[x,y,z]}` 或 null；`detailCamera` 为 `{amount,focus:[x,y,z],apparatus:string[],focusRadius?,direction?,focusSize?,widthFill?}` 或 null；`inspectionCamera` 为 `{apparatus:string[],stage:'pour'|'attract'}` 或 null。`demonstration` 可提供 `{progress,caption,mixture?,pressure?,camera?}`。这些是宿主读取的相机与后果状态，不是直接操作摄像机的方法。
- `replaying` 表示恢复回放；`beginConsequence()`、`rewindConsequence()` 和 `onConsequenceRewound(cleanup)` 服务分支回退。通常让引擎调用前两者。`dispose()` 释放上下文持有的资源。

`ExperimentEngine(config,parent?)` 提供 `snapshot`、`subscribe`、`update(dt)`、`play()`、`pause()`、`act(target?)`、`next()`、`previous()`、`reset()`、`answerPrediction(selected,classroom?)`、`continueExplanation()`、`rewindMistake()`、`checkpoint()`、`resume(checkpoint)`、`dispose()`。`snapshot.mistake` 为 null 或 `{mistake,phase:'demo'|'lesson'|'rewind'}`。宿主调用 `XiaokeLab.mount(container,config,options)` 挂载网页。异步步骤需要宿主持续调用 `update` 才能推进 tween。
