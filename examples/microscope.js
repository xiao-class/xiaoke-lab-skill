// Generated from miniprogram/packageLab/lib/experiments/microscope.ts by scripts/export-skill-examples.js.
// This standalone configuration only uses the XiaokeLab public API.
const THREE = XiaokeLab.THREE;
const { microscope, microscopeParts, glassSlide, coverSlip, tweezers, dropper, blottingPaper, onionScale, epidermis, operationHand, instrumentCase, labBench } = XiaokeLab.apparatus;
const { stainSpread, slideCrack, slideBubbles } = XiaokeLab.effects;
const { initialEyepieceState, focusHeight } = XiaokeLab.biology;
const { KnobRotate } = XiaokeLab.interaction;
const { StageDrag } = XiaokeLab.interaction;
const microscopeState = (ctx) => ctx.state.eyepiece;
const prep = (ctx) => new THREE.Vector3(Number(ctx.state.prepX ?? 3.75), .022, 1.05);
/** Reflow the preparation tray within the actual unoccluded rectangle. */
function placePrep(ctx, next) {
    const old = Number(ctx.state.prepX ?? 3.75), delta = next - old;
    if (Math.abs(delta) < .001)
        return false;
    ctx.state.prepX = next;
    for (const id of ['onion', 'tweezers', 'dropper', 'paper', 'cloth'])
        ctx.getApparatus(id).object.position.x += delta;
    if (!microscopeState(ctx).mounted)
        ctx.getApparatus('slide').object.position.x += delta;
    return true;
}
function layoutMicroscope(ctx, aspect) { return placePrep(ctx, Math.max(1.3, aspect * (3.3 + microscopeState(ctx).height) * 1.13 - 1.3)); }
function sync(ctx) {
    const s = microscopeState(ctx), scope = ctx.getApparatus('microscope');
    scope.setState?.('height', s.height);
    scope.setState?.('objective', s.objective);
    scope.setState?.('mirror', s.mirrorAngle);
    scope.setState?.('aperture', s.aperture);
    scope.setState?.('concave', s.concave);
    if (ctx.state.parked)
        scope.setState?.('parked', true);
    scope.setState?.('highlight', ctx.state.part ?? '');
    const slide = ctx.getApparatus('slide');
    slide.object.userData.mountedOn = s.mounted ? 'microscope' : null;
    ctx.getApparatus('cover').object.userData.mountedOn = s.mounted ? 'microscope' : null;
    slide.object.position.copy(s.mounted ? new THREE.Vector3(s.stageX * .6, 1.48, -s.stageY * .6) : prep(ctx));
    slide.setState?.('water', s.water);
    const film = ctx.getApparatus('epidermis');
    film.object.visible = s.specimen;
    film.setState?.('flat', s.flattened);
    ctx.getApparatus('cover').setState?.('lower', ctx.state.coverStarted ? s.covered : 1);
    ctx.getEffect('stain').setProgress?.(s.stained);
    ctx.getEffect('crack').setProgress?.(s.cracked);
    ctx.getEffect('bubbles').setProgress?.(s.bubbles);
}
function change(ctx, values) { Object.assign(microscopeState(ctx), values); sync(ctx); }
function select(ctx, part) { ctx.state.part = part; sync(ctx); const info = microscopeParts.find(p => p.id === part); if (info)
    ctx.callout(info.name, 'microscope', part); }
