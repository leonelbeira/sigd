// Espelho Raio-X — app principal
// Câmara -> MediaPipe (cara 478 pontos + mãos 21 pontos) -> anatomia 3D (Three.js) + músculos 2D + etiquetas.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';
import { FilesetResolver, FaceLandmarker, HandLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/vision_bundle.mjs';
import { CANON, MIRROR } from './canon.js';
import { LAYERS, PRESETS, PARTS, HAND_PARTS, MUSCLES, CHALLENGES, TXT } from './parts.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const BS_SWAP = false;
const DEBUG = { bs: null, tip: null, hand: null }; // usado nos testes automáticos
const ARTIFACT = !!window.ESPELHO_ARTIFACT;           // versão publicada dentro do Claude (sem câmara)
let capDownloads = null, capTTS = null;
if (window.claude && typeof window.claude.use === 'function') {
  window.claude.use('downloads').then(d => { capDownloads = d; if (ARTIFACT) $('#btnFoto').hidden = !d; }).catch(() => { });
  window.claude.use('tts').then(t => { capTTS = t; }).catch(() => { });
}
let sourceKind = null; // 'camera' | 'video' | 'image'
// onde estão o motor de IA e os modelos (a versão publicada no Claude carrega-os de um CDN)
const CFG = Object.assign({
  wasm: 'vendor/mediapipe/wasm',
  faceModel: 'models/face_landmarker.task',
  handModel: 'models/hand_landmarker.task',
}, window.ESPELHO_CFG || {});
// impressões digitais (SHA-256) dos modelos testados (iguais aos da pasta models/): só usamos ficheiros iguais a estes
const MODEL_SHA = {
  face: '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',
  hand: 'fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1',
};
async function loadModel(url, sha) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`modelo ${url}: HTTP ${r.status}`);
  const buf = new Uint8Array(await r.arrayBuffer());
  if (sha && window.crypto?.subtle) {
    const h = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buf))].map(x => x.toString(16).padStart(2, '0')).join('');
    if (h !== sha) throw new Error('o modelo descarregado não é o original');
  }
  return buf;
} // se os lados esquerdo/direito das expressões aparecerem trocados, mudar para true

// ------------------------------------------------------------------ definições
const DEFAULTS = {
  layers: { skull: true, teeth: true, spine: true, brain: false, eyes: true, muscles: false, hands: true },
  labels: true, look: 'xray', bright: 1, realMe: 0.45, anat: 1,
  reveal: 'all', lens: 0.26, feather: 0.25,
  fit: { size: 1, w: 1, h: 1, d: 1, x: 0, y: 0, z: 0 },
  sci: false, track: false, muscleHint: true, voice: true, panel: true,
};
const FIT_PRESETS = {
  adulto: { size: 1, w: 1, h: 1, d: 1, x: 0, y: 0, z: 0 },
  crianca: { size: 1.06, w: 1.02, h: 1.05, d: 1, x: 0, y: 0.5, z: 0 },
};
let S = loadSettings();
function loadSettings() {
  let s = structuredClone(DEFAULTS);
  try {
    const j = JSON.parse(localStorage.getItem('espelhoRaioX') || 'null');
    if (j) s = { ...s, ...j, layers: { ...s.layers, ...(j.layers || {}) }, fit: { ...s.fit, ...(j.fit || {}) } };
  } catch (e) { /* sem armazenamento: usa as predefinições */ }
  return s;
}
let saveTimer = 0;
function saveSettings() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { localStorage.setItem('espelhoRaioX', JSON.stringify(S)); } catch (e) { } }, 300);
}
const getPath = (o, p) => p.split('.').reduce((a, k) => a?.[k], o);
const setPath = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((a, k) => a[k], o)[last] = v; };

// ------------------------------------------------------------------ DOM
const video = $('#video'), still = $('#still'), stage = $('#stage'), stageWrap = $('#stageWrap');
const glCanvas = $('#gl'), mCanvas = $('#muscles'), tCanvas = $('#track'), lCanvas = $('#labels'), fxCanvas = $('#fx');
const mctx = mCanvas.getContext('2d'), tctx = tCanvas.getContext('2d'), lctx = lCanvas.getContext('2d'), fctx = fxCanvas.getContext('2d');
const anat = $('#anat');
const anatBg = document.createElement('div');
anatBg.id = 'anatBg';
anatBg.style.cssText = 'position:absolute;inset:0;pointer-events:none';
anat.prepend(anatBg);

let vw = 1280, vh = 720;          // resolução da fonte (px de vídeo)
let cssW = 1, cssH = 1, dpr = 1;  // tamanho do palco no ecrã
let source = null;                // elemento de vídeo/imagem activo
let running = false;

function layout() {
  const r = stageWrap.getBoundingClientRect();
  const pad = 24, aw = Math.max(50, r.width - pad), ah = Math.max(50, r.height - pad);
  const ar = vw / vh;
  let w = aw, h = aw / ar;
  if (h > ah) { h = ah; w = ah * ar; }
  cssW = Math.round(w); cssH = Math.round(h);
  stage.style.width = cssW + 'px'; stage.style.height = cssH + 'px';
  dpr = Math.min(2, window.devicePixelRatio || 1);
  for (const c of [lCanvas, fxCanvas]) { c.width = Math.round(cssW * dpr); c.height = Math.round(cssH * dpr); }
}
new ResizeObserver(layout).observe(stageWrap);

function setSourceSize(w, h) {
  vw = w; vh = h;
  for (const c of [mCanvas, tCanvas]) { c.width = vw; c.height = vh; }
  renderer.setSize(vw, vh, false);
  camera.left = 0; camera.right = vw; camera.top = 0; camera.bottom = -vh; camera.updateProjectionMatrix();
  layout();
}

// ------------------------------------------------------------------ Three.js
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(0, vw, 0, -vh, 0.1, 30000);
camera.position.z = 12000;
scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3a5a, 1.3));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(0.35, 0.7, 1).multiplyScalar(1000);
scene.add(sun);

