// Generated from miniprogram/packageLab/lib/experiments/oxygen.ts by scripts/export-skill-examples.js.
// This standalone configuration only uses the XiaokeLab public API.
const THREE = XiaokeLab.THREE;
const { alcoholLamp, testTube, ironStand, rubberStopper, deliveryTube, connectedDeliveryPath, labBench, waterTrough, gasJar, glassPlate, cottonPlug, splint } = XiaokeLab.apparatus;
const { bubbles, flame, heatGlow, powderBed, gasCollect, dyeSpread, emberRelight, powderStream, demonstrateBackflow } = XiaokeLab.effects;
const particles = [];
for (let unit = 0; unit < 2; unit++)
    for (let atom = 0; atom < 6; atom++) {
        const element = atom === 0 ? 'K' : atom === 1 ? 'Mn' : 'O', oxygen = unit * 4 + atom - 2;
        const species = element === 'K' || element === 'Mn' && unit === 0 || element === 'O' && oxygen < 4 ? 'K2MnO4' : element === 'O' && oxygen >= 6 ? 'O2' : 'MnO2';
        const start = [-1.15 + unit * 1.6 + Math.cos(atom * 1.4) * .42, (unit ? -.4 : .4) + Math.sin(atom * 1.4) * .42, atom % 2 * .16];
        const end = species === 'O2' ? [3.5 + (oxygen - 6) * .48, -.3, 0] : species === 'K2MnO4' ? [-1.05 + Math.cos(atom + unit) * .48, Math.sin(atom + unit) * .48, unit * .23] : [.85 + Math.cos(atom) * .35, Math.sin(atom) * .35, 0];
        particles.push({ id: `${element}-${unit}-${atom}`, element, frames: [{ at: 0, position: start, species: 'KMnO4', side: 'reactant' }, { at: .2, position: start, species: 'KMnO4', side: 'reactant' }, { at: .6, position: species === 'O2' ? [.6 + (oxygen - 6) * .48, -.3, 0] : end, species, side: 'product' }, { at: 1, position: end, species, side: 'product' }] });
    }
const micro = { channel: 'reaction', source: { apparatus: 'test-tube', anchor: 'sample' }, elements: { K: { color: '#b09cdb', label: '钾' }, Mn: { color: '#63677e', label: '锰' }, O: { color: '#ed775a', label: '氧' } }, particles,
    bonds: [{ a: 'O-1-4', b: 'O-1-5', from: .6, to: 1, order: 2 }],
    captions: [{ at: 0, text: '2 个 KMnO₄ 化学式单位的粒子示意（非独立分子）' }, { at: .2, text: '受热分解，原子重新组合' }, { at: .6, text: '剩下 K₂MnO₄、MnO₂ 粒子簇；O 原子两两组成 O₂，向右侧导管离开' }, { at: 1, text: 'K 2→2 · Mn 2→2 · O 8→8；原子守恒' }] };
const angle = -Math.PI / 2 - .085, tubeX = -2.45, tubeY = 1.85, lampX = tubeX - Math.sin(angle) * 1.03 + Math.cos(angle) * .3;
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const outlet = v(2.25, .35), jarPosition = v(3.25, 2.1), tablePosition = v(4.95, .03, .15);
function path(ctx, end = outlet) {
    const inlet = ctx.getApparatus('stopper').anchors.outlet;
    // Descend OUTSIDE the inverted bottle, then turn upward through its submerged mouth.
    // A direct shoulder-to-tip line would incorrectly pass through the glass wall.
    return end.x > outlet.x + 1e-6 ? [...connectedDeliveryPath(inlet, outlet, ctx.root), v(end.x, outlet.y), end] : connectedDeliveryPath(inlet, end, ctx.root);
}
function light(ctx, on) { ctx.getApparatus('lamp').setState?.('lit', on); if (on) {
    ctx.getEffect('flame').start();
    if (ctx.replaying)
        ctx.getEffect('flame').setProgress?.(1);
}
else
    ctx.getEffect('flame').stop(); ctx.state.lit = on; }
