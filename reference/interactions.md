# 交互

`XiaokeLab.interaction` 导出 `RailDrag`、`snapRail`、`KnobRotate`、`StageDrag`。使用上下文注册以便宿主连接鼠标和触摸。导轨值通过 `ctx.addRail({id,label,min,max,snap,value,origin,direction,unitsPerWorld,onChange})` 建立：origin 和 direction 为三元数组，value/min/max/snap 为数值，`onChange(value)` 更新器材位置。`snapRail(value,min,max,step=1)` 将值吸附并限制范围。导轨实例支持 `set(value,snap=true)`、`point(value?)`、`pixel(camera,width,value?)`、`valueAtPixel(camera,width,pixel)`、`pixelsPerUnit(camera,width)`、`readout()`。

`new KnobRotate({center,get,set,perTurn,min,max})`：center 返回 THREE.Vector3 世界坐标；get/set 读写值，perTurn 是转一周的数值变化。`new StageDrag({enabled?,height,get,set,limit})`：height 返回水平面的世界 y；get/set 读写 `{x,y}`，limit 限制两个轴。二者实现 `begin(point,camera,width,height)`、`move(...)`、`end()`；point 是像素 `{x,y}`。用 `ctx.addPointer(id,instance)` 注册。对于需要恢复的自定义拖动状态，用 `ctx.registerInteraction(id,{capture,restore})` 保存与重建；导轨由引擎单独保存。

```js
const { apparatus, defineExperiment } = XiaokeLab;
export default defineExperiment({
  minimums: false, // 独立 API 演示；完整课程默认检查教学数量
  id:'rail-demo', subject:'physics', title:'移动光屏', equation:'',
  setup(ctx) {
    const screen = ctx.addApparatus(apparatus.lightScreen({id:'screen'}));
    ctx.addRail({id:'screen',label:'光屏',min:0,max:10,snap:1,value:5,
      origin:[0,0,0],direction:[1,0,0],unitsPerWorld:1,
      onChange(value) { screen.object.position.x = value; }});
  },
  steps:[{id:'move',title:'移动',description:'移动光屏',camera:{focus:'screen.center'},
    action:{label:'移动',target:'screen'},run(ctx){ctx.rails.get('screen').set(6);},
    observation:'光屏沿导轨移动。'}]
});
```