const hex3 = h => { const c = parseInt(h.slice(1), 16); return new THREE.Vector3(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255); };
const XRAY_VS = `
varying vec3 vN; varying vec3 vW;
void main(){ vN = normalize(normalMatrix * normal); vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const XRAY_FS = `
uniform vec3 uColor; uniform float uPow, uFill, uGain, uOpacity, uTime, uNeon, uHue;
varying vec3 vN; varying vec3 vW;
vec3 hsv(float h, float s, float v){ vec3 k = clamp(abs(mod(h*6.0+vec3(0.,4.,2.),6.)-3.)-1.,0.,1.); return v*mix(vec3(1.),k,s); }
void main(){
  float f = 1.0 - abs(normalize(vN).z);
  float rim = pow(f, uPow);
  vec3 col = uColor;
  if (uNeon > 0.5) col = hsv(fract(uHue + vW.y*0.0016 + uTime*0.12), 0.75, 1.0);
  vec3 c = col * (rim * 1.25 + uFill) * uGain * uOpacity;
  c = min(c, vec3(1.0));
  gl_FragColor = vec4(c, max(c.r, max(c.g, c.b)));
}`;
// tipo -> [cor raio-X, cor osso, potência, preenchimento, matiz néon]
const KINDS = {
  bone:   ['#a8e6ff', '#efe4cc', 2.4, 0.05, 0.55],
  tooth:  ['#f4fbff', '#fbf6e6', 1.9, 0.10, 0.15],
  spine:  ['#8ff0c8', '#e8dcc2', 2.6, 0.025, 0.40],
  brain:  ['#ff8fc0', '#ee98b4', 1.7, 0.09, 0.90],
  eye:    ['#ffe066', '#fbfbf6', 2.2, 0.04, 0.12],
  iris:   ['#ffe066', '#3d8fd6', 1.0, 0.22, 0.12],
  pupil:  ['#fff5c0', '#101010', 1.0, 0.45, 0.12],
  nerve:  ['#ffd45a', '#f0d28c', 2.2, 0.05, 0.10],
  hand:   ['#d9f1ff', '#efe4cc', 2.0, 0.10, 0.60],
};
const MATS = { xray: {}, neon: {}, solid: {} };
for (const [k, [cx, cs, pw, fill, hue]] of Object.entries(KINDS)) {
  for (const look of ['xray', 'neon']) {
    const m = new THREE.ShaderMaterial({
      vertexShader: XRAY_VS, fragmentShader: XRAY_FS, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
      uniforms: { uColor: { value: hex3(cx) }, uPow: { value: pw }, uFill: { value: fill }, uGain: { value: 1 }, uOpacity: { value: 1 },
        uTime: { value: 0 }, uNeon: { value: look === 'neon' ? 1 : 0 }, uHue: { value: hue } },
    });
    MATS[look][k] = m;
  }
  const sm = new THREE.MeshStandardMaterial({ color: cs, roughness: k === 'tooth' ? 0.35 : 0.62, metalness: 0, side: THREE.FrontSide });
  if (k === 'hand') { sm.depthTest = false; }
  MATS.solid[k] = sm;
}
const allMeshes = []; // {mesh, kind, layer}
function addMesh(parent, geo, kind, layer) {
  const m = new THREE.Mesh(geo, MATS[S.look][kind]);
  m.frustumCulled = false;
  if (kind === 'hand') m.renderOrder = 10;
  parent.add(m);
  allMeshes.push({ mesh: m, kind, layer });
  return m;
}
function applyLook() {
  for (const it of allMeshes) it.mesh.material = MATS[S.look][it.kind];
  updateSolidOpacity();
}
function updateSolidOpacity() {
  for (const [k, m] of Object.entries(MATS.solid)) {
    let o = S.anat;
    if ((k === 'bone' || k === 'tooth') && S.layers.brain) o *= 0.42;
    const tr = o < 0.99;
    if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
    m.opacity = o; m.depthWrite = !tr;
  }
}

// geometrias
const GEO = {};
async function loadAnatomy() {
  const j = await (await fetch('data/anatomy.json')).json();
  const dec = b64 => { const s = atob(b64); const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u.buffer; };
  for (const [name, m] of Object.entries(j.meshes)) {
    const q = new Int16Array(dec(m.pos));
    const pos = new Float32Array(q.length);
    for (let i = 0; i < q.length; i++) pos[i] = q[i] * m.scale;
    const idx = m.idx32 ? new Uint32Array(dec(m.idx)) : new Uint16Array(dec(m.idx));
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.computeVertexNormals();
    GEO[name] = g;
  }
  GEO.eyeball = new THREE.SphereGeometry(1.15, 32, 22);
  GEO.irisRing = new THREE.TorusGeometry(0.5, 0.07, 8, 40);
  GEO.irisDisc = new THREE.CircleGeometry(0.5, 32);
  GEO.pupil = new THREE.CircleGeometry(0.22, 24);
  const prof = [[0, 0], [0.6, 0.01], [0.95, 0.05], [1, 0.1], [0.72, 0.2], [0.56, 0.35], [0.5, 0.5], [0.56, 0.65], [0.72, 0.8], [1, 0.9], [0.95, 0.95], [0.6, 0.99], [0, 1]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  GEO.bone = new THREE.LatheGeometry(prof, 12);
  GEO.carpal = new THREE.SphereGeometry(1, 14, 10);
  for (const s of [-1, 1]) {
    const c = new THREE.CatmullRomCurve3([[3.1, 1.0, 3.85], [2.3, 1.1, 2.5], [0.35, 1.2, 1.0], [1.3, 1.6, -1.2]].map(p => new THREE.Vector3(s * p[0], p[1], p[2])));
    GEO['nerve' + s] = new THREE.TubeGeometry(c, 30, 0.2, 8, false);
  }
}

const JAW_PIVOT = new THREE.Vector3(0, -0.45, -0.55);
const EYE_C = [new THREE.Vector3(-3.16, 1.03, 5.0), new THREE.Vector3(3.16, 1.03, 5.0)];
function makeHeadRig() {
  const g = new THREE.Group(); g.matrixAutoUpdate = false; g.visible = false;
  const r = { g, layer: {} };
  const L = (name) => (r.layer[name] = r.layer[name] || []);
  L('skull').push(addMesh(g, GEO.skull, 'bone', 'skull'));
  L('teeth').push(addMesh(g, GEO.teethUpper, 'tooth', 'teeth'));
  const jaw = new THREE.Group(); jaw.position.copy(JAW_PIVOT); g.add(jaw);
  const jawIn = new THREE.Group(); jawIn.position.copy(JAW_PIVOT).multiplyScalar(-1); jaw.add(jawIn);
  L('skull').push(addMesh(jawIn, GEO.mandible, 'bone', 'skull'));
  L('teeth').push(addMesh(jawIn, GEO.teethLower, 'tooth', 'teeth'));
  r.jaw = jaw;
  L('spine').push(addMesh(g, GEO.spine, 'spine', 'spine'));
  L('brain').push(addMesh(g, GEO.brain, 'brain', 'brain'));
  r.eyes = [];
  for (let i = 0; i < 2; i++) {
    const e = new THREE.Group(); e.position.copy(EYE_C[i]); g.add(e);
    L('eyes').push(addMesh(e, GEO.eyeball, 'eye', 'eyes'));
    const ring = addMesh(e, GEO.irisRing, 'iris', 'eyes'); ring.position.z = 1.035; L('eyes').push(ring);
    const disc = addMesh(e, GEO.irisDisc, 'iris', 'eyes'); disc.position.z = 1.05; L('eyes').push(disc);
    const pup = addMesh(e, GEO.pupil, 'pupil', 'eyes'); pup.position.z = 1.1; L('eyes').push(pup);
    r.eyes.push(e);
    L('eyes').push(addMesh(g, GEO['nerve' + (i ? 1 : -1)], 'nerve', 'eyes'));
  }
  scene.add(g);
  return r;
}

const HAND_BONES = [
  ['1', '2', 0.052], ['2', '3', 0.048], ['3', '4', 0.04, 0.16],
  ['b5', '5', 0.045], ['5', '6', 0.047], ['6', '7', 0.041], ['7', '8', 0.036, 0.18],
  ['b9', '9', 0.046], ['9', '10', 0.048], ['10', '11', 0.042], ['11', '12', 0.036, 0.18],
  ['b13', '13', 0.043], ['13', '14', 0.045], ['14', '15', 0.04], ['15', '16', 0.035, 0.18],
  ['b17', '17', 0.04], ['17', '18', 0.041], ['18', '19', 0.036], ['19', '20', 0.032, 0.18],
  ['rad0', 'rad1', 0.062], ['uln0', 'uln1', 0.056],
];
function makeHandRig() {
  const g = new THREE.Group(); g.visible = false; scene.add(g);
  const bones = HAND_BONES.map(() => addMesh(g, GEO.bone, 'hand', 'hands'));
  const carpals = Array.from({ length: 8 }, () => addMesh(g, GEO.carpal, 'hand', 'hands'));
  return { g, bones, carpals };
}

let headRigs = [], handRigs = [];

// ------------------------------------------------------------------ MediaPipe
let faceLM = null, handLM = null;
async function loadVision(onMsg) {
  const fileset = await FilesetResolver.forVisionTasks(CFG.wasm);
  onMsg('A preparar o laboratório… a carregar os modelos de IA');
  const [faceBuf, handBuf] = await Promise.all([loadModel(CFG.faceModel, CFG.checkSha === false ? null : MODEL_SHA.face), loadModel(CFG.handModel, CFG.checkSha === false ? null : MODEL_SHA.hand)]);
  const forceCPU = /[?&]cpu\b/.test(location.search);
  const mk = async (Cls, opts) => {
    if (forceCPU) return await Cls.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'CPU' } });
    try { return await Cls.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'GPU' } }); }
    catch (e) { console.warn('GPU indisponível, a usar CPU', e); return await Cls.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'CPU' } }); }
  };
  onMsg('A preparar o laboratório… a aprender a ver caras');
  faceLM = await mk(FaceLandmarker, {
    baseOptions: { modelAssetBuffer: faceBuf }, runningMode: 'VIDEO', numFaces: 2,
    outputFaceBlendshapes: true, minFaceDetectionConfidence: 0.5, minFacePresenceConfidence: 0.5, minTrackingConfidence: 0.5,
  });
  onMsg('A preparar o laboratório… a aprender a ver mãos');
  handLM = await mk(HandLandmarker, {
    baseOptions: { modelAssetBuffer: handBuf }, runningMode: 'VIDEO', numHands: 2,
    minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
  });
}

// ------------------------------------------------------------------ filtros de suavização (One Euro)
class OneEuro {
  constructor(n, minCutoff, beta, dCutoff = 1) { this.n = n; this.x = new Float32Array(n); this.dx = new Float32Array(n); this.t = -1; this.mc = minCutoff; this.b = beta; this.dc = dCutoff; }
  reset() { this.t = -1; }
  static a(c, dt) { const tau = 1 / (2 * Math.PI * c); return 1 / (1 + tau / dt); }
  filter(src, t) {
    const n = this.n, x = this.x, dx = this.dx;
    if (this.t < 0) { x.set(src); dx.fill(0); this.t = t; return x; }
    const dt = Math.max(1e-3, t - this.t); this.t = t;
    const ad = OneEuro.a(this.dc, dt);
    for (let i = 0; i < n; i++) {
      const d = (src[i] - x[i]) / dt;
      const e = dx[i] + ad * (d - dx[i]); dx[i] = e;
      x[i] += OneEuro.a(this.mc + this.b * Math.abs(e), dt) * (src[i] - x[i]);
    }
    return x;
  }
}

// ------------------------------------------------------------------ estado do tracking
const V = () => new THREE.Vector3();
function makeFaceSlot(i) {
  return { i, active: false, lost: 0, filt: new OneEuro(478 * 3, 1.1, 0.012), lm: null, bs: {}, kyRest: null, jawPrev: 0, chew: 0,
    pose: { C: V(), X: V(), Y: V(), Z: V(), kx: 1, ky: 1, kz: 1 }, rig: null, act: {}, faceW: 0 };
}
function makeHandSlot(i) { return { i, active: false, lost: 0, filt: new OneEuro(21 * 3, 1.6, 0.02), lm: null, rig: null, J: Array.from({ length: 21 }, V), hs: 1 }; }
const faces = [makeFaceSlot(0), makeFaceSlot(1)];
const hands = [makeHandSlot(0), makeHandSlot(1)];

function assignSlots(slots, items, keyFn, t) {
  const used = new Set(), out = [];
  for (const it of items) {
    const k = keyFn(it.raw);
    let best = -1, bd = Infinity;
    slots.forEach((s, j) => {
      if (used.has(j)) return;
      const d = s.lm && s.active ? Math.hypot(s.key[0] - k[0], s.key[1] - k[1]) : 1e6 + j;
      if (d < bd) { bd = d; best = j; }
    });
    if (best < 0) continue;
    used.add(best);
    const s = slots[best];
    if (!s.active || bd > vw * 0.35) s.filt.reset();
    s.active = true; s.lost = 0; s.key = k;
    out.push([s, it]);
  }
  slots.forEach((s, j) => { if (!used.has(j)) s.lost += 1; });
  return out;
}

const CANON_W = 15.3284, CANON_H = 17.43;
function computePose(f) {
  const lm = f.lm, p = f.pose;
  const w = (i, v) => v.set(lm[i * 3], -lm[i * 3 + 1], -lm[i * 3 + 2]);
  const a = w(234, V()), b = w(454, V()), t10 = w(10, V()), t2 = w(2, V()), t152 = w(152, V());
  p.C.addVectors(a, b).multiplyScalar(0.5);
  p.X.subVectors(b, a); const len = p.X.length(); p.X.divideScalar(len);
  p.Y.subVectors(t10, t2); p.Y.addScaledVector(p.X, -p.Y.dot(p.X)).normalize();
  p.Z.crossVectors(p.X, p.Y);
  p.kx = len / CANON_W;
  const kyInst = t10.sub(t152).dot(p.Y) / CANON_H;
  const jo = f.bs.jawOpen || 0;
  if (f.kyRest == null) f.kyRest = jo < 0.15 ? kyInst : p.kx;
  else if (jo < 0.1) f.kyRest = lerp(f.kyRest, kyInst, 0.06);
  p.ky = clamp(f.kyRest, p.kx * 0.8, p.kx * 1.25);
  p.kz = p.kx;
  f.faceW = Math.hypot(lm[454 * 3] - lm[234 * 3], lm[454 * 3 + 1] - lm[234 * 3 + 1]);
}
// ponto local (cm) -> px de vídeo, usando só a pose (sem ajuste)
function projLocal(p, x, y, z, out = [0, 0]) {
  out[0] = p.C.x + p.X.x * p.kx * x + p.Y.x * p.ky * y + p.Z.x * p.kz * z;
  out[1] = -(p.C.y + p.X.y * p.kx * x + p.Y.y * p.ky * y + p.Z.y * p.kz * z);
  return out;
}
const tmpV = V();
function projRig(rig, x, y, z, jawAngle = null) {
  tmpV.set(x, y, z);
  if (jawAngle != null) {
    tmpV.sub(JAW_PIVOT);
    const c = Math.cos(jawAngle), s = Math.sin(jawAngle), yy = tmpV.y, zz = tmpV.z;
    tmpV.y = yy * c - zz * s; tmpV.z = yy * s + zz * c;
    tmpV.add(JAW_PIVOT);
  }
  tmpV.applyMatrix4(rig.g.matrix);
  return [tmpV.x, -tmpV.y];
}
// quanto um ponto local está virado para a câmara (-1 a 1)
function facing(p, x, z) {
  const n = new THREE.Vector3(x, 0, z + 1.5).normalize();
  return p.X.z * n.x + p.Z.z * n.z;
}

function bsGet(b, base, side) { // side 'R' | 'L' (lado da pessoa)
  const s = BS_SWAP ? (side === 'R' ? 'Left' : 'Right') : (side === 'R' ? 'Right' : 'Left');
  const o = side === 'R' ? (BS_SWAP ? 'Right' : 'Left') : (BS_SWAP ? 'Left' : 'Right');
  const v = b[base + s] || 0, w = b[base + o] || 0;
  return 0.65 * v + 0.35 * (v + w) / 2;
}
function muscleActs(f) {
  const b = f.bs, A = {};
  for (const sd of ['R', 'L']) {
    A['mFrontal' + sd] = Math.max((b.browInnerUp || 0) * 0.9, bsGet(b, 'browOuterUp', sd));
    A['mCorrugador' + sd] = bsGet(b, 'browDown', sd);
    A['mOrbOlho' + sd] = Math.max(bsGet(b, 'eyeBlink', sd), bsGet(b, 'eyeSquint', sd) * 0.55);
    A['mZigomatico' + sd] = bsGet(b, 'mouthSmile', sd);
    A['mMasseter' + sd] = f.chew;
    A['mTemporal' + sd] = f.chew * 0.9;
    A['mDepressor' + sd] = clamp(bsGet(b, 'mouthFrown', sd) * 2.4, 0, 1);
  }
  A.mOrbBoca = Math.max(b.mouthPucker || 0, (b.mouthFunnel || 0) * 0.7);
  return A;
}

// ------------------------------------------------------------------ ciclo de detecção
let lastTs = 0, lastVidTime = -1, frameN = 0, detMs = 0, fps = 0, fpsT = performance.now(), fpsN = 0, handSkip = false;
let tPrev = performance.now() / 1000;

function detect(now) {
  if (!faceLM || !source) return false;
  const isVid = source.tagName === 'VIDEO';
  if (isVid) {
    if (source.readyState < 2) return false;
    if (source.currentTime === lastVidTime) return false;
    lastVidTime = source.currentTime;
  } else if (frameN % 2) { frameN++; return false; }
  let ts = Math.round(now); if (ts <= lastTs) ts = lastTs + 1; lastTs = ts;
  const t0 = performance.now();
  const t = now / 1000;
  const fr = faceLM.detectForVideo(source, ts);
  const doHands = S.layers.hands || mode !== 'explorar' || S.reveal === 'lens';
  let hr = null;
  if (doHands && !(handSkip && frameN % 2)) hr = handLM.detectForVideo(source, ts);
  detMs = lerp(detMs, performance.now() - t0, 0.1);
  handSkip = detMs > 30;
  frameN++;

  // caras
  const items = (fr.faceLandmarks || []).map((l, k) => {
    const raw = new Float32Array(478 * 3);
    for (let i = 0; i < 478; i++) { raw[i * 3] = l[i].x * vw; raw[i * 3 + 1] = l[i].y * vh; raw[i * 3 + 2] = l[i].z * vw; }
    const bs = {};
    for (const c of fr.faceBlendshapes?.[k]?.categories || []) bs[c.categoryName] = c.score;
    return { raw, bs };
  });
  for (const [f, it] of assignSlots(faces, items, r => [r[3], r[4]], t)) {
    f.lm = f.filt.filter(it.raw, t);
    for (const [k, v] of Object.entries(it.bs)) f.bs[k] = lerp(f.bs[k] ?? v, v, 0.55);
    if (DEBUG.bs) Object.assign(f.bs, DEBUG.bs);
    const dt = Math.max(0.01, t - (f.tj || t - 0.033)); f.tj = t;
    const jo = f.bs.jawOpen || 0;
    const sp = Math.abs(jo - f.jawPrev) / dt; f.jawPrev = jo;
    f.chew = lerp(f.chew, clamp(sp / 0.9, 0, 1), clamp(dt * 3, 0, 1));
    computePose(f);
    f.act = muscleActs(f);
  }
  for (const f of faces) if (f.active && f.lost > 15) { f.active = false; f.kyRest = null; }

  // mãos
  if (hr) {
    const hl = [...(hr.landmarks || [])];
    if (DEBUG.hand) hl.push(DEBUG.hand.map(([x, y, z]) => ({ x: x / vw, y: y / vh, z: z / vw })));
    const hitems = hl.map(l => {
      const raw = new Float32Array(63);
      for (let i = 0; i < 21; i++) { raw[i * 3] = l[i].x * vw; raw[i * 3 + 1] = l[i].y * vh; raw[i * 3 + 2] = l[i].z * vw; }
      return { raw };
    });
    for (const [h, it] of assignSlots(hands, hitems, r => [r[0], r[1]], t)) {
      h.lm = h.filt.filter(it.raw, t);
      for (let i = 0; i < 21; i++) h.J[i].set(h.lm[i * 3], -h.lm[i * 3 + 1], -h.lm[i * 3 + 2]);
      h.hs = h.J[0].distanceTo(h.J[9]);
    }
    for (const h of hands) if (h.active && h.lost > 8) h.active = false;
  } else if (!doHands) hands.forEach(h => (h.active = false));
  return true;
}

// ------------------------------------------------------------------ actualizar o 3D
const m4 = new THREE.Matrix4(), UP = new THREE.Vector3(0, 1, 0);
function updateHead(f) {
  const r = f.rig, p = f.pose, F = S.fit;
  const sx = p.kx * F.size * F.w, sy = p.ky * F.size * F.h, sz = p.kz * F.size * F.d;
  const tx = p.C.x + p.X.x * p.kx * F.x + p.Y.x * p.ky * F.y + p.Z.x * p.kz * F.z;
  const ty = p.C.y + p.X.y * p.kx * F.x + p.Y.y * p.ky * F.y + p.Z.y * p.kz * F.z;
  const tz = p.C.z + p.X.z * p.kx * F.x + p.Y.z * p.ky * F.y + p.Z.z * p.kz * F.z;
  r.g.matrix.set(
    p.X.x * sx, p.Y.x * sy, p.Z.x * sz, tx,
    p.X.y * sx, p.Y.y * sy, p.Z.y * sz, ty,
    p.X.z * sx, p.Y.z * sy, p.Z.z * sz, tz,
    0, 0, 0, 1);
  r.g.matrixWorldNeedsUpdate = true;
  r.jawAngle = clamp((f.bs.jawOpen || 0) * 1.1, 0, 1) * 0.42;
  r.jaw.rotation.x = r.jawAngle;
  // olhos seguem a íris (pontos 468 e 473)
  const inv = m4.copy(r.g.matrix).invert();
  for (const ii of [468, 473]) {
    const v = new THREE.Vector3(f.lm[ii * 3], -f.lm[ii * 3 + 1], -f.lm[ii * 3 + 2]).applyMatrix4(inv);
    const e = v.x < 0 ? 0 : 1;
    const d = v.sub(EYE_C[e]); d.z = Math.max(d.z, 0.6); d.normalize();
    d.x = clamp(d.x, -0.5, 0.5); d.y = clamp(d.y, -0.4, 0.4); d.normalize();
    r.eyes[e].quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
  }
  r.g.visible = true;
  for (const [layer, list] of Object.entries(r.layer)) for (const m of list) m.visible = !!S.layers[layer];
}
const hv = Array.from({ length: 8 }, V);
function handPoint(h, key, out) {
  const J = h.J;
  if (/^\d+$/.test(key)) return out.copy(J[+key]);
  if (key[0] === 'b') return out.copy(J[0]).lerp(J[+key.slice(1)], 0.24);
  const down = hv[7].subVectors(J[0], J[9]).normalize();
  const hs = h.hs;
  if (key.startsWith('rad')) { out.copy(J[0]).lerp(J[1], 0.3).addScaledVector(down, 0.12 * hs); if (key === 'rad1') out.addScaledVector(down, 1.35 * hs); return out; }
  if (key.startsWith('uln')) { out.copy(J[0]).lerp(J[17], 0.3).addScaledVector(down, 0.12 * hs); if (key === 'uln1') out.addScaledVector(down, 1.4 * hs); return out; }
  return out;
}
const hq = new THREE.Quaternion();
function updateHand(h) {
  const r = h.rig, hs = h.hs;
  r.g.visible = S.layers.hands;
  if (!S.layers.hands) return;
  HAND_BONES.forEach(([a, b, rad, endGap = 0.07], i) => {
    const A = handPoint(h, a, hv[0]), B = handPoint(h, b, hv[1]);
    const d = hv[2].subVectors(B, A); const len = d.length(); if (len < 1e-3) return; d.divideScalar(len);
    const m = r.bones[i];
    m.position.copy(A).addScaledVector(d, len * 0.07);
    m.quaternion.setFromUnitVectors(UP, d);
    const rr = rad * hs;
    m.scale.set(rr, len * (1 - 0.07 - endGap), rr);
  });
  // ossos do pulso (carpos): duas filas
  const J = h.J, ks = [5, 9, 13, 17];
  for (let k = 0; k < 4; k++) {
    const base = hv[3].copy(J[0]).lerp(J[ks[k]], 0.24);
    for (let row = 0; row < 2; row++) {
      const m = r.carpals[row * 4 + k];
      m.position.copy(J[0]).lerp(base, row ? 0.72 : 0.36);
      if (!row) m.position.lerp(J[1], 0.12);
      const s = (row ? 0.068 : 0.062) * hs;
      m.scale.set(s * 1.1, s * 0.9, s);
    }
  }
}

// ------------------------------------------------------------------ músculos (2D, por cima da cara)
// anel exterior do orbicular do olho (local, lado direito)
const ORB_OUT = (() => {
  const m = MUSCLES.find(x => x.id === 'mOrbOlho');
  return m.A.map(i => {
    const x = CANON[i * 3], y = CANON[i * 3 + 1];
    const a = Math.atan2(y - m.centro[1], x - m.centro[0]);
    const ox = m.centro[0] + m.raio[0] * Math.cos(a), oy = m.centro[1] + m.raio[1] * Math.sin(a);
    return [ox, oy, 6.0 - 0.18 * (ox - m.centro[0]) ** 2 - 0.05 * Math.max(0, oy - 1) ** 2];
  });
})();
function mPt(f, spec, side) {
  if (typeof spec === 'number') { const i = side === 'R' ? spec : MIRROR[spec]; return [f.lm[i * 3], f.lm[i * 3 + 1]]; }
  return projLocal(f.pose, side === 'R' ? spec[0] : -spec[0], spec[1], spec[2]);
}
function polyLen(P) { let L = 0; for (let i = 1; i < P.length; i++) L += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); return L; }
function resample(P, n, closed = false) {
  const Q = closed ? [...P, P[0]] : P;
  if (Q.length === 1) return Array.from({ length: n }, () => Q[0].slice());
  const seg = [0]; for (let i = 1; i < Q.length; i++) seg.push(seg[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]));
  const T = seg[seg.length - 1] || 1, out = [];
  let j = 1;
  for (let k = 0; k < n; k++) {
    const d = closed ? (k / n) * T : (k / (n - 1)) * T;
    while (j < Q.length - 1 && seg[j] < d) j++;
    const t = (d - seg[j - 1]) / ((seg[j] - seg[j - 1]) || 1);
    out.push([lerp(Q[j - 1][0], Q[j][0], t), lerp(Q[j - 1][1], Q[j][1], t)]);
  }
  return out;
}
function muscleGeom(f, m, side) {
  const p = f.pose;
  if (m.tipo === 'faixa') return { A: resample(m.A.map(s => mPt(f, s, side)), 16), B: resample(m.B.map(s => mPt(f, s, side)), 16) };
  if (m.tipo === 'leque') return { apex: mPt(f, m.A[0], side), B: resample(m.B.map(s => mPt(f, s, side)), m.fibras + 1) };
  if (m.tipo === 'fita') {
    const C = m.A.map(s => mPt(f, s, side));
    const n = 14, Cr = resample(C, n);
    const W = Array.from({ length: n }, (_, k) => { const t = k / (n - 1) * (m.w.length - 1); const i = Math.min(m.w.length - 2, Math.floor(t)); return lerp(m.w[i], m.w[i + 1], t - i) * p.kx; });
    return { C: Cr, W };
  }
  if (m.tipo === 'anel') {
    const inner = m.A.map(s => mPt(f, s, side));
    let outer;
    if (m.centro) outer = ORB_OUT.map(o => projLocal(p, side === 'R' ? o[0] : -o[0], o[1], o[2]));
    else {
      const c = inner.reduce((a, q) => [a[0] + q[0] / inner.length, a[1] + q[1] / inner.length], [0, 0]);
      const ex = [p.X.x * p.kx, -p.X.y * p.kx], ey = [p.Y.x * p.ky, -p.Y.y * p.ky];
      const det = ex[0] * ey[1] - ex[1] * ey[0] || 1;
      outer = inner.map(q => {
        const dx = q[0] - c[0], dy = q[1] - c[1];
        const u = (dx * ey[1] - dy * ey[0]) / det, v = (ex[0] * dy - ex[1] * dx) / det;
        const su = u * m.escala[0] + Math.sign(u) * 0.25, sv = v * m.escala[1] + Math.sign(v) * 0.45;
        return [c[0] + ex[0] * su + ey[0] * sv, c[1] + ex[1] * su + ey[1] * sv];
      });
    }
    return { inner: resample(inner, 32, true), outer: resample(outer, 32, true) };
  }
}
function centroidOf(g) {
  const pts = g.A ? [...g.A, ...g.B] : g.apex ? [g.apex, ...g.B, g.apex, g.apex] : g.C ? g.C : [...g.inner, ...g.outer];
  return pts.reduce((a, q) => [a[0] + q[0] / pts.length, a[1] + q[1] / pts.length], [0, 0]);
}
const MUSCLE_ORDER = ['mTemporal', 'mMasseter', 'mFrontal', 'mCorrugador', 'mOrbOlho', 'mZigomatico', 'mDepressor', 'mOrbBoca'];
const M_LOCAL_C = {}; // centróide local aproximado (para saber se está virado para a câmara)
for (const m of MUSCLES) {
  const pts = [...(m.A || []), ...(m.B || [])].map(s => typeof s === 'number' ? [CANON[s * 3], CANON[s * 3 + 1], CANON[s * 3 + 2]] : s);
  M_LOCAL_C[m.id] = pts.reduce((a, q) => [a[0] + q[0] / pts.length, a[1] + q[1] / pts.length, a[2] + q[2] / pts.length], [0, 0, 0]);
}
function path(ctx, pts, closed) { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); if (closed) ctx.closePath(); }

function drawMuscles(f, time, only = null) {
  const ctx = mctx, p = f.pose;
  f.mgeo = {};
  const lw = Math.max(1, p.kx * 0.09);
  for (const id of MUSCLE_ORDER) {
    if (only && !only.includes(id)) continue;
    const m = MUSCLES.find(x => x.id === id);
    for (const side of m.par ? ['R', 'L'] : ['C']) {
      const c = M_LOCAL_C[id];
      const sx = side === 'L' ? -c[0] : c[0];
      const fc = m.par ? facing(p, sx, c[2]) : 1;
      if (fc < -0.2) continue;
      const g = muscleGeom(f, m, side === 'C' ? 'R' : side);
      f.mgeo[id + side] = { g, fc, c: centroidOf(g) };
      const a = clamp(side === 'C' ? f.act[id] || 0 : f.act[id + side] || 0, 0, 1);
      const sel = selected && selected.id === id;
      const vis = clamp((fc + 0.2) / 0.5, 0, 1);
      let fill, fib, edge;
      const op = S.anat * vis;
      if (S.look === 'solid') {
        fill = `rgba(${190 + 40 * a},${38 + 30 * a},${50},${0.78 * op})`; fib = `rgba(255,190,190,${0.35 * op})`; edge = `rgba(80,0,12,${0.6 * op})`;
      } else if (S.look === 'neon') {
        const h = (time * 50 + MUSCLE_ORDER.indexOf(id) * 45) % 360;
        fill = `hsla(${h},100%,60%,${(0.12 + 0.3 * a) * op})`; fib = `hsla(${h},100%,72%,${(0.55 + 0.4 * a) * op})`; edge = `hsla(${h},100%,75%,${0.7 * op})`;
      } else {
        fill = `rgba(255,70,95,${(0.14 + 0.32 * a) * op * S.bright})`; fib = `rgba(255,135,150,${(0.42 + 0.5 * a) * op * Math.min(1.4, S.bright)})`; edge = `rgba(255,120,140,${0.55 * op})`;
      }
      ctx.save();
      ctx.globalCompositeOperation = S.look === 'solid' ? 'source-over' : 'lighter';
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      // forma
      ctx.beginPath();
      if (g.A) { path(ctx, [...g.A, ...g.B.slice().reverse()], true); }
      else if (g.apex) { path(ctx, [g.apex, ...g.B], true); }
      else if (g.C) {
        const Lft = [], Rgt = [];
        g.C.forEach((q, k) => { const n = normalAt(g.C, k); Lft.push([q[0] + n[0] * g.W[k] / 2, q[1] + n[1] * g.W[k] / 2]); Rgt.push([q[0] - n[0] * g.W[k] / 2, q[1] - n[1] * g.W[k] / 2]); });
        g.edges = [Lft, Rgt];
        path(ctx, [...Lft, ...Rgt.reverse()], true);
      } else { path(ctx, g.outer, true); path(ctx, g.inner.slice().reverse(), true); }
      ctx.fillStyle = fill; ctx.fill('evenodd');
      // fibras
      ctx.strokeStyle = fib; ctx.lineWidth = lw;
      ctx.beginPath();
      if (g.A) for (let k = 0; k < m.fibras; k++) { const t = (k + 0.5) / m.fibras; const i = t * (g.A.length - 1), i0 = Math.floor(i), tt = i - i0, i1 = Math.min(i0 + 1, g.A.length - 1);
        const a0 = [lerp(g.A[i0][0], g.A[i1][0], tt), lerp(g.A[i0][1], g.A[i1][1], tt)], b0 = [lerp(g.B[i0][0], g.B[i1][0], tt), lerp(g.B[i0][1], g.B[i1][1], tt)];
        ctx.moveTo(lerp(a0[0], b0[0], 0.04), lerp(a0[1], b0[1], 0.04)); ctx.lineTo(lerp(a0[0], b0[0], 0.96), lerp(a0[1], b0[1], 0.96)); }
      else if (g.apex) for (const q of g.B) { ctx.moveTo(lerp(g.apex[0], q[0], 0.06), lerp(g.apex[1], q[1], 0.06)); ctx.lineTo(lerp(g.apex[0], q[0], 0.95), lerp(g.apex[1], q[1], 0.95)); }
      else if (g.C) for (let k = 0; k < m.fibras; k++) { const u = (k + 0.5) / m.fibras * 2 - 1; const pts = g.C.map((q, i) => { const n = normalAt(g.C, i); return [q[0] + n[0] * g.W[i] / 2 * u * 0.85, q[1] + n[1] * g.W[i] / 2 * u * 0.85]; }); path(ctx, pts, false); }
      else for (let k = 1; k <= m.fibras; k++) { const t = k / (m.fibras + 1); path(ctx, g.inner.map((q, i) => [lerp(q[0], g.outer[i][0], t), lerp(q[1], g.outer[i][1], t)]), true); }
      ctx.stroke();
      // contorno + brilho quando está a trabalhar (ou seleccionado)
      const glow = Math.max(a > 0.45 ? a : 0, sel ? 0.8 : 0);
      ctx.beginPath();
      if (g.A) path(ctx, [...g.A, ...g.B.slice().reverse()], true);
      else if (g.apex) path(ctx, [g.apex, ...g.B], true);
      else if (g.edges) path(ctx, [...g.edges[0], ...g.edges[1]], true);
      else { path(ctx, g.outer, true); path(ctx, g.inner, true); }
      if (glow > 0) { ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 16 * glow * (vw / 1280) * 2; ctx.strokeStyle = `rgba(255,209,102,${0.5 + 0.5 * glow})`; ctx.lineWidth = lw * 1.6; }
      else { ctx.strokeStyle = edge; ctx.lineWidth = lw * 0.8; }
      ctx.stroke();
      ctx.restore();
    }
  }
}
function normalAt(C, k) {
  const a = C[Math.max(0, k - 1)], b = C[Math.min(C.length - 1, k + 1)];
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return [-dy / l, dx / l];
}

// ------------------------------------------------------------------ revelar (lupa / meia cara)
let lensPos = null, pointer = null;
function revealState(f0) {
  const st = { mode: S.reveal };
  if (S.reveal === 'lens') {
    let target = null;
    const h = hands.find(h => h.active);
    if (h) target = [h.lm[8 * 3], h.lm[8 * 3 + 1]];
    else if (pointer) target = pointer;
    else if (f0) target = [f0.lm[168 * 3], f0.lm[168 * 3 + 1]];
    else target = [vw / 2, vh / 2];
    lensPos = lensPos ? [lerp(lensPos[0], target[0], 0.35), lerp(lensPos[1], target[1], 0.35)] : target;
    st.c = lensPos; st.r = S.lens * Math.min(vw, vh); st.r0 = st.r * (1 - S.feather);
  } else if (S.reveal === 'half') {
    if (f0) {
      const p = f0.pose;
      let nx = -p.X.x, ny = p.X.y; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      st.p = [f0.lm[168 * 3], f0.lm[168 * 3 + 1]]; st.n = [nx, ny];
    } else { st.p = [vw / 2, vh / 2]; st.n = [-1, 0]; }
    st.fw = Math.max(2, S.feather * 0.25 * Math.min(vw, vh));
  }
  return st;
}
function inReveal(st, x, y) {
  if (st.mode === 'lens') return Math.hypot(x - st.c[0], y - st.c[1]) < st.r;
  if (st.mode === 'half') return (x - st.p[0]) * st.n[0] + (y - st.p[1]) * st.n[1] > 0;
  return true;
}
let lastMaskCss = '';
function applyMaskCss(st) {
  const k = cssW / vw; let css = 'none';
  if (st.mode === 'lens') {
    css = `radial-gradient(circle at ${(st.c[0] * k).toFixed(1)}px ${(st.c[1] * k).toFixed(1)}px, #000 ${(st.r0 * k).toFixed(1)}px, transparent ${(st.r * k).toFixed(1)}px)`;
  } else if (st.mode === 'half') {
    const [nx, ny] = st.n;
    const ang = Math.atan2(nx, -ny);
    const Lg = Math.abs(cssW * Math.sin(ang)) + Math.abs(cssH * Math.cos(ang));
    const d0 = ((st.p[0] * k - cssW / 2) * nx + (st.p[1] * k - cssH / 2) * ny);
    const pc = 50 + 100 * d0 / Lg, fw = 100 * st.fw * k / Lg;
    css = `linear-gradient(${(ang * 180 / Math.PI).toFixed(1)}deg, transparent ${(pc - fw).toFixed(2)}%, #000 ${(pc + fw).toFixed(2)}%)`;
  }
  if (css !== lastMaskCss) { anat.style.webkitMaskImage = css; anat.style.maskImage = css; lastMaskCss = css; }
}
function backdropFilter() {
  const rm = S.realMe;
  if (S.look === 'xray') return { f: `grayscale(1) brightness(${(0.1 + 0.9 * rm).toFixed(2)}) contrast(1.1)`, tint: `rgba(30,110,190,${(0.28 * (1 - rm * 0.6)).toFixed(2)})` };
  if (S.look === 'neon') return { f: `grayscale(1) brightness(${(0.05 + 0.7 * rm).toFixed(2)})`, tint: 'rgba(40,0,70,0.18)' };
  return { f: `brightness(${(0.4 + 0.6 * rm).toFixed(2)})`, tint: 'rgba(0,0,0,0)' };
}
let lastBd = '';
function applyBackdrop() {
  const b = backdropFilter(); const key = b.f + b.tint;
  if (key === lastBd) return; lastBd = key;
  anatBg.style.backdropFilter = b.f; anatBg.style.webkitBackdropFilter = b.f; anatBg.style.background = b.tint;
}