function adjust(ctx, control, value = 0) {
    const s = microscopeState(ctx);
    if (control === 'objective')
        change(ctx, { objective: s.objective === 10 ? 40 : 10 });
    if (control === 'aperture')
        change(ctx, { aperture: s.aperture > .8 ? .5 : 1 });
    if (control === 'mirrorFace')
        change(ctx, { concave: !s.concave });
    if (control === 'mirror')
        change(ctx, { mirrorAngle: Math.max(-1, Math.min(1, value)) });
    if (control === 'fine')
        change(ctx, { height: Math.max(-.15, Math.min(1.2, s.height + value)) });
    if (control === 'coarse') {
        if (s.objective === 40)
            ctx.callout('高倍下只能用细准焦螺旋', 'microscope', 'fine');
        else
            change(ctx, { height: Math.max(-.15, Math.min(1.2, s.height + value)) });
    }
    if (control === 'left')
        change(ctx, { stageX: Math.max(-.8, s.stageX - .1) });
    if (control === 'right')
        change(ctx, { stageX: Math.min(.8, s.stageX + .1) });
    if (control === 'up')
        change(ctx, { stageY: Math.min(.8, s.stageY + .1) });
    if (control === 'down')
        change(ctx, { stageY: Math.max(-.8, s.stageY - .1) });
    if (control === 'labels')
        change(ctx, { labels: !s.labels });
}
async function shot(ctx, anchor, run, radius = 1.25) {
    const focus = ctx.getApparatus(anchor === 'prep' ? 'slide' : 'microscope').anchors[anchor === 'prep' ? 'center' : anchor].getWorldPosition(new THREE.Vector3()).toArray();
    const detail = { widthFill: anchor === 'prep' ? .97 : .84, focus, apparatus: anchor === 'prep' ? ['slide', 'cover'] : ['microscope'], focusRadius: radius, direction: anchor === 'prep' ? [.12, 1.25, 1] : [.42, .28, 1], focusSize: anchor === 'prep' ? [1.55, .35, .75] : undefined };
    await ctx.tween(.7, p => ctx.detailCamera = { ...detail, amount: p });
    await run();
    await ctx.tween(.6, p => ctx.detailCamera = { ...detail, amount: 1 - p });
    ctx.detailCamera = null;
}
async function handAt(ctx, point, run) { const hand = ctx.getApparatus('hand'); hand.object.visible = true; hand.object.position.copy(point).add(new THREE.Vector3(.25, .05, .1)); await run(); hand.object.visible = false; }
async function focusTo(ctx, to, control) {
    const from = microscopeState(ctx).height;
    select(ctx, control);
    await handAt(ctx, ctx.getApparatus('microscope').anchors[control].getWorldPosition(new THREE.Vector3()), () => ctx.tween(2, p => change(ctx, { height: from + (to - from) * p })));
}
function restDropper(ctx) { const d = ctx.getApparatus('dropper'); d.object.position.set(prep(ctx).x + .3, .12, -.45); d.object.rotation.z = Math.PI / 2; }
async function prepare(ctx, action) {
    const slide = ctx.getApparatus('slide'), tool = ctx.getApparatus('tweezers'), cover = ctx.getApparatus('cover');
    const onion = ctx.getApparatus('onion'), onionRest = onion.object.position.clone();
    if (action === 'peel')
        onion.object.position.copy(prep(ctx)).add(new THREE.Vector3(.1, -.017, -.45));
    await shot(ctx, 'prep', async () => {
        if (action === 'wipe') {
            const cloth = ctx.getApparatus('cloth');
            cloth.object.visible = true;
            await ctx.tween(1.4, p => cloth.object.position.copy(prep(ctx)).add(new THREE.Vector3(Math.sin(p * Math.PI * 4) * .5, .09, 0)));
            await ctx.tween(.8, p => cloth.object.position.set(prep(ctx).x + .6 + Math.sin(p * Math.PI * 2) * .2, .1, 1.5));
            cloth.object.visible = false;
            ctx.callout('载、盖玻片擦净；镜头只能用擦镜纸', 'slide', 'center');
        }
        if (action === 'water') {
            const d = ctx.getApparatus('dropper');
            d.object.rotation.z = 0;
            d.object.position.copy(prep(ctx)).add(new THREE.Vector3(0, .6, 0));
            await ctx.tween(1.5, p => d.setState?.('drip', p));
            change(ctx, { water: 1 });
            restDropper(ctx);
        }
        if (action === 'peel') {
            const onion = ctx.getApparatus('onion');
            tool.object.position.copy(onion.object.position).add(new THREE.Vector3(0, .2, -.4));
            await ctx.tween(1.5, p => { onion.setState?.('peel', p); tool.object.position.y = .3 + p * .5; });
            const from = tool.object.position.clone(), film = ctx.getApparatus('epidermis');
            change(ctx, { specimen: true, flattened: 0 });
            await ctx.tween(1, p => { tool.object.position.lerpVectors(from, prep(ctx).add(new THREE.Vector3(0, .12, -.45)), p); film.object.position.copy(tool.object.position).sub(slide.object.position).add(new THREE.Vector3(0, -.065, .45)); });
            film.object.position.set(0, .055, 0);
            tool.object.position.set(prep(ctx).x + .4, .025, .3);
            ctx.callout('只撕取鳞片叶内侧的薄膜', 'onion', 'film');
        }
        if (action === 'flat') {
            await ctx.tween(1.5, p => { change(ctx, { flattened: p }); tool.object.position.copy(prep(ctx)).add(new THREE.Vector3((p - .5) * .35, .12, -.4)); });
            tool.object.position.set(prep(ctx).x + .4, .025, .3);
        }
        if (action === 'cover') {
            ctx.state.coverStarted = true;
            cover.object.visible = true;
            cover.object.position.set(-.29, .07, 0);
            await ctx.tween(2.4, p => { change(ctx, { covered: p }); tool.object.position.copy(slide.object.position).add(new THREE.Vector3(-.29 + Math.cos((1 - p) * Math.PI / 3) * .58, .07 + Math.sin((1 - p) * Math.PI / 3) * .58, -.4)); });
            tool.object.position.set(prep(ctx).x + .4, .025, .3);
            ctx.callout('一侧先接触水滴，再缓缓放下', 'slide', 'center');
        }
        if (action === 'stain') {
            const d = ctx.getApparatus('dropper'), paper = ctx.getApparatus('paper');
            d.object.rotation.z = 0;
            d.setState?.('iodine', true);
            d.object.position.copy(prep(ctx)).add(new THREE.Vector3(-.35, .6, 0));
            paper.object.position.copy(prep(ctx)).add(new THREE.Vector3(.52, .07, 0));
            await ctx.tween(1, p => d.setState?.('drip', p));
            await ctx.tween(2.8, p => change(ctx, { stained: p }));
            paper.object.position.set(prep(ctx).x + .7, .018, 1.8);
            restDropper(ctx);
            ctx.callout('一侧滴碘液，另一侧吸水纸吸引', 'slide', 'center');
        }
    }, .95);
    if (action === 'peel')
        onion.object.position.copy(onionRest);
}
async function consequence(ctx, kind) {
    const damage = kind === 'crash' || kind === 'coarse';
    ctx.state.coverStarted = true;
    change(ctx, { aligned: true, mirrorAngle: 0, aperture: 1, specimen: true, mounted: kind !== 'bubbles', stageX: 0, stageY: 0, flattened: 1, covered: 1, water: 1, stained: kind === 'unstained' ? 0 : 1, objective: kind === 'coarse' ? 40 : 10, height: kind === 'coarse' ? .75 : focusHeight(10), targetMarked: false });
    const cover = ctx.getApparatus('cover');
    cover.object.visible = true;
    cover.object.position.set(-.29, .07, 0);
    const caption = kind === 'bubbles' ? '盖玻片直接平放：气泡被包在盖玻片下，黑厚边、中央亮' : kind === 'unstained' ? '未染色：细胞核对比度很低，几乎看不见' : kind === 'crash' ? '物镜压碎玻片，可能损坏镜头' : '高倍下用粗准焦：镜筒大幅下降，物像完全模糊，玻片破裂';
    const focus = (kind === 'bubbles' ? prep(ctx) : new THREE.Vector3(0, 1.66, .04)).toArray();
    const detail = { widthFill: kind === 'bubbles' ? .97 : .84, focus, apparatus: kind === 'bubbles' ? ['slide', 'cover'] : ['microscope', 'slide'], focusSize: kind === 'bubbles' ? [1.55, .35, .75] : [1.1, .85, .8], direction: kind === 'bubbles' ? [.12, 1.25, 1] : [.55, .32, 1] };
    await ctx.tween(.7, p => { ctx.detailCamera = { ...detail, amount: p }; ctx.demonstration = { progress: 0, caption }; });
    const from = microscopeState(ctx).height;
    // Objective tips meet the cover at y=1.55; stop just into its surface.
    const contact = kind === 'coarse' ? .325 : .105, end = contact - .025;
    await ctx.tween(3, p => {
        if (kind === 'bubbles') {
            cover.object.position.y = .07 + .5 * (1 - p);
            change(ctx, { bubbles: Math.max(0, (p - .6) / .4) });
        }
        if (damage) {
            const height = from + (end - from) * p;
            change(ctx, { height, cracked: Math.max(0, Math.min(1, (contact - height) / .025)) });
        }
        ctx.demonstration = { progress: p, caption };
    });
    ctx.callout(caption, kind === 'bubbles' ? 'slide' : 'microscope', kind === 'bubbles' ? 'center' : 'stage');
    await ctx.wait(1.8);
    await ctx.tween(.65, p => ctx.detailCamera = { ...detail, amount: 1 - p });
    ctx.detailCamera = null;
}
const microscopeExperiment = {
    id: 'microscope', title: '练习使用显微镜 · 观察洋葱鳞片叶内表皮细胞', subject: 'biology', orientation: 'landscape', equation: '放大倍数 = 目镜倍数 × 物镜倍数',
    framingApparatus: ['microscope', 'slide', 'onion', 'tweezers', 'dropper', 'paper', 'cloth', 'cover', 'case'], frameDirection: [.32, .32, 1],
    secondView: { type: 'eyepieceView', sample: microscopeState, parts: microscopeParts, select, adjust, layout: layoutMicroscope },
    summaryDiagram: { src: '/assets/microscope-structure.png', title: '显微镜结构图', labels: microscopeParts.map(p => `${p.name}：${p.role}`) },
    conclusion: '先低倍对光，再从侧面看物镜下降；看目镜时上升寻找物像。像偏哪边，装片向哪边移；高倍下只用细准焦。10× × 10× = 100 倍，10× × 40× = 400 倍。',
    modelNote: '教学示意，步骤与制片时间已压缩。细胞图样为固定种子生成；亮度、清晰度和细胞数为定性模型。细胞膜紧贴细胞壁，普通光镜下不易看清；洋葱鳞片叶内表皮细胞通常没有叶绿体。',
    safetyNotes: ['镜头只能用擦镜纸擦拭。', '下降镜筒时眼睛从侧面看物镜，防止压坏玻片和镜头。', '高倍物镜下只能用细准焦螺旋，不能用粗准焦螺旋。'],
    setup(ctx) {
        ctx.state.eyepiece = initialEyepieceState();
        ctx.state.prepX = 3.75;
        ctx.state.part = '';
        ctx.state.parked = false;
        ctx.state.coverStarted = false;
        ctx.addApparatus(labBench({ width: 24, depth: 18 }));
        ctx.addApparatus(microscope());
        ctx.addApparatus(instrumentCase());
        const slide = ctx.addApparatus(glassSlide());
        const cover = ctx.addApparatus(coverSlip(), slide.object);
        cover.object.position.set(.8, .04, .3);
        const film = ctx.addApparatus(epidermis(), slide.object);
        film.anchors.center = new THREE.Object3D();
        film.object.add(film.anchors.center);
        film.object.position.y = .055;
        for (const [factory, id, x, z] of [[tweezers, 'tweezers', 1.7, .3], [dropper, 'dropper', 1.6, -.45], [blottingPaper, 'paper', 2, 1.8], [blottingPaper, 'cloth', .7, 1.7], [onionScale, 'onion', 1.7, -.15]]) {
            const a = ctx.addApparatus(factory(id));
            if (id === 'paper' || id === 'cloth') {
                a.anchors.center = new THREE.Object3D();
                a.object.add(a.anchors.center);
            }
            a.object.position.set(x + prep(ctx).x - 1.3, id === 'onion' ? .005 : .025, z);
        }
        restDropper(ctx);
        for (const id of ['hand', 'left-hand']) {
            const hand = ctx.addApparatus(operationHand(id));
            hand.object.visible = false;
        }
        ctx.addEffect('stain', stainSpread(), slide.object).object.position.y = .065;
        ctx.addEffect('crack', slideCrack(), slide.object).object.position.y = .085;
        ctx.addEffect('bubbles', slideBubbles(), slide.object).object.position.y = .078;
        ctx.registerInteraction('eyepiece', { capture: () => ({ state: { ...microscopeState(ctx) }, part: ctx.state.part, prepX: ctx.state.prepX }), restore(value) { const saved = value; Object.assign(microscopeState(ctx), saved.state); ctx.state.part = saved.part; placePrep(ctx, saved.prepX ?? 3.75); sync(ctx); } });
        for (const key of ['coarse', 'fine', 'mirror']) {
            ctx.addPointer(`microscope.${key}`, new KnobRotate({ center: () => ctx.getApparatus('microscope').anchors[key].getWorldPosition(new THREE.Vector3()), get: () => key === 'mirror' ? microscopeState(ctx).mirrorAngle : microscopeState(ctx).height, set(value) { adjust(ctx, key, key === 'mirror' ? value : value - microscopeState(ctx).height); }, min: key === 'mirror' ? -1 : -.15, max: 1.2, perTurn: key === 'fine' ? .08 : key === 'coarse' ? .85 : 2 }));
        }
        const drag = new StageDrag({ enabled: () => microscopeState(ctx).mounted, height: () => 1.48, get: () => ({ x: microscopeState(ctx).stageX * .6, y: microscopeState(ctx).stageY * .6 }), set: ({ x, y }) => change(ctx, { stageX: x / .6, stageY: y / .6 }), limit: .48 });
        ctx.addPointer('microscope.stage', drag);
        ctx.addPointer('slide', drag);
        ctx.addPointer('cover', drag);
        ctx.addPointer('epidermis', drag);
        sync(ctx);
    },
    steps: [
        { id: 'carry', title: '取镜和安放', description: '右手握镜臂，左手托镜座；放在实验台略偏左处。点击显微镜部件，可高亮查看名称与作用。镜头只能用擦镜纸擦拭。', camera: { focus: 'microscope.arm' }, action: { label: '双手取镜，安放稳妥' }, async run(ctx) { const scope = ctx.getApparatus('microscope'), right = ctx.getApparatus('hand'), left = ctx.getApparatus('left-hand'); right.object.visible = left.object.visible = true; await ctx.tween(2, p => { const lift = Math.sin(p * Math.PI) * .35; scope.object.position.y = lift; right.object.position.set(.85, 1.8 + lift, -.25); left.object.position.set(0, lift, .45); }); right.object.visible = left.object.visible = false; ctx.callout('右手握镜臂，左手托镜座', 'microscope', 'arm'); }, observation: '双手取镜，一握一托，安放在实验台略偏左处。' },
        { id: 'illuminate', title: '低倍对光', description: '转动转换器，使低倍物镜对准通光孔，选择较大光圈。左眼注视目镜，右眼睁开，转动反光镜，直到看到明亮的圆形视野。', camera: { focus: 'microscope.mirror' }, action: { label: '低倍对光，调节反光镜' }, async run(ctx) { change(ctx, { objective: 10, aligned: true, aperture: 1 }); select(ctx, 'mirror'); await shot(ctx, 'mirror', () => handAt(ctx, ctx.getApparatus('microscope').anchors.mirror.getWorldPosition(new THREE.Vector3()), () => ctx.tween(2, p => change(ctx, { mirrorAngle: .7 * (1 - p) })))); ctx.callout('左眼看目镜，右眼睁开 · 明亮圆形视野', 'microscope', 'ocular'); }, observation: '低倍物镜、较大光圈，转动反光镜得到明亮圆形视野。' },
        { id: 'prepare', title: '制作临时装片', description: '擦 → 滴清水 → 撕内表皮 → 展平 → 盖 → 染。盖玻片的一侧先接触水滴再缓缓放下；一侧滴碘液，另一侧用吸水纸吸引。', camera: { focus: 'slide.center' }, predict: { question: '怎样盖盖玻片才能避免气泡？', options: [{ id: 'edge', text: '一侧先接触水滴，再缓缓放下' }, { id: 'flat', text: '直接平放在水滴上' }, { id: 'fast', text: '快速拍下盖玻片' }], answer: 'edge', explain: '一侧接触水滴后缓缓放下，能减少空气被包在盖玻片下。' }, actions: [{ label: '擦净载玻片与盖玻片', run: ctx => prepare(ctx, 'wipe') }, { label: '中央滴一滴清水', target: 'dropper', run: ctx => prepare(ctx, 'water') }, { label: '镊子撕取内表皮', target: 'onion', run: ctx => prepare(ctx, 'peel') }, { label: '在水滴中展平', target: 'tweezers', run: ctx => prepare(ctx, 'flat') }, { label: '一侧先接触，缓缓盖下', target: 'cover', run: ctx => prepare(ctx, 'cover') }, { label: '一侧滴碘液，另一侧吸引', target: 'paper', run: ctx => prepare(ctx, 'stain') }], run() { }, observation: '内表皮展平，盖片无气泡；碘液从一侧向另一侧扩散，细胞核更易辨认。', mistakes: [{ id: 'flat-cover', trigger: 'flat-cover', title: '盖玻片直接平放', lesson: '气泡边缘黑而厚、中间亮，遮挡细胞；细胞则紧密排列成砖墙状。盖片应一侧先接触水滴再缓缓放下。', consequence: ctx => consequence(ctx, 'bubbles') }, { id: 'no-stain', trigger: 'no-stain', title: '不染色', lesson: '未染色细胞对比度低，细胞核几乎看不见。用碘液染色可提高对比度。', consequence: ctx => consequence(ctx, 'unstained') }] },
        { id: 'mount', title: '放置装片', description: '装片正面朝上，放到载物台上，标本正对通光孔，用压片夹压住。', camera: { focus: 'microscope.stage' }, action: { label: '放置装片，压片夹固定', target: 'slide' }, async run(ctx) { const slide = ctx.getApparatus('slide'), from = slide.object.position.clone(); await shot(ctx, 'stage', async () => { await handAt(ctx, from, () => ctx.tween(2, p => { slide.object.position.lerpVectors(from, new THREE.Vector3(0, 1.48, 0), p); ctx.getApparatus('hand').object.position.copy(slide.object.position).add(new THREE.Vector3(.25, .05, .1)); })); change(ctx, { mounted: true }); }); }, observation: '标本正对通光孔，装片由压片夹固定。' },
        { id: 'lower', title: '侧看物镜，下降镜筒', description: '转动粗准焦螺旋，镜筒缓缓下降。眼睛必须从侧面看着物镜，直到物镜接近玻片。', warning: '下降时看物镜，不看目镜，避免压坏玻片和镜头。', camera: { focus: 'microscope.stage' }, action: { label: '从侧面看物镜，缓缓下降' }, async run(ctx) { ctx.callout('眼睛从侧面看物镜', 'microscope', 'low'); await shot(ctx, 'stage', () => focusTo(ctx, .15, 'coarse')); }, observation: '下降镜筒时从侧面看物镜，物镜接近玻片但不接触。', mistakes: [{ id: 'look-ocular', trigger: 'look-ocular', title: '下降时只看目镜', lesson: '物镜可能压碎玻片，还可能损坏镜头。下降镜筒时必须从侧面看物镜。', consequence: ctx => consequence(ctx, 'crash') }] },
        { id: 'focus', title: '上升找像，细调清晰', description: '左眼看目镜，反向转动粗准焦螺旋使镜筒缓缓上升，直到看到物像；再转动细准焦螺旋，使物像更加清晰。可拖动对应旋钮练习。', camera: { focus: 'microscope.coarse' }, action: { label: '缓缓上升找像，再细调' }, async run(ctx) { change(ctx, { objective: 10, height: .15 }); await shot(ctx, 'stage', async () => { await focusTo(ctx, .32, 'coarse'); await focusTo(ctx, .36, 'fine'); }); change(ctx, { stageX: 0, stageY: 0, targetMarked: true }); ctx.callout('左眼看目镜 · 上升找像 · 细调清晰', 'microscope', 'fine'); }, observation: '镜筒上升时物像逐渐出现；细准焦让细胞壁和染色后的细胞核清晰。' },
        { id: 'move', title: '倒像与移动装片', description: '物像在视野左上方。要让它到中央，装片也应向左上方移动；视野中的像会反向移动到右下方。可在载物台二维拖动装片。', camera: { focus: 'microscope.stage' }, predict: { question: '物像在视野左上方，要移到中央，装片应向哪边移动？', options: [{ id: 'upper-left', text: '左上方' }, { id: 'lower-right', text: '右下方' }, { id: 'upper-right', text: '右上方' }], answer: 'upper-left', explain: '显微镜成倒像，像与装片移动方向相反。装片向左上，像向右下回到中央。' }, action: { label: '装片向左上移动', target: 'slide' }, async run(ctx) { change(ctx, { objective: 10, height: .36 }); const s = microscopeState(ctx), x = s.stageX, y = s.stageY; await ctx.tween(2, p => change(ctx, { stageX: x + (-.4 - x) * p, stageY: y + (.3 - y) * p })); ctx.callout('装片左上 ↖ · 物像右下 ↘', 'microscope', 'stage'); }, observation: '像偏哪边，装片向哪边移：装片左上，物像右下。' },
        { id: 'high', title: '换高倍，只用细准焦', description: '转动转换器换高倍物镜：视野变暗，细胞变大、数目变少。只能用细准焦螺旋调清晰；可调大光圈或用凹面镜使视野变亮。', camera: { focus: 'microscope.nosepiece' }, predict: { question: '换成高倍物镜后，视野亮度和细胞数目怎样变化？', options: [{ id: 'dark-fewer', text: '变暗，细胞变大、数目变少' }, { id: 'bright-more', text: '变亮，细胞变小、数目变多' }, { id: 'same', text: '亮度、细胞大小与数目不变' }], answer: 'dark-fewer', explain: '高倍观察的范围更小，细胞像更大，看到的细胞更少，视野变暗。' }, actions: [{ label: '转动转换器换高倍物镜', run: async (ctx) => { change(ctx, { targetMarked: false }); select(ctx, 'nosepiece'); await shot(ctx, 'stage', async () => { await handAt(ctx, ctx.getApparatus('microscope').anchors.nosepiece.getWorldPosition(new THREE.Vector3()), () => ctx.tween(1, p => ctx.getApparatus('microscope').setState?.('turn', p))); change(ctx, { objective: 40 }); await ctx.wait(1.5); }); } }, { label: '用细准焦调清晰，改善照明', run: async (ctx) => { change(ctx, { objective: 40 }); await focusTo(ctx, .38, 'fine'); change(ctx, { aperture: 1, concave: true }); } }], run(ctx) { ctx.callout('10× × 40× = 400 倍 · 只用细准焦', 'microscope', 'high'); }, observation: '高倍：视野变暗、细胞变大、数目变少；用细准焦调清晰，大光圈或凹面镜改善照明。', mistakes: [{ id: 'high-coarse', trigger: 'high-coarse', title: '换高倍后用粗准焦', lesson: '高倍物镜离玻片较近，粗准焦会使镜筒大幅移动，导致模糊甚至压碎玻片。只能用细准焦螺旋。', consequence: ctx => consequence(ctx, 'coarse') }] },
        { id: 'structures', title: '认识细胞结构', description: '开关视野标注，认识细胞壁、细胞质、细胞核和大液泡。细胞膜紧贴细胞壁，普通光镜下不易看清，不能把清晰边线当成细胞膜。', camera: { focus: 'microscope.ocular' }, action: { label: '显示细胞结构标注' }, run(ctx) { change(ctx, { labels: true, height: .38 }); }, observation: '细胞壁清楚，细胞核被碘液染成棕黄深色，细胞质淡黄，液泡大而透明；细胞膜不易分辨。' },
        { id: 'tidy', title: '整理与实验小结', description: '取下装片，转动转换器使物镜偏向两旁，镜筒降到最低，放回镜箱。回顾结构图与放大倍数计算。', camera: { focus: 'microscope.base' }, action: { label: '整理显微镜，放回镜箱' }, async run(ctx) { change(ctx, { mounted: false, labels: false }); ctx.state.parked = true; sync(ctx); await focusTo(ctx, -.15, 'coarse'); ctx.callout('物镜偏向两旁 · 镜筒最低 · 放回镜箱', 'microscope', 'base'); const scope = ctx.getApparatus('microscope'), box = ctx.getApparatus('case'), right = ctx.getApparatus('hand'), left = ctx.getApparatus('left-hand'); right.object.visible = left.object.visible = true; await ctx.tween(1.5, p => { const y = Math.sin(p * Math.PI) * .25; scope.object.position.y = y; right.object.position.set(.85, 1.8 + y, -.25); left.object.position.set(0, y, .45); }); right.object.visible = left.object.visible = false; box.object.visible = true; await ctx.tween(1.3, p => box.setState?.('close', p)); scope.object.visible = false; ctx.state.stored = true; }, observation: '取下装片，物镜偏向两旁，镜筒最低，双手取镜放回镜箱。' }
    ]
};

microscopeExperiment.subject = 'biology';
export default XiaokeLab.defineExperiment(microscopeExperiment);
