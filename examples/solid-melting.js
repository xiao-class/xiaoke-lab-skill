const { THREE, apparatus, effects, views, defineExperiment } = XiaokeLab;
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const SEA_DATA = [[0, 35], [2, 42], [4, 48], [6, 48], [8, 48], [10, 58], [12, 68]];
const WAX_DATA = [[0, 35], [2, 39], [4, 45], [6, 52], [8, 59], [10, 65], [12, 71]];
const STATIONS = [
  { key: 'sea', x: -2.25, sample: '海波', color: 0xe9f2f4, liquid: 0xc7e8ed },
  { key: 'wax', x: 2.25, sample: '石蜡', color: 0xf2d98b, liquid: 0xe7bd58 },
];

function reading(data, time) {
  if (time <= data[0][0]) return data[0][1];
  for (let i = 1; i < data.length; i++) {
    if (time <= data[i][0]) {
      const [t0, a] = data[i - 1], [t1, b] = data[i];
      return a + (b - a) * (time - t0) / (t1 - t0);
    }
  }
  return data[data.length - 1][1];
}

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .58, ...options });
}

function mesh(geometry, mat, position = [0, 0, 0]) {
  const item = new THREE.Mesh(geometry, mat);
  item.position.set(...position);
  return item;
}

function anchor(object, name, position) {
  const point = new THREE.Object3D();
  point.name = name;
  point.position.set(...position);
  object.add(point);
  return point;
}

function customItem(id, label, object, anchors, controls = {}) {
  object.userData.apparatusId = id;
  return { id, label, object, anchors, ...controls, dispose() { apparatus.disposeObject(object); } };
}

function cylinderBetween(a, b, radius, mat) {
  const direction = b.clone().sub(a);
  const item = mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 12), mat);
  item.position.copy(a).add(b).multiplyScalar(.5);
  item.quaternion.setFromUnitVectors(v(0, 1, 0), direction.normalize());
  return item;
}

function makeTripod(id) {
  const object = new THREE.Group();
  const metal = material(0x5c6870, { metalness: .72, roughness: .35 });
  const clay = material(0xb8a995, { roughness: .92 });
  for (let i = 0; i < 3; i++) {
    const angle = i * Math.PI * 2 / 3;
    const foot = v(Math.cos(angle) * .7, .03, Math.sin(angle) * .7);
    const top = v(Math.cos(angle) * .55, 1.12, Math.sin(angle) * .55);
    object.add(cylinderBetween(foot, top, .035, metal));
  }
  object.add(mesh(new THREE.BoxGeometry(1.48, .055, 1.48), clay, [0, 1.145, 0]));
  for (let i = -3; i <= 3; i++) {
    object.add(mesh(new THREE.BoxGeometry(1.42, .018, .018), metal, [0, 1.18, i * .19]));
    object.add(mesh(new THREE.BoxGeometry(.018, .018, 1.42), metal, [i * .19, 1.18, 0]));
  }
  return customItem(id, '三脚架与陶土网', object, { support: anchor(object, 'support', [0, 1.19, 0]) });
}

function makeThermometer(id) {
  const object = new THREE.Group();
  const glass = material(0xd9f2f4, { transparent: true, opacity: .42, depthWrite: false, roughness: .12 });
  const red = material(0xd94b43, { emissive: 0x390b08, emissiveIntensity: .25 });
  const ink = material(0x42515a);
  object.add(mesh(new THREE.CylinderGeometry(.055, .055, 2.3, 16), glass, [0, 1.2, 0]));
  const bulb = mesh(new THREE.SphereGeometry(.105, 18, 12), red, [0, .06, 0]);
  bulb.userData.partId = 'bulb';
  object.add(bulb);
  const column = mesh(new THREE.CylinderGeometry(.022, .022, 1, 12), red, [0, .35, 0]);
  object.add(column);
  for (let i = 0; i <= 12; i++) {
    const tick = mesh(new THREE.BoxGeometry(i % 2 ? .07 : .11, .012, .012), ink, [.055, .35 + i * .14, .045]);
    object.add(tick);
  }
  object.add(mesh(new THREE.CylinderGeometry(.07, .07, .08, 16), ink, [0, 2.39, 0]));
  const anchors = { bulb: anchor(object, 'bulb', [0, .06, 0]), scale: anchor(object, 'scale', [0, 1.35, 0]), top: anchor(object, 'top', [0, 2.4, 0]) };
  return customItem(id, '温度计（刻度示意）', object, anchors, {
    setState(key, value) {
      if (key === 'temperature') {
        const length = .18 + clamp((Number(value) - 20) / 60) * 1.65;
        column.scale.y = length;
        column.position.y = .1 + length / 2;
      }
      if (key === 'contact') {
        bulb.material.emissive.setHex(value ? 0xb32418 : 0x390b08);
        bulb.material.emissiveIntensity = value ? 1.2 : .25;
      }
    },
  });
}