// ------------------------------------------------------------------ alvos (etiquetas, toque, cliques)
function collectTargets(f, opts = {}) {
  const out = [];
  if (!f || !f.active) return out;
  const r = f.rig, p = f.pose;
  for (const part of PARTS) {
    if (!opts.all && !S.layers[part.layer]) continue;
    const sides = part.par ? [1, -1] : [1];
    for (const s of sides) {
      const lx = part.a[0] * s;
      const fc = part.par ? facing(p, lx, part.a[2]) : 1;
      if (fc < -0.1) continue;
      const [x, y] = projRig(r, lx, part.a[1], part.a[2], part.jaw ? r.jawAngle : null);
      out.push({ kind: 'part', item: part, id: part.id, x, y, fc, layer: part.layer, side: s });
    }
    if (opts.touch && part.toque) for (const t of part.toque) {
      const [x, y] = projRig(r, t[0], t[1], t[2], part.jaw ? r.jawAngle : null);
      out.push({ kind: 'part', item: part, id: part.id, x, y, fc: 1, layer: part.layer, extra: true });
    }
  }
  if ((S.layers.muscles || opts.all) && f.mgeo) {
    for (const m of MUSCLES) for (const sd of ['R', 'L', 'C']) {
      const g = f.mgeo[m.id + sd]; if (!g) continue;
      out.push({ kind: 'muscle', item: m, id: m.id, x: g.c[0], y: g.c[1], fc: g.fc, layer: 'muscles' });
    }
  }
  return out;
}
function handTargets() {
  const out = [];
  const h = hands.find(h => h.active);
  if (!h || !S.layers.hands) return out;
  const J = h.J, P = (v) => [v.x, -v.y];
  const mid = (a, b) => [(a.x + b.x) / 2, -(a.y + b.y) / 2];
  out.push({ kind: 'hand', item: HAND_PARTS[0], id: 'falanges', ...xy(mid(J[10], J[11])) });
  out.push({ kind: 'hand', item: HAND_PARTS[1], id: 'metacarpos', ...xy(P(hv[4].copy(J[0]).lerp(J[13], 0.62))) });
  out.push({ kind: 'hand', item: HAND_PARTS[2], id: 'carpos', ...xy(P(hv[5].copy(J[0]).lerp(J[9], 0.14))) });
  out.push({ kind: 'hand', item: HAND_PARTS[3], id: 'antebraco', ...xy(P(handPoint(h, 'rad0', hv[6]).lerp(handPoint(h, 'rad1', V()), 0.35))) });
  return out.filter(t => t.x > 0 && t.x < vw && t.y > 0 && t.y < vh);
}
const xy = a => ({ x: a[0], y: a[1], fc: 1, layer: 'hands' });

