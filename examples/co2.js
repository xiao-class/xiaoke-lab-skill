// Generated from miniprogram/packageLab/lib/experiments/co2.ts by scripts/export-skill-examples.js.
// This standalone configuration only uses the XiaokeLab public API.
const THREE = XiaokeLab.THREE;
const { conicalFlask, longStemFunnel, twoHoleStopper, springClip, marbleChips, acidLiquid, candle, candleStand, litmusSolution, gasJar, glassPlate, splint, beaker, deliveryTube, connectedDeliveryPath, labBench } = XiaokeLab.apparatus;
const { bubbles, turbidity, effervescence, gasPour, gasFlow } = XiaokeLab.effects;
// One CaCO3 formula unit at the lattice surface plus two dissociated HCl units.
// Ca and Cl end as separate aqueous ions; no fictitious CaCl2 molecule is drawn.
const specs = [
    { id: 'Ca', element: 'Ca', before: 'CaCO3', after: 'CaCl2', start: [-1.45, -.2, 0], join: [-1.45, -.3, 0], end: [-1.65, -.65, 0] },
    { id: 'C', element: 'C', before: 'CaCO3', after: 'CO2', start: [-.5, -.2, 0], join: [.3, .25, 0], end: [1.8, 1.7, 0] },
    { id: 'O1', element: 'O', before: 'CaCO3', after: 'CO2', start: [-.9, .3, 0], join: [-.15, .25, 0], end: [1.35, 1.7, 0] },
    { id: 'O2', element: 'O', before: 'CaCO3', after: 'CO2', start: [0, -.1, 0], join: [.75, .25, 0], end: [2.25, 1.7, 0] },
    { id: 'O3', element: 'O', before: 'CaCO3', after: 'H2O', start: [-.65, -.7, 0], join: [.15, -.6, 0], end: [.3, -.65, 0] },
    { id: 'H1', element: 'H', before: 'HCl', after: 'H2O', start: [.4, .85, 0], join: [-.14, -.37, 0], end: [.01, -.42, 0] },
    { id: 'H2', element: 'H', before: 'HCl', after: 'H2O', start: [1.35, .55, 0], join: [.44, -.37, 0], end: [.59, -.42, 0] },
    { id: 'Cl1', element: 'Cl', before: 'HCl', after: 'CaCl2', start: [1.4, -.6, .1], join: [1.4, -.65, .1], end: [1.4, -.65, .1] },
    { id: 'Cl2', element: 'Cl', before: 'HCl', after: 'CaCl2', start: [-.7, 1.1, .1], join: [-.9, .8, .1], end: [-.9, .8, .1] },
];
const particles = specs.map(s => ({ id: s.id, element: s.element, radius: s.element === 'H' ? .13 : .22, frames: [
        { at: 0, position: s.start, species: s.before, side: 'reactant' },
        { at: .18, position: s.start, species: s.before, side: 'reactant' },
        { at: .55, position: s.join, species: s.after, side: 'product' },
        { at: 1, position: s.end, species: s.after, side: 'product' }
    ] }));