function makeStirrer(id) {
  const object = new THREE.Group();
  const glass = material(0xcce9ed, { transparent: true, opacity: .62, depthWrite: false, roughness: .15 });
  object.add(mesh(new THREE.CylinderGeometry(.028, .028, 2.35, 12), glass, [0, 1.175, 0]));
  object.add(mesh(new THREE.SphereGeometry(.055, 12, 8), glass, [0, 2.36, 0]));
  return customItem(id, '玻璃搅拌棒', object, { tip: anchor(object, 'tip', [0, 0, 0]) });
}

function makeSample(id, label, solidColor, liquidColor) {
  const object = new THREE.Group();
  const solidMat = material(solidColor, { roughness: .88 });
  const liquidMat = material(liquidColor, { transparent: true, opacity: .78, depthWrite: false, roughness: .25 });
  const solids = [];
  for (let i = 0; i < 18; i++) {
    const layer = Math.floor(i / 6), index = i % 6;
    const angle = index * Math.PI * 2 / 6 + layer * .3;
    const radius = index % 2 ? .11 : .07;
    const piece = mesh(new THREE.BoxGeometry(.09, .09, .09), solidMat.clone(),
      [Math.cos(angle) * radius, .13 + layer * .17, Math.sin(angle) * radius]);
    piece.rotation.set(i * .19, i * .31, i * .13);
    piece.userData.home = piece.position.clone();
    solids.push(piece);
    object.add(piece);
  }
  const liquid = mesh(new THREE.CylinderGeometry(.17, .15, .62, 24), liquidMat, [0, .34, 0]);
  liquid.scale.y = .02;
  object.add(liquid);
  let melt = 0, uneven = 0, direct = 0;
  const render = () => {
    const liquidFraction = Math.max(melt, uneven * .68);
    liquid.scale.y = Math.max(.02, liquidFraction);
    liquid.position.y = .03 + .31 * liquid.scale.y;
    solids.forEach((piece, i) => {
      const layer = Math.floor(i / 6);
      const localMelt = uneven > 0 ? clamp(melt + uneven * (layer === 0 ? .9 : layer === 1 ? .25 : -.15)) : melt;
      piece.scale.setScalar(Math.max(.08, 1 - localMelt * .92));
      piece.position.y = piece.userData.home.y - localMelt * .08;
      piece.material.emissive.setHex(direct > 0 && layer === 0 ? 0x8f2c12 : 0x000000);
      piece.material.emissiveIntensity = direct * .7;
    });
  };
  return customItem(id, label, object, { sample: anchor(object, 'sample', [0, .42, 0]) }, {
    setState(key, value) {
      if (key === 'melt') melt = clamp(Number(value));
      if (key === 'uneven') uneven = clamp(Number(value));
      if (key === 'directHeat') direct = clamp(Number(value));
      render();
    },
  });
}

function makeStopwatch(id) {
  const object = new THREE.Group();
  object.add(mesh(new THREE.BoxGeometry(.82, .18, .62), material(0x43515c, { metalness: .25 }), [0, .09, 0]));
  object.add(mesh(new THREE.BoxGeometry(.57, .025, .3), material(0xb9d8cf, { emissive: 0x172d27, emissiveIntensity: .25 }), [0, .193, .03]));
  object.add(mesh(new THREE.CylinderGeometry(.07, .07, .08, 16), material(0xd6a34b), [0, .22, -.25]));
  return customItem(id, '秒表（时间在第二视图显示）', object, { center: anchor(object, 'center', [0, .2, 0]) });
}