function primaryFace() {
  let best = null;
  for (const f of faces) if (f.active && f.lm && (!best || f.faceW > best.faceW)) best = f;
  return best;
}

// ------------------------------------------------------------------ etiquetas
function labelText(t) {
  const it = t.item;
  if (S.sci) return it.cient && it.cient !== it.nome ? `${it.nome} · ${it.cient}` : it.nome;
  return it.nome;
}
function drawLabels(f, st) {
  const ctx = lctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, lCanvas.width, lCanvas.height);
  if (!S.labels || !f) return;
  const sc = lCanvas.width / vw; ctx.setTransform(sc, 0, 0, sc, 0, 0);
  let T = [...collectTargets(f), ...handTargets()].filter(t => !t.extra);
  // um rótulo por parte: o lado mais virado para a câmara
  const best = new Map();
  for (const t of T) { const k = t.kind + t.id; if (!best.has(k) || best.get(k).fc < t.fc) best.set(k, t); }
  T = [...best.values()].filter(t => inReveal(st, t.x, t.y));
  if (!T.length) return;
  const u = vw / cssW;              // 1 px de ecrã em px de vídeo
  const dens = T.length > 14 ? 0.84 : 1;
  const fs = 15 * u * dens, padX = 9 * u * dens, h = 26 * u * dens, gap = 4 * u * dens;
  ctx.font = `600 ${fs}px Fredoka, "Segoe UI", sans-serif`; ctx.textBaseline = 'middle';
  const fx = vw - f.lm[168 * 3];    // centro da cara no ecrã (espelhado)
  const half = f.faceW * 0.62 + 30 * u;
  const cols = { L: [], R: [] };
  for (const t of T) { t.dx = vw - t.x; t.dy = t.y; (t.dx < fx ? cols.L : cols.R).push(t); }
  for (const [side, list] of Object.entries(cols)) {
    list.sort((a, b) => a.dy - b.dy);
    let y = -Infinity;
    for (const t of list) { t.ly = Math.max(t.dy, y + h + gap); y = t.ly; }
    const over = y + h / 2 - (vh - 6 * u);
    if (over > 0) for (const t of list) t.ly -= over;
    for (let i = 1; i < list.length; i++) if (list[i].ly < list[i - 1].ly + h + gap) list[i].ly = list[i - 1].ly + h + gap;
    for (const t of list) {
      const txt = labelText(t); const tw = ctx.measureText(txt).width + padX * 2 + 14 * u;
      let lx = side === 'L' ? fx - half - tw : fx + half;
      lx = clamp(lx, 6 * u, vw - tw - 6 * u);
      const col = LAYERS[t.layer].cor;
      const sel = selected && selected.id === t.id;
      const ex = side === 'L' ? lx + tw : lx;
      ctx.strokeStyle = col; ctx.globalAlpha = 0.75; ctx.lineWidth = 1.4 * u;
      ctx.beginPath(); ctx.moveTo(t.dx, t.dy); ctx.lineTo(lerp(t.dx, ex, 0.55), t.ly); ctx.lineTo(ex, t.ly); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(t.dx, t.dy, 3.6 * u, 0, 7); ctx.fill();
      ctx.fillStyle = sel ? 'rgba(60,44,0,0.92)' : 'rgba(6,14,30,0.78)';
      roundRect(ctx, lx, t.ly - h / 2, tw, h, h / 2); ctx.fill();
      ctx.lineWidth = (sel ? 2.4 : 1.2) * u; ctx.strokeStyle = sel ? '#ffd166' : col; ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx + padX + 4 * u, t.ly, 4 * u, 0, 7); ctx.fill();
      ctx.fillStyle = '#f2fbff'; ctx.fillText(txt, lx + padX + 13 * u, t.ly + 1 * u);
      t.box = [lx, t.ly - h / 2, tw, h];
    }
  }
  lastLabels = T;
}
let lastLabels = [];
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

