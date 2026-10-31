// Generated from miniprogram/packageLab/lib/experiments/copper.ts by scripts/export-skill-examples.js.
// This standalone configuration only uses the XiaokeLab public API.
const { srgb } = XiaokeLab;
const THREE = XiaokeLab.THREE;
const { alcoholLamp, alcoholLampDetailed, beaker, deliveryTube, ironStand, labBench, rubberStopper, testTube } = XiaokeLab.apparatus;
const { bubbles, flame, heatGlow, powderBed, turbidity } = XiaokeLab.effects;
const { demonstrateBackflow } = XiaokeLab.effects;
const { demonstrateLiquidRisk } = XiaokeLab.effects;
// Two reaction units; stable atom IDs make conservation inspectable at every frame.
const particles = [0, 1].flatMap(unit => {
    const y = unit * 1.1 - .55, shift = unit * .22;
    const frames = (start, middle, end, before, after) => [
        { at: 0, position: start, species: before, side: 'reactant' },
        { at: .12 + shift, position: start, species: before, side: 'reactant' },
        { at: .48 + shift, position: middle, species: before, side: 'reactant' },
        { at: .52 + shift, position: middle, species: after, side: 'product' },
        { at: 1, position: end, species: after, side: 'product' },
    ];
    return [
        { id: `cu${unit}a`, element: 'Cu', frames: frames([-1.5, y, 0], [-1.5, y, 0], [-1.2, y * .45, 0], 'CuO', 'Cu') },
        { id: `o${unit}a`, element: 'O', frames: frames([-.9, y, 0], [.15, y, 0], [3.8, y + .6, 0], 'CuO', 'CO2') },
        { id: `cu${unit}b`, element: 'Cu', frames: frames([-.9, y, .6], [-.9, y, .6], [-.75, y * .45, .3], 'CuO', 'Cu') },
        { id: `o${unit}b`, element: 'O', frames: frames([-1.5, y, .6], [1.25, y, 0], [4.9, y + .6, 0], 'CuO', 'CO2') },
        { id: `c${unit}`, element: 'C', radius: .2, frames: frames([unit ? -1.9 : -.1, 0, unit ? .8 : -.4], [.7, y, 0], [4.35, y + .6, 0], 'C', 'CO2') },
    ];
});
const micro = {
    channel: 'reaction', source: { apparatus: 'test-tube', anchor: 'sample' },
    elements: { Cu: { color: '#c36040', label: '铜' }, O: { color: '#ee814e', label: '氧' }, C: { color: '#3e4851', label: '碳' } },
    particles, speciesColors: { 'CuO:Cu': '#378fba' },
    bonds: [0, 1].flatMap(unit => [
        { a: `c${unit}`, b: `o${unit}a`, from: .52 + unit * .22, to: 1, order: 2 },
        { a: `c${unit}`, b: `o${unit}b`, from: .52 + unit * .22, to: 1, order: 2 },
        ...['a', 'b'].flatMap(i => ['a', 'b'].map(j => ({ a: `cu${unit}${i}`, b: `o${unit}${j}`, from: 0, to: .12 + unit * .22 }))),
    ]),
    captions: [{ at: 0, text: 'CuO 离子晶格小块 · 碳原子散布其间' }, { at: .12, text: '碳靠近晶格，氧原子重新组合' }, { at: .52, text: 'O=C=O 形成并向导管方向离开；铜聚集' }, { at: 1, text: '原子没有消失，只是重新组合了' }],
};
const { connectedDeliveryPath } = XiaokeLab.apparatus;
const tubeAngle = -Math.PI / 2 - .085;
const tubeHeight = 1.85;
// Flame contacts the lower wall below the reaction front (powder offset .38 + .65).
const lampX = -2.45 - Math.sin(tubeAngle) * 1.03 + Math.cos(tubeAngle) * .3;
const gasOutlet = new THREE.Vector3(2.63, .28, 0);
function path(ctx, lift = 0) {
    return connectedDeliveryPath(ctx.getApparatus('stopper').anchors.outlet, gasOutlet, ctx.root, lift);
}
const setLit = (ctx, lit) => {
    ctx.getApparatus('lamp').setState?.('lit', lit);
    if (lit) {
        ctx.getEffect('flame').start();
        if (ctx.replaying)
            ctx.getEffect('flame').setProgress?.(1);
    }
    else
        ctx.getEffect('flame').stop();
    ctx.state.lit = lit;
};
const copperExperiment = {
    lampVariant: 'classic',
    orientation: 'landscape', id: 'copper', title: '木炭还原氧化铜', equation: '2CuO + C = 2Cu + CO₂↑', condition: '高温',
    micro,
    framingApparatus: ['lamp', 'stand', 'test-tube', 'stopper', 'delivery', 'beaker'],
    geometryExceptions: [{ kind: 'overlap', ids: ['stand', 'lamp'], reason: '铁架台的长立杆与底座构成宽大包围盒，酒精灯位于夹具前方；包围盒相交不表示实体相交。' }],
    conclusion: '木炭具有还原性，使 CuO 失去氧；CuO 被还原为红色的 Cu。化学反应前后原子的种类和数目不变。',
    substances: [
        { id: 'CuO', label: '2CuO', side: 'reactant', targets: ['test-tube'], description: '黑色氧化铜：反应时失去氧，生成红色铜。' },
        { id: 'C', label: 'C', side: 'reactant', targets: ['test-tube'], description: '木炭提供碳，具有还原性。' },
        { id: 'Cu', label: '2Cu', side: 'product', targets: ['test-tube'], description: '红色铜：对应试管内黑色粉末变红。' },
        { id: 'CO2', label: 'CO₂↑', side: 'product', targets: ['delivery', 'beaker'], description: 'CO₂ 沿导管进入石灰水，使它变浑浊：Ca(OH)₂ + CO₂ = CaCO₃↓ + H₂O。' },
    ],
    safetyNotes: [
        '试管和药品须干燥；管口略向下，防止冷凝水回流使热试管炸裂。',
        '先均匀预热，再集中加热药品部位；可加网罩使火焰集中并提高温度。',
        '结束时先移出导管，再用灯帽盖灭酒精灯，不可用嘴吹灭。',
        '待试管冷却后再取出产物。本课件为现象与操作示意，时间经过压缩。',
    ],
    setup(ctx) {
        ctx.addApparatus(labBench());
        const tube = ctx.addApparatus(testTube());
        tube.object.position.set(-2.45, tubeHeight, 0);
        tube.object.rotation.z = tubeAngle;
        const stand = ctx.addApparatus(ironStand({ height: tubeHeight - .16 }));
        stand.object.position.set(-.65, 0, -.15);
        const lamp = ctx.addApparatus(this.lampVariant === 'detailed' ? alcoholLampDetailed() : alcoholLamp());
        lamp.object.position.set(lampX, 0, .4);
        lamp.object.scale.setScalar(1.2);
        const stopper = ctx.addApparatus(rubberStopper(), tube.anchors.mouth);
        stopper.object.position.y = -.06;
        ctx.addApparatus(deliveryTube({ points: path(ctx) }));
        const cup = ctx.addApparatus(beaker());
        cup.object.position.set(2.63, 0, 0);
        cup.label = '烧杯（清水，检查气密性）';
        ctx.addEffect('flame', flame(), lamp.anchors.wick);
        const powder = ctx.addEffect('powder', powderBed(), tube.object);
        powder.object.position.y = .38;
        powder.stop();
        ctx.addEffect('bubbles', bubbles({ rise: .52, surface: () => cup.anchors.surface.getWorldPosition(new THREE.Vector3()).y }), ctx.getApparatus('delivery').anchors.outlet);
        ctx.addEffect('turbidity', turbidity(cup.anchors.liquid));
        const glow = ctx.addEffect('heat', heatGlow(), tube.object);
        glow.object.position.set(.16, 1.0, 0);
        const paper = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.25), new THREE.MeshStandardMaterial({ color: srgb(0xe3dfd1), roughness: .95, side: THREE.DoubleSide }));
        paper.name = 'sample-paper';
        paper.rotation.x = -Math.PI / 2;
        paper.position.set(.6, .015, 1.35);
        paper.visible = false;
        paper.receiveShadow = true;
        ctx.root.add(paper);
        ctx.state.lit = false;
        ctx.state.deliveryRemoved = false;
        ctx.state.cooled = false;
    },
    steps: [
        {
            camera: { focus: 'beaker.surface' }, id: 'airtight', title: '检查装置气密性',
            description: '先将导管口浸入水中，再手握试管，使管内空气受热膨胀。观察导管口是否冒出气泡。',
            async run(ctx) {
                const tube = ctx.getApparatus('test-tube');
                await ctx.tween(1.2, p => { tube.object.scale.setScalar(1 + Math.sin(p * Math.PI) * .004); });
                ctx.getEffect('bubbles').start();
                ctx.callout('冒出气泡', 'beaker', 'surface');
                await ctx.wait(2.5);
                ctx.getEffect('bubbles').stop();
            },
            observation: '手握使管内空气受热膨胀，导管口冒出气泡，说明装置气密性良好。',
        },
        {
            mistakes: [{ id: 'mouth-up', trigger: 'mouth-up', title: '试管口朝上放置',
                    consequence: ctx => demonstrateLiquidRisk(ctx, { vessel: 'test-tube', heat: 'heat', tilt: .3, delivery: { id: 'delivery', inlet: 'stopper' }, localPath: true, path: [[.20, 3.2, .04], [.20, 1.8, .04], [.20, .65, .04]], captions: ['假设受热后，水蒸气在较冷的管口凝结', '管口朝上：冷凝水向热的管底回流', '热玻璃骤冷，存在炸裂风险'] }),
                    lesson: '试管口应略向下。冷凝水流向管口，避免回流到灼热管底，造成局部骤冷。' }],
            camera: { focus: 'test-tube.sample' }, id: 'load', title: '装入药品，固定试管',
            description: '把烘干的木炭粉与氧化铜粉混合均匀，平铺在试管底部。固定试管，使管口略向下；将烧杯中的水换为澄清石灰水。',
            action: { label: '装入混合粉末', target: 'test-tube' },
            async run(ctx) {
                const stopper = ctx.getApparatus('stopper'), delivery = ctx.getApparatus('delivery');
                await ctx.tween(.7, p => { stopper.object.position.y = -.06 + p * .5; delivery.setState?.('points', path(ctx)); });
                ctx.getEffect('powder').start();
                await ctx.wait(.8);
                await ctx.tween(.7, p => { stopper.object.position.y = -.06 + (1 - p) * .5; delivery.setState?.('points', path(ctx)); });
                ctx.getApparatus('beaker').label = '烧杯（澄清石灰水）';
            },
            observation: '黑色混合粉末平铺在试管底部，管口略低于管底。',
            warning: '管口略向下，防止冷凝水回流到灼热的管底，使试管炸裂。',
        },
        {
            predict: { question: '充分加热后，黑色粉末会变成什么颜色？', options: [{ id: 'red', text: '红色' }, { id: 'white', text: '白色' }, { id: 'black', text: '仍是黑色' }], answer: 'red', explain: '木炭使黑色氧化铜失去氧，生成红色的铜。', observeAt: 'observe' },
            camera: { focus: 'lamp.wick' }, id: 'heat', title: '点燃酒精灯，均匀预热',
            description: '点击酒精灯或下方按钮点火。先来回移动酒精灯均匀预热，再集中加热药品所在部位。',
            action: { label: '点燃酒精灯', target: 'lamp' },
            async run(ctx) {
                const lamp = ctx.getApparatus('lamp');
                await ctx.tween(.8, p => lamp.setState?.('cap', 1 - p));
                setLit(ctx, true);
                await ctx.tween(4.5, p => { lamp.object.position.x = lampX + Math.sin(p * Math.PI * 4) * .85; });
                await ctx.tween(2, p => ctx.getEffect('heat').setProgress?.(p));
            },
            observation: '先均匀预热，再集中加热，药品部位温度升高。',
            warning: '可加网罩使火焰集中并提高温度。不要直接用大火局部加热冷试管。',
        },
        {
            predict: { question: '反应产生的气体通入澄清石灰水，会怎样？', options: [{ id: 'cloudy', text: '变浑浊' }, { id: 'clear', text: '保持澄清' }, { id: 'blue', text: '变蓝' }], answer: 'cloudy', explain: '生成的 CO₂ 与 Ca(OH)₂ 反应，产生 CaCO₃ 沉淀，使石灰水变浑浊。' },
            camera: { focus: 'test-tube.sample' }, id: 'observe', title: '观察颜色与石灰水',
            description: '保持高温，观察试管内粉末颜色和烧杯中澄清石灰水的变化。注意两个位置的现象。',
            async run(ctx) {
                ctx.getEffect('bubbles').start();
                let red = false, cloudy = false;
                await ctx.tween(10, p => {
                    ctx.setProgress('reaction', p);
                    ctx.getEffect('powder').setProgress?.(p);
                    ctx.getEffect('turbidity').setProgress?.(p);
                    if (p > .15 && !red) {
                        red = true;
                        ctx.callout('黑色 → 红色', 'test-tube', 'sample');
                    }
                    if (p > .48 && !cloudy) {
                        cloudy = true;
                        ctx.callout('澄清 → 浑浊', 'beaker', 'surface');
                    }
                });
            },
            observation: '黑色粉末逐渐变红；导管口冒出气泡，澄清石灰水变浑浊，说明生成了二氧化碳。',
        },
        {
            predict: { question: '结束实验时，应该先做哪一步？', options: [{ id: 'remove', text: '先移出导管' }, { id: 'extinguish', text: '先熄灭酒精灯' }, { id: 'together', text: '同时移出导管并熄灭酒精灯' }], answer: 'remove', explain: '先移出导管再熄灯，可避免管内气体冷却、压强减小引起石灰水倒吸。' },
            mistakes: [{ id: 'backflow', trigger: 'lamp', title: '先熄灭酒精灯',
                    consequence: ctx => demonstrateBackflow(ctx, path(ctx)),
                    lesson: '先移出导管，再盖灭酒精灯。降温使管内气压减小，外界大气压推动液体倒吸；热玻璃接触冷液体存在炸裂风险。' }],
            camera: { focus: 'delivery' }, id: 'finish', title: '先移导管，再熄灭酒精灯',
            description: '先将导管口移出石灰水，再用灯帽盖灭酒精灯。可点击导管和酒精灯，也可按下方按钮操作。',
            actions: [
                { label: '移出导管', target: 'delivery', async run(ctx) {
                        await ctx.tween(1.5, p => {
                            ctx.getApparatus('delivery').setState?.('points', path(ctx, p * 1.35));
                            if (.28 + p * 1.35 >= .8)
                                ctx.getEffect('bubbles').stop();
                        });
                        ctx.state.deliveryRemoved = true;
                        ctx.getEffect('bubbles').stop();
                    } },
                { label: '用灯帽盖灭酒精灯', target: 'lamp', async run(ctx) {
                        // Defense in depth: configuration can also be called by a replay or another UI.
                        if (!ctx.state.deliveryRemoved)
                            throw new Error('请先移出导管，防止石灰水倒吸！');
                        await ctx.tween(1.1, p => ctx.getApparatus('lamp').setState?.('cap', p));
                        setLit(ctx, false);
                    } },
            ],
            run() { },
            observation: '已先移出导管，再用灯帽盖灭酒精灯，避免石灰水倒吸。',
            warning: '必须先移出导管，再熄灭酒精灯，否则石灰水可能倒吸进入热试管，使试管炸裂。请先移出导管；不可用嘴吹灭。',
        },
        {
            camera: { focus: 'test-tube.sample' }, id: 'cool', title: '冷却后，取出产物',
            description: '等待试管冷却后，取下橡胶塞，将粉末倒在纸上观察。冷却时间已压缩，实际实验不可趁热取出。',
            async run(ctx) {
                await ctx.tween(4, p => ctx.getEffect('heat').setProgress?.(1 - p));
                ctx.state.cooled = true;
                const tube = ctx.getApparatus('test-tube'), stopper = ctx.getApparatus('stopper'), delivery = ctx.getApparatus('delivery');
                await ctx.tween(1, p => { stopper.object.position.y = -.06 + p * .65; delivery.setState?.('points', path(ctx, 1.35)); });
                stopper.object.visible = false;
                delivery.object.visible = false;
                const paper = ctx.root.getObjectByName('sample-paper');
                paper.visible = true;
                await ctx.tween(1.8, p => { tube.object.position.set(-2.45 + p * .8, tubeHeight + p * .4, p * 1.35); tube.object.rotation.z = tubeAngle - p * .55; });
                const powder = ctx.getEffect('powder');
                await ctx.tween(1, p => { powder.object.position.y = .38 + p * 2.3; powder.object.scale.y = 1 - p * .7; });
                ctx.root.attach(powder.object);
                const from = powder.object.position.clone(), rotation = powder.object.quaternion.clone();
                const landing = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2));
                await ctx.tween(1.6, p => { powder.object.position.copy(from).lerp(new THREE.Vector3(-.15, .23, 1.35), p); powder.object.quaternion.copy(rotation).slerp(landing, p); powder.object.scale.y = .3 + p * .7; });
            },
            observation: '冷却后倒在纸上的红色物质是铜。木炭使氧化铜失去氧，说明木炭具有还原性。',
        },
    ],
};

copperExperiment.subject = 'chemistry';
copperExperiment.minimums = false; // 保留源课件的两个假如分支
export default XiaokeLab.defineExperiment(copperExperiment);
