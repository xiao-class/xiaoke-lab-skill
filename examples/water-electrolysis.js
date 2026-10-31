const { apparatus: A, views, THREE } = XiaokeLab;

const predict = (question, choices, answer, explain) => ({
  question, options: choices.map(([id, text]) => ({ id, text })), answer, explain
});

// Four water molecules make the arrangement easier to see while conserving every atom.
const particleView = views.molecules({
  channel: 'electrolysis', source: { apparatus: 'cell', anchor: 'center' },
  reactants: ['H2O', 'H2O', 'H2O', 'H2O'],
  products: ['H2', 'H2', 'H2', 'H2', 'O2', 'O2'],
  captions: [
    { at: 0, text: '通电前：4 个水分子' },
    { at: .3, text: '水分子拆开，原子重新排列' },
    { at: .75, text: '生成 4 个氢分子和 2 个氧分子' }
  ]
});
particleView.data.background = '#d9e7e9';

function setProgress(ctx, p) {
  ctx.state.progress = p;
  ctx.getApparatus('cell').setState('progress', p);
  ctx.setProgress('electrolysis', p);
}
function demo(id, title, lesson, caption, focus, change) {
  return { id, trigger: id, title, lesson, async consequence(ctx) {
    ctx.detailCamera = { amount: 1, focus, apparatus: ['cell'], focusRadius: .7 };
    await ctx.tween(2, p => {
      change(ctx, p);
      ctx.demonstration = { progress: p, caption };
    });
  }};
}
const powerMistake = demo('power-first', '接线未完成先通电', '先断电接好导线，检查连接后再通电。',
  '导线未接好，电路不通，没有气泡（示意）', [2, .4, .6], (ctx, p) => {
    ctx.getApparatus('cell').object.getObjectByName('negative-wire').visible = p < .05;
  });
const compareMistake = demo('read-early', '只看气泡数就比较体积', '应收集一段时间，液面稳定后比较两管的气体体积。',
  '气泡大小和快慢不同，不能只凭气泡数判断体积', [0, 1.5, 0], (ctx, p) => {
    ctx.getApparatus('cell').object.getObjectByName('early-marker').visible = p > .1;
  });
const ignitionMistake = demo('unverified', '未经检纯就点燃', '氢气混入空气可能爆鸣，先验纯，再由教师取少量气体检验。',
  '混有空气的氢气点燃可能发生爆鸣（风险示意）', [.7, 2.2, 0], (ctx, p) => {
    const spark = ctx.getApparatus('cell').object.getObjectByName('risk-flash');
    spark.visible = p > .2; spark.scale.setScalar(.3 + .7 * p);
  });