// ------------------------------------------------------------------ pontos de tracking
const HAND_LINKS = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];
function drawTracking() {
  tctx.clearRect(0, 0, vw, vh);
  if (!S.track) return;
  const r = Math.max(1, vw / 900);
  tctx.fillStyle = 'rgba(111,227,255,0.85)';
  for (const f of faces) if (f.active && f.lm) for (let i = 0; i < 478; i++) tctx.fillRect(f.lm[i * 3] - r / 2, f.lm[i * 3 + 1] - r / 2, r, r);
  tctx.strokeStyle = 'rgba(255,209,102,0.9)'; tctx.fillStyle = '#ffd166'; tctx.lineWidth = r * 1.5;
  for (const h of hands) if (h.active && h.lm) {
    tctx.beginPath(); for (const [a, b] of HAND_LINKS) { tctx.moveTo(h.lm[a * 3], h.lm[a * 3 + 1]); tctx.lineTo(h.lm[b * 3], h.lm[b * 3 + 1]); } tctx.stroke();
    for (let i = 0; i < 21; i++) { tctx.beginPath(); tctx.arc(h.lm[i * 3], h.lm[i * 3 + 1], r * 2.2, 0, 7); tctx.fill(); }
  }
}

// ------------------------------------------------------------------ voz, sons, cartões
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => /pt[-_]PT/i.test(v.lang)) || vs.find(v => /pt[-_]MZ/i.test(v.lang)) || vs.find(v => /^pt/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (!S.voice) return;
  const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim();
  const hasSynth = 'speechSynthesis' in window;
  if ((!hasSynth || !voice) && capTTS) { capTTS.speak(clean, { language: 'pt-BR', rate: 0.95 }).catch(() => { }); return; }
  if (!hasSynth) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = voice?.lang || 'pt-PT'; if (voice) u.voice = voice; u.rate = 0.95; u.pitch = 1.1;
    speechSynthesis.speak(u);
  } catch (e) { }
}
function stopSpeech() { try { window.speechSynthesis?.cancel(); } catch (e) { } try { capTTS?.stop(); } catch (e) { } }
let audio = null;
function tone(seq, dur = 0.11, type = 'triangle', gain = 0.12) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    let t = audio.currentTime;
    for (const fq of seq) {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.value = fq; g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.6);
      o.connect(g).connect(audio.destination); o.start(t); o.stop(t + dur * 1.7); t += dur;
    }
  } catch (e) { }
}
const sndOk = () => tone([523, 659, 784, 1047], 0.09);
const sndTick = () => tone([880], 0.05, 'sine', 0.06);