function addBottomAnchor(item, name, y) {
  item.anchors[name] = anchor(item.object, name, [0, y, 0]);
}

function align(item, source, target, axes = 'xyz') {
  item.object.updateWorldMatrix(true, true);
  target.updateWorldMatrix(true, false);
  const parent = item.object.parent;
  const a = parent.worldToLocal(source.getWorldPosition(v(0, 0)));
  const b = parent.worldToLocal(target.getWorldPosition(v(0, 0)));
  const delta = b.sub(a);
  for (const axis of axes) item.object.position[axis] += delta[axis];
}

function setLight(ctx, lit) {
  for (const { key } of STATIONS) {
    ctx.getApparatus(`${key}-lamp`).setState('lit', lit);
    const flame = ctx.getEffect(`${key}-flame`);
    if (lit) {
      flame.start();
      if (ctx.replaying) flame.setProgress?.(1);
    } else flame.stop();
  }
  ctx.state.heating = lit;
}

function syncTime(ctx, time) {
  const seaMelt = clamp((time - 4) / 4);
  const waxMelt = clamp((time - 2) / 8);
  Object.assign(ctx.state, {
    time,
    seaTemp: reading(SEA_DATA, time),
    waxTemp: reading(WAX_DATA, time),
    seaMelt,
    waxMelt,
    contactError: false,
    directHeat: false,
    noStir: false,
  });
  for (const { key } of STATIONS) {
    ctx.getApparatus(`${key}-thermometer`).setState('temperature', ctx.state[`${key}Temp`]);
    ctx.getApparatus(`${key}-sample`).setState('melt', ctx.state[`${key}Melt`]);
    ctx.getApparatus(`${key}-sample`).setState('uneven', 0);
    ctx.getApparatus(`${key}-sample`).setState('directHeat', 0);
    ctx.getApparatus(`${key}-thermometer`).setState('contact', false);
  }
}

async function advance(ctx, target, seconds) {
  const start = ctx.state.time;
  const rods = STATIONS.map(({ key }) => {
    const rod = ctx.getApparatus(`${key}-stirrer`);
    return { rod, x: rod.object.position.x };
  });
  ctx.state.stirring = true;
  await ctx.tween(seconds, p => {
    syncTime(ctx, start + (target - start) * p);
    rods.forEach(({ rod, x }, i) => {
      rod.object.rotation.z = Math.sin(p * Math.PI * 8 + i) * .055;
      rod.object.position.x = x + Math.sin(p * Math.PI * 8 + i) * .025;
    });
  });
  rods.forEach(({ rod, x }) => { rod.object.rotation.z = 0; rod.object.position.x = x; });
  ctx.state.stirring = false;
  syncTime(ctx, target);
}

