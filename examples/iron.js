// Generated from miniprogram/packageLab/lib/experiments/iron.ts by scripts/export-skill-examples.js.
// This standalone configuration only uses the XiaokeLab public API.
const THREE = XiaokeLab.THREE;
const { alcoholLamp, alcoholBlowtorch, beaker, deliveryTube, gasSource, hardGlassTube, ironStand, labBench, magnet, nozzleTube, rubberStopper, sampleTray } = XiaokeLab.apparatus;
const { bubbles, flame, gasFlow, heatGlow, powderBed, turbidity, demonstrateGasIgnition, demonstrateUntreatedGas } = XiaokeLab.effects;
// 2 Fe + 3 lattice O + 3 CO: all eleven atom IDs persist, even outside the view.
const particles = [0, 1].map(i => ({ id: `fe${i}`, element: 'Fe', frames: [
        { at: 0, position: [-1.1, i * .6 - .3, 0], species: 'Fe2O3', side: 'reactant' },
        { at: .84, position: [-1.1, i * .6 - .3, 0], species: 'Fe2O3', side: 'reactant' },
        { at: 1, position: [-.9 + i * .4, -.1, 0], species: 'Fe', side: 'product' }
    ] }));
for (let i = 0; i < 3; i++) {
    const start = .08 + i * .26, join = start + .18, end = join + .07, y = (i - 1) * .64;
    const frames = (a, b, c, before) => [
        { at: 0, position: a, species: before, side: 'reactant' },
        { at: start, position: a, species: before, side: 'reactant' },
        { at: join, position: b, species: 'CO2', side: 'product' },
        { at: end, position: c, species: 'CO2', side: 'product' },
        { at: 1, position: c, species: 'CO2', side: 'product' }
    ];
    particles.push({ id: `lattice-o${i}`, element: 'O', frames: frames([-.65, y, 0], [-.3, y, 0], [3.2, y, 0], 'Fe2O3') }, { id: `c${i}`, element: 'C', radius: .19, frames: frames([1.1, y, 0], [.15, y, 0], [3.65, y, 0], 'CO') }, { id: `co-o${i}`, element: 'O', frames: frames([1.55, y, 0], [.6, y, 0], [4.1, y, 0], 'CO') });
}
const micro = { channel: 'reaction', source: { apparatus: 'hard-tube', anchor: 'sample' },
    elements: { Fe: { color: '#41464a', label: '铁', metalness: .8, roughness: .25 }, O: { color: '#438bc6', label: '氧' }, C: { color: '#53616a', label: '碳' } }, particles,
    bonds: [0, 1, 2].flatMap(i => [
        { a: `c${i}`, b: `co-o${i}`, from: 0, to: .26 + i * .26 - .0001, order: 3 },
        { a: `c${i}`, b: `co-o${i}`, from: .26 + i * .26, to: 1, order: 2 },
        { a: `c${i}`, b: `lattice-o${i}`, from: .26 + i * .26, to: 1, order: 2 },
        ...[0, 1].map(j => ({ a: `fe${j}`, b: `lattice-o${i}`, from: 0, to: .08 + i * .26 }))
    ]),
    captions: [{ at: 0, text: 'Fe₂O₃ 小晶格；3 个 CO 分子靠近（过程示意）' }, { at: .26, text: 'CO 带走一个 O，成为 CO₂；其余 CO 依次靠近' }, { at: .78, text: '3 个 CO₂ 离开，剩余 Fe 原子聚集' }, { at: 1, text: 'Fe 2→2 · O 6→6 · C 3→3；原子守恒' }]
};
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const inlet = [v(-3.72, 1.75), v(-3.35, 1.75), v(-3.35, 1.9), v(-2.7, 1.9)];
const outlet = [v(.9, 1.9), v(1.35, 1.9), v(1.984, 1.9), v(1.984, .28)];
const exhaust = [v(2.416, 1.12), v(2.416, 1.85), v(3.15, 1.85), v(3.15, .94), v(3.65, .94)];
const light = (ctx, id, effect, on) => { ctx.getApparatus(id).setState?.('lit', on); const f = ctx.getEffect(effect); if (on) {
    f.start();
    if (ctx.replaying)
        f.setProgress?.(1);
}
else
    f.stop(); };
function flow(ctx, on) { ctx.state.flowing = on; ctx.getApparatus('gas-source').setState?.('flowing', on); for (const id of ['inlet-flow', 'tube-flow', 'outlet-flow', 'exhaust-flow', 'bubbles'])
    on ? ctx.getEffect(id).start() : ctx.getEffect(id).stop(); }