let selected = null, cardTimer = 0;
function showCard(t, say = true) {
  const it = t.item;
  selected = { id: t.id, kind: t.kind, until: performance.now() + 6000 };
  $('#card .c-emoji').textContent = it.emoji || '✨';
  $('#card .c-title').textContent = it.nome;
  $('#card .c-sci').textContent = it.cient && it.cient !== it.nome ? it.cient : '';
  $('#card .c-text').textContent = it.facto;
  $('#card').hidden = false;
  $('#card').style.animation = 'none'; void $('#card').offsetWidth; $('#card').style.animation = '';
  if (say) speak(`${it.nome}. ${it.facto}`);
  clearTimeout(cardTimer);
  cardTimer = setTimeout(() => { $('#card').hidden = true; }, 22000);
  sndTick();
}
$('#card .c-close').onclick = () => { $('#card').hidden = true; selected = null; stopSpeech(); };
$('#card .c-say').onclick = () => { const t = $('#card .c-title').textContent; speak(`${t}. ${$('#card .c-text').textContent}`); };
let toastTimer = 0;
function toast(msg, ms = 2600) { const el = $('#toast'); el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (el.hidden = true), ms); }

// confetti e efeitos (no canvas fx, coordenadas de ecrã espelhado em px de vídeo)
let parts = [];
function confetti(x, y, n = 90) {
  const cols = ['#ffd166', '#6fe3ff', '#ff8fc0', '#8ff0c8', '#ffffff'];
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = (0.3 + Math.random()) * vw * 0.6; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - vw * 0.3, life: 1.6 + Math.random(), c: cols[i % cols.length], r: (3 + Math.random() * 5) * vw / 1280, rot: Math.random() * 6 }); }
}

// ------------------------------------------------------------------ modos: explorar / tocar / desafio
let mode = 'explorar';
const dwell = { id: null, t: 0, last: null, lastAt: 0 };
let ch = null;