const micro = { channel: 'reaction', source: { apparatus: 'marble', anchor: 'sample' }, particles, surfaces: [{ position: [0, 1.15, 0], size: [5, 1.8], color: '#93cbd1', opacity: .16 }],
    elements: { Ca: { color: '#c5d699', label: '钙' }, C: { color: '#485661', label: '碳' }, O: { color: '#e87863', label: '氧' }, H: { color: '#ecede7', label: '氢' }, Cl: { color: '#7abe86', label: '氯' } },
    bonds: [...['O1', 'O2', 'O3'].map(b => ({ a: 'C', b, from: 0, to: .549 })), ...['O1', 'O2'].map(b => ({ a: 'C', b, from: .55, to: 1, order: 2 })), ...['H1', 'H2'].map(b => ({ a: 'O3', b, from: .55, to: 1 })), { a: 'Ca', b: 'O3', from: 0, to: .18 }],
    captions: [{ at: 0, text: 'CaCO₃ 晶格表面片段；稀盐酸中的 H⁺、Cl⁻ 分散在水中（示意）' }, { at: .18, text: 'H⁺ 靠近 CO₃²⁻，原子重新组合，生成 H₂O 和 CO₂' }, { at: .55, text: 'CO₂ 分子向上逸出液面；Ca²⁺、Cl⁻ 留在溶液中' }, { at: 1, text: 'Ca 1→1 · C 1→1 · O 3→3 · H 2→2 · Cl 2→2；原子守恒' }] };
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const flaskX = -2.3, stationX = 2.1;
const local = (ctx, id, key) => ctx.root.worldToLocal(ctx.getApparatus(id).anchors[key].getWorldPosition(v(0, 0)));
const path = (ctx, end = v(stationX, .18)) => { const points = connectedDeliveryPath(ctx.getApparatus('stopper').anchors.outlet, end, ctx.root); points[2].y = points[3].y = Math.max(2.55, end.y + .35); return points; };
const intensity = (ctx, p) => ctx.getEffect('reaction-bubbles').setIntensity(p);
function station(ctx, ids) { for (const id of ['gas-jar', 'glass-plate', 'splint', 'limewater', 'candle-cup', 'candle-stand', 'low-candle', 'high-candle', 'litmus'])
    ctx.getApparatus(id).object.visible = ids.includes(id); }
async function closeup(ctx, id, anchor, radius) { const focus = ctx.getApparatus(id).anchors[anchor].getWorldPosition(v(0, 0)).toArray(); await ctx.tween(.7, p => ctx.detailCamera = { amount: p, focus, apparatus: [id], focusRadius: radius }); }
async function endCloseup(ctx) { const camera = ctx.detailCamera; if (camera)
    await ctx.tween(.6, p => ctx.detailCamera = { ...camera, amount: 1 - p }); ctx.detailCamera = null; }