function tail(ctx, on) { ctx.state.tailLit = on; light(ctx, 'tail-lamp', 'tail-lamp-flame', on); if (on) {
    ctx.getEffect('tail-flame').start();
    if (ctx.replaying)
        ctx.getEffect('tail-flame').setProgress?.(1);
}
else {
    ctx.getEffect('tail-flame').stop();
    ctx.getApparatus('tail-lamp').setState?.('cap', 1);
} }
const ironExperiment = {
    id: 'iron', title: 'CO 还原氧化铁', orientation: 'landscape', equation: '3CO + Fe₂O₃ = 2Fe + 3CO₂', condition: '高温', micro,
    framingApparatus: ['gas-source', 'hard-tube', 'stand', 'inlet-stopper', 'outlet-stopper', 'inlet', 'delivery', 'beaker', 'wash-stopper', 'exhaust', 'nozzle', 'blowtorch', 'tail-lamp', 'magnet', 'sample-tray'],
    geometryExceptions: [{ kind: 'overlap', ids: ['stand', 'outlet-stopper'], reason: '铁架台立杆、夹具与底座的整体包围盒覆盖管口区域，塞子插在玻璃管口，并未插入铁架台实体。' }],
    substances: [
        { id: 'CO', label: '3CO', side: 'reactant', targets: ['gas-source', 'nozzle', 'tail-lamp'], description: 'CO 具有还原性且有毒。过量 CO 到达尖嘴，必须点燃处理。' },
        { id: 'Fe2O3', label: 'Fe₂O₃', side: 'reactant', targets: ['hard-tube'], description: '红棕色氧化铁粉末在高温下失去氧。' },
        { id: 'Fe', label: '2Fe', side: 'product', targets: ['hard-tube', 'magnet'], description: '生成的铁粉呈黑色；冷却后可被磁铁吸引。' },
        { id: 'CO2', label: '3CO₂', side: 'product', targets: ['beaker', 'delivery'], description: 'CO₂ 使澄清石灰水变浑浊：Ca(OH)₂ + CO₂ = CaCO₃↓ + H₂O。' }
    ],
    conclusion: 'CO 具有还原性，在高温下把 Fe₂O₃ 还原为铁，同时生成 CO₂。铁粉可被磁铁吸引；结合反应和现象判断产物，不能仅凭磁性鉴别所有黑色物质。反应前后原子种类、数目不变。',
    safetyNotes: ['CO 有毒，必须进行尾气处理，实验在通风处进行。', '先通 CO 排尽空气，再加热，防止混合气体爆炸。', '结束时先停止加热，继续通 CO 至冷却，再停止通气，最后熄灭尾气酒精灯。', '持续通 CO 可防止热铁重新氧化、石灰水倒吸。冷却后才可取出产物。', '气流粒子、灰雾、爆鸣和微粒变化均为教学示意；CO 实际无色，时间经过压缩。'],
    setup(ctx) {
        ctx.addApparatus(labBench());
        const source = ctx.addApparatus(gasSource());
        source.object.position.set(-4, 0, 0);
        const tube = ctx.addApparatus(hardGlassTube());
        tube.object.position.set(-.9, 1.9, 0);
        const stand = ctx.addApparatus(ironStand({ height: 1.9, angle: -Math.PI / 2, clampRadius: .385 }));
        stand.object.position.set(.28, 0, -.15);
        for (const [id, anchor, rotation] of [['inlet-stopper', 'inlet', Math.PI / 2], ['outlet-stopper', 'outlet', -Math.PI / 2]]) {
            const plug = ctx.addApparatus(rubberStopper({ id, radius: .305 }), tube.anchors[anchor]);
            plug.object.rotation.z = rotation;
        }
        ctx.addApparatus(deliveryTube({ id: 'inlet', points: inlet }));
        ctx.addApparatus(deliveryTube({ points: outlet }));
        const cup = ctx.addApparatus(beaker({ height: 1.35 }));
        cup.object.position.set(2.2, 0, 0);
        cup.label = '烧杯（清水，检查气密性）';
        const lid = ctx.addApparatus(rubberStopper({ id: 'wash-stopper', radius: .6, holes: 2 }));
        lid.object.position.set(2.2, 1.35, 0);
        ctx.addApparatus(deliveryTube({ id: 'exhaust', points: exhaust }));
        const nozzle = ctx.addApparatus(nozzleTube({ height: .3 }));
        nozzle.object.position.set(3.65, .94, 0);
        const torch = ctx.addApparatus(alcoholBlowtorch());
        torch.object.position.set(-.9, 0, 0);
        const lamp = ctx.addApparatus(alcoholLamp({ id: 'tail-lamp' }));
        lamp.object.position.set(3.65, 0, 0);
        const bar = ctx.addApparatus(magnet());
        bar.object.position.set(2.6, .26, 1.05);
        bar.object.visible = false;
        const tray = ctx.addApparatus(sampleTray());
        tray.object.position.set(1.3, 0, 1.05);
        tray.object.visible = false;
        ctx.addEffect('torch-flame', flame({ height: .72, width: .44, intensity: 2.1, torch: true }), torch.anchors.wick);
        ctx.addEffect('tail-lamp-flame', flame({ height: .44, width: .2 }), lamp.anchors.wick);
        ctx.addEffect('tail-flame', flame({ height: .3, width: .18, intensity: .4 }), nozzle.anchors.tip);
        const powder = ctx.addEffect('powder', powderBed({ length: 1.2, heatCenter: .6, startColor: 0x8b3a1f, endColor: 0x1e1e1e, reactionSpan: 1 }), tube.object);
        powder.object.rotation.z = -Math.PI / 2;
        powder.object.position.set(-.6, -.05, 0);
        powder.stop();
        const heat = ctx.addEffect('heat', heatGlow(), tube.anchors.sample);
        heat.object.rotation.z = Math.PI / 2;
        ctx.addEffect('bubbles', bubbles({ rise: .52, surface: () => cup.anchors.surface.getWorldPosition(v(0, 0)).y }), ctx.getApparatus('delivery').anchors.outlet);
        ctx.addEffect('turbidity', turbidity(cup.anchors.liquid));
        for (const [id, points] of [['inlet-flow', inlet], ['tube-flow', [v(-2.7, 1.96), v(.9, 1.96)]], ['outlet-flow', outlet], ['exhaust-flow', exhaust]])
            ctx.addEffect(id, gasFlow({ points: [...points] }));
        Object.assign(ctx.state, { flowing: false, tailLit: false, heating: false, cooled: false, purged: false, loaded: false, attracted: false, airtight: false });
        ctx.setProgress('reaction', 0);
    },
    steps: [
        { id: 'airtight', title: '检查装置气密性', camera: { focus: 'beaker.surface' }, description: '连接装置，将导管口浸入清水。暂时关闭气源入口，手握硬质玻璃管，使管内空气稍受热，观察气泡。检查后换入澄清石灰水。', async run(ctx) { ctx.getEffect('bubbles').start(); ctx.callout('导管口冒出气泡', 'beaker', 'surface'); await ctx.wait(2.5); ctx.getEffect('bubbles').stop(); ctx.state.airtight = true; }, observation: '手握玻璃管后，水中导管口冒出气泡，说明装置气密性良好。' },
        { id: 'load', title: '装入氧化铁，连接装置', camera: { focus: 'hard-tube.sample' }, description: '将少量红棕色氧化铁粉末平铺在硬质玻璃管中部，接好两端橡胶塞。密闭烧杯中为澄清石灰水，长管进气、短管出气。', async run(ctx) { const plug = ctx.getApparatus('inlet-stopper'); await ctx.tween(.6, p => plug.object.position.x = -p * .45); ctx.getEffect('powder').start(); ctx.state.loaded = true; await ctx.tween(.6, p => plug.object.position.x = -(1 - p) * .45); ctx.getApparatus('beaker').label = '密闭烧杯（澄清石灰水）'; ctx.callout('红棕色 Fe₂O₃', 'hard-tube', 'sample'); }, observation: '硬质玻璃管中部为红棕色氧化铁，石灰水澄清。' },
        { id: 'purge', title: '先通 CO，排尽空气', camera: { focus: 'gas-source.outlet' }, description: '先通入 CO 排尽装置内空气，同时点燃尾气处的酒精灯。尾气由酒精灯引燃处理；排气时间经过压缩。', predict: { question: '为什么要先通 CO、再加热？', options: [{ id: 'air', text: '排尽空气，防止爆炸' }, { id: 'time', text: '节约时间' }, { id: 'warm', text: '让粉末预热' }], answer: 'air', explain: 'CO 与空气混合后加热可能发生爆炸，必须先通 CO 排尽空气。' },
            action: { label: '通入 CO 并点燃尾气酒精灯', target: 'gas-source' },
            mistakes: [{ id: 'heat-first', trigger: 'blowtorch', title: '先点燃喷灯，后通 CO', lesson: 'CO 与空气混合加热可能爆炸。先通 CO 排尽空气，同时点燃尾气酒精灯，再加热药品。', consequence: ctx => demonstrateGasIgnition(ctx, { vessel: 'hard-tube', stopper: 'outlet-stopper', flame: 'torch-flame', airPath: [v(-1.7, .06), v(1.7, .06)] }) }],
            async run(ctx) { flow(ctx, true); tail(ctx, true); ctx.getEffect('tail-flame').stop(); ctx.callout('CO 通气中 · 先排空气', 'gas-source', 'label'); await ctx.wait(5); ctx.state.purged = true; ctx.getEffect('tail-flame').start(); if (ctx.replaying)
                ctx.getEffect('tail-flame').setProgress?.(1); }, observation: '先通 CO 排尽空气，尾气处酒精灯已点燃。', warning: 'CO 有毒；在通风处实验并处理尾气。未排尽空气不可加热。' },
        { id: 'heat', title: '高温加热，观察变化', camera: { focus: 'hard-tube.sample' }, description: '点燃酒精喷灯加热氧化铁。观察粉末、石灰水与尾气尖嘴三个位置。尾气 CO 燃烧生成 CO₂。', secondaryEquation: '2CO + O₂ ==点燃== 2CO₂', secondaryEquationLabel: '尾气处理',
            predict: { question: '加热后红棕色粉末会变成什么颜色？', options: [{ id: 'black', text: '黑色' }, { id: 'white', text: '白色' }, { id: 'red', text: '仍是红棕色' }], answer: 'black', explain: '高温下 CO 将红棕色 Fe₂O₃ 还原为黑色铁粉，同时生成 CO₂。' }, action: { label: '点燃酒精喷灯', target: 'blowtorch' },
            mistakes: [{ id: 'untreated', trigger: 'tail-lamp', title: '不处理尾气', lesson: '未反应的 CO 有毒，直接排入实验室会使人中毒。必须在通风处操作，并点燃尾气或收集处理。', consequence: ctx => demonstrateUntreatedGas(ctx, { nozzle: 'nozzle', flames: ['tail-flame', 'tail-lamp-flame'], lamp: 'tail-lamp' }) }],
            async run(ctx) {
                if (!ctx.state.purged || !ctx.state.tailLit)
                    throw new Error('请先排尽空气并处理尾气');
                light(ctx, 'blowtorch', 'torch-flame', true);
                ctx.state.heating = true;
                await ctx.tween(2, p => ctx.getEffect('heat').setProgress?.(p));
                let powder = false, water = false;
                await ctx.tween(10, p => { ctx.setProgress('reaction', p); ctx.getEffect('powder').setProgress?.(p); ctx.getEffect('turbidity').setProgress?.(p); if (p > .15 && !powder) {
                    powder = true;
                    ctx.callout('红棕色 → 黑色', 'hard-tube', 'sample');
                } if (p > .48 && !water) {
                    water = true;
                    ctx.callout('澄清 → 浑浊', 'beaker', 'surface');
                } });
                ctx.callout('尾气燃烧 · 蓝色火焰', 'nozzle', 'tip');
            },
            observation: '红棕色粉末逐渐变黑；澄清石灰水变浑浊；尾气燃烧产生蓝色火焰。' },
        { id: 'finish', title: '先停加热，通 CO 至冷却', camera: { focus: 'blowtorch.wick' }, description: '先熄灭喷灯，继续通 CO 直到硬质玻璃管冷却。再停止通 CO，最后熄灭尾气酒精灯。',
            predict: { question: '实验结束时正确的顺序？', options: [{ id: 'cool', text: '先停止加热，继续通 CO 至冷却' }, { id: 'gas', text: '先停止通 CO' }, { id: 'both', text: '同时停止加热与通 CO' }], answer: 'cool', explain: '持续通 CO 至冷却，防止热铁被空气重新氧化，也防止石灰水倒吸。之后停止通 CO，最后熄灭尾气酒精灯。' },
            actions: [{ label: '熄灭喷灯，继续通 CO 至冷却', target: 'blowtorch', async run(ctx) { light(ctx, 'blowtorch', 'torch-flame', false); ctx.state.heating = false; ctx.callout('停止加热，继续通 CO', 'hard-tube', 'sample'); await ctx.tween(5, p => ctx.getEffect('heat').setProgress?.(1 - p)); ctx.state.cooled = true; ctx.callout('玻璃管已冷却', 'hard-tube', 'sample'); } },
                { label: '停止通 CO，最后盖灭尾气酒精灯', target: 'gas-source', async run(ctx) { if (!ctx.state.cooled)
                        throw new Error('请继续通 CO 至玻璃管冷却'); flow(ctx, false); ctx.getEffect('tail-flame').stop(); await ctx.tween(1, p => ctx.getApparatus('tail-lamp').setState?.('cap', p)); tail(ctx, false); } }], run() { },
            observation: '先停止加热，继续通 CO 至冷却，再停止通 CO，最后盖灭尾气酒精灯。', warning: '先停加热、后停气。持续通 CO 防止热铁重新氧化及石灰水倒吸。' },
        { id: 'test', title: '冷却后取出，用磁铁检验', camera: { focus: 'sample-tray.sample' }, description: '确认冷却后取出黑色粉末，倒在白纸上，再把磁铁靠近。磁铁能吸引产物，结合反应说明生成了铁。', async run(ctx) {
                if (!ctx.state.cooled || ctx.state.flowing)
                    throw new Error('须先冷却并停止通气');
                const plug = ctx.getApparatus('outlet-stopper');
                await ctx.tween(.6, p => plug.object.position.x = p * .6);
                plug.object.visible = false;
                ctx.getApparatus('delivery').object.visible = false;
                ctx.getApparatus('inlet-stopper').object.visible = false;
                ctx.getApparatus('inlet').object.visible = false;
                const tube = ctx.getApparatus('hard-tube'), tubeFrom = tube.object.position.clone();
                const tray = ctx.getApparatus('sample-tray'), bar = ctx.getApparatus('magnet');
                tray.object.visible = true;
                bar.object.visible = true;
                // Lift from the clamp, bring the open end over the paper, then tip it gently.
                await ctx.tween(1.2, p => { tube.object.position.copy(tubeFrom).lerp(v(-.7, .9, 1.05), p); tube.object.rotation.z = -.22 * p; });
                ctx.inspectionCamera = { apparatus: ['hard-tube', 'sample-tray', 'magnet'], stage: 'pour' };
                const powder = ctx.getEffect('powder');
                ctx.root.attach(powder.object);
                ctx.root.updateWorldMatrix(true, true);
                const mouth = powder.object.worldToLocal(tube.anchors.outlet.getWorldPosition(v(0, 0)));
                const pile = powder.object.worldToLocal(tray.anchors.sample.getWorldPosition(v(0, 0)));
                await ctx.tween(2.4, p => powder.setPour(p, mouth, pile));
                const tipped = tube.object.position.clone();
                await ctx.tween(.8, p => { tube.object.position.copy(tipped).lerp(v(-.7, .36, 1.05), p); tube.object.rotation.z = -.22 * (1 - p); });
                ctx.inspectionCamera = { apparatus: ['hard-tube', 'sample-tray', 'magnet'], stage: 'attract' };
                const barFrom = bar.object.position.clone();
                await ctx.tween(1.2, p => bar.object.position.copy(barFrom).lerp(v(1.95, .52, 1.05), p));
                ctx.root.updateWorldMatrix(true, true);
                const target = powder.object.worldToLocal(bar.anchors.pole.getWorldPosition(v(0, 0)));
                const localOrigin = powder.object.worldToLocal(v(0, 0)), up = powder.object.worldToLocal(v(0, 1)).sub(localOrigin);
                await ctx.tween(2.4, p => powder.setAttraction(p, target, up));
                await ctx.wait(.6);
                await ctx.tween(.8, p => { bar.object.position.y = .52 - .43 * p; ctx.root.updateWorldMatrix(true, true); powder.setAttraction(1, powder.object.worldToLocal(bar.anchors.pole.getWorldPosition(v(0, 0))), up); });
                ctx.state.attracted = true;
                ctx.callout('能被磁铁吸引 → 铁', 'magnet', 'pole');
            }, observation: '冷却后黑色粉末被磁铁吸引并附着，结合反应说明生成了铁。' }
    ]
};

ironExperiment.subject = 'chemistry';
ironExperiment.minimums = false; // 保留源课件的两个假如分支
export default XiaokeLab.defineExperiment(ironExperiment);