function setMode(m) {
  mode = m;
  $$('.modes button').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
  $('#prompt').hidden = true; ch = null; dwell.id = null;
  $('#card').hidden = true; selected = null;
  if (m === 'tocar') {
    S.layers.hands = true; refreshUI();
    promptShow('👆', TXT.tocaIntro, '', null);
    speak(TXT.tocaIntro);
    setTimeout(() => { if (mode === 'tocar' && !ch) $('#prompt').hidden = true; }, 5000);
  }
  if (m === 'desafio') {
    S.layers.skull = true; S.layers.hands = true; refreshUI();
    if (sourceKind === 'image') {
      promptShow('🎥', 'O Desafio precisa de movimento: usa a câmara ou um vídeo.', '', null);
      return;
    }
    const extra = sourceKind === 'video' ? ' Num vídeo gravado só passa se lá estiverem as caretas certas!' : '';
    promptShow('⭐', `Desafio! ${TXT.desafioIntro}${extra}`, '', 'Começar ▶', startChallenge);
    speak(`Desafio! ${TXT.desafioIntro}`);
  }
}
function promptShow(emoji, text, stars, btn, onBtn, cls = '') {
  const p = $('#prompt');
  p.hidden = false; p.className = cls;
  p.querySelector('.p-emoji').textContent = emoji;
  p.querySelector('.p-text').textContent = text;
  p.querySelector('.p-stars').textContent = stars;
  const b = p.querySelector('.p-btn');
  b.hidden = !btn; if (btn) { b.textContent = btn; b.onclick = onBtn; }
  p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop');
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function startChallenge() {
  const face = shuffle(CHALLENGES.filter(c => c.tipo === 'cara')).slice(0, 4);
  const touch = shuffle(CHALLENGES.filter(c => c.tipo === 'toque')).slice(0, 4);
  const list = []; for (let i = 0; i < 4; i++) list.push(face[i], touch[i]);
  ch = { list, i: -1, stars: 0, phase: 'next', t: 0, hold: 0 };
  nextRound();
}
function starsStr() { return '⭐'.repeat(ch.stars) + '☆'.repeat(ch.list.length - ch.stars); }
function nextRound() {
  ch.i++; ch.hold = 0; ch.t = performance.now();
  if (ch.i >= ch.list.length) {
    ch.phase = 'end';
    const msg = ch.stars === ch.list.length ? `Incrível! Fizeste tudo! ${ch.stars} estrelas!` : `Fizeste ${ch.stars} de ${ch.list.length}! Muito bem!`;
    promptShow('🏆', msg, starsStr(), 'Jogar outra vez', startChallenge, 'ok');
    speak(msg); confetti(vw / 2, vh * 0.35, 160); sndOk();
    return;
  }
  ch.phase = 'ask';
  const c = ch.list[ch.i];
  promptShow(c.emoji, c.pede, starsStr(), null);
  speak(c.pede);
}
function roundOk(x, y) {
  const c = ch.list[ch.i];
  ch.phase = 'ok'; ch.stars++; ch.t = performance.now();
  promptShow('🎉', c.ok, starsStr(), null, null, 'ok');
  speak(c.ok); sndOk(); confetti(x ?? vw / 2, y ?? vh * 0.3);
  const it = [...PARTS, ...MUSCLES].find(p => p.id === c.alvo);
  if (it) selected = { id: it.id, until: performance.now() + 3500 };
}
function fingerTips() {
  if (DEBUG.tip) return [DEBUG.tip];
  return hands.filter(h => h.active && h.lm).map(h => [h.lm[8 * 3], h.lm[8 * 3 + 1]]);
}
function nearestTarget(tips, targets, radius) {
  let best = null, bd = radius;
  for (const tip of tips) for (const t of targets) {
    const d = Math.hypot(tip[0] - t.x, tip[1] - t.y);
    if (d < bd) { bd = d; best = { t, tip, d }; }
  }
  return best;
}
let noHandSince = 0;
function updateInteraction(f0, dt, now) {
  const tips = fingerTips();
  if (!tips.length) { if (!noHandSince) noHandSince = now; } else noHandSince = 0;
  const R = f0 ? f0.faceW * 0.13 : vw * 0.05;
  fxDraw.tips = tips; fxDraw.progress = null; fxDraw.hintAt = null;

  if (mode === 'tocar' && f0) {
    const targets = [...collectTargets(f0, { touch: true })];
    const hit = nearestTarget(tips, targets, R);
    if (hit) {
      if (dwell.id === hit.t.id + hit.t.kind) dwell.t += dt; else { dwell.id = hit.t.id + hit.t.kind; dwell.t = 0; }
      const recent = dwell.last === dwell.id && now - dwell.lastAt < 4000;
      if (!recent) {
        fxDraw.progress = { x: hit.tip[0], y: hit.tip[1], p: clamp(dwell.t / 0.55, 0, 1) };
        if (dwell.t > 0.55) { showCard(hit.t); dwell.last = dwell.id; dwell.lastAt = now; }
      }
    } else { dwell.id = null; dwell.t = 0; if (dwell.last && now - dwell.lastAt > 1200) dwell.last = null; }
  }

  if (mode === 'desafio' && ch) {
    const c = ch.list[ch.i];
    const el = (now - ch.t) / 1000;
    if (ch.phase === 'ask' && c) {
      if (c.tipo === 'cara' && f0) {
        const ok = c.teste(f0.bs, { mastigar: f0.chew });
        ch.hold = ok ? ch.hold + dt : Math.max(0, ch.hold - dt * 2);
        if (ch.hold > (c.alvo === 'mMasseter' ? 0.8 : 0.35)) roundOk(vw - f0.lm[1 * 3], f0.lm[1 * 3 + 1] - f0.faceW * 0.6);
      } else if (c.tipo === 'toque' && f0) {
        const targets = collectTargets(f0, { all: true, touch: true }).filter(t => t.id === c.alvo && t.kind === 'part');
        const hit = nearestTarget(tips, targets, R * 1.15);
        if (hit) { ch.hold += dt; fxDraw.progress = { x: hit.tip[0], y: hit.tip[1], p: clamp(ch.hold / 0.45, 0, 1) }; }
        else ch.hold = Math.max(0, ch.hold - dt);
        if (hit && ch.hold > 0.45) roundOk(vw - hit.tip[0], hit.tip[1]);
        if (el > 7) fxDraw.hintAt = targets;
        if (!tips.length && noHandSince && now - noHandSince > 3500) $('#hint').textContent = TXT.semMao;
      }
      if (el > 25 && ch.phase === 'ask') {
        ch.phase = 'skip'; ch.t = now;
        promptShow('🙂', 'Esta era difícil! Vamos tentar outra.', starsStr(), null);
        speak('Esta era difícil! Vamos tentar outra.');
      }
    } else if ((ch.phase === 'ok' && el > 3.2) || (ch.phase === 'skip' && el > 2.2)) nextRound();
  }

  // dica de músculo em acção (modo explorar)
  if (mode === 'explorar' && f0 && S.muscleHint && (S.layers.muscles)) {
    let top = null, tv = 0.62;
    for (const [k, v] of Object.entries(f0.act)) if (v > tv) { tv = v; top = k; }
    if (top) {
      const id = top.replace(/(.)[RL]$/, '$1');
      if (hintState.id !== id && now - hintState.at > 3500) {
        const m = MUSCLES.find(x => x.id === id);
        hintState.id = id; hintState.at = now;
        toast(`${m.emoji} Estás a usar o ${m.nome.toLowerCase()}!`);
      }
    } else if (now - hintState.at > 6000) hintState.id = null;
  }
}
const hintState = { id: null, at: 0 };
const fxDraw = { tips: [], progress: null, hintAt: null };

function drawFx(dt, st, now) {
  const ctx = fctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  const sc = fxCanvas.width / vw; ctx.setTransform(sc, 0, 0, sc, 0, 0);
  const u = vw / cssW;
  // lupa
  if (st.mode === 'lens') {
    const x = vw - st.c[0], y = st.c[1];
    ctx.strokeStyle = 'rgba(111,227,255,0.85)'; ctx.lineWidth = 3 * u; ctx.shadowColor = '#6fe3ff'; ctx.shadowBlur = 14 * u;
    ctx.beginPath(); ctx.arc(x, y, st.r * (1 - S.feather * 0.5), 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
  }
  // dedos (modos de toque)
  if (mode !== 'explorar') for (const tip of fxDraw.tips) {
    const x = vw - tip[0], y = tip[1];
    ctx.fillStyle = 'rgba(255,209,102,0.9)'; ctx.beginPath(); ctx.arc(x, y, 6 * u, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,209,102,0.5)'; ctx.lineWidth = 2 * u; ctx.beginPath(); ctx.arc(x, y, 14 * u + Math.sin(now / 180) * 2 * u, 0, 7); ctx.stroke();
  }
  if (fxDraw.progress) {
    const { x, y, p } = fxDraw.progress;
    ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 5 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(vw - x, y, 24 * u, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
  }
  if (fxDraw.hintAt) for (const t of fxDraw.hintAt) {
    const k = (now / 600) % 1;
    ctx.strokeStyle = `rgba(125,255,168,${1 - k})`; ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.arc(vw - t.x, t.y, (10 + 30 * k) * u, 0, 7); ctx.stroke();
  }
  // confetti
  parts = parts.filter(q => (q.life -= dt) > 0);
  for (const q of parts) {
    q.vy += vw * 1.2 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.985; q.rot += dt * 8;
    ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.globalAlpha = clamp(q.life, 0, 1);
    ctx.fillStyle = q.c; ctx.fillRect(-q.r, -q.r * 0.5, q.r * 2, q.r); ctx.restore();
  }
}

// ------------------------------------------------------------------ ciclo principal
let noFaceSince = 0;
function frame(nowMs) {
  requestAnimationFrame(frame);
  if (!running) return;
  const now = nowMs, t = now / 1000, dt = clamp(t - tPrev, 0.001, 0.25); tPrev = t;
  fpsN++; if (now - fpsT > 1000) { fps = fpsN * 1000 / (now - fpsT); fpsN = 0; fpsT = now; }
  try { detect(now); } catch (e) { console.error(e); }

  // materiais
  for (const look of ['xray', 'neon']) for (const m of Object.values(MATS[look])) { m.uniforms.uTime.value = t; m.uniforms.uGain.value = S.bright; m.uniforms.uOpacity.value = S.anat; }

  // cabeças
  faces.forEach((f, i) => {
    if (!f.rig) f.rig = headRigs[i];
    if (f.active && f.lm) updateHead(f); else f.rig.g.visible = false;
  });
  hands.forEach((h, i) => {
    if (!h.rig) h.rig = handRigs[i];
    if (h.active && h.lm) updateHand(h); else h.rig.g.visible = false;
  });
  const f0 = primaryFace();

  // músculos
  mctx.clearRect(0, 0, vw, vh);
  const forced = mode === 'desafio' && ch && ch.phase !== 'end' ? [ch.list[ch.i]?.alvo, ch.list[ch.i]?.alvo === 'mMasseter' ? 'mTemporal' : null].filter(Boolean) : null;
  for (const f of faces) if (f.active && f.lm) {
    if (S.layers.muscles) drawMuscles(f, t);
    else { f.mgeo = null; if (forced && f === f0 && MUSCLES.some(m => forced.includes(m.id))) drawMuscles(f, t, forced); }
  }

  const st = revealState(f0);
  applyMaskCss(st); applyBackdrop();
  if (selected && now > selected.until && $('#card').hidden) selected = null;
  updateInteraction(f0, dt, now);
  renderer.render(scene, camera);
  drawLabels(f0, st);
  drawTracking();
  drawFx(dt, st, now);

  // dicas
  const hint = $('#hint');
  if (!f0) { if (!noFaceSince) noFaceSince = now; } else noFaceSince = 0;
  let msg = '';
  if (noFaceSince && now - noFaceSince > 1500) msg = TXT.semCara;
  else if (f0 && f0.faceW < vw * 0.12) msg = TXT.perto;
  else if (hint.textContent === TXT.semMao && mode === 'desafio' && ch?.list[ch.i]?.tipo === 'toque' && !fingerTips().length) msg = TXT.semMao;
  if (hint.textContent !== msg) hint.textContent = msg;
  hint.hidden = !msg;

  if (S.track) {
    const b = f0?.bs || {};
    const top = Object.entries(b).filter(([k]) => k !== '_neutral').sort((a, c) => c[1] - a[1]).slice(0, 5).map(([k, v]) => `${k.padEnd(18)} ${(v * 100).toFixed(0).padStart(3)}%`).join('\n');
    $('#stats').textContent = `${fps.toFixed(0)} fps · detecção ${detMs.toFixed(0)} ms\ncaras ${faces.filter(f => f.active).length} · mãos ${hands.filter(h => h.active).length}\n${top}`;
  }
  $('#stats').hidden = !S.track;
}

// ------------------------------------------------------------------ foto
function takePhoto() {
  if (!source) return;
  const c = document.createElement('canvas'); c.width = vw; c.height = vh;
  const g = c.getContext('2d');
  const st = revealState(primaryFace());
  g.save(); g.translate(vw, 0); g.scale(-1, 1);
  g.drawImage(source, 0, 0, vw, vh);
  const o = document.createElement('canvas'); o.width = vw; o.height = vh;
  const og = o.getContext('2d');
  const bd = backdropFilter();
  og.filter = bd.f; og.drawImage(source, 0, 0, vw, vh); og.filter = 'none';
  og.fillStyle = bd.tint; og.fillRect(0, 0, vw, vh);
  og.drawImage(glCanvas, 0, 0, vw, vh); og.drawImage(mCanvas, 0, 0);
  if (st.mode !== 'all') {
    og.globalCompositeOperation = 'destination-in';
    let grd;
    if (st.mode === 'lens') { grd = og.createRadialGradient(st.c[0], st.c[1], st.r0, st.c[0], st.c[1], st.r); grd.addColorStop(0, '#000'); grd.addColorStop(1, 'rgba(0,0,0,0)'); }
    else { const [nx, ny] = st.n; grd = og.createLinearGradient(st.p[0] - nx * st.fw, st.p[1] - ny * st.fw, st.p[0] + nx * st.fw, st.p[1] + ny * st.fw); grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, '#000'); }
    og.fillStyle = grd; og.fillRect(0, 0, vw, vh);
  }
  g.drawImage(o, 0, 0);
  if (S.track) g.drawImage(tCanvas, 0, 0);
  g.restore();
  g.drawImage(lCanvas, 0, 0, vw, vh);
  g.drawImage(fxCanvas, 0, 0, vw, vh);
  // marca discreta
  g.font = `600 ${Math.round(vh * 0.03)}px Fredoka, sans-serif`; g.fillStyle = 'rgba(111,227,255,0.85)'; g.textBaseline = 'bottom';
  g.fillText('Espelho Raio-X', vh * 0.02, vh * 0.98);
  const d = new Date(), z = n => String(n).padStart(2, '0');
  const name = `espelho-raio-x-${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}.png`;
  const fl = $('#flash'); fl.classList.add('on'); setTimeout(() => fl.classList.remove('on'), 60);
  tone([1400, 700], 0.04, 'square', 0.05);
  if (ARTIFACT) {
    if (!capDownloads) { toast('Aqui não dá para guardar fotos 🙁'); return; }
    c.toBlob(b => capDownloads.save({ filename: name, data: b })
      .then(() => toast('📸 Foto guardada!'))
      .catch(e => { if (e?.code !== 'declined') toast('Não consegui guardar a foto.'); }), 'image/png');
    return;
  }
  const a = document.createElement('a');
  a.download = name; a.href = c.toDataURL('image/png'); a.click();
  toast('📸 Foto guardada nas Transferências!');
}

// ------------------------------------------------------------------ interface
function refreshUI() {
  $$('[data-set]').forEach(el => {
    const v = getPath(S, el.dataset.set);
    if (el.classList.contains('seg')) el.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.val === v));
    else if (el.type === 'checkbox') el.checked = !!v;
    else if (el.type === 'range') el.value = v;
  });
  $$('#layerChips .chip').forEach(b => { b.classList.toggle('on', !!S.layers[b.dataset.layer]); b.setAttribute('aria-pressed', !!S.layers[b.dataset.layer]); });
  $('#btnVoz').setAttribute('aria-pressed', S.voice); $('#btnVoz').textContent = S.voice ? '🔊' : '🔇';
  $('#app').classList.toggle('nopanel', !S.panel); $('#btnPainel').setAttribute('aria-pressed', S.panel);
  updateSolidOpacity();
  saveSettings();
  requestAnimationFrame(layout);
}
function initUI() {
  if (window.innerWidth < 900) S.panel = false;
  const chips = $('#layerChips');
  chips.innerHTML = Object.entries(LAYERS).map(([k, l]) => `<button class="chip" data-layer="${k}" style="--c:${l.cor}"><i></i>${l.nome}</button>`).join('');
  chips.onclick = e => { const b = e.target.closest('.chip'); if (!b) return; S.layers[b.dataset.layer] = !S.layers[b.dataset.layer]; refreshUI(); };
  $$('[data-preset]').forEach(b => b.onclick = () => { S.layers = { ...PRESETS[b.dataset.preset] }; refreshUI(); sndTick(); });
  $$('.seg[data-set]').forEach(seg => seg.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    setPath(S, seg.dataset.set, b.dataset.val);
    if (seg.dataset.set === 'look') applyLook();
    refreshUI();
  });
  $$('input[data-set]').forEach(el => el.oninput = () => { setPath(S, el.dataset.set, el.type === 'checkbox' ? el.checked : parseFloat(el.value)); refreshUI(); });
  $$('[data-fit]').forEach(b => b.onclick = () => { S.fit = { ...FIT_PRESETS[b.dataset.fit] }; refreshUI(); });
  $('#btnFitReset').onclick = () => { S.fit = { ...FIT_PRESETS.adulto }; refreshUI(); };
  $$('.modes button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $('#btnFoto').onclick = takePhoto;
  $('#btnVoz').onclick = () => { S.voice = !S.voice; if (!S.voice) stopSpeech(); refreshUI(); };
  $('#btnFile').onclick = () => $('#fileIn').click();
  $('#btnPainel').onclick = () => { S.panel = !S.panel; refreshUI(); };
  $('#btnFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => { }); };
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'f' || e.key === 'F') takePhoto();
    else if (e.key === 'p' || e.key === 'P') { S.panel = !S.panel; refreshUI(); }
    else if (e.key === 'l' || e.key === 'L') { S.labels = !S.labels; refreshUI(); }
    else if (e.key === 'Escape') { $('#card').hidden = true; selected = null; }
    else if ('1234'.includes(e.key)) { S.layers = { ...PRESETS[['ossos', 'cerebro', 'musculos', 'tudo'][+e.key - 1]] }; refreshUI(); }
  });
  const toVid = e => { const r = stage.getBoundingClientRect(); const xd = (e.clientX - r.left) / r.width * vw; return [vw - xd, (e.clientY - r.top) / r.height * vh]; };
  stage.addEventListener('pointermove', e => { pointer = toVid(e); });
  stage.addEventListener('pointerleave', () => { pointer = null; });
  stage.addEventListener('click', e => {
    if (e.target.closest('#card, #prompt')) return;
    const f0 = primaryFace(); if (!f0) return;
    const [x, y] = toVid(e);
    // clique num rótulo
    const xd = vw - x;
    for (const t of lastLabels) if (t.box && xd >= t.box[0] && xd <= t.box[0] + t.box[2] && y >= t.box[1] && y <= t.box[1] + t.box[3]) { showCard(t); return; }
    const hit = nearestTarget([[x, y]], [...collectTargets(f0, { touch: true }), ...handTargets()], f0.faceW * 0.16);
    if (hit) showCard(hit.t);
  });
  refreshUI();
}