async function bubbleThrough(ctx, id, effect, change) {
    station(ctx, [id]);
    const tube = ctx.getApparatus('delivery'), surface = local(ctx, id, 'surface');
    // Keep the outlet immersed in the completed view; the next step moves/hides the assembly.
    const immersed = surface.clone().add(v(0, -.48));
    tube.object.visible = true;
    tube.setState?.('points', path(ctx, surface.clone().add(v(0, 1.1))));
    await closeup(ctx, id, 'surface', .85);
    const from = local(ctx, 'delivery', 'outlet');
    await ctx.tween(.8, p => tube.setState?.('points', path(ctx, from.clone().lerp(immersed, p))));
    const gas = ctx.getEffect(effect);
    gas.start();
    await ctx.tween(4, change);
    gas.stop();
    await endCloseup(ctx);
}
function demo(ctx, p, caption) { ctx.demonstration = { progress: p, caption }; }
async function load(ctx, sealed = true) {
    const plug = ctx.getApparatus('stopper'), marble = ctx.getApparatus('marble'), funnel = ctx.getApparatus('funnel'), acid = ctx.getApparatus('acid'), tube = ctx.getApparatus('delivery');
    // Discard the check water before loading. Lift the complete stopper/funnel assembly.
    acid.setState?.('height', 0);
    funnel.setState?.('waterColumn', 0);
    tube.object.visible = false;
    await ctx.tween(.7, p => plug.object.position.y = p * 1.65);
    marble.object.visible = true;
    await ctx.tween(.9, p => marble.object.position.y = (1 - p) * 1.7);
    await ctx.tween(.7, p => plug.object.position.y = (1 - p) * 1.65);
    tube.object.visible = true;
    funnel.object.position.y = sealed ? -1.45 : -.85;
    funnel.setState?.('pouring', 1);
    await ctx.tween(1.8, p => acid.setState?.('height', p * .67));
    funnel.setState?.('pouring', 0);
    // Connected liquid inside the stem reaches the same level as the flask liquid.
    funnel.setState?.('waterColumn', sealed ? .36 : 0);
    intensity(ctx, 1);
    Object.assign(ctx.state, { loaded: true, sealed, acid: 'HCl' });
}
async function cover(ctx) { const plate = ctx.getApparatus('glass-plate'), from = plate.object.position.clone(), mouth = local(ctx, 'gas-jar', 'mouth'); await ctx.tween(.7, p => plate.object.position.copy(from).lerp(mouth, p)); ctx.state.covered = true; }
async function testFull(ctx, full) {
    const stick = ctx.getApparatus('splint'), plate = ctx.getApparatus('glass-plate');
    stick.object.visible = true;
    plate.object.position.set(3.15, .04, .35);
    ctx.state.covered = false;
    const mouth = local(ctx, 'gas-jar', 'mouth');
    stick.object.position.copy(mouth).add(v(.7, .02));
    stick.object.rotation.z = -Math.PI / 2;
    stick.setState?.('burning', true);
    await ctx.tween(1, p => stick.object.position.copy(mouth).add(v(.7 * (1 - p), .02)));
    if (full) {
        await ctx.tween(1.8, p => stick.setState?.('extinction', p));
        ctx.state.splintOut = true;
        ctx.callout('瓶口木条熄灭 → 已集满', 'gas-jar', 'mouth');
    }
    else {
        await ctx.wait(2);
        ctx.state.splintOut = false;
    }
}
const co2Experiment = {
    id: 'co2', title: '二氧化碳的实验室制取与性质', orientation: 'landscape', equation: 'CaCO₃ + 2HCl == CaCl₂ + H₂O + CO₂↑', micro,
    framingApparatus: ['flask', 'stopper', 'funnel', 'clip', 'acid', 'marble', 'delivery', 'gas-jar', 'glass-plate', 'splint', 'limewater', 'candle-cup', 'candle-stand', 'low-candle', 'high-candle', 'litmus'],
    substances: [
        { id: 'CaCO3', label: 'CaCO₃', side: 'reactant', targets: ['marble'], description: '大理石或石灰石的主要成分，与稀盐酸反应，表面冒泡并逐渐变小。' },
        { id: 'HCl', label: '2HCl', side: 'reactant', targets: ['acid', 'funnel'], description: '稀盐酸经长颈漏斗加入；液面必须没过漏斗下端形成液封。' },
        { id: 'CaCl2', label: 'CaCl₂', side: 'product', targets: ['acid'], description: 'Ca²⁺、Cl⁻ 留在溶液中，不把氯化钙画成独立分子。' },
        { id: 'H2O', label: 'H₂O', side: 'product', targets: ['acid'], description: '氢、氧原子重新组合生成水。' },
        { id: 'CO2', label: 'CO₂↑', side: 'product', targets: ['gas-jar', 'limewater', 'low-candle', 'high-candle'], description: 'CO₂ 密度比空气大；使澄清石灰水变浑浊，使下层蜡烛先熄灭。CO₂ 无色，此处气流仅为示意。' }
    ],
    conclusion: '大理石与稀盐酸制取 CO₂；长颈漏斗下端必须液封。CO₂ 能溶于水，采用向上排空气法；瓶口燃着木条熄灭用于验满，澄清石灰水变浑浊用于检验。CO₂ 密度比空气大，不燃烧也不支持燃烧；与水反应生成碳酸，使紫色石蕊变红。Ca 1→1、C 1→1、O 3→3、H 2→2、Cl 2→2，原子守恒。',
    safetyNotes: ['稀盐酸有腐蚀性，避免接触皮肤；实验后废液倒入指定容器。', '夹住导管上的弹簧夹检查气密性；装药品前倒掉检查用水，反应前打开弹簧夹。', '长颈漏斗下端伸入液面以下，形成液封，防止气体从漏斗口逸出。', 'CO₂ 能溶于水，不用排水法；向上排空气法收集，导管伸到瓶底，瓶口朝上。', 'CO₂ 无色，此处为示意；气流、积聚层、微粒与反应时间均作教学简化。'],
    setup(ctx) {
        ctx.addApparatus(labBench());
        const flask = ctx.addApparatus(conicalFlask());
        flask.object.position.x = flaskX;
        const stopper = ctx.addApparatus(twoHoleStopper(), flask.anchors.mouth);
        const funnel = ctx.addApparatus(longStemFunnel(), stopper.object);
        funnel.object.position.set(stopper.anchors.inlet.position.x, -1.45, 0);
        const acid = ctx.addApparatus(acidLiquid(), flask.object);
        acid.object.userData.contains = ['marble'];
        const marble = ctx.addApparatus(marbleChips(), flask.object);
        marble.object.visible = false;
        const tube = ctx.addApparatus(deliveryTube({ points: path(ctx, v(stationX, 1.9)) }));
        const clip = ctx.addApparatus(springClip(), tube.object);
        clip.object.position.set(-.8, 2.55, 0);
        const jar = ctx.addApparatus(gasJar({ inverted: false, waterLevel: 0 }));
        jar.object.position.set(stationX, 0, 0);
        const plate = ctx.addApparatus(glassPlate());
        plate.object.position.set(3.15, .04, .35);
        ctx.addApparatus(splint());
        const lime = ctx.addApparatus(beaker({ id: 'limewater' }));
        lime.object.position.x = stationX;
        const cup = ctx.addApparatus(beaker({ id: 'candle-cup', radius: .95, height: 1.7 }));
        cup.setState?.('empty', true);
        cup.label = '烧杯（阶梯蜡烛）';
        cup.object.position.x = stationX;
        const stand = ctx.addApparatus(candleStand(), cup.object);
        cup.object.userData.contains = ['candle-stand', 'low-candle', 'high-candle'];
        stand.object.userData.contains = ['low-candle', 'high-candle'];
        ctx.addApparatus(candle({ id: 'low-candle' }), stand.anchors.low);
        ctx.addApparatus(candle({ id: 'high-candle' }), stand.anchors.high);
        const litmus = ctx.addApparatus(litmusSolution());
        litmus.object.position.x = stationX;
        ctx.addEffect('reaction-bubbles', effervescence(), marble.anchors.sample);
        ctx.addEffect('collect', gasPour({ points: [v(0, .2), v(.2, .16), v(.2, 1.4)], radius: .4, height: 1.48 }), jar.object);
        ctx.addEffect('lime-bubbles', bubbles({ surface: () => lime.anchors.surface.getWorldPosition(v(0, 0)).y }), tube.anchors.outlet);
        ctx.addEffect('turbidity', turbidity(lime.anchors.liquid));
        ctx.addEffect('litmus-bubbles', bubbles({ surface: () => litmus.anchors.surface.getWorldPosition(v(0, 0)).y }), tube.anchors.outlet);
        ctx.addEffect('pour', gasPour({ points: [v(-.78, 1.72), v(-.82, 1.3), v(-.82, .2), v(0, .16)], radius: .87, height: 1.43 }), cup.object);
        station(ctx, ['gas-jar', 'glass-plate']);
        Object.assign(ctx.state, { loaded: false, sealed: false, airtight: false, acid: '', collected: 0, covered: false, splintOut: false, lowOut: false, highOut: false, litmusRed: false });
        ctx.setProgress('reaction', 0);
    },
    steps: [
        { id: 'airtight', title: '检查气密性', camera: { focus: 'funnel.column' }, description: '夹住导管上的弹簧夹，从长颈漏斗加水。漏斗中形成一段稳定水柱，说明装置气密性良好；检查后打开弹簧夹。', action: { label: '夹住导管，加水检查', target: 'clip' }, async run(ctx) { ctx.getApparatus('clip').setState?.('closed', true); ctx.getApparatus('funnel').setState?.('pouring', 1); await ctx.tween(2, p => { ctx.getApparatus('acid').setState?.('height', .52 * p); ctx.getApparatus('funnel').setState?.('waterColumn', 1.8 * p); }); ctx.getApparatus('funnel').setState?.('pouring', 0); ctx.callout('水柱保持稳定 → 气密性良好', 'funnel', 'column'); await ctx.wait(2); ctx.state.airtight = true; ctx.getApparatus('clip').setState?.('closed', false); await ctx.tween(.7, p => ctx.getApparatus('funnel').setState?.('waterColumn', 1.8 - p * 1.59)); }, observation: '夹住导管加水后，漏斗中出现稳定水柱，装置气密性良好。' },
        { id: 'load', title: '装大理石，加入稀盐酸', camera: { focus: 'funnel.tip' }, description: '倒掉检查用水。锥形瓶中放几块大理石，塞好双孔橡胶塞；从长颈漏斗注入稀盐酸，液面没过漏斗下端。', action: { label: '装大理石并加入稀盐酸', target: 'flask' }, run: ctx => load(ctx), observation: '大理石浸在稀盐酸中；漏斗下端在液面以下，形成液封。', warning: '盐酸有腐蚀性，避免接触皮肤；弹簧夹保持打开。', mistakes: [
                { id: 'unsealed-funnel', trigger: 'unsealed-funnel', title: '漏斗下端未伸入液面以下', lesson: '没有液封，产生的 CO₂ 会沿长颈漏斗逸出，集气瓶中无法有效收集。漏斗下端必须浸入液面以下。', async consequence(ctx) { await load(ctx, false); await closeup(ctx, 'funnel', 'tip', .62); const leak = ctx.addEffect('risk-leak', gasFlow({ points: [v(0, 0), v(0, 2.25), v(.25, 2.6)] }), ctx.getApparatus('funnel').object); leak.start(); ctx.callout('漏斗口逸气 · CO₂ 无色，此处为示意', 'funnel', 'mouth'); await ctx.tween(4, p => { leak.setProgress?.(p); demo(ctx, p * .7, '漏斗下端高于液面，没有液封；CO₂ 从漏斗口逸出，集气瓶收集不到气体'); }); const tipCamera = ctx.detailCamera, mouth = ctx.getApparatus('funnel').anchors.mouth.getWorldPosition(v(0, 0)); await ctx.tween(1, p => { ctx.detailCamera = { ...tipCamera, focus: new THREE.Vector3(...tipCamera.focus).lerp(mouth, p).toArray() }; demo(ctx, .7 + p * .15, '沿漏斗追踪逸出的气流 · CO₂ 无色，此处为示意'); }); await ctx.tween(1.5, p => demo(ctx, .85 + p * .15, '漏斗口逸气，集气瓶收集不到气体；需要下端液封')); } },
                { id: 'sulfuric-acid', trigger: 'sulfuric-acid', title: '用稀硫酸代替稀盐酸', lesson: '起初产生 CO₂，随后微溶的硫酸钙覆盖大理石表面，阻碍酸继续接触固体，气泡很快变少直至停止。实验室用稀盐酸。', async consequence(ctx) { await load(ctx); ctx.state.acid = 'H2SO4'; await closeup(ctx, 'marble', 'sample', .62); await ctx.tween(5, p => { ctx.getApparatus('marble').setState?.('coating', p); intensity(ctx, 1 - p); demo(ctx, p, p < .3 ? '开始有气泡；随后形成白色薄膜' : '微溶的硫酸钙覆盖表面，阻碍接触，气泡逐渐停止'); }); } }
            ] },
        { id: 'observe', title: '观察反应与微粒变化', camera: { focus: 'marble.sample' }, description: '观察大理石表面大量气泡，固体逐渐变小。打开放大镜，追踪原子如何重新组合；先排出装置中的空气。', action: { label: '观察气泡与大理石', target: 'marble' }, async run(ctx) { await ctx.tween(7, p => { ctx.getApparatus('marble').setState?.('reaction', p); ctx.setProgress('reaction', p); }); ctx.callout('大量气泡 · 大理石逐渐变小', 'marble', 'sample'); }, observation: '大理石表面产生大量气泡，固体逐渐变小；CO₂ 逸出，Ca²⁺、Cl⁻ 留在溶液中。' },
        { id: 'collect', title: '向上排空气法收集', camera: { focus: 'gas-jar.gas' }, description: 'CO₂ 密度比空气大、能溶于水，采用向上排空气法。瓶口朝上，导管伸到瓶底；收集后移出导管并盖玻璃片。CO₂ 无色，此处为示意。', predict: { question: '应该用哪种方法收集 CO₂？', options: [{ id: 'up', text: '向上排空气法' }, { id: 'water', text: '排水法' }, { id: 'down', text: '向下排空气法' }], answer: 'up', explain: 'CO₂ 密度比空气大，且能溶于水；瓶口朝上、导管伸到瓶底，用向上排空气法收集。' }, action: { label: '导管伸到瓶底，收集并盖片', target: 'gas-jar' }, async run(ctx) { const from = local(ctx, 'delivery', 'outlet'); await ctx.tween(1, p => ctx.getApparatus('delivery').setState?.('points', path(ctx, from.clone().lerp(v(stationX, .18), p)))); await ctx.tween(6, p => { ctx.getEffect('collect').setProgress?.(p); ctx.state.collected = p; }); ctx.callout('CO₂ 从底部积聚 · 空气从瓶口排出', 'gas-jar', 'mouth'); await ctx.tween(.8, p => ctx.getApparatus('delivery').setState?.('points', path(ctx, v(stationX, .18 + 1.72 * p)))); await cover(ctx); }, observation: 'CO₂ 从集气瓶底部积聚，空气由瓶口排出；收集后盖好玻璃片。', mistakes: [
                { id: 'downward-collection', trigger: 'downward-collection', title: '瓶口朝下，用向下排空气法', lesson: 'CO₂ 密度比空气大，会向下流出朝下的瓶口，难以收集。验满时木条保持燃烧；应把瓶口朝上。', async consequence(ctx) { const jar = ctx.getApparatus('gas-jar'); jar.setState?.('inverted', true); jar.object.position.y = 2; ctx.getApparatus('delivery').setState?.('points', [...path(ctx, v(stationX - .65, .2)), v(stationX, .2), v(stationX, 1.8)]); await closeup(ctx, 'gas-jar', 'mouth', 1.05); const leak = ctx.addEffect('risk-heavy-gas', gasFlow({ points: [v(stationX, 1.8), v(stationX, .35), v(stationX + .65, .05)] })); leak.start(); await ctx.tween(3, p => demo(ctx, p * .6, '瓶口朝下，CO₂ 下沉流出瓶口 · 无色气体示意')); await testFull(ctx, false); demo(ctx, 1, '收集不到足量 CO₂，瓶口燃着的木条一直不熄灭'); } }
            ] },
        { id: 'full', title: '验满：燃着木条放在瓶口', camera: { focus: 'gas-jar.mouth' }, description: '移开玻璃片，把燃着的木条放在集气瓶口。木条熄灭，说明已集满；验满后重新盖好。', predict: { question: '怎样验满？', options: [{ id: 'mouth', text: '燃着的木条放在瓶口' }, { id: 'inside', text: '燃着的木条伸入瓶内' }, { id: 'ember', text: '带火星的木条放在瓶口' }], answer: 'mouth', explain: '验满要检查瓶口是否已有 CO₂，因此把燃着的木条放在瓶口；不能伸入瓶内，也不用带火星木条。' }, action: { label: '把燃着木条放在瓶口', target: 'splint' }, async run(ctx) { await closeup(ctx, 'gas-jar', 'mouth', .75); await testFull(ctx, true); ctx.getApparatus('splint').object.visible = false; await cover(ctx); await endCloseup(ctx); }, observation: '瓶口燃着的木条熄灭，说明 CO₂ 已集满。此操作用于验满，气体检验另用石灰水。' },
        { id: 'identify', title: '检验：澄清石灰水变浑浊', camera: { focus: 'limewater.surface' }, description: '保留已收集的 CO₂，另将发生装置的导管通入澄清石灰水。控制通气量，观察白色浑浊。', secondaryEquation: 'CO₂ + Ca(OH)₂ == CaCO₃↓ + H₂O', action: { label: '通入澄清石灰水', target: 'limewater' }, async run(ctx) { await bubbleThrough(ctx, 'limewater', 'lime-bubbles', p => ctx.getEffect('turbidity').setProgress?.(p)); ctx.callout('澄清 → 浑浊 · CaCO₃ 沉淀', 'limewater', 'surface'); }, observation: '澄清石灰水变浑浊，生成白色 CaCO₃ 沉淀，检验 CO₂。' },
        { id: 'candles', title: '性质一：阶梯蜡烛', camera: { focus: 'candle-stand.high' }, description: '把 CO₂ 沿烧杯壁慢慢倒入，观察高低两支点燃的蜡烛。CO₂ 无色，此处淡色气流与积聚层为示意。', predict: { question: '阶梯蜡烛哪支先熄灭？', options: [{ id: 'low', text: '下层先熄灭' }, { id: 'high', text: '上层先熄灭' }, { id: 'same', text: '同时熄灭' }], answer: 'low', explain: 'CO₂ 密度比空气大，从杯底向上积聚；不燃烧也不支持燃烧，所以下层蜡烛先熄灭，上层后熄灭。' }, action: { label: '沿杯壁慢慢倒入 CO₂', target: 'gas-jar' }, async run(ctx) {
                station(ctx, ['gas-jar', 'candle-cup', 'candle-stand', 'low-candle', 'high-candle']);
                ctx.getApparatus('delivery').object.visible = false;
                const jar = ctx.getApparatus('gas-jar');
                jar.object.position.set(stationX, 0, 0);
                ctx.getEffect('collect').stop();
                for (const id of ['low-candle', 'high-candle'])
                    ctx.getApparatus(id).setState?.('lit', true);
                // Move the open mouth above the left inner wall, then pour with the mouth down.
                const from = jar.object.position.clone();
                await ctx.tween(1.5, p => { jar.object.rotation.z = -2.15 * p; jar.object.position.copy(from).lerp(v(stationX - 2.16, 2.66), p); });
                await closeup(ctx, 'candle-cup', 'surface', 1.08);
                await ctx.tween(8, p => { ctx.getEffect('pour').setProgress?.(p); const low = THREE.MathUtils.clamp((p - .4) / .16, 0, 1), high = THREE.MathUtils.clamp((p - .77) / .16, 0, 1); ctx.getApparatus('low-candle').setState?.('extinction', low); ctx.getApparatus('high-candle').setState?.('extinction', high); ctx.state.lowOut = low >= .42; ctx.state.highOut = high >= .42; });
                ctx.state.collected = 0;
                ctx.callout('下层先熄灭，上层后熄灭', 'candle-stand', 'low');
                jar.object.visible = false;
                await endCloseup(ctx);
            }, observation: '下层蜡烛先熄灭，上层后熄灭；说明 CO₂ 密度比空气大，不燃烧也不支持燃烧。' },
        { id: 'litmus', title: '性质二：与水反应', camera: { focus: 'litmus.surface' }, description: '将 CO₂ 通入紫色石蕊溶液。CO₂ 与水反应生成碳酸，溶液变红；实际实验结束后，废液倒入指定容器。', secondaryEquation: 'CO₂ + H₂O == H₂CO₃', action: { label: '通入紫色石蕊溶液', target: 'litmus' }, async run(ctx) { await bubbleThrough(ctx, 'litmus', 'litmus-bubbles', p => ctx.getApparatus('litmus').setState?.('acidity', p)); ctx.state.litmusRed = true; ctx.callout('紫色 → 红色 · 生成碳酸', 'litmus', 'surface'); intensity(ctx, 0); }, observation: '紫色石蕊溶液变红：CO₂ 与水反应生成碳酸。实验后废液倒入指定容器。' }
    ]
};

co2Experiment.subject = 'chemistry';
export default XiaokeLab.defineExperiment(co2Experiment);
