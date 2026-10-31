const { apparatus, defineExperiment } = XiaokeLab;
export default defineExperiment({
  id: __ID__, subject: __SUBJECT__, title: __TITLE__, equation: '',
  framingApparatus: ['beaker'],
  setup(ctx) {
    ctx.addApparatus(apparatus.labBench());
    ctx.addApparatus(apparatus.beaker());
  },
  steps: [{
    id: 'observe', title: '观察实验', description: '请补充操作和观察。',
    camera: {focus: 'beaker.surface'}, action: {label: '开始观察'},
    run(ctx) { ctx.callout('请补充观察', 'beaker', 'surface'); },
    observation: '请补充观察结果。'
  }]
});