// ------------------------------------------------------------------ arranque
const loadMsg = $('#loadMsg');
let ready = null, wantStart = null;
async function boot() {
  initUI();
  try {
    loadMsg.textContent = 'A preparar o laboratório… a montar o esqueleto';
    await loadAnatomy();
    headRigs = [makeHeadRig(), makeHeadRig()];
    handRigs = [makeHandRig(), makeHandRig()];
    applyLook();
    await loadVision(m => (loadMsg.textContent = m));
    loadMsg.textContent = 'Pronto! ✨';
    ready = true;
    requestAnimationFrame(frame);
    if (wantStart) wantStart();
  } catch (e) {
    console.error(e);
    loadMsg.classList.add('err');
    loadMsg.textContent = 'Não consegui carregar os modelos. Confirma que abriste a app com o “Iniciar Espelho Raio-X” e não directamente o ficheiro. (' + (e.message || e) + ')';
  }
}
function begin(src, w, h) {
  source = src; setSourceSize(w, h);
  $('#start').hidden = true; running = true;
  lastVidTime = -1;
  faces.forEach(f => { f.active = false; f.filt.reset(); f.kyRest = null; });
  hands.forEach(h => { h.active = false; h.filt.reset(); });
}
async function startCamera() {
  if (!ready) { wantStart = startCamera; $('#btnStart').disabled = true; $('#btnStart').textContent = 'Quase pronto…'; return; }
  wantStart = null;
  const btn = $('#btnStart'); btn.disabled = true; btn.textContent = 'A ligar a câmara…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    video.srcObject = stream; still.hidden = true; video.hidden = false;
    await video.play();
    sourceKind = 'camera';
    begin(video, video.videoWidth, video.videoHeight);
    tone([660, 880], 0.08);
  } catch (e) {
    console.error(e);
    btn.disabled = false; btn.textContent = '🎥 Tentar outra vez';
    loadMsg.classList.add('err');
    loadMsg.textContent = ARTIFACT ? 'Aqui dentro do Claude a câmara está bloqueada. Escolhe uma foto ou um vídeo — ou usa a versão para computador para o espelho ao vivo.'
      : e.name === 'NotAllowedError' ? 'Não deste autorização para usar a câmara. Clica no ícone da câmara na barra de endereço, escolhe “Permitir” e tenta outra vez.'
      : e.name === 'NotFoundError' ? 'Não encontrei nenhuma câmara. Podes experimentar com uma foto ou vídeo.'
      : e.name === 'NotReadableError' ? 'A câmara está a ser usada por outro programa (Teams, Zoom…). Fecha-o e tenta outra vez.'
      : 'Não consegui ligar a câmara: ' + e.message;
  }
}
async function startFile(file) {
  if (!ready) { wantStart = () => startFile(file); return; }
  const url = URL.createObjectURL(file);
  if (file.type.startsWith('video/')) {
    video.srcObject = null; video.src = url; video.loop = true; still.hidden = true; video.hidden = false;
    await video.play();
    sourceKind = 'video';
    begin(video, video.videoWidth, video.videoHeight);
  } else {
    still.src = url; await still.decode(); still.hidden = false; video.hidden = true;
    sourceKind = 'image';
    begin(still, still.naturalWidth, still.naturalHeight);
  }
  if (mode === 'desafio') setMode('desafio');
}
$('#btnStart').onclick = ARTIFACT ? () => $('#fileIn').click() : startCamera;
$('#fileIn').onchange = e => { const f = e.target.files[0]; if (f) startFile(f); e.target.value = ''; };
if (ARTIFACT) {
  $('#btnStart').textContent = '📁 Escolher foto ou vídeo';
  $('#artNote').hidden = false; $('#altLabel').hidden = true;
  $('#btnCamAlt').hidden = false; $('#btnCamAlt').onclick = startCamera;
  $('#privacy').textContent = '🔒 A foto ou o vídeo ficam só neste browser — nada é enviado para lado nenhum.';
  $('#btnFoto').hidden = true;
}
// arrastar e largar uma foto ou vídeo
let dragN = 0;
window.addEventListener('dragenter', e => { e.preventDefault(); dragN++; $('#app').classList.add('drag'); });
window.addEventListener('dragleave', () => { if (--dragN <= 0) { dragN = 0; $('#app').classList.remove('drag'); } });
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => {
  e.preventDefault(); dragN = 0; $('#app').classList.remove('drag');
  const f = [...(e.dataTransfer?.files || [])].find(f => /^(image|video)\//.test(f.type));
  if (f) startFile(f);
});
boot();

// para testes e curiosos na consola
window.espelho = { S, faces, hands, refreshUI, setMode, takePhoto, startFile, DEBUG, collectTargets: (o) => collectTargets(primaryFace(), o) };
