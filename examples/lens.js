// Generated from miniprogram/packageLab/lib/experiments/lens.ts by scripts/export-skill-examples.js.
// This standalone configuration only uses the XiaokeLab public API.
const THREE = XiaokeLab.THREE;
const { opticalBench, railSlider, convexLens, lightScreen, matchStick, candle, labBench } = XiaokeLab.apparatus;
const { screenImage, virtualImage, parallelLight } = XiaokeLab.effects;
const { lensRules, opticalReading } = XiaokeLab.optics;
function lensState(ctx) { return ctx.state.optics; }
function observe(ctx, observing) { lensState(ctx).observing = observing; ctx.observationCamera = observing ? { position: [.8, 1.7, 0], target: [-1, 1.7, 0] } : null; sync(ctx); }
function sync(ctx) { ctx.effects.forEach(e => e.update(0)); }
function illuminate(ctx) { const s = lensState(ctx); s.parallel = false; s.lit = true; s.observing = false; s.offset = 0; s.blocked = 0; ctx.observationCamera = null; ctx.getEffect('sunlight').stop(); ctx.getApparatus('candle').object.visible = true; ctx.getApparatus('candle').object.position.y = .37; ctx.getApparatus('candle').object.scale.y = 1; ctx.getApparatus('candle').setState?.('lit', true); ctx.getApparatus('lens').setState?.('blocked', 0); sync(ctx); }
async function move(ctx, id, to) { const rail = ctx.rails.get(id); const from = rail.value; await ctx.tween(1.2, p => { rail.set(from + (to - from) * p, false); sync(ctx); }); rail.set(to); sync(ctx); }
async function position(ctx, c, s) { illuminate(ctx); await move(ctx, 'candle', c); await move(ctx, 'screen', s); }
async function showScreen(ctx) {
    const focus = ctx.getApparatus('screen').anchors.center.getWorldPosition(new THREE.Vector3()).toArray();
    const shot = { focus, apparatus: ['screen'], focusRadius: 1.05 };
    await ctx.tween(.9, p => ctx.detailCamera = { ...shot, amount: p });
    await ctx.wait(1.8);
    await ctx.tween(.8, p => ctx.detailCamera = { ...shot, amount: 1 - p });
    ctx.detailCamera = null;
}
async function closeup(ctx, caption, change) {
    await ctx.tween(4, p => { change(p); sync(ctx); const point = ctx.getApparatus('screen').anchors.center.getWorldPosition(new THREE.Vector3()); ctx.detailCamera = { amount: p, focus: point.toArray(), apparatus: ['screen'], focusRadius: 1.15 }; ctx.demonstration = { progress: p, caption }; });
}
const cases = [
    { id: 'far', title: 'u > 2f · 缩小的实像', c: 20, s: 65, description: '蜡烛放在 20 cm（u = 30 cm）。来回移动光屏，在 65 cm 找到最清晰的像。比较像的方向和大小。', observation: 'u = 30 cm，v = 15 cm：倒立、缩小的实像，f < v < 2f；照相机利用这一规律。' },
    { id: 'twice', title: 'u = 2f · 等大的实像', c: 30, s: 70, description: '蜡烛移到 30 cm（u = 20 cm），重新寻找最清晰的像。注意光屏远离透镜。', observation: 'u = 20 cm，v = 20 cm：倒立、等大的实像。' },
    { id: 'near', title: 'f < u < 2f · 放大的实像', c: 35, s: 80, description: '蜡烛放在 35 cm（u = 15 cm），光屏移到 80 cm。观察倒立、放大的清晰烛焰像。', observation: 'u = 15 cm，v = 30 cm：倒立、放大的实像，v > 2f；投影仪利用这一规律。' },
    { id: 'focus', title: 'u = f · 不成像', c: 40, s: 80, description: '蜡烛放在 40 cm（u = 10 cm）。前后移动光屏，始终找不到清晰的像，只有一片光。', observation: 'u = f 时，出射光平行，不成像；任何有限位置的光屏都找不到清晰的像。' },
    { id: 'inside', title: 'u < f · 透过透镜观察', c: 45, s: 80, description: '蜡烛放在 45 cm（u = 5 cm）。光屏上得不到像；从光屏一侧透过透镜观察，同侧出现正立、放大的虚像。', observation: 'u = 5 cm：光屏接收不到像。从光屏侧透过透镜，看到正立、放大的虚像，与烛焰同侧；应用于放大镜。' },
];
const imagingSteps = cases.map(row => ({ id: row.id, title: row.title, description: row.description, camera: { focus: 'screen.center' }, railTargets: { candle: row.c, screen: row.s }, action: { label: '自动移动到位', target: 'screen' }, async run(ctx) { await position(ctx, row.c, row.s); const r = opticalReading(lensState(ctx)); ctx.callout(r.image.kind === 'real' ? `最清晰 · v = ${r.image.v.toFixed(1)} cm` : r.image.kind === 'virtual' ? '光屏无像 · 请从光屏侧透过透镜观察' : '不成像 · 移动光屏仍找不到清晰像', 'screen', 'center'); await showScreen(ctx); }, observation: row.observation }));
imagingSteps[0].predict = { question: 'u = 30 cm 时，像是什么样的？', options: [{ id: 'small', text: '倒立、缩小的实像' }, { id: 'big', text: '倒立、放大的实像' }, { id: 'upright', text: '正立、放大的虚像' }], answer: 'small', explain: '物体在二倍焦距外，清晰的像位于一倍与二倍焦距之间，是倒立、缩小的实像。' };
imagingSteps[1].predict = { question: '蜡烛从 20 cm 向透镜靠近（u 仍大于 f），光屏和像怎样变化？', options: [{ id: 'away', text: '光屏远离透镜，像变大' }, { id: 'toward', text: '光屏靠近透镜，像变小' }, { id: 'same', text: '光屏不动，像不变' }], answer: 'away', explain: '成实像时，物近像远像变大。u 从 30 cm 减到 20 cm，v 从 15 cm 增到 20 cm。' };
imagingSteps[4].predict = { question: 'u = 5 cm 时，在光屏上能看到像吗？', options: [{ id: 'virtual', text: '不能；透过透镜看到正立、放大的虚像' }, { id: 'screen', text: '能；光屏上有倒立放大的像' }, { id: 'none', text: '不能；任何方向都看不到像' }], answer: 'virtual', explain: '物体位于一倍焦距内，折射光线的反向延长线相交成虚像；需从光屏一侧透过透镜观察。' };
imagingSteps[0].mistakes = [
    { id: 'defocus', trigger: 'defocus', title: '光屏没有移到像距处', lesson: '模糊光斑不等于不成像。来回移动光屏，在 65 cm（v = 15 cm）找到最清晰的像。', async consequence(ctx) { await position(ctx, 20, 65); ctx.callout('清晰像 → 偏离像距 → 模糊光斑', 'screen', 'center'); await closeup(ctx, '光屏偏离像距：烛焰像变大、变淡、变模糊；来回移动寻找最清晰处', p => ctx.rails.get('screen').set(65 + 12 * p, false)); } },
    { id: 'half-covered', trigger: 'half-covered', title: '用纸挡住透镜上半部分', lesson: '像仍然完整，只是变暗。每个物点的光仍能经过未遮住的透镜部分会聚成像。', async consequence(ctx) { await position(ctx, 20, 65); await closeup(ctx, '遮住透镜上半部分：完整的倒立烛焰像仍在，只是变暗', p => { lensState(ctx).blocked = p * .5; ctx.getApparatus('lens').setState?.('blocked', p * .5); }); ctx.callout('像仍完整 · 亮度降低', 'screen', 'center'); } }
];
const lensExperiment = {
    id: 'lens', title: '探究凸透镜成像的规律', subject: 'physics', orientation: 'landscape', equation: '一倍焦距分虚实，二倍焦距分大小',
    secondView: { type: 'rayDiagram', screenCloseup: true, sample: lensState, setObserving: observe }, rules: lensRules,
    // 25° elevation, 40° off the rail, on the candle side. Frame only the working span.
    frameDirection: [-.7660444431, .4663076582, .6427876097],
    framingApparatus: ['candle-slider', 'candle', 'lens-slider', 'lens', 'screen-slider', 'screen'],
    geometryExceptions: [{ kind: 'scale', ids: ['optical-bench'], reason: '光具座是 100 cm 的长导轨，远长于滑块和火柴属于器材的正常比例。' }],
    conclusion: '一倍焦距分虚实，二倍焦距分大小；成实像时，物近像远像变大。虚像不能用光屏承接，要从光屏一侧透过透镜观察。',
    modelNote: '薄透镜、近轴光线教学模型；位置以 cm 计，像距为模型计算。光路与虚像为辅助示意；画面亮度与模糊度非定量光度测量。',
    safetyNotes: ['使用火柴时注意防火；实验结束熄灭蜡烛。', '平行光模拟太阳光测焦距，切勿透过透镜直视太阳，也勿让聚焦光斑照射皮肤或可燃物。', '调整烛焰中心、透镜中心、光屏中心大致在同一高度，使像成在光屏中央。'],
    setup(ctx) {
        Object.assign(ctx.state, { optics: { f: 10, lens: 50, candle: 20, screen: 75, height: 3.6, offset: 0, blocked: 0, parallel: true, lit: false, observing: false } });
        ctx.registerInteraction('observer', { capture: () => lensState(ctx).observing, restore: value => observe(ctx, value === true) });
        ctx.addApparatus(labBench({ width: 80, depth: 24 }));
        ctx.addApparatus(opticalBench());
        for (const id of ['candle', 'lens', 'screen']) {
            const slider = ctx.addApparatus(railSlider(`${id}-slider`));
            slider.object.userData.mountedOn = 'optical-bench';
        }
        const c = ctx.addApparatus(candle({ height: 1.1 }));
        c.object.position.y = .37;
        c.object.visible = false;
        ctx.addApparatus(convexLens());
        const screen = ctx.addApparatus(lightScreen());
        const match = ctx.addApparatus(matchStick());
        match.object.position.set(-3, .04, 1);
        match.object.rotation.z = -Math.PI / 2;
        for (const [id, label, min, max, value] of [['candle', '蜡烛', 0, 49, 20], ['screen', '光屏', 51, 100, 75]]) {
            ctx.addRail({ id, label, min, max, value, snap: 1, origin: [-5, 0, 0], direction: [1, 0, 0], unitsPerWorld: 10, onChange(value) { lensState(ctx)[id] = value; ctx.getApparatus(id).object.position.x = (value - 50) * .1; ctx.getApparatus(`${id}-slider`).object.position.x = (value - 50) * .1; } });
        }
        ctx.addEffect('screen-image', screenImage(() => lensState(ctx)), screen.anchors.center);
        ctx.addEffect('virtual-image', virtualImage(() => lensState(ctx)));
        ctx.addEffect('sunlight', parallelLight({ screen: () => (lensState(ctx).screen - lensState(ctx).lens) * .1 })).start();
        sync(ctx);
    },
    steps: [
        { id: 'measure', title: '认识器材，测量焦距', camera: { focus: 'optical-bench.center' }, description: '光具座刻度为 0–100 cm。凸透镜固定在 50 cm，用平行光（太阳光示意）照射，拖动光屏寻找最小最亮光斑。光屏在 60 cm 时，f = 10.0 cm。', railTargets: { screen: 60 }, action: { label: '自动移动光屏到焦点', target: 'screen' }, async run(ctx) { await move(ctx, 'screen', 60); ctx.callout('最小最亮光斑 · f = 10.0 cm', 'screen', 'center'); await ctx.wait(1.5); }, observation: '平行光经凸透镜后会聚，光屏在 60.0 cm 得到最小最亮光斑；透镜在 50.0 cm，焦距 f = 10.0 cm。' },
        { id: 'align', title: '安装、点燃与三心调节', camera: { focus: 'candle.wick' }, description: '蜡烛、凸透镜、光屏依次放在光具座上。用火柴点燃蜡烛，调整烛焰中心、透镜中心和光屏中心大致在同一高度，使像成在光屏中央。', action: { label: '点燃蜡烛并调节三心', target: 'match' }, async run(ctx) { const match = ctx.getApparatus('match'); match.setState?.('lit', true); illuminate(ctx); await ctx.tween(1, p => match.object.position.set(-3, .4 + p * .6, .8 * (1 - p))); match.setState?.('lit', false); match.object.visible = false; await position(ctx, 20, 65); ctx.callout('三心大致同高 → 像成在光屏中央', 'screen', 'center'); await ctx.wait(1); }, observation: '烛焰中心、透镜中心和光屏中心大致在同一高度，像成在光屏中央。', mistakes: [{ id: 'misaligned', trigger: 'misaligned', title: '三心不在同一高度（烛焰偏低）', lesson: '烛焰偏低，倒立的像向上偏移，甚至跑出光屏。调节三心大致同高，目的是使像成在光屏中央。', async consequence(ctx) { await position(ctx, 35, 80); await closeup(ctx, '烛焰偏低 → 像向上移到光屏边缘；三心同高才能使像成在中央', p => { lensState(ctx).offset = -5.985 * p; ctx.getApparatus('candle').object.scale.y = 1 - .45 * p; }); } }] },
        ...imagingSteps,
        { id: 'summary', title: '总结凸透镜成像规律', camera: { focus: 'optical-bench.center' }, description: '对照规律表，归纳一倍焦距与二倍焦距两个分界。在成实像的范围内拖动蜡烛，观察物近像远像变大。', action: { label: '整理实验小结' }, run(ctx) { ctx.observationCamera = null; lensState(ctx).observing = false; sync(ctx); }, observation: '一倍焦距分虚实，二倍焦距分大小；成实像时，物近像远像变大。' }
    ]
};

lensExperiment.subject = 'physics';
export default XiaokeLab.defineExperiment(lensExperiment);