function drawGraph(g, state, size) {
  const w = size.width, h = size.height;
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#f5f8fa';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#243b4a';
  g.font = '600 15px sans-serif';
  g.fillText(`左·海波 ${Math.round(state.seaTemp ?? 35)}℃`, 18, 26);
  g.fillStyle = '#b56a20';
  g.fillText(`右·石蜡 ${Math.round(state.waxTemp ?? 35)}℃`, Math.min(150, w * .38), 26);
  g.fillStyle = '#4d626e';
  g.font = '12px sans-serif';
  g.fillText(`计时 ${Math.round(state.time ?? 0)} min`, w - 72, 26);
  const left = 46, right = w - 18, top = 48, bottom = h - 70;
  const x = t => left + (right - left) * t / 12;
  const y = temp => bottom - (bottom - top) * (temp - 20) / 60;
  g.font = '11px sans-serif';
  g.lineWidth = 1;
  for (const temp of [20, 40, 60, 80]) {
    g.strokeStyle = '#d8e1e6';
    g.beginPath(); g.moveTo(left, y(temp)); g.lineTo(right, y(temp)); g.stroke();
    g.fillStyle = '#627580'; g.fillText(`${temp}`, 18, y(temp) + 4);
  }
  for (let t = 0; t <= 12; t += 2) {
    g.strokeStyle = '#e3e9ec';
    g.beginPath(); g.moveTo(x(t), top); g.lineTo(x(t), bottom); g.stroke();
    g.fillStyle = '#627580'; g.fillText(`${t}`, x(t) - 3, bottom + 18);
  }
  g.strokeStyle = '#8a9aa3';
  g.beginPath(); g.moveTo(left, top); g.lineTo(left, bottom); g.lineTo(right, bottom); g.stroke();
  g.fillStyle = '#627580';
  g.fillText('温度/℃', 4, top - 8);
  g.fillText('时间/min', right - 55, bottom + 35);
  g.strokeStyle = '#73a7b7'; g.setLineDash([4, 4]);
  g.beginPath(); g.moveTo(left, y(48)); g.lineTo(right, y(48)); g.stroke(); g.setLineDash([]);
  const time = state.time ?? 0;
  function curve(data, color) {
    const points = data.filter(([t]) => t < time);
    points.push([time, reading(data, time)]);
    g.strokeStyle = color; g.lineWidth = 3; g.beginPath();
    points.forEach(([t, temp], i) => { if (i === 0) g.moveTo(x(t), y(temp)); else g.lineTo(x(t), y(temp)); });
    g.stroke();
    // 每到一个完整分钟就留下记录点；当前读数随动画连续移动。
    g.fillStyle = color;
    for (let minute = 0; minute <= Math.floor(time); minute++) {
      g.beginPath(); g.arc(x(minute), y(reading(data, minute)), 2.5, 0, Math.PI * 2); g.fill();
    }
    const last = points[points.length - 1];
    g.fillStyle = color; g.beginPath(); g.arc(x(last[0]), y(last[1]), 4, 0, Math.PI * 2); g.fill();
  }
  curve(SEA_DATA, '#2786a2');
  curve(WAX_DATA, '#d78b32');
  g.font = '12px sans-serif';
  g.fillStyle = '#2786a2'; g.fillText('蓝线：海波（晶体）', left, h - 39);
  g.fillStyle = '#b56a20'; g.fillText('橙线：石蜡（非晶体）', Math.min(left + 150, w * .52), h - 39);
  g.fillStyle = state.contactError || state.directHeat || state.noStir ? '#b64438' : '#405864';
  let note = state.phase || '先预测，再观察曲线';
  if (state.contactError) note = '碰到底部：测的是管壁，不是样品温度';
  if (state.directHeat) note = '直接加热：局部过热，样品受热不均';
  if (state.noStir) note = '不搅拌：下层先熔化，上下温度不同';
  g.font = '600 12px sans-serif';
  g.fillText(note, left, h - 14);
}