function bubbleRhythm(ctx, rhythm) { ctx.getEffect('bubbles').setRhythm(rhythm); ctx.getEffect('bubbles').start(); ctx.state.bubbleRhythm = rhythm; }
async function load(ctx, cotton = true) {
    const plug = ctx.getApparatus('stopper');
    await ctx.tween(.6, p => { plug.object.position.y = -.06 + p * .5; ctx.getApparatus('delivery').setState?.('points', path(ctx)); });
    ctx.getEffect('powder').start();
    ctx.getApparatus('cotton').object.visible = cotton;
    ctx.state.cotton = cotton;
    await ctx.tween(.6, p => { plug.object.position.y = -.06 + (1 - p) * .5; ctx.getApparatus('delivery').setState?.('points', path(ctx)); });
    ctx.state.loaded = true;
}
async function coverAndSetDown(ctx) {
    const jar = ctx.getApparatus('gas-jar'), plate = ctx.getApparatus('glass-plate'), delivery = ctx.getApparatus('delivery');
    // Withdraw from the bottle mouth but keep the outlet submerged until the finish step.
    const from = ctx.root.worldToLocal(delivery.anchors.outlet.getWorldPosition(v(0, 0)));
    await ctx.tween(.7, p => delivery.setState?.('points', path(ctx, from.clone().lerp(outlet, p))));
    ctx.getEffect('collect').stop();
    ctx.state.collecting = false;
    const plateFrom = plate.object.position.clone(), mouth = ctx.root.worldToLocal(jar.anchors.mouth.getWorldPosition(v(0, 0)));
    await ctx.tween(1, p => plate.object.position.copy(plateFrom).lerp(mouth, p));
    jar.anchors.mouth.attach(plate.object);
    plate.object.userData.mountedOn = 'gas-jar';
    plate.object.position.set(0, 0, 0);
    plate.object.rotation.set(0, 0, 0);
    ctx.state.covered = true;
    ctx.callout('水下盖住瓶口', 'gas-jar', 'mouth');
    await ctx.tween(.8, p => jar.object.position.copy(jarPosition).add(v(0, p * .65)));
    await ctx.tween(1, p => jar.object.position.set(jarPosition.x + (tablePosition.x - jarPosition.x) * p, 2.75, tablePosition.z * p));
    await ctx.tween(1, p => { jar.object.rotation.z = Math.PI * (1 - p); jar.object.position.y = 2.75 - 1.7 * p; });
    jar.setState?.('inverted', false);
    await ctx.tween(.7, p => jar.object.position.y = 1.05 + (tablePosition.y - 1.05) * p);
    ctx.state.jarUpright = true;
    ctx.callout('氧气密度比空气大 · 正放', 'gas-jar', 'gas');
}
async function insertSplint(ctx, relight) {
    const jar = ctx.getApparatus('gas-jar'), plate = ctx.getApparatus('glass-plate'), stick = ctx.getApparatus('splint');
    const focus = jar.anchors.mouth.getWorldPosition(v(0, 0)).toArray();
    await ctx.tween(.7, p => { ctx.detailCamera = { amount: p, focus, apparatus: ['gas-jar'] }; });
    ctx.root.attach(plate.object);
    plate.object.userData.mountedOn = null;
    const plateFrom = plate.object.position.clone();
    await ctx.tween(.8, p => { plate.object.position.copy(plateFrom).lerp(v(4.95, .035, 1.1), p); plate.object.position.x += Math.sin(p * Math.PI) * .7; });
    const mouth = ctx.root.worldToLocal(jar.anchors.mouth.getWorldPosition(v(0, 0)));
    stick.object.visible = true;
    stick.object.position.copy(mouth).add(v(0, .45));
    ctx.getEffect('ember').start();
    await ctx.tween(1.2, p => stick.object.position.copy(mouth).add(v(0, .45 - p * 1.1)));
    if (relight) {
        await ctx.wait(.6);
        await ctx.tween(.18, p => ctx.getEffect('ember').setProgress?.(p));
        ctx.state.relit = true;
        ctx.callout('带火星的木条复燃 → 氧气', 'splint', 'tip');
        await ctx.wait(.9);
    }
    else {
        await ctx.tween(1.5, p => ctx.getEffect('ember').setBrightness(p));
        ctx.state.relit = false;
    }
}
const oxygenExperiment = {
    id: 'oxygen', title: '高锰酸钾制取氧气', orientation: 'landscape', equation: '2KMnO₄ ==△== K₂MnO₄ + MnO₂ + O₂↑', condition: '△', micro,
    framingApparatus: ['stand', 'test-tube', 'lamp', 'cotton', 'stopper', 'delivery', 'water-trough', 'gas-jar', 'glass-plate', 'splint'],
    geometryExceptions: [{ kind: 'overlap', ids: ['stand', 'lamp'], reason: '铁架台的长立杆与底座构成宽大包围盒，酒精灯位于夹具前方；包围盒相交不表示实体相交。' }],
    substances: [{ id: 'KMnO4', label: '2KMnO₄', side: 'reactant', targets: ['test-tube'], description: '紫黑色高锰酸钾粉末，受热分解。' }, { id: 'K2MnO4', label: 'K₂MnO₄', side: 'product', targets: ['test-tube'], description: '锰酸钾与二氧化锰留在试管内，混合固体用黑褐色表示。' }, { id: 'MnO2', label: 'MnO₂', side: 'product', targets: ['test-tube'], description: '生成的黑色二氧化锰是产物。' }, { id: 'O2', label: 'O₂↑', side: 'product', targets: ['gas-jar', 'splint'], description: '氧气在集气瓶上部聚集，能使带火星的木条复燃。氧气本身无色。' }],
    conclusion: '加热高锰酸钾生成锰酸钾、二氧化锰和氧气。氧气不易溶于水，可用排水法收集；带火星木条复燃可检验氧气。查、装、定、点、收、离、熄；先移导管再熄灯。K 2→2、Mn 2→2、O 8→8，原子守恒。',
    safetyNotes: ['加热前试管外壁必须干燥；管口略向下，防止冷凝水回流使热试管炸裂。', '管口放一团棉花，防止高锰酸钾粉末随气流进入导管。', '先预热，再集中加热药品；导管口气泡连续、均匀冒出后才开始收集。', '先把导管移出水面，再用灯帽盖灭酒精灯，防止倒吸；不可用嘴吹灭。', '在水下盖好玻璃片，取出后正放；本课件为教学示意，时间已压缩。'],
    setup(ctx) {
        ctx.addApparatus(labBench());
        const tube = ctx.addApparatus(testTube());
        tube.object.position.set(tubeX, tubeY, 0);
        tube.object.rotation.z = angle;
        const stand = ctx.addApparatus(ironStand({ height: tubeY - .16, angle }));
        stand.object.position.set(-.65, 0, -.15);
        const lamp = ctx.addApparatus(alcoholLamp());
        lamp.object.position.set(lampX, 0, .4);
        lamp.object.scale.setScalar(1.2);
        const cotton = ctx.addApparatus(cottonPlug(), tube.anchors.mouth);
        cotton.object.position.y = -.42;
        cotton.object.visible = false;
        const stopper = ctx.addApparatus(rubberStopper(), tube.anchors.mouth);
        stopper.object.position.y = -.06;
        ctx.addApparatus(deliveryTube({ points: path(ctx) }));
        const trough = ctx.addApparatus(waterTrough());
        trough.object.position.set(3, 0, 0);
        const jar = ctx.addApparatus(gasJar());
        jar.object.position.copy(jarPosition);
        jar.object.visible = false;
        const plate = ctx.addApparatus(glassPlate());
        plate.object.position.set(4.9, .035, .1);
        const stick = ctx.addApparatus(splint());
        stick.object.visible = false;
        ctx.addEffect('flame', flame(), lamp.anchors.wick);
        const powder = ctx.addEffect('powder', powderBed({ startColor: 0x302039, endColor: 0x29231e }), tube.object);
        powder.object.position.y = .38;
        powder.stop();
        ctx.addEffect('heat', heatGlow(), tube.anchors.sample);
        ctx.addEffect('bubbles', bubbles({ rhythm: 'intermittent', surface: () => (ctx.state.collecting ? jar : trough).anchors.surface.getWorldPosition(v(0, 0)).y }), ctx.getApparatus('delivery').anchors.outlet);
        ctx.addEffect('collect', gasCollect({ jar, surface: () => trough.anchors.surface.getWorldPosition(v(0, 0)).y }));
        ctx.addEffect('ember', emberRelight(), stick.anchors.tip);
        Object.assign(ctx.state, { loaded: false, cotton: false, lit: false, deliveryRemoved: false, covered: false, jarUpright: false, relit: false, collecting: false, bubbleRhythm: 'intermittent', pure: true });
        ctx.setProgress('reaction', 0);
    },
    steps: [
        { id: 'airtight', title: '查 · 检查装置气密性', camera: { focus: 'water-trough.surface' }, description: '导管口浸入水中，手握试管，使管内空气受热膨胀，观察导管口是否冒出气泡。', async run(ctx) { bubbleRhythm(ctx, 'intermittent'); ctx.callout('手握受热 · 导管口冒泡', 'water-trough', 'surface'); await ctx.wait(2.5); ctx.getEffect('bubbles').stop(); }, observation: '手握试管后导管口冒出气泡，说明装置气密性良好。' },
        { id: 'load', title: '装 · 装药品，放棉花', camera: { focus: 'test-tube.mouth' }, description: '装入少量紫黑色高锰酸钾粉末，在管口内放一团棉花，再塞好带导管的橡胶塞。', action: { label: '装药品并放棉花', target: 'test-tube' }, run: ctx => load(ctx), observation: '紫黑色粉末装在试管底部；管口内有一团棉花。', warning: '棉花阻挡粉末，避免粉末随气流进入导管。',
            mistakes: [{ id: 'no-cotton', trigger: 'no-cotton', title: '管口不放棉花', lesson: '高锰酸钾粉末随气流进入导管并溶于水，水被染成紫红色。管口应放一团棉花。', async consequence(ctx) {
                        await load(ctx, false);
                        light(ctx, true);
                        const stream = ctx.addEffect('risk-powder', powderStream({ points: [ctx.root.worldToLocal(ctx.getApparatus('test-tube').anchors.sample.getWorldPosition(v(0, 0))), ...path(ctx)] }));
                        const dye = ctx.addEffect('risk-dye', dyeSpread({ origin: outlet.clone().sub(v(3, 0)), bounds: new THREE.Box3(v(-1.05, .1, -.8), v(1.05, .74, .8)) }), ctx.getApparatus('water-trough').object);
                        await ctx.tween(7, p => { stream.setProgress?.(Math.min(1, p * 1.4)); dye.setProgress?.(Math.max(0, (p - .4) / .6)); ctx.demonstration = { progress: p, caption: p < .4 ? '加热后，粉末随气流穿过未放棉花的管口' : '紫红色从水中导管口扩散 · 粉末进入水槽' }; });
                    } }] },
        { id: 'fix', title: '定 · 管口略向下，倒立集气瓶', camera: { focus: 'gas-jar.mouth' }, description: '试管口略向下倾斜，固定在铁架台上。集气瓶装满水，倒立在水槽中；瓶内不能留有空气。', async run(ctx) { ctx.getApparatus('gas-jar').object.visible = true; ctx.getApparatus('gas-jar').setState?.('waterLevel', 1); ctx.callout('装满水 · 倒立', 'gas-jar', 'mouth'); await ctx.wait(1.5); }, observation: '管口略低于管底；集气瓶倒立且装满水。', warning: '管口略向下；加热前试管外壁必须干燥。' },
        { id: 'heat', title: '点 · 预热后集中加热', camera: { focus: 'lamp.wick' }, description: '点燃酒精灯，先来回移动均匀预热，再对准药品部位集中加热。起初的气泡主要来自装置中的空气。', action: { label: '点燃酒精灯并预热', target: 'lamp' }, async run(ctx) { light(ctx, true); await ctx.tween(4, p => ctx.getApparatus('lamp').object.position.x = lampX + Math.sin(p * Math.PI * 4) * .8); await ctx.tween(1, p => ctx.getEffect('heat').setProgress?.(p)); bubbleRhythm(ctx, 'intermittent'); }, observation: '起初导管口间断冒泡，先排出装置内的空气，此时不能收集。' },
        { id: 'collect', title: '收 · 排水收集，盖片正放', camera: { focus: 'gas-jar.surface' }, description: '等气泡连续、均匀冒出后，把导管伸入集气瓶口。水面下降，瓶口冒出大气泡说明集满。在水下盖好玻璃片，取出后正放。',
            predict: { question: '什么时候开始收集氧气？', options: [{ id: 'steady', text: '导管口气泡连续、均匀冒出时' }, { id: 'first', text: '一有气泡就收集' }, { id: 'before', text: '加热前就收集' }], answer: 'steady', explain: '最初排出装置中的空气；连续、均匀冒泡后再收集，得到较纯的氧气。' }, action: { label: '等连续均匀冒泡，再收集', target: 'gas-jar' },
            async run(ctx) {
                await ctx.wait(2);
                bubbleRhythm(ctx, 'continuous');
                ctx.callout('气泡连续、均匀 → 开始收集', 'water-trough', 'surface');
                await ctx.wait(2);
                await ctx.tween(1, p => ctx.getApparatus('delivery').setState?.('points', path(ctx, outlet.clone().lerp(v(3.25, .57), p))));
                ctx.state.collecting = true;
                await ctx.tween(9, p => { ctx.getEffect('collect').setProgress?.(p); ctx.getEffect('powder').setProgress?.(p); ctx.setProgress('reaction', p); });
                ctx.callout('瓶口大气泡 → 已集满', 'gas-jar', 'mouth');
                await ctx.wait(1.5);
                await coverAndSetDown(ctx);
            },
            observation: '紫黑色粉末逐渐变暗为黑褐色；水面下降，氧气在瓶上部聚集；瓶口有大气泡时已集满。盖片后正放。',
            mistakes: [{ id: 'early-collect', trigger: 'early-collect', title: '一有气泡就收集', lesson: '最初排出的主要是装置内的空气。这次提前收集得到的不纯气体使木条略微变亮，不能复燃；应等气泡连续均匀后再收集。', async consequence(ctx) {
                        ctx.state.pure = false;
                        await ctx.tween(1, p => ctx.getApparatus('delivery').setState?.('points', path(ctx, outlet.clone().lerp(v(3.25, .57), p))));
                        ctx.state.collecting = true;
                        await ctx.tween(3, p => { ctx.getEffect('collect').setProgress?.(p); ctx.demonstration = { progress: p * .35, caption: '过早收集：装置内空气进入集气瓶，气体不纯' }; });
                        await coverAndSetDown(ctx);
                        ctx.getApparatus('delivery').setState?.('points', path(ctx, v(2.25, 1.2)));
                        ctx.getEffect('bubbles').stop();
                        light(ctx, false);
                        ctx.getApparatus('lamp').setState?.('cap', 1);
                        await insertSplint(ctx, false);
                        await ctx.tween(2, p => ctx.demonstration = { progress: .8 + p * .2, caption: '跳到检验：木条只是略微变亮，不能复燃 · 因为混入了装置内的空气' });
                    } }] },
        { id: 'finish', title: '离、熄 · 先移导管，后熄灯', camera: { focus: 'delivery' }, description: '先把导管移出水面，再用灯帽盖灭酒精灯，防止水倒吸入热试管。', predict: { question: '实验结束的正确顺序？', options: [{ id: 'remove', text: '先移出导管，再熄灭酒精灯' }, { id: 'extinguish', text: '先熄灭酒精灯，再移出导管' }, { id: 'together', text: '同时移出导管并熄灭酒精灯' }], answer: 'remove', explain: '先移导管再熄灯，避免冷却时管内压强减小，水倒吸导致热试管炸裂。' },
            actions: [{ label: '先移出导管', target: 'delivery', async run(ctx) { await ctx.tween(1.2, p => { ctx.getApparatus('delivery').setState?.('points', path(ctx, v(2.25, .35 + p * .9))); if (.35 + p * .9 >= .78)
                        ctx.getEffect('bubbles').stop(); }); ctx.state.deliveryRemoved = true; } }, { label: '用灯帽盖灭酒精灯', target: 'lamp', async run(ctx) { if (!ctx.state.deliveryRemoved)
                        throw new Error('请先移出导管，防止倒吸'); await ctx.tween(1, p => ctx.getApparatus('lamp').setState?.('cap', p)); light(ctx, false); await ctx.tween(2, p => ctx.getEffect('heat').setProgress?.(1 - p)); } }], run() { },
            mistakes: [{ id: 'backflow', trigger: 'lamp', title: '先熄灭酒精灯', consequence: ctx => { ctx.getEffect('bubbles').stop(); return demonstrateBackflow(ctx, path(ctx), { sourceId: 'water-trough', liquidName: '水槽中的水' }); }, lesson: '气体冷却使管内压强减小，大气压将水槽中的水经导管压入热试管，造成骤冷炸裂。先移出导管，再熄灯。' }], warning: '必须先移导管后熄灯，防止倒吸使热试管炸裂。', observation: '导管先离开水面，再盖灭酒精灯，避免了倒吸。' },
        { id: 'test', title: '检验 · 带火星的木条复燃', camera: { focus: 'gas-jar.gas' }, description: '移开玻璃片，把带火星的木条伸入正放的集气瓶。观察木条是否复燃。', predict: { question: '带火星的木条伸入集气瓶后会怎样？', options: [{ id: 'relight', text: '复燃' }, { id: 'out', text: '熄灭' }, { id: 'same', text: '没有变化' }], answer: 'relight', explain: '氧气支持燃烧，能使带火星的木条复燃，说明收集的气体是氧气。' }, action: { label: '伸入带火星的木条', target: 'splint' }, async run(ctx) { if (!ctx.state.jarUpright || ctx.state.lit)
                throw new Error('请先完成收集与结束操作'); await insertSplint(ctx, true); }, observation: '带火星的木条复燃，发出明亮火焰，说明收集的是氧气。' }
    ]
};

oxygenExperiment.subject = 'chemistry';
export default XiaokeLab.defineExperiment(oxygenExperiment);