export default XiaokeLab.defineExperiment({
  id: 'water-electrolysis', subject: 'chemistry', title: '电解水实验',
  equation: '2H₂O → 2H₂↑ + O₂↑', condition: '通直流电', framingApparatus: ['cell'],
  conclusion: '水通电分解生成氢气和氧气，说明水由氢元素和氧元素组成；反应前后原子的种类和数目不变。',
  modelNote: '气泡、液面和粒子均为教学示意；电解液由教师配制。气体溶解等因素可能使实际体积比偏离 2∶1。',
  safetyNotes: ['使用安全低压直流电，检查线路后再通电。', '由教师按规范配制电解液，不用食盐水代替。', '先断电，氢气验纯后再由教师取少量气体远离电源检验。'],
  secondView: particleView,
  setup(ctx) {
    ctx.addApparatus(A.labBench());
    const cell = ctx.addApparatus(A.electrolysisApparatus({ id: 'cell' }));
    // Keep the complete circuit in a single framing group. All coordinates are local to cell.
    const supply = A.dcPowerSupply({ id: 'power' });
    supply.object.name = 'power'; supply.object.position.set(2.5, 0, .1);
    cell.object.add(supply.object);
    cell.anchors.power = supply.anchors.center;
    for (const [name, color, from, to] of [
      ['positive-wire', 0xd63838, [2, .36, .78], [-.7, .17, .54]],
      ['negative-wire', 0x22272b, [3, .36, .78], [.7, .17, .54]]
    ]) {
      const wire = A.wire({ id: name, from: new THREE.Vector3(...from), to: new THREE.Vector3(...to), color, sag: .07, radius: .04 });
      wire.object.name = name; cell.object.add(wire.object);
    }
    const indicator = new THREE.Mesh(new THREE.SphereGeometry(.12, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffc53b }));
    indicator.position.set(-.7, 1.65, .32); indicator.name = 'early-marker'; indicator.visible = false; cell.object.add(indicator);
    const flash = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffbb58, transparent: true, opacity: .8 }));
    flash.position.set(.7, 2.25, .15); flash.name = 'risk-flash'; flash.visible = false; cell.object.add(flash);
    // Teacher's gas tests are drawn as separate, clearly visible props.
    const hydrogen = new THREE.Group(); hydrogen.name = 'hydrogen-test'; hydrogen.visible = false;
    const blueFlame = new THREE.Mesh(new THREE.ConeGeometry(.11, .4, 18), new THREE.MeshBasicMaterial({ color: 0x69bfff, transparent: true, opacity: .85 }));
    blueFlame.position.set(.7, 2.53, .15); hydrogen.add(blueFlame); cell.object.add(hydrogen);
    const oxygen = new THREE.Group(); oxygen.name = 'oxygen-test'; oxygen.visible = false;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .85, 10), new THREE.MeshStandardMaterial({ color: 0x9a673e }));
    stick.position.set(-.7, 2.62, .15); stick.rotation.z = -.28; oxygen.add(stick);
    const fire = new THREE.Mesh(new THREE.ConeGeometry(.12, .32, 16), new THREE.MeshBasicMaterial({ color: 0xffaa32 }));
    fire.position.set(-.58, 3.13, .15); oxygen.add(fire); cell.object.add(oxygen);
    // An effect updates between steps as well as during the collection tween.
    const group = new THREE.Group(), bubbleMaterial = new THREE.MeshBasicMaterial({ color: 0xe4faff, transparent: true, opacity: .9 });
    const bubbles = [];
    for (const x of [-.7, .7]) for (let i = 0; i < 5; i++) {
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(.035 + (i % 2) * .012, 10, 8), bubbleMaterial);
      group.add(bubble); bubbles.push({ bubble, x, i });
    }
    let time = 0;
    ctx.addEffect('electrode-bubbles', { object: group, start() {}, stop() {}, update(dt) {
      time += dt;
      const p = Number(ctx.state.progress) || 0;
      for (const { bubble, x, i } of bubbles) {
        const liquidTop = 2.13 - p * (x > 0 ? 1.35 : .675);
        const span = Math.max(.08, liquidTop - .58);
        bubble.position.set(x + (i % 2 ? .065 : -.065), .58 + ((time * .48 + i * .21) % 1) * span, .06);
        bubble.visible = !!ctx.state.powered;
      }
    }, dispose() { group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); bubbleMaterial.dispose(); } }, cell.object);
    ctx.state.powered = false; setProgress(ctx, 0);
  },
  steps: [
    { id: 'inspect', title: '观察电解装置', camera: { focus: 'cell.center' }, description: '观察水槽、两支倒置集气管、电极、学生电源和红黑导线。左正极，右负极。', action: { label: '观察装置', target: 'cell' },
      run(ctx) { ctx.callout('左正极 · 右负极', 'cell', 'center'); }, observation: '两支集气管内充满液体，电极浸入液体。' },
    { id: 'prepare', title: '检查液体与线路', camera: { focus: 'cell.center' }, description: '断电检查导线，确认两管充满电解液且没有残留空气。', action: { label: '检查连接', target: 'cell' },
      predict: predict('为什么要先排尽管中的空气？', [['air', '防止空气混入，影响体积比较和验气'], ['speed', '让水不通电也能分解'], ['equal', '使两侧气体体积一定相等']], 'air', '残留空气会混入生成的气体，影响读数和检验，也可能带来安全风险。'),
      mistakes: [powerMistake], run(ctx) { ctx.callout('排尽空气，接好线路', 'cell', 'center'); }, observation: '两管内没有明显气泡，红黑导线分别连到电极。' },
    { id: 'switch', title: '接通低压直流电', camera: { focus: 'cell.center' }, description: '接通电源，观察两根电极附近。', action: { label: '接通电源', target: 'cell' },
      predict: predict('通电后电极附近会出现什么？', [['both', '两极都出现气泡'], ['negative', '只有负极出现气泡'], ['none', '两极都无气泡，只是水变色']], 'both', '通电后水发生分解，两极分别产生气体。'),
      async run(ctx) { ctx.state.powered = true; await ctx.tween(2, p => setProgress(ctx, .18 * p)); }, observation: '两根电极附近都有气泡产生，气泡沿管上升。' },
    { id: 'collect', title: '继续收集气体', camera: { focus: 'cell.center' }, description: '保持通电，观察气泡和两支管内液面的变化。', action: { label: '继续通电', target: 'cell' },
      async run(ctx) { await ctx.tween(3, p => setProgress(ctx, .18 + .47 * p)); }, observation: '气体逐渐积累，两侧液面都下降，负极侧下降更明显。' },
    { id: 'compare', title: '比较两管气体', camera: { focus: 'cell.center' }, description: '继续收集并比较同温同压下的气体体积。', action: { label: '比较体积', target: 'cell' },
      predict: predict('负极与正极产生的气体体积约为多少？', [['two', '负极约为正极的两倍'], ['half', '正极约为负极的两倍'], ['same', '两侧体积相等']], 'two', '水分解产生氢气和氧气的分子数比为 2∶1，同温同压下体积比也约为 2∶1。'),
      mistakes: [compareMistake], async run(ctx) { await ctx.tween(2, p => setProgress(ctx, .65 + .35 * p)); ctx.callout('负极 ∶ 正极 ≈ 2 ∶ 1', 'cell', 'center'); }, observation: '负极管内气体体积约为正极的两倍。' },
    { id: 'stop', title: '断开电源', camera: { focus: 'cell.power' }, description: '停止通电，在教师指导下准备检验少量气体。', action: { label: '关闭电源', target: 'cell' },
      run(ctx) { ctx.state.powered = false; ctx.callout('先断电，再验气', 'cell', 'power'); }, observation: '气泡停止产生，收集管内留有气体。' },
    { id: 'oxygen', title: '检验正极气体', camera: { focus: 'cell.oxygen' }, description: '教师取少量正极气体，用带火星的木条检验。', action: { label: '检验正极气体', target: 'cell' },
      predict: predict('带火星的木条遇到正极气体会怎样？', [['relight', '复燃'], ['blue', '产生淡蓝色火焰'], ['out', '没有变化或熄灭']], 'relight', '正极生成氧气，氧气支持燃烧，能使带火星的木条复燃。'),
      run(ctx) { ctx.getApparatus('cell').object.getObjectByName('oxygen-test').visible = true; ctx.callout('带火星木条复燃', 'cell', 'oxygen'); }, observation: '带火星的木条复燃，正极气体是氧气。' },
    { id: 'hydrogen', title: '检验负极气体', camera: { focus: 'cell.hydrogen' }, description: '教师先验纯，再取少量负极气体远离电源点燃。验纯时混有空气可能有轻微爆鸣；纯净氢气安静燃烧。', warning: '氢气必须先验纯；切勿直接点燃未检纯的收集管。', action: { label: '检验负极气体', target: 'cell' },
      mistakes: [ignitionMistake], run(ctx) { const cell = ctx.getApparatus('cell'); cell.object.getObjectByName('oxygen-test').visible = false; cell.object.getObjectByName('hydrogen-test').visible = true; ctx.callout('验纯后：淡蓝色火焰', 'cell', 'hydrogen'); }, observation: '验纯时可能听到轻微爆鸣，纯净气体燃烧呈淡蓝色火焰；负极气体是氢气。' },
    { id: 'atoms', title: '解释微观变化', camera: { focus: 'cell.center' }, description: '重看水分子拆开、氢氧原子重新组合的过程，并比较原子计数。', action: { label: '重看微观变化', target: 'cell' },
      run: async ctx => { ctx.getApparatus('cell').object.getObjectByName('hydrogen-test').visible = false; await ctx.tween(3, p => ctx.setProgress('electrolysis', p)); }, observation: '水分子拆开，原子重新组成氢分子和氧分子；氢、氧原子数各自不变。' }
  ]
});
