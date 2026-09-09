/* ============================================================
   Hero figure (assets/figure.js): a small three.js scene in place of
   a portrait. The character is an illustration (assets/figure.webp,
   cut out from the generated image; figure.png is the fallback):
   Xi dressed as a bird swordsman, a nod to Kez from Dota 2 and to
   keV, the unit gamma-photon energies are quoted in. It stands as a
   lit card in the scene: it breathes, sways, leans toward the
   pointer and casts a soft contact shadow. Around it: a spiral
   galaxy turning slowly, crescent slashes that flare and fade,
   feathers drifting down, and a pair of 511 keV photons orbiting
   back to back.

   Falls back to the inline SVG avatar when WebGL or the CDN is not
   available. Exposes the head portrait (assets/portrait.jpg) as
   window.PORTRAIT_URL and the 'portrait' event for the Contact page.
   ============================================================ */
const host = document.querySelector('.figure-scene');
if (host) boot();

async function boot() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let THREE;
  try { THREE = await import('three'); } catch (err) { return; }
  const probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) return;

  // ---------- the illustration ----------
  const loader = new THREE.TextureLoader();
  const loadTex = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));
  let tex;
  try { tex = await loadTex('assets/figure.webp'); }
  catch (err) { try { tex = await loadTex('assets/figure.png'); } catch (err2) { return; } }
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const aspect = tex.image.width / tex.image.height;

  // ---------- renderer / camera ----------
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0.15, 1.75, 7.4);
  camera.lookAt(0, 1.62, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  // ---------- lights (for the shadow and the feathers) ----------
  scene.add(new THREE.HemisphereLight(0xfff3e2, 0x4a3f36, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2.2, 5, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 4.5, bottom: -1, near: 1, far: 16 });
  key.shadow.bias = -0.0006;
  key.shadow.radius = 6;
  scene.add(key);

  // ---------- the figure: a card that keeps the illustration's own lighting ----------
  const FIG_H = 3.3;
  const fig = new THREE.Group();
  scene.add(fig);
  const card = new THREE.Mesh(
    new THREE.PlaneGeometry(FIG_H * aspect, FIG_H),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.08, toneMapped: false, side: THREE.DoubleSide })
  );
  card.position.y = FIG_H / 2;
  card.castShadow = true;
  card.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.5 });
  fig.add(card);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.ShadowMaterial({ opacity: 0.28 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  // a soft back-light halo so the silhouette lifts off the dark page
  const glowTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 128;
    const g = cv.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.35, 'rgba(255,255,255,0.4)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  })();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x2fc4d9, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(3.6, 4.4, 1);
  halo.position.set(0, 1.7, -0.3);
  scene.add(halo);

  // ---------- effects ----------
  const fx = new THREE.Group();
  scene.add(fx);
  const clay = (color, extra) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.7, metalness: 0 }, extra || {}));
  const M = { feather: clay(0x2a5f6d), featherLight: clay(0x3f8a9a), beak: clay(0xf2b544) };
  const feather = (mat, len, parent) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), mat);
    f.scale.set(0.07, 0.025, len || 0.3);
    (parent || fx).add(f);
    return f;
  };

  // a spiral galaxy, seen at an angle behind him, turning slowly
  const galaxy = (() => {
    const COUNT = 7000, ARMS = 3, RADIUS = 3.6;
    const pos = new Float32Array(COUNT * 3), col = new Float32Array(COUNT * 3);
    const inner = new THREE.Color(0xffc79a), mid = new THREE.Color(0x2fc4d9), outer = new THREE.Color(0x8b7cf6);
    for (let i = 0; i < COUNT; i++) {
      const r = Math.pow(Math.random(), 1.6) * RADIUS;
      const arm = (i % ARMS) / ARMS * Math.PI * 2;
      const a = arm + r * 1.35 + (Math.random() - 0.5) * (0.12 + r * 0.12);
      const puff = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1);
      pos[i * 3] = Math.cos(a) * r + puff * 0.25;
      pos[i * 3 + 1] = puff * (0.06 + r * 0.03);
      pos[i * 3 + 2] = Math.sin(a) * r + puff * 0.25;
      const c = r < RADIUS * 0.35 ? inner.clone().lerp(mid, r / (RADIUS * 0.35)) : mid.clone().lerp(outer, (r - RADIUS * 0.35) / (RADIUS * 0.65));
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 0.075, map: glowTex, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
    const g = new THREE.Group();
    g.add(new THREE.Points(geo, mat));
    g.position.set(0.3, 1.9, -2.6);
    g.rotation.set(-1.05, 0, 0.25);
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffd9b3, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    core.scale.set(1.6, 1.6, 1);
    g.add(core);
    scene.add(g);
    return g;
  })();

  // crescent slashes that flare and fade
  const slashes = [
    { r: 1.5, pos: [1.3, 1.9, -0.6], rot: [0.3, 0.6, 0.9], t0: 0.0 },
    { r: 1.9, pos: [-1.4, 2.2, -0.9], rot: [-0.4, -0.5, -0.7], t0: 1.3 },
    { r: 1.3, pos: [0.3, 0.9, -1.1], rot: [1.2, 0.2, 0.3], t0: 2.4 }
  ].map(s => {
    const mat = new THREE.MeshBasicMaterial({ color: 0x9fe9f5, transparent: true, opacity: 0, depthWrite: false });
    const m = new THREE.Mesh(new THREE.TorusGeometry(s.r, 0.022, 8, 60, 1.3), mat);
    m.position.set(s.pos[0], s.pos[1], s.pos[2]);
    m.rotation.set(s.rot[0], s.rot[1], s.rot[2]);
    fx.add(m);
    return { mesh: m, base: s.rot[2], t0: s.t0 };
  });
  const CYCLE = 4.2;

  // feathers drifting down
  const feathers = [];
  for (let i = 0; i < 9; i++) {
    const f = feather(i % 3 ? M.feather : M.featherLight, 0.26);
    feathers.push({ mesh: f, x: (Math.random() - 0.5) * 4.2, z: -0.8 - Math.random() * 1.6, phase: Math.random() * 10, speed: 0.22 + Math.random() * 0.14, life: Math.random() });
  }

  // a pair of 511 keV photons, back to back, orbiting his chest
  const photonMat = new THREE.MeshStandardMaterial({ color: 0xffb066, emissive: 0xff8a3d, emissiveIntensity: 1.6, roughness: 0.4 });
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xff9a55, transparent: true, depthWrite: false, opacity: 0.8 });
  const photons = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), photonMat);
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(0.5, 0.5, 1);
    m.add(glow);
    fx.add(m);
    return m;
  });
  const labelTex = (() => {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96;
    const g = cv.getContext('2d');
    g.font = "600 44px 'JetBrains Mono', ui-monospace, Consolas, monospace";
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 8;
    g.fillStyle = '#ffb066'; g.fillText('511 keV', 128, 48);
    return new THREE.CanvasTexture(cv);
  })();
  labelTex.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTex, transparent: true, depthWrite: false, opacity: 0.95 }));
  label.scale.set(0.8, 0.3, 1);
  fx.add(label);
  const HEART = new THREE.Vector3(0, 1.95, 0);

  // ---------- pointer + idle ----------
  const target = { x: 0, y: 0 }, look = { x: 0, y: 0 };
  if (finePointer) {
    window.addEventListener('pointermove', (e) => {
      const r = host.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      target.x = Math.max(-1, Math.min(1, (e.clientX - cx) / 520));
      target.y = Math.max(-1, Math.min(1, (e.clientY - cy) / 420));
    }, { passive: true });
  }
  const animate = (now, dt) => {
    const t = now / 1000, k = Math.min(1, dt / 160);
    look.x += (target.x - look.x) * k;
    look.y += (target.y - look.y) * k;
    // the card leans toward the pointer, sways and breathes
    fig.rotation.y = look.x * 0.16 + Math.sin(t * 0.5) * 0.03;
    fig.rotation.x = -look.y * 0.05;
    fig.rotation.z = Math.sin(t * 0.8) * 0.012;
    fig.position.x = Math.sin(t * 0.8) * 0.04 + look.x * 0.08;
    fig.position.y = Math.abs(Math.sin(t * 1.4)) * 0.035;
    card.scale.set(1 + Math.sin(t * 1.4) * 0.006, 1 + Math.sin(t * 1.4 + 1) * 0.008, 1);
    halo.material.opacity = 0.18 + 0.06 * Math.sin(t * 1.1);
    galaxy.rotation.y += dt / 1000 * 0.06;
    galaxy.rotation.x = -1.05 + look.y * 0.06;
    slashes.forEach(s => {
      const u = ((t + s.t0) % CYCLE);
      let o = 0, sweep = 0;
      if (u < 1.4) { o = u < 0.25 ? u / 0.25 : Math.max(0, 1 - (u - 0.25) / 1.15); sweep = u * 0.9; }
      s.mesh.material.opacity = o * 0.85;
      s.mesh.rotation.z = s.base + sweep;
      s.mesh.scale.setScalar(0.85 + u * 0.25);
    });
    feathers.forEach(f => {
      f.life += dt / 1000 * f.speed / 3.6;
      if (f.life > 1) { f.life = 0; f.x = (Math.random() - 0.5) * 4.2; f.z = -0.8 - Math.random() * 1.6; }
      const y = 3.6 - f.life * 3.7;
      f.mesh.position.set(f.x + Math.sin(t * 1.1 + f.phase) * 0.35, y, f.z);
      f.mesh.rotation.set(Math.sin(t * 1.3 + f.phase) * 0.6, t * 0.6 + f.phase, Math.cos(t * 0.9 + f.phase) * 0.5);
    });
    const a = t * 0.55, R = 1.7;
    const p0 = new THREE.Vector3(HEART.x + Math.cos(a) * R, HEART.y + Math.sin(a * 0.7) * 0.45, HEART.z + Math.sin(a) * R * 0.55);
    const p1 = HEART.clone().multiplyScalar(2).sub(p0);
    photons[0].position.copy(p0);
    photons[1].position.copy(p1);
    label.position.copy(p0).add(new THREE.Vector3(p0.x > 0 ? -0.35 : 0.35, 0.32, 0));
    fx.rotation.y = look.x * 0.1;
  };

  // ---------- loop / lifecycle ----------
  let running = false, raf = 0, last = 0, visible = false;
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const render = () => renderer.render(scene, camera);
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(now - (last || now), 50);
    last = now;
    animate(now, dt);
    render();
    raf = requestAnimationFrame(frame);
  };
  const sync = () => {
    const want = visible && !document.hidden && !reduceMotion.matches;
    if (want && !running) { running = true; last = 0; raf = requestAnimationFrame(frame); }
    else if (!want && running) { running = false; cancelAnimationFrame(raf); }
  };
  new ResizeObserver(() => { resize(); if (!running) render(); }).observe(host);
  resize();
  animate(0, 0);
  render();
  host.classList.add('ready');
  window.PORTRAIT_URL = 'assets/portrait.jpg';
  document.dispatchEvent(new CustomEvent('portrait', { detail: window.PORTRAIT_URL }));
  new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); sync(); }, { threshold: 0.05 }).observe(host);
  document.addEventListener('visibilitychange', sync);
}
