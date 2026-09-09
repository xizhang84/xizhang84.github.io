/* ============================================================
   3D PET/CT scanner room — the interactive site map
   Procedural model loosely following a clinical PET/CT gantry
   (≈2.3 m wide rounded housing, 80 cm bore, patient table that
   slides into the bore, electronics cabinet, review workstation).
   Annihilation events in the patient's head emit back-to-back
   511 keV photons that light up detector blocks, draw the line of
   response, send a pulse down the cable, and add a count to the
   image forming on the workstation screen.

   Each part of the room is a "station" that stands for one section
   of the site. Hovering a part (or its pulsing dot) lifts and glows
   it and reveals a tooltip; clicking opens that section.

   Built on three.js (ES module via import map). Falls back to the
   flat station list if WebGL or the CDN is unavailable.
   ============================================================ */
const host = document.querySelector('.pet-scene');
if (host) boot();

function showFallback() {
  host.hidden = true;
  const list = document.querySelector('.pet-map');
  if (list) list.hidden = false;
}

async function boot() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let THREE, OrbitControls, CSS2DRenderer, CSS2DObject;
  try {
    const mods = await Promise.all([
      import('three'),
      import('three/addons/controls/OrbitControls.js'),
      import('three/addons/renderers/CSS2DRenderer.js')
    ]);
    THREE = mods[0];
    OrbitControls = mods[1].OrbitControls;
    CSS2DRenderer = mods[2].CSS2DRenderer;
    CSS2DObject = mods[2].CSS2DObject;
  } catch (err) {
    showFallback();
    return;
  }
  // Post-processing (bloom) is optional: the room still renders without it.
  let PP = null;
  try {
    const [ec, rp, ub, op] = await Promise.all([
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js')
    ]);
    PP = { EffectComposer: ec.EffectComposer, RenderPass: rp.RenderPass, UnrealBloomPass: ub.UnrealBloomPass, OutputPass: op.OutputPass };
  } catch (err) { PP = null; }
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) { showFallback(); return; }

  // ---------- Palette (follows the site's CSS variables) ----------
  const cssVar = (name, fallback) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  };
  const readPalette = () => ({
    dark: document.documentElement.getAttribute('data-theme') === 'dark',
    paper: cssVar('--paper', '#ffffff'),
    elev: cssVar('--bg-elev', '#f8f1de'),
    ink: cssVar('--ink', '#1f1611'),
    soft: cssVar('--ink-soft', '#4a3f33'),
    teal: cssVar('--teal', '#04a4ba'),
    terra: cssVar('--terracotta', '#c6644d'),
    sand: cssVar('--sand', '#e8d9b8')
  });
  let pal = readPalette();

  // ---------- Renderer / camera / controls ----------
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 2, 0.1, 60);
  camera.position.set(3.9, 2.3, 4.6);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  // ---------- Bloom: the bright emissive parts (crystal flashes, LEDs, tracer) glow ----------
  let composer = null, bloom = null;
  if (PP) {
    composer = new PP.EffectComposer(renderer);
    composer.addPass(new PP.RenderPass(scene, camera));
    bloom = new PP.UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.5, 0.85);
    // The bloom blur writes alpha = 1, which would paint the transparent canvas black.
    // Add the glow to the colour only and leave the alpha channel as the scene rendered it.
    const blend = bloom.blendMaterial || bloom.materialCopy;
    if (blend) {
      blend.blending = THREE.CustomBlending;
      blend.blendSrc = THREE.OneFactor; blend.blendDst = THREE.OneFactor;
      blend.blendSrcAlpha = THREE.ZeroFactor; blend.blendDstAlpha = THREE.OneFactor;
    }
    composer.addPass(bloom);
    composer.addPass(new PP.OutputPass());
  }

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'scene-labels';
  host.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(-0.55, 0.65, 0.5);  // centre of the room, slightly low so the gantry sits high in frame
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minPolarAngle = 0.85;
  controls.maxPolarAngle = 1.42;
  controls.autoRotate = !reduceMotion.matches;
  controls.autoRotateSpeed = 0.7;
  controls.update();

  // ---------- Lights ----------
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a7b66, 0.9);
  const sun = new THREE.DirectionalLight(0xffffff, 1.7);
  sun.position.set(3, 6.5, 4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -4.5, right: 4.5, top: 4.5, bottom: -4.5, near: 1, far: 20 });
  sun.shadow.bias = -0.0006;
  sun.shadow.radius = 4;
  const fill = new THREE.DirectionalLight(0x9fd8e2, 0.4);
  fill.position.set(-4, 2.5, -3);
  scene.add(hemi, sun, fill);

  // ---------- Materials that follow the theme ----------
  const M = {
    floor: new THREE.MeshStandardMaterial({ roughness: 1, transparent: true }),
    housing: new THREE.MeshPhysicalMaterial({ roughness: 0.32, metalness: 0.05, transparent: true, opacity: 0.55, depthWrite: false }),
    led: new THREE.MeshStandardMaterial({ emissiveIntensity: 1.6, roughness: 0.3 }),
    board: new THREE.MeshStandardMaterial({ roughness: 0.7 }),
    bed: new THREE.MeshStandardMaterial({ roughness: 0.55 }),
    pedestal: new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.15 }),
    patient: new THREE.MeshStandardMaterial({ roughness: 0.8 }),
    tracer: new THREE.MeshStandardMaterial({ emissiveIntensity: 2.2 }),
    cabinet: new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.1 }),
    cable: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
    desk: new THREE.MeshStandardMaterial({ roughness: 0.6 }),
    monitor: new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.3 }),
    photon: new THREE.MeshBasicMaterial(),
    pulse: new THREE.MeshBasicMaterial(),
    pick: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  };
  const blockMats = [];
  const ledMats = [];

  function applyPalette() {
    pal = readPalette();
    const c = (hex) => new THREE.Color(hex);
    M.floor.color = c(pal.elev);
    M.floor.opacity = pal.dark ? 0.9 : 1;
    M.housing.color = c(pal.paper);
    M.housing.opacity = pal.dark ? 0.5 : 0.55;
    M.led.color = c(pal.teal); M.led.emissive = c(pal.teal);
    M.board.color = c(pal.dark ? '#2a3a2e' : '#33503e');
    M.bed.color = c(pal.dark ? '#5a4d40' : '#efe6d2');
    M.pedestal.color = c(pal.dark ? '#3a3029' : '#cdc2ad');
    M.patient.color = c(pal.sand);
    M.tracer.color = c(pal.terra); M.tracer.emissive = c(pal.terra);
    M.cabinet.color = c(pal.dark ? '#2b241f' : '#4a3f33');
    M.cable.color = c(pal.dark ? '#111' : '#2a2320');
    M.desk.color = c(pal.dark ? '#3d332b' : '#d6c9ae');
    M.monitor.color = c(pal.dark ? '#1a1512' : '#3b332c');
    M.photon.color = c(pal.terra);
    glowMat.color = c(pal.terra);
    M.pulse.color = c(pal.teal);
    blockMats.forEach(m => { m.color = c(pal.dark ? '#c9c2b4' : '#f4efe4'); m.emissive = c(pal.teal); });
    ledMats.forEach((m, i) => { const col = i % 5 === 0 ? pal.terra : pal.teal; m.color = c(col); m.emissive = c(col); });
    // highlight glow colour for every station material
    STATIONS.forEach(s => s.glow.forEach(m => { m.emissive = c(pal.teal); }));
    hemi.intensity = pal.dark ? 0.45 : 0.9;
    sun.intensity = pal.dark ? 1.1 : 1.7;
    fill.intensity = pal.dark ? 0.25 : 0.4;
    tracerLight.color = c(pal.terra);
    if (bloom) {
      bloom.strength = pal.dark ? 0.75 : 0.35;
      bloom.threshold = pal.dark ? 0.78 : 0.96;
      bloom.radius = pal.dark ? 0.55 : 0.4;
    }
  }

  // ---------- Floor ----------
  const floorAlpha = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256;
    const g = cv.getContext('2d');
    const grad = g.createRadialGradient(128, 128, 40, 128, 128, 128);
    grad.addColorStop(0, '#fff'); grad.addColorStop(0.75, '#fff'); grad.addColorStop(1, '#000');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(cv);
  })();
  M.floor.alphaMap = floorAlpha;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(4.6, 72), M.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---------- Gantry (station: detector → Publications) ----------
  const BORE_R = 0.42, RING_R = 0.52, N_BLOCKS = 40, GANTRY_D = 0.9;
  const gantry = new THREE.Group();
  gantry.position.y = 1.0;
  scene.add(gantry);

  const roundedRect = (w, h, r) => {
    const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  };
  const shell = roundedRect(2.3, 2.0, 0.32);
  const bore = new THREE.Path(); bore.absarc(0, 0, BORE_R, 0, Math.PI * 2, true);
  shell.holes.push(bore);
  const housingGeo = new THREE.ExtrudeGeometry(shell, { depth: GANTRY_D, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 4, curveSegments: 56 });
  housingGeo.translate(0, 0, -GANTRY_D / 2);
  const housing = new THREE.Mesh(housingGeo, M.housing);
  housing.castShadow = true;
  gantry.add(housing);

  const ledRingGeo = new THREE.TorusGeometry(0.5, 0.012, 10, 96);
  [1, -1].forEach(sign => {
    const ring = new THREE.Mesh(ledRingGeo, M.led);
    ring.position.z = sign * (GANTRY_D / 2 + 0.05);
    gantry.add(ring);
  });

  const blockGeo = new THREE.BoxGeometry(0.07, 0.16, 0.26);
  const blockFlash = new Float32Array(N_BLOCKS);
  for (let i = 0; i < N_BLOCKS; i++) {
    const a = (i / N_BLOCKS) * Math.PI * 2;
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.45, emissiveIntensity: 0 });
    blockMats.push(mat);
    const m = new THREE.Mesh(blockGeo, mat);
    m.position.set(Math.cos(a) * RING_R, Math.sin(a) * RING_R, 0);
    m.rotation.z = a + Math.PI / 2;
    gantry.add(m);
  }
  const boardGeo = new THREE.BoxGeometry(0.085, 0.02, 0.24);
  const boards = new THREE.InstancedMesh(boardGeo, M.board, N_BLOCKS);
  const tmp = new THREE.Object3D();
  for (let i = 0; i < N_BLOCKS; i++) {
    const a = (i / N_BLOCKS) * Math.PI * 2;
    tmp.position.set(Math.cos(a) * 0.63, Math.sin(a) * 0.63, 0);
    tmp.rotation.set(0, 0, a + Math.PI / 2);
    tmp.updateMatrix();
    boards.setMatrixAt(i, tmp.matrix);
  }
  gantry.add(boards);

  // ---------- Patient table + patient (station: subject → Home) ----------
  const HEAD = new THREE.Vector3(0, 1.0, 0.05);
  const bedG = new THREE.Group();
  bedG.position.set(0, 0.9, 1.1);
  scene.add(bedG);
  const local = (v) => v.clone().sub(bedG.position);

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.76, 0.7), M.pedestal);
  pedestal.position.copy(local(new THREE.Vector3(0, 0.38, 1.85)));
  const table = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.06, 2.7), M.bed);
  table.position.copy(local(new THREE.Vector3(0, 0.86, 1.25)));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 18), M.patient);
  head.position.copy(local(HEAD));
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.85, 6, 14), M.patient);
  torso.rotation.x = Math.PI / 2;
  torso.position.copy(local(new THREE.Vector3(0, 1.03, 0.75)));
  const legs = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.9, 6, 14), M.patient);
  legs.rotation.x = Math.PI / 2;
  legs.position.copy(local(new THREE.Vector3(0, 0.99, 1.75)));
  [pedestal, table, head, torso, legs].forEach(m => { m.castShadow = true; m.receiveShadow = true; bedG.add(m); });

  // ---------- Annihilation point (station: annihilation → Research) ----------
  const annG = new THREE.Group();
  annG.position.copy(HEAD);
  scene.add(annG);
  const tracer = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), M.tracer);
  const tracerLight = new THREE.PointLight(0xffffff, 1.2, 1.6, 2);
  const annPick = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), M.pick);
  annG.add(tracer, tracerLight, annPick);

  // ---------- Electronics cabinet + cable (station: readout → CV) ----------
  const CAB = new THREE.Vector3(-1.9, 0.85, -0.35);
  const cabG = new THREE.Group();
  cabG.position.copy(CAB);
  scene.add(cabG);
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.7, 0.78), M.cabinet);
  cabinet.castShadow = true; cabinet.receiveShadow = true;
  cabG.add(cabinet);
  const ledGeo = new THREE.BoxGeometry(0.028, 0.028, 0.01);
  const leds = [];
  for (let r = 0; r < 9; r++) {
    for (let col = 0; col < 4; col++) {
      const mat = new THREE.MeshStandardMaterial({ emissiveIntensity: 0.3, roughness: 0.4 });
      ledMats.push(mat);
      const led = new THREE.Mesh(ledGeo, mat);
      led.position.set(-0.17 + col * 0.11, 0.6 - r * 0.12, 0.39 + 0.006);
      led.userData.phase = Math.random() * 10;
      cabG.add(led); leds.push(led);
    }
  }
  const cableCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.17, 0.95, 0.15),
    new THREE.Vector3(-1.4, 0.55, 0.05),
    new THREE.Vector3(-1.62, 0.5, -0.15),
    new THREE.Vector3(-1.9, 0.95, -0.35)
  ]);
  const cable = new THREE.Mesh(new THREE.TubeGeometry(cableCurve, 48, 0.018, 8, false), M.cable);
  cable.castShadow = true;
  scene.add(cable);

  // ---------- Workstation (station: image → Contact) ----------
  const station = new THREE.Group();
  station.position.set(-1.65, 0.75, 1.75);
  station.rotation.y = 0.75;
  scene.add(station);
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.55), M.desk);
  deskTop.position.y = -0.01;
  const deskLegL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.5), M.desk);
  deskLegL.position.set(-0.46, -0.39, 0);
  const deskLegR = deskLegL.clone(); deskLegR.position.x = 0.46;
  const monBase = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.16), M.monitor);
  monBase.position.set(0, 0.02, 0);
  const monStand = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, 0.04), M.monitor);
  monStand.position.set(0, 0.10, 0);
  const monFrame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.4, 0.025), M.monitor);
  monFrame.position.set(0, 0.36, 0);
  [deskTop, deskLegL, deskLegR, monBase, monStand, monFrame].forEach(m => { m.castShadow = true; m.receiveShadow = true; station.add(m); });

  const screenCanvas = document.createElement('canvas');
  screenCanvas.width = 256; screenCanvas.height = 160;
  const sg = screenCanvas.getContext('2d');
  const screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.36), new THREE.MeshBasicMaterial({ map: screenTex }));
  screen.position.set(0, 0.36, 0.0135);
  station.add(screen);
  const resetScreen = () => {
    sg.globalCompositeOperation = 'source-over';
    sg.fillStyle = '#1c1613'; sg.fillRect(0, 0, 256, 160);
    sg.fillStyle = 'rgba(232,217,184,0.16)';
    sg.beginPath(); sg.ellipse(128, 80, 52, 62, 0, 0, Math.PI * 2); sg.fill();
    sg.strokeStyle = 'rgba(232,217,184,0.35)'; sg.lineWidth = 1.2;
    sg.beginPath(); sg.ellipse(128, 80, 52, 62, 0, 0, Math.PI * 2); sg.stroke();
    sg.strokeStyle = 'rgba(232,217,184,0.18)';
    sg.beginPath(); sg.moveTo(128, 22); sg.lineTo(128, 138); sg.stroke();
    sg.fillStyle = 'rgba(4,164,186,0.9)'; sg.font = '10px monospace';
    sg.fillText('PET · brain · counts', 8, 14);
    sg.fillText('511 keV window', 8, 152);
    screenTex.needsUpdate = true;
  };
  let counts = 0;
  const plotCount = (p) => {
    const u = 128 + (p.x / 0.11) * 46;
    const v = 80 - ((p.y - HEAD.y) / 0.11) * 56;
    sg.globalCompositeOperation = 'lighter';
    const g = sg.createRadialGradient(u, v, 0, u, v, 9);
    g.addColorStop(0, 'rgba(255,150,90,0.55)'); g.addColorStop(1, 'rgba(255,150,90,0)');
    sg.fillStyle = g; sg.beginPath(); sg.arc(u, v, 9, 0, Math.PI * 2); sg.fill();
    sg.globalCompositeOperation = 'source-over';
    sg.fillStyle = '#1c1613'; sg.fillRect(190, 140, 60, 16);
    sg.fillStyle = 'rgba(4,164,186,0.9)'; sg.font = '10px monospace';
    sg.fillText(String(++counts).padStart(5, '0') + ' ev', 196, 152);
    screenTex.needsUpdate = true;
    if (counts % 500 === 0) resetScreen();
  };
  resetScreen();

  // ---------- Stations: hover to reveal, click to open ----------
  const STATIONS = [
    { id: 'home', stage: '01 · Subject', title: 'Home', blurb: 'Every scan begins with a subject. Who I am and what I work on.',
      group: bedG, glow: [M.pedestal, M.bed, M.patient], at: [0.05, 1.22, 1.55] },
    { id: 'research', stage: '02 · Annihilation', title: 'Research', blurb: 'A positron meets an electron and two 511 keV photons fly apart. My research themes.',
      group: annG, glow: [], at: [0, 1.0, 0.05] },
    { id: 'publications', stage: '03 · Detector', title: 'Publications', blurb: 'Scintillator crystals and SiPMs catch each photon. My peer-reviewed results.',
      group: gantry, glow: [M.housing, M.board], glowAmt: 0.14, at: [0.8, 1.6, 0.5] },
    { id: 'cv', stage: '04 · Readout', title: 'CV', blurb: 'FPGA readout turns pulses into timestamps and energies. Training, skills, awards.',
      group: cabG, glow: [M.cabinet, M.cable], at: [-1.9, 1.76, -0.35] },
    { id: 'contact', stage: '05 · Image', title: 'Contact', blurb: 'Coincidences are reconstructed into an image. Let’s build the next one together.',
      group: station, glow: [M.desk, M.monitor], at: [-1.65, 1.42, 1.75] }
  ];
  const pickables = [];
  STATIONS.forEach(s => {
    s.hi = 0; s.target = 0;
    s.baseY = s.group.position.y;
    s.group.traverse(o => { if (o.isMesh) { o.userData.station = s; pickables.push(o); } });
    s.glow.forEach(m => { m.emissiveIntensity = 0; });

    // pulsing dot (tap target) + tooltip, both anchored to the part
    const anchor = document.createElement('div');
    anchor.className = 'scene-anchor';
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'scene-dot';
    dot.setAttribute('aria-label', s.title + ' — ' + s.stage);
    const tip = document.createElement('div');
    tip.className = 'scene-tip';
    tip.innerHTML = '<span class="tip-stage">' + s.stage + '</span><strong class="tip-title">' + s.title + '</strong><p>' + s.blurb + '</p><span class="tip-go">Click to open →</span>';
    anchor.append(dot, tip);
    s.dot = dot; s.tip = tip;
    dot.addEventListener('pointerenter', () => setHover(s));
    dot.addEventListener('focus', () => setHover(s));
    dot.addEventListener('blur', () => setHover(null));
    dot.addEventListener('click', (e) => { e.preventDefault(); open(s); });
    const obj = new CSS2DObject(anchor);
    obj.position.set(s.at[0], s.at[1], s.at[2]);
    s.anchorObj = obj;
    scene.add(obj);
  });
  const projected = new THREE.Vector3();
  const placeTip = (s) => {
    projected.copy(s.anchorObj.position).project(camera);
    const y = (1 - projected.y) / 2 * host.clientHeight;
    s.tip.classList.toggle('below', y < 150);
  };
  cable.userData.station = STATIONS[3];
  pickables.push(cable);

  let hovered = null;
  function setHover(s) {
    if (s === hovered) return;
    if (hovered) { hovered.target = 0; hovered.tip.classList.remove('show'); hovered.dot.classList.remove('is-hot'); }
    hovered = s;
    if (s) { s.target = 1; s.tip.classList.add('show'); s.dot.classList.add('is-hot'); }
    host.classList.toggle('picking', !!s);
  }
  // close-up pose on a station, seen from roughly where the camera is now
  function zoomPose(s, from) {
    const at = new THREE.Vector3(s.at[0], s.at[1] - 0.12, s.at[2]);
    const dir = from.clone().sub(at).normalize();
    dir.y = Math.min(Math.max(dir.y, 0.3), 0.55);
    const hz = Math.hypot(dir.x, dir.z) || 1;
    const hs = Math.sqrt(1 - dir.y * dir.y) / hz;
    dir.x *= hs; dir.z *= hs;
    return { pos: at.clone().addScaledVector(dir, 2.1), target: at };
  }
  function open(s) {
    if (fly) return;
    const here = (location.hash.replace('#', '') || 'home') === s.id;
    if (reduceMotion.matches) { if (!here) location.hash = '#' + s.id; return; }
    setHover(null);
    const pose = zoomPose(s, camera.position);
    if (here) {
      // the section is this page (the patient → Home): look closer, then settle back
      flyTo(pose.pos, pose.target, 720, () => setTimeout(() => { if (!fly) flyHome(900); }, 650));
      return;
    }
    // fly the camera to the part first, then open its section
    zoomed = true;
    flyTo(pose.pos, pose.target, 720, () => {
      // the exact frame the visitor is looking at becomes the section's thumbnail,
      // so the view transition morphs it into place without a visible cut
      render();
      const img = document.querySelector('.station-card[data-station="' + s.id + '"] .station-thumb');
      const go = () => { location.hash = '#' + s.id; };
      if (!img) { go(); return; }
      try {
        thumbCtx.clearRect(0, 0, THUMB_W, THUMB_H);
        const cw = renderer.domElement.width, chh = renderer.domElement.height;
        const scale = Math.max(THUMB_W / cw, THUMB_H / chh);
        const dw = cw * scale, dh = chh * scale;
        thumbCtx.drawImage(renderer.domElement, (THUMB_W - dw) / 2, (THUMB_H - dh) / 2, dw, dh);
        img.src = thumbCanvas.toDataURL('image/png');
        img.hidden = false;
        img.closest('.station-card').classList.add('has-thumb');
        (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(go);
      } catch (err) { go(); }
    });
  }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pointerDirty = false, pointerOnCanvas = false, pressed = null, pressAt = null;
  const toNDC = (e) => {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
  };
  const pick = () => {
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickables, false);
    return hits.length ? hits[0].object.userData.station : null;
  };
  renderer.domElement.addEventListener('pointermove', (e) => { toNDC(e); pointerDirty = true; pointerOnCanvas = true; });
  renderer.domElement.addEventListener('pointerleave', () => { pointerOnCanvas = false; setHover(null); });
  renderer.domElement.addEventListener('pointerdown', (e) => { toNDC(e); pressed = pick(); pressAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!pressAt) return;
    const moved = Math.hypot(e.clientX - pressAt[0], e.clientY - pressAt[1]);
    if (moved < 6 && pressed) open(pressed);
    pressed = null; pressAt = null;
  });

  // ---------- Events ----------
  const PHOTON_SPEED = 1.7;
  const FLASH_MS = 700, LOR_MS = 1000;
  const IDLE_GAP = [550, 950], HOVER_GAP = [220, 380], HOT_GAP = [90, 160];
  const rand = (a, b) => a + Math.random() * (b - a);
  const photonGeo = new THREE.SphereGeometry(0.028, 12, 10);
  const pulseGeo = new THREE.SphereGeometry(0.026, 10, 8);
  const glowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 64;
    const g = cv.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,0.45)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  })();
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.9 });
  const lorGeo = new THREE.CylinderGeometry(0.007, 0.007, 1, 6, 1, true);
  const makeLOR = (a, b) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pal.teal), transparent: true, opacity: 0.85, depthWrite: false });
    const m = new THREE.Mesh(lorGeo, mat);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    m.position.copy(mid);
    m.scale.set(1, dir.length(), 1);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  };
  let photons = [], lors = [], pulses = [];
  let nextEventAt = 0, hovering = false;

  function spawnEvent(now) {
    const o = new THREE.Vector3(rand(-0.08, 0.08), HEAD.y + rand(-0.08, 0.08), HEAD.z + rand(-0.06, 0.06));
    const ang = Math.random() * Math.PI * 2;
    const tilt = rand(-0.15, 0.15);
    const d = new THREE.Vector3(Math.cos(ang), Math.sin(ang), tilt).normalize();
    const ev = { hits: [], origin: o };
    [d, d.clone().negate()].forEach(dir => {
      const m = new THREE.Mesh(photonGeo, M.photon);
      const glow = new THREE.Sprite(glowMat);
      glow.scale.set(0.16, 0.16, 1);
      m.add(glow);
      m.position.copy(o);
      scene.add(m);
      photons.push({ mesh: m, dir, ev, born: now });
    });
    plotCount(o);
  }

  function step(now, dt) {
    if (now >= nextEventAt) {
      spawnEvent(now);
      const gap = hovered === STATIONS[1] ? HOT_GAP : hovering ? HOVER_GAP : IDLE_GAP;
      nextEventAt = now + rand(gap[0], gap[1]);
    }
    const keep = [];
    for (const p of photons) {
      p.mesh.position.addScaledVector(p.dir, PHOTON_SPEED * dt / 1000);
      const dx = p.mesh.position.x, dy = p.mesh.position.y - gantry.position.y;
      const r = Math.hypot(dx, dy);
      if (r >= RING_R - 0.08) {
        const a = Math.atan2(dy, dx);
        const idx = ((Math.round(a / (Math.PI * 2) * N_BLOCKS) % N_BLOCKS) + N_BLOCKS) % N_BLOCKS;
        blockFlash[idx] = now;
        p.ev.hits.push(p.mesh.position.clone());
        scene.remove(p.mesh);
        if (p.ev.hits.length === 2) {
          const line = makeLOR(p.ev.hits[0], p.ev.hits[1]);
          scene.add(line);
          lors.push({ line, t: now });
          const pm = new THREE.Mesh(pulseGeo, M.pulse);
          scene.add(pm);
          pulses.push({ mesh: pm, t: now });
        }
      } else {
        keep.push(p);
      }
    }
    photons = keep;

    lors = lors.filter(l => {
      const k = 1 - (now - l.t) / LOR_MS;
      if (k <= 0) { scene.remove(l.line); l.line.material.dispose(); return false; }
      l.line.material.opacity = 0.85 * k * k;
      return true;
    });
    pulses = pulses.filter(p => {
      const k = (now - p.t) / 900;
      if (k >= 1) { scene.remove(p.mesh); return false; }
      p.mesh.position.copy(cableCurve.getPointAt(k));
      return true;
    });
    for (let i = 0; i < N_BLOCKS; i++) {
      const age = now - blockFlash[i];
      const k = age >= 0 && age < FLASH_MS ? 1 - age / FLASH_MS : 0;
      blockMats[i].emissiveIntensity = 3.2 * k * k;
    }
    const pulse = 0.5 + 0.5 * Math.sin(now / 420);
    const hot = STATIONS[1].hi;
    M.tracer.emissiveIntensity = 1.4 + 1.4 * pulse + 1.5 * hot;
    tracerLight.intensity = 0.6 + 1.2 * pulse + 2.0 * hot;
    leds.forEach((l, i) => {
      const on = Math.sin(now / 180 + l.userData.phase) > (i % 3 === 0 ? 0.2 : 0.7);
      l.material.emissiveIntensity = on ? 1.4 : 0.15;
    });
  }

  // hover emphasis: the part lifts, grows a little and glows
  function updateEmphasis(dt) {
    const k = Math.min(1, dt / 110);
    STATIONS.forEach(s => {
      s.hi += (s.target - s.hi) * k;
      const h = s.hi;
      if (s === STATIONS[1]) {
        tracer.scale.setScalar(1 + 1.2 * h);
      } else {
        s.group.scale.setScalar(1 + 0.05 * h);
        s.group.position.y = s.baseY + 0.05 * h;
      }
      s.glow.forEach(m => { m.emissiveIntensity = (s.glowAmt || 0.35) * h; });
    });
  }

  // ---------- Camera flights: intro fly-in, click-to-open, return home ----------
  const HOME_TARGET = controls.target.clone();
  const HOME_DIR = camera.position.clone().sub(HOME_TARGET).normalize();
  let homeDist = 6.1;
  let fly = null, zoomed = false;
  const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const homePosition = () => HOME_TARGET.clone().addScaledVector(HOME_DIR, homeDist);
  function flyTo(pos, target, dur, done) {
    fly = { p0: camera.position.clone(), p1: pos.clone(), t0: controls.target.clone(), t1: target.clone(), start: 0, dur, done };
    controls.enabled = false;
    controls.autoRotate = false;
    host.classList.add('flying');
  }
  function updateFlight(now) {
    if (!fly) return;
    if (!fly.start) fly.start = now;
    const k = easeInOut(Math.min(1, (now - fly.start) / fly.dur));
    camera.position.lerpVectors(fly.p0, fly.p1, k);
    controls.target.lerpVectors(fly.t0, fly.t1, k);
    camera.lookAt(controls.target);
    if (k >= 1) {
      const done = fly.done;
      fly = null;
      controls.enabled = true;
      controls.autoRotate = !reduceMotion.matches && !hovering;
      host.classList.remove('flying');
      if (done) done();
    }
  }
  const flyHome = (dur) => { zoomed = false; flyTo(homePosition(), HOME_TARGET, dur); };

  // ---------- Station thumbnails: the close-up of each part, for the section headers ----------
  const THUMB_W = 400, THUMB_H = 250;
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = THUMB_W; thumbCanvas.height = THUMB_H;
  const thumbCtx = thumbCanvas.getContext('2d');
  let thumbsDone = false;
  function makeThumbs() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    const savedPos = camera.position.clone(), savedTarget = controls.target.clone(), savedAspect = camera.aspect;
    renderer.setSize(THUMB_W, THUMB_H, false);
    if (composer) composer.setSize(THUMB_W, THUMB_H);
    camera.aspect = THUMB_W / THUMB_H;
    camera.updateProjectionMatrix();
    const thumbs = {};
    STATIONS.forEach(s => {
      const pose = zoomPose(s, homePosition());
      camera.position.copy(pose.pos);
      camera.lookAt(pose.target);
      if (composer) composer.render(); else renderer.render(scene, camera);
      thumbCtx.clearRect(0, 0, THUMB_W, THUMB_H);
      thumbCtx.drawImage(renderer.domElement, 0, 0, THUMB_W, THUMB_H);
      thumbs[s.id] = thumbCanvas.toDataURL('image/png');
    });
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
    camera.aspect = savedAspect;
    camera.updateProjectionMatrix();
    camera.position.copy(savedPos);
    controls.target.copy(savedTarget);
    camera.lookAt(savedTarget);
    thumbsDone = true;
    document.dispatchEvent(new CustomEvent('scenethumbs', { detail: thumbs }));
  }

  // ---------- Loop / lifecycle ----------
  let running = false, rafId = 0, lastTs = 0, booted = false;
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    homeDist = 6.1 * Math.max(1, 1.45 / camera.aspect);
    if (!zoomed && !fly) {
      const off = camera.position.clone().sub(controls.target).setLength(homeDist);
      camera.position.copy(controls.target).add(off);
    }
    renderer.setSize(w, h);
    if (composer) composer.setSize(w, h);
    labelRenderer.setSize(w, h);
    if (booted && !thumbsDone) { makeThumbs(); render(); }   // first layout after a deep link
  };
  const render = () => {
    if (composer) composer.render(); else renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(now - (lastTs || now), 50);
    lastTs = now;
    if (pointerDirty && pointerOnCanvas) { pointerDirty = false; setHover(pick()); }
    if (hovered) placeTip(hovered);
    if (!reduceMotion.matches) step(now, dt);
    updateEmphasis(dt);
    updateFlight(now);
    if (!fly) controls.update();
    render();
    rafId = requestAnimationFrame(frame);
  };
  const start = () => {
    if (zoomed && !fly) { zoomed = false; setTimeout(() => flyTo(homePosition(), HOME_TARGET, 900), 450); }   // back from a section: let the thumbnail grow into the scanner, then pull the camera back
    if (running) return; running = true; lastTs = 0; nextEventAt = performance.now() + 300; rafId = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(rafId); };

  new ResizeObserver(resize).observe(host);
  resize();
  applyPalette();
  makeThumbs();
  booted = true;
  if (!reduceMotion.matches) {
    // intro: start high and far away, settle into the home framing
    camera.position.copy(HOME_TARGET).addScaledVector(HOME_DIR, homeDist * 1.9).add(new THREE.Vector3(0.6, 1.4, 0));
    controls.target.copy(HOME_TARGET).add(new THREE.Vector3(0, 0.3, 0));
    camera.lookAt(controls.target);
    flyTo(homePosition(), HOME_TARGET, 1900);
  }
  render();
  host.classList.add('ready');
  host.hidden = false;
  const flatList = document.querySelector('.pet-map');
  if (flatList) flatList.hidden = true;

  const io = new IntersectionObserver(entries => {
    entries.forEach(en => en.isIntersecting ? start() : stop());
  }, { threshold: 0.08 });
  io.observe(host);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (host.getBoundingClientRect().height > 0) start(); });
  document.addEventListener('themechange', () => { applyPalette(); makeThumbs(); if (!running) render(); });
  host.addEventListener('pointerenter', () => { hovering = true; if (!fly) controls.autoRotate = false; });
  host.addEventListener('pointerleave', () => { hovering = false; if (!fly) controls.autoRotate = !reduceMotion.matches; });
  controls.addEventListener('change', () => { if (!running) render(); });
}