const config = {
  id: 'solid-melting', subject: 'physics', title: '探究固体熔化时温度的变化规律',
  equation: '熔化吸热；晶体有固定熔点，非晶体没有固定熔点', orientation: 'landscape', lampVariant: 'detailed',
  framingApparatus: ['sea-tripod', 'wax-tripod', 'sea-beaker', 'wax-beaker', 'sea-tube', 'wax-tube', 'sea-stand', 'wax-stand', 'sea-lamp', 'wax-lamp', 'sea-thermometer', 'wax-thermometer', 'sea-stirrer', 'wax-stirrer'],
  frameDirection: [0, 1.05, 1.65],
  modelNote: '为便于对照，将两套水浴装置并列。曲线采用典型实验数据，海波熔点取约 48℃；12 min 过程作加速演示，并非实时采集。石蜡是混合物，没有固定熔点。样品形态、温度计刻度和局部过热颜色均为教学示意。',
  conclusion: '固体熔化要吸热。海波属于晶体，熔化过程中继续吸热但温度约为 48℃不变，有固定熔点；石蜡属于非晶体，受热后逐渐软化、熔化，温度持续上升，没有固定熔点。温度—时间图像中的水平段表示晶体的熔化过程，不表示停止吸热。',
  safetyNotes: ['酒精灯用灯帽盖灭，不可用嘴吹；加热时不要触碰烧杯、陶土网和试管。', '温度计玻璃泡要全部浸入样品，不碰试管底和试管壁；读数时视线与液柱顶端相平。', '采用水浴加热并适当搅拌，使样品受热均匀；实验后待装置冷却再整理。'],
  secondView: views.custom2d({ title: '温度—时间图像（典型数据）', aspect: 1.08, legend: '每 1 min 记录一次；平台段仍在吸热', draw: drawGraph }),
  setup(ctx) {
    ctx.addApparatus(apparatus.labBench({ width: 24, depth: 10 }));
    Object.assign(ctx.state, { time: 0, seaTemp: 35, waxTemp: 35, seaMelt: 0, waxMelt: 0, heating: false, stirring: false, thermometersReady: false, contactError: false, directHeat: false, noStir: false, phase: '两套装置：海波与石蜡对照' });
    for (const { key, x, sample, color, liquid } of STATIONS) {
      const tripod = ctx.addApparatus(makeTripod(`${key}-tripod`));
      tripod.object.position.set(x, 0, 0);
      const cup = ctx.addApparatus(apparatus.beaker({ id: `${key}-beaker`, radius: .88, height: 1.5, liquidHeight: 1.05, color: 0xd9eef3 }));
      addBottomAnchor(cup, 'bottom', 0);
      addBottomAnchor(cup, 'innerBottom', .1);
      cup.anchors.heatingPoint = anchor(cup.object, 'heatingPoint', [0, 0, .55]);
      cup.mountedOn = `${key}-tripod`;
      ctx.root.updateMatrixWorld(true);
      align(cup, cup.anchors.bottom, tripod.anchors.support);
      const tube = ctx.addApparatus(apparatus.testTube({ id: `${key}-tube`, length: 2.35, radius: .23 }));
      addBottomAnchor(tube, 'base', 0);
      addBottomAnchor(tube, 'clampPoint', 1.8);
      addBottomAnchor(tube, 'bulbTarget', .36);
      addBottomAnchor(tube, 'stirTarget', .25);
      tube.contains = [`${key}-sample`, `${key}-thermometer`, `${key}-stirrer`];
      tube.mountedOn = `${key}-stand`;
      cup.contains = [`${key}-tube`, `${key}-sample`];
      tripod.contains = [`${key}-lamp`];
      ctx.root.updateMatrixWorld(true);
      align(tube, tube.anchors.base, cup.anchors.innerBottom);
      const stand = ctx.addApparatus(apparatus.ironStand({ id: `${key}-stand`, height: tube.object.position.y + 1.8, angle: 0, clampRadius: .24 }));
      const removedBase = [];
      for (const child of [...stand.object.children]) {
        if (child.isMesh && child.position.y < .1) {
          stand.object.remove(child);
          removedBase.push(child);
        }
      }
      stand.object.add(mesh(new THREE.BoxGeometry(.5, .16, .5), material(0x3e4a52, { metalness: .65, roughness: .4 }), [-.5, .08, -.28]));
      const disposeStand = stand.dispose;
      stand.dispose = () => { removedBase.forEach(part => apparatus.disposeObject(part)); disposeStand?.(); };
      stand.label = '铁架台（紧凑底座）';
      stand.object.position.set(x + 1.05, 0, -.4);
      ctx.root.updateMatrixWorld(true);
      align(stand, stand.anchors.clamp, tube.anchors.clampPoint, 'xz');
      const lamp = ctx.addApparatus(apparatus.alcoholLampDetailed({ id: `${key}-lamp` }));
      lamp.object.scale.setScalar(.85);
      lamp.object.position.y = 0;
      ctx.root.updateMatrixWorld(true);
      align(lamp, lamp.anchors.wick, cup.anchors.heatingPoint, 'xz');
      ctx.addEffect(`${key}-flame`, effects.flame({ height: .48, width: .25, intensity: .72 }), lamp.anchors.wick);
      const filling = ctx.addApparatus(makeSample(`${key}-sample`, `${sample}样品`, color, liquid), tube.object);
      filling.object.position.y = .08;
      filling.mountedOn = `${key}-stand`;
      const thermometer = ctx.addApparatus(makeThermometer(`${key}-thermometer`));
      thermometer.mountedOn = `${key}-stand`;
      ctx.root.updateMatrixWorld(true);
      align(thermometer, thermometer.anchors.bulb, tube.anchors.bulbTarget);
      thermometer.object.position.y += .45;
      thermometer.setState('temperature', 35);
      const stirrer = ctx.addApparatus(makeStirrer(`${key}-stirrer`));
      stirrer.mountedOn = `${key}-stand`;
      ctx.root.updateMatrixWorld(true);
      align(stirrer, stirrer.anchors.tip, tube.anchors.stirTarget);
      stirrer.object.position.x += .1;
    }
    const watch = ctx.addApparatus(makeStopwatch('stopwatch'));
    watch.object.position.set(0, 0, 1.65);
    ctx.root.updateMatrixWorld(true);
  },
  steps: [
    {
      id: 'assemble', title: '检查水浴加热装置', camera: { focus: 'sea-beaker.surface' },
      description: '辨认两套装置：烧杯中是清水，试管分别装海波和石蜡。烧杯放在陶土网上，用酒精灯加热水，再由水把热量传给样品。',
      action: { label: '检查水浴装置', target: 'sea-tripod' },
      predict: { question: '与直接用火焰加热试管相比，水浴加热的主要好处是什么？', options: [
        { id: 'even', text: '受热更均匀，便于观察记录' }, { id: 'short', text: '只是为了缩短实验时间' }, { id: 'mp', text: '能提高固体的熔点' },
      ], answer: 'even', explain: '水浴把火焰的集中加热变成较温和、较均匀的加热，样品温度变化较慢，便于按时间间隔记录。' },
      run(ctx) { ctx.state.phase = '水浴加热：水把热量传给试管中的样品'; ctx.callout('水浴加热 · 受热较均匀', 'sea-beaker', 'surface'); },
      observation: '两套水浴装置并列；烧杯中的水包围试管下部，试管不直接放在火焰上。', warning: '检查装置稳固，加热后不要触碰烧杯和陶土网。',
    },
    {
      id: 'insert', title: '装样并插入温度计', camera: { focus: 'sea-thermometer.bulb', distance: 3.2 },
      description: '两支试管分别装有适量海波和石蜡。把温度计玻璃泡全部浸入样品，不能碰试管底或试管壁；玻璃棒用于搅拌。',
      action: { label: '插入并检查温度计', target: 'sea-thermometer' },
      predict: { question: '持续加热时，石蜡的温度会怎样变化？', observeAt: 'wax', options: [
        { id: 'rise', text: '边软化边熔化，温度持续上升' }, { id: 'fixed', text: '一定在 48℃保持不变' }, { id: 'drop', text: '先下降，再上升' },
      ], answer: 'rise', explain: '石蜡是非晶体，没有固定熔点；受热时逐渐软化、熔化，温度持续上升，图像没有水平平台。' },
      async run(ctx) {
        const items = STATIONS.map(({ key }) => ctx.getApparatus(`${key}-thermometer`));
        const starts = items.map(item => item.object.position.y);
        await ctx.tween(2, p => items.forEach((item, i) => { item.object.position.y = starts[i] - .45 * p; }));
        ctx.state.thermometersReady = true;
        ctx.state.phase = '玻璃泡浸入样品，不碰底、不碰壁';
        ctx.callout('玻璃泡浸入样品 · 不碰底', 'sea-thermometer', 'bulb');
      },
      observation: '温度计玻璃泡完全浸入样品，位于试管中央；搅拌棒伸入样品。', warning: '读数时温度计量程要合适，玻璃泡保持浸入，视线与液柱顶端相平。',
      mistakes: [{ id: 'touch-bottom', trigger: 'touch-bottom', title: '温度计玻璃泡碰到试管底', lesson: '碰底后测到的是试管底附近的温度，不代表样品整体温度；应把玻璃泡放在样品中央。', async consequence(ctx) {
        const thermometer = ctx.getApparatus('sea-thermometer'), tube = ctx.getApparatus('sea-tube');
        const from = thermometer.object.position.y, target = tube.object.position.y + .06;
        const focus = thermometer.anchors.bulb.getWorldPosition(v(0, 0)).toArray();
        await ctx.tween(3, p => {
          thermometer.object.position.y = from + (target - from) * p;
          thermometer.setState('contact', p > .7);
          ctx.state.contactError = p > .7;
          ctx.state.seaTemp = 35 + 17 * Math.max(0, (p - .7) / .3);
          thermometer.setState('temperature', ctx.state.seaTemp);
          ctx.detailCamera = { amount: p, focus, apparatus: ['sea-thermometer', 'sea-tube'], focusRadius: .75 };
          ctx.demonstration = { progress: p, caption: p < .7 ? '玻璃泡向下移动，逐渐靠近试管底' : '碰到底部：读数受管壁影响，不代表样品温度（示意）' };
        });
      } }],
    },
    {
      id: 'heat', title: '加热水浴，搅拌并计时', camera: { focus: 'sea-lamp.wick' },
      description: '点燃两盏酒精灯，用外焰加热烧杯。轻轻搅拌样品，从 35℃开始，每隔 1 min 记录一次两种样品的温度和状态。',
      action: { label: '点燃酒精灯并计时', target: 'sea-lamp' },
      predict: { question: '海波开始熔化后，继续吸热，温度将怎样变化？', observeAt: 'sea-plateau', options: [
        { id: 'plateau', text: '约 48℃保持不变，直到完全熔化' }, { id: 'rise', text: '一直快速上升，不会停留' }, { id: 'fall', text: '停止吸热，温度下降' },
      ], answer: 'plateau', explain: '海波是晶体。熔化过程中固液共存，吸收的热量用于使固体熔化，温度约保持在熔点 48℃，并不是停止吸热。' },
      async run(ctx) { setLight(ctx, true); ctx.state.phase = '熔化前：两种固体吸热，温度逐渐升高'; await advance(ctx, 4, 4); ctx.callout('开始记录 · 每隔 1 min 读数', 'stopwatch', 'center'); },
      observation: '水温逐渐升高；海波和石蜡在熔化前都吸热升温，海波接近 48℃。', warning: '用外焰加热，适当搅拌；不要直接加热试管，也不要让温度计碰底。',
      mistakes: [{ id: 'direct-flame', trigger: 'direct-flame', title: '撤去水浴，直接加热试管', lesson: '直接火焰加热会使试管局部温度过高、样品受热不均，读数缺乏代表性；应使用水浴。', async consequence(ctx) {
        ctx.getApparatus('sea-beaker').object.visible = false;
        ctx.getApparatus('sea-tripod').object.visible = false;
        const lamp = ctx.getApparatus('sea-lamp'), lampFrom = lamp.object.position.z;
        lamp.setState('lit', true);
        ctx.getEffect('sea-flame').start();
        const sample = ctx.getApparatus('sea-sample');
        const focus = sample.anchors.sample.getWorldPosition(v(0, 0)).toArray();
        ctx.state.directHeat = true;
        await ctx.tween(4, p => {
          sample.setState('directHeat', p);
          sample.setState('uneven', p);
          lamp.object.position.z = lampFrom * (1 - p);
          ctx.detailCamera = { amount: p, focus, apparatus: ['sea-sample', 'sea-tube', 'sea-lamp'], focusRadius: .95 };
          ctx.demonstration = { progress: p, caption: p < .45 ? '火焰集中加热试管底部，没有水浴缓冲' : '下层先受热熔化，上层仍较冷：样品受热不均（示意）' };
        });
      } }],
    },
    {
      id: 'sea-plateau', title: '观察海波的熔化平台', camera: { focus: 'sea-sample.sample', distance: 3.5 },
      description: '继续加热并搅拌，观察海波从固态变成固液共存，再完全熔化；同时读取温度，注意图像中的水平段。',
      action: { label: '观察海波熔化', target: 'sea-sample' },
      async run(ctx) { ctx.state.phase = '海波熔化：继续吸热，约 48℃不变'; await advance(ctx, 8, 5); ctx.callout('固液共存 → 完全熔化 · 约 48℃', 'sea-sample', 'sample'); },
      observation: '海波逐渐熔化，熔化时固液共存；继续吸热，但温度约保持 48℃不变，完全熔化前曲线出现水平段。',
      mistakes: [{ id: 'no-stir', trigger: 'no-stir', title: '加热时不搅拌样品', lesson: '不搅拌会使样品上下受热不均，温度计只能反映局部温度；应在水浴加热时轻轻搅拌。', async consequence(ctx) {
        const sample = ctx.getApparatus('sea-sample');
        const focus = sample.anchors.sample.getWorldPosition(v(0, 0)).toArray();
        ctx.state.noStir = true;
        await ctx.tween(4, p => {
          sample.setState('uneven', p);
          sample.setState('melt', 0);
          ctx.detailCamera = { amount: p, focus, apparatus: ['sea-sample', 'sea-thermometer'], focusRadius: .8 };
          ctx.demonstration = { progress: p, caption: p < .45 ? '没有搅拌，热量在样品中传递不均匀' : '下层先熔化、上层仍是固体：局部读数不能代表整体' };
        });
      } }],
    },
    {
      id: 'wax', title: '对照石蜡的熔化过程', camera: { focus: 'wax-sample.sample', distance: 3.5 },
      description: '观察石蜡的状态和温度曲线。比较它与海波：是否先变软，是否存在温度保持不变的熔化平台。',
      action: { label: '观察石蜡熔化', target: 'wax-sample' },
      async run(ctx) { ctx.state.phase = '石蜡熔化：逐渐软化，温度持续上升'; await advance(ctx, 10, 4); ctx.callout('逐渐软化、熔化 · 没有固定熔点', 'wax-sample', 'sample'); },
      observation: '石蜡先变软，再逐渐变成液态；整个过程中温度持续上升，曲线没有水平平台。',
    },
    {
      id: 'after', title: '继续记录完全熔化后的温度', camera: { focus: 'sea-thermometer.scale', distance: 3.2 },
      description: '海波已完全熔化，继续水浴加热并记录。把海波完全熔化后的曲线与熔化平台比较。',
      action: { label: '继续加热并记录', target: 'sea-thermometer' },
      predict: { question: '海波完全熔化后，继续吸热，温度会怎样变化？', options: [
        { id: 'rise', text: '温度又逐渐升高' }, { id: 'forever', text: '永远保持 48℃不变' }, { id: 'freeze', text: '立即凝固并降温' },
      ], answer: 'rise', explain: '水平平台只对应晶体的熔化过程。海波全部变成液体后，继续吸热会使液态海波温度升高。' },
      async run(ctx) { ctx.state.phase = '完全熔化后：液体继续吸热升温'; await advance(ctx, 12, 3); ctx.callout('平台结束 · 温度继续升高', 'sea-thermometer', 'scale'); },
      observation: '海波完全熔化后，温度从约 48℃继续升高；石蜡温度也继续上升。',
    },
    {
      id: 'finish', title: '盖灭酒精灯，整理记录', camera: { focus: 'sea-lamp.cap', distance: 3.4 },
      description: '停止加热，用灯帽分别盖灭两盏酒精灯。保持记录完整：时间、温度、样品状态三项不能缺少。',
      action: { label: '盖灭酒精灯并整理', target: 'sea-lamp' },
      async run(ctx) {
        const lamps = STATIONS.map(({ key }) => ctx.getApparatus(`${key}-lamp`));
        await ctx.tween(2, p => lamps.forEach(lamp => lamp.setState('cap', p)));
        setLight(ctx, false);
        ctx.state.phase = '记录完整：时间、温度、样品状态';
        ctx.callout('灯帽盖灭 · 待冷却再整理', 'sea-lamp', 'cap');
      },
      observation: '火焰熄灭，停止计时；记录表中同时保留时间、温度和样品状态。', warning: '不可用嘴吹灭酒精灯；装置未冷却前不要拆卸。',
    },
    {
      id: 'conclude', title: '比较曲线，归纳规律', camera: { focus: 'sea-sample.sample', distance: 4 },
      description: '比较两条温度—时间曲线，从“是否出现水平平台”判断晶体和非晶体的熔化特点，并解释平台段是否吸热。',
      action: { label: '归纳熔化规律', target: 'stopwatch' },
      run(ctx) { ctx.state.phase = '晶体有熔点；非晶体没有熔点；熔化都吸热'; ctx.callout('水平平台 = 海波正在熔化', 'sea-sample', 'sample'); ctx.callout('持续升温 = 石蜡逐渐熔化', 'wax-sample', 'sample'); },
      observation: '海波曲线有约 48℃的水平平台，石蜡曲线持续上升；两种固体熔化都需要吸热。',
    },
  ],
};
export default defineExperiment(config);
