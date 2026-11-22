// Espelho Raio-X — app principal
// Câmara -> MediaPipe (cara 478 pontos + mãos 21 pontos) -> anatomia 3D (Three.js) + músculos 2D + etiquetas.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.js';
import { FilesetResolver, FaceLandmarker, HandLandmarker, PoseLandmarker, ObjectDetector } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.3/vision_bundle.mjs';
import { CANON, MIRROR } from './canon.js';
import { LAYERS, PRESETS, PARTS, HAND_PARTS, MUSCLES, CHALLENGES, TXT, BODY_PARTS, BODY_CHALLENGES, QUIZ, OBJECTS, objPlural, ETAPAS, LADDER, LADO, COMBOS, SEQ_ITEMS, LANDMARKS, CLINICAL, GAZE, QUIZ_MAIS } from './parts.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const BS_SWAP = false;
const DEBUG = { bs: null, tip: null, hand: null, pose: null, gaze: null }; // usado nos testes automáticos
const ARTIFACT = !!window.ESPELHO_ARTIFACT;           // versão publicada dentro do Claude (sem câmara)
let capDownloads = null, capTTS = null;
if (window.claude && typeof window.claude.use === 'function') {
  window.claude.use('downloads').then(d => { capDownloads = d; if (ARTIFACT) $('#btnFoto').hidden = $('#btnRec').hidden = !d; }).catch(() => { });
  window.claude.use('tts').then(t => { capTTS = t; }).catch(() => { });
}
let sourceKind = null; // 'camera' | 'video' | 'image'
// onde estão o motor de IA e os modelos (a versão publicada no Claude carrega-os de um CDN)
const CFG = Object.assign({
  wasm: 'vendor/mediapipe/wasm',
  faceModel: 'models/face_landmarker.task',
  handModel: 'models/hand_landmarker.task',
  poseModel: 'models/pose_landmarker_lite.task',
  objModel: 'models/efficientdet_lite0.tflite',
}, window.ESPELHO_CFG || {});
// impressões digitais (SHA-256) dos modelos testados (iguais aos da pasta models/): só usamos ficheiros iguais a estes
const MODEL_SHA = {
  face: '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff',
  hand: 'fbc2a30080c3c557093b5ddfc334698132eb341044ccee322ccf8bcf3607cde1',
  pose: '59929e1d1ee95287735ddd833b19cf4ac46d29bc7afddbbf6753c459690d574a',
  obj: '4b59100025bea1235a84c1038879a6cccc9f6c49f5e41144e91e74d99e780993',
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
  layers: { skull: true, teeth: true, spine: true, brain: false, eyes: true, muscles: false, hands: true, body: false },
  babyTeeth: false, level: 'exploradores',
  objXray: true, objEN: false, objMov: false, prog: { max: 1, best: {} }, unlockAll: false,
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
  body:   ['#b9d7ff', '#efe4cc', 2.2, 0.06, 0.65],
  cart:   ['#7aa8ff', '#c9d6ef', 1.6, 0.02, 0.70],
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
  if (k === 'cart') { sm.transparent = true; sm.opacity = 0.55; }
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
  for (const [geo, kid] of [[GEO.teethUpper, false], [GEO.teethUpperKid, true]]) { const m = addMesh(g, geo, 'tooth', 'teeth'); m.userData.kid = kid; L('teeth').push(m); }
  const jaw = new THREE.Group(); jaw.position.copy(JAW_PIVOT); g.add(jaw);
  const jawIn = new THREE.Group(); jawIn.position.copy(JAW_PIVOT).multiplyScalar(-1); jaw.add(jawIn);
  L('skull').push(addMesh(jawIn, GEO.mandible, 'bone', 'skull'));
  for (const [geo, kid] of [[GEO.teethLower, false], [GEO.teethLowerKid, true]]) { const m = addMesh(jawIn, geo, 'tooth', 'teeth'); m.userData.kid = kid; L('teeth').push(m); }
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

let headRigs = [], handRigs = [], bodyRig = null;

// ================================================================== CORPO (esqueleto com o tracking do corpo)
// Referencial do tronco (cm): origem a meio dos ombros, x = esquerda da pessoa, y = cima, z = frente; ombros em x = ±18.
// Referencial da bacia (cm): origem a meio das ancas, ancas em x = ±10.
function mergeGeos(list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const g of list) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, ov * 3); nor.set(g.attributes.normal.array, ov * 3);
    if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i++) idx[oi + i] = a[i] + ov; oi += a.length; }
    else { for (let i = 0; i < n; i++) idx[oi + i] = ov + i; oi += n; }
    ov += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
function tubeGeo(pts, r, seg = 28, rs = 8) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg, r, rs, false); }
function segGeo(base, a, b, sx, sz = sx) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length(); d.normalize();
  const m = new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(UP, d), new THREE.Vector3(sx, len, sz));
  return base.clone().applyMatrix4(m);
}
function capsGeo(a, b, sx, sz) {
  const d = new THREE.Vector3().subVectors(b, a), len = d.length(); d.normalize();
  const g = new THREE.CapsuleGeometry(1, Math.max(0.1, len - 2), 6, 16);
  const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(UP, d), new THREE.Vector3(sx, 1, sz));
  return g.applyMatrix4(m);
}
const spineZ = y => y > -27 ? -4.5 - 1.0 * Math.sin(Math.PI * clamp((-1 - y) / 26, 0, 1)) : -4.5 + 1.2 * Math.sin(Math.PI * clamp((-27 - y) / 13, 0, 1));
const sternZ = y => lerp(6.1, 8.5, clamp((-3 - y) / 19, 0, 1));
function buildTorsoGeos() {
  const bones = [], cart = [];
  const A = [6.5, 9.5, 11.2, 12.4, 13.2, 13.7, 13.9, 13.8, 13.4, 12.7, 11.5, 10.0];
  const B = [5.0, 6.8, 7.8, 8.4, 8.7, 8.9, 9.0, 9.0, 8.8, 8.4, 7.8, 7.0];
  const DROP = [2.5, 3.5, 4.5, 5.5, 6.0, 6.5, 7.0, 7.0, 6.5, 6.0, 4.0, 3.0];
  for (let i = 0; i < 12; i++) {
    const yb = -1 - 2.3 * i;
    const end = i < 7 ? Math.PI - Math.asin(1.7 / A[i]) : i < 10 ? 2.45 : i === 10 ? 1.75 : 1.45;
    const cz = i < 7 ? sternZ(yb - DROP[i]) - B[i] * Math.cos(Math.asin(1.7 / A[i])) : -0.5;
    const cartFrom = i < 7 ? end - 0.5 : i < 10 ? end - 0.42 : 99;
    for (const s of [-1, 1]) {
      const bonePts = [v3(s * 1.3, yb + 0.3, spineZ(yb) - 0.6)], cartPts = [];
      const N = 22;
      for (let k = 0; k <= N; k++) {
        const ph = 0.28 + (end - 0.28) * k / N;
        const p = v3(s * A[i] * Math.sin(ph), yb - DROP[i] * Math.pow((1 - Math.cos(ph)) / 2, 1.1), cz - B[i] * Math.cos(ph));
        if (ph <= cartFrom) bonePts.push(p); else { if (!cartPts.length) cartPts.push(bonePts[bonePts.length - 1].clone()); cartPts.push(p); }
      }
      bones.push(tubeGeo(bonePts, i === 0 ? 0.55 : 0.5, 40));
      if (cartPts.length > 1) cart.push(tubeGeo(cartPts, 0.42, 12));
    }
  }
  // esterno (manúbrio, corpo, apêndice xifóide)
  bones.push(capsGeo(v3(0, -3.0, sternZ(-3.0)), v3(0, -8.0, sternZ(-8.0)), 2.2, 0.5));
  bones.push(capsGeo(v3(0, -8.6, sternZ(-8.6)), v3(0, -21.6, sternZ(-21.6)), 1.55, 0.45));
  bones.push(capsGeo(v3(0, -21.8, sternZ(-21.8)), v3(0, -24.6, sternZ(-22) - 0.4), 0.6, 0.35));
  // clavículas e omoplatas
  for (const s of [-1, 1]) {
    bones.push(tubeGeo([v3(s * 1.8, -3.0, 6.6), v3(s * 6, -2.2, 7.0), v3(s * 11, -1.2, 4.6), v3(s * 16.5, 1.2, 0.5)], 0.62, 30));
    bones.push(tubeGeo([v3(s * 7.5, -4.5, -9.8), v3(s * 13, -1.5, -7), v3(s * 16.5, 1.2, -1.5)], 0.45));
    bones.push(tubeGeo([v3(s * 7, -2, -9.6), v3(s * 7.3, -10, -9.4), v3(s * 7.6, -17, -9.0)], 0.38));
    bones.push(tubeGeo([v3(s * 7.6, -17, -9.0), v3(s * 12.5, -9, -7), v3(s * 15.5, -3, -4.5)], 0.42));
    bones.push(tubeGeo([v3(s * 7, -2, -9.6), v3(s * 12, -2.5, -7.5), v3(s * 14.5, -2.0, -5)], 0.32));
    bones.push(tubeGeo([v3(s * 14.8, -2, -3.5), v3(s * 15.6, -1.5, 0.3)], 0.3, 8));
  }
  // coluna torácica (T1–T12) e lombar (L1–L5)
  const spine = [];
  for (let i = 0; i < 17; i++) {
    const lumbar = i >= 12;
    const y = lumbar ? -28.2 - 2.65 * (i - 12) : -1.3 - 2.3 * i;
    const z = spineZ(y);
    const r = lumbar ? 2.0 : 1.3 + 0.06 * i, h = lumbar ? 2.0 : 1.6;
    spine.push(new THREE.CylinderGeometry(r, r, h, 16).translate(0, y, z));
    if (lumbar) {
      spine.push(segGeo(GEO.bone, v3(0, y, z - 1.4), v3(0, y - 0.5, z - 4.8), 0.5, 0.3));
      for (const s of [-1, 1]) spine.push(segGeo(GEO.bone, v3(s * 1.4, y, z - 1.0), v3(s * 4.2, y, z - 1.6), 0.32));
    } else {
      spine.push(segGeo(GEO.bone, v3(0, y, z - 1.2), v3(0, y - 2.0, z - 4.6), 0.32));
      for (const s of [-1, 1]) spine.push(segGeo(GEO.bone, v3(s * 1.0, y + 0.2, z - 1.0), v3(s * 3.0, y + 0.4, z - 2.2), 0.3));
    }
  }
  return { bones: mergeGeos(bones), cart: mergeGeos(cart), spine: mergeGeos(spine) };
}
function buildPelvisGeo() {
  const g = [];
  for (const s of [-1, 1]) {
    g.push(new THREE.TorusGeometry(2.3, 0.38, 8, 28).rotateY(Math.PI / 2).translate(s * 10, 0, 0.5));
    const crest = [v3(s * 3.8, 6.5, -6.5), v3(s * 8, 9.5, -5), v3(s * 12.5, 9.5, -1), v3(s * 13, 7, 3), v3(s * 11.5, 4.5, 5.5)];
    g.push(tubeGeo(crest, 0.55, 36));
    for (const c of [v3(s * 6, 8.5, -5.8), v3(s * 9.5, 9.6, -3.5), v3(s * 12.5, 8.6, 0.5)]) g.push(tubeGeo([c, v3(s * 9.6, 2.2, 0.2)], 0.32, 8));
    g.push(tubeGeo([v3(s * 3.8, 6.5, -6.5), v3(s * 5.2, 2, -5.5), v3(s * 8.5, 0.5, -2)], 0.5));
    g.push(tubeGeo([v3(s * 11.5, 4.5, 5.5), v3(s * 10.6, 2.5, 3), v3(s * 10.2, 1.5, 2.0)], 0.45, 10));
    g.push(tubeGeo([v3(s * 9, -0.5, 2.5), v3(s * 5, -2.0, 5.5), v3(s * 1.0, -3.5, 6.6)], 0.55));
    g.push(tubeGeo([v3(s * 1.0, -3.5, 6.6), v3(s * 1.2, -6.0, 6.0)], 0.6, 8));
    g.push(tubeGeo([v3(s * 1.2, -6.0, 6.0), v3(s * 4.5, -7.5, 3), v3(s * 7.5, -7.0, -0.5), v3(s * 9.2, -3, -1.0), v3(s * 9.5, -1.2, -0.3)], 0.55, 36));
  }
  // sacro e cóccix
  g.push(capsGeo(v3(0, 6.5, -6.8), v3(0, -1.5, -8.2), 2.6, 0.6));
  g.push(tubeGeo([v3(-4.0, 7, -6.8), v3(-2.2, 2.5, -7.8), v3(0, -2.5, -8.5), v3(2.2, 2.5, -7.8), v3(4.0, 7, -6.8)], 0.45, 30));
  g.push(tubeGeo([v3(0, -2.5, -8.5), v3(0, -4.6, -7.8)], 0.35, 8));
  return mergeGeos(g);
}
// ossos dos membros: [ponto A, ponto B, id, espessura (fracção da largura dos ombros), desvio lateral]
const LIMBS = [
  [11, 13, 'umero', 0.032, 0], [12, 14, 'umero', 0.032, 0],
  [13, 15, 'antebracoC', 0.019, 1], [13, 15, 'antebracoC', 0.016, -1], [14, 16, 'antebracoC', 0.019, -1], [14, 16, 'antebracoC', 0.016, 1],
  [23, 25, 'femur', 0.042, 0], [24, 26, 'femur', 0.042, 0],
  [25, 27, 'tibia', 0.034, 0], [25, 27, 'tibia', 0.015, 1], [26, 28, 'tibia', 0.034, 0], [26, 28, 'tibia', 0.015, -1],
  [27, 29, 'pe', 0.03, 0], [28, 30, 'pe', 0.03, 0], [27, 31, 'pe', 0.016, 0], [28, 32, 'pe', 0.016, 0],
  [15, 17, 'mao', 0.011, 0], [15, 19, 'mao', 0.011, 0], [15, 21, 'mao', 0.011, 0],
  [16, 18, 'mao', 0.011, 0], [16, 20, 'mao', 0.011, 0], [16, 22, 'mao', 0.011, 0],
];
function makeBodyRig() {
  const t = buildTorsoGeos();
  const torso = new THREE.Group(); torso.matrixAutoUpdate = false; scene.add(torso);
  addMesh(torso, t.bones, 'body', 'body'); addMesh(torso, t.cart, 'cart', 'body'); addMesh(torso, t.spine, 'spine', 'body');
  const pelvis = new THREE.Group(); pelvis.matrixAutoUpdate = false; scene.add(pelvis);
  addMesh(pelvis, buildPelvisGeo(), 'body', 'body');
  const limbs = new THREE.Group(); scene.add(limbs);
  const bones = LIMBS.map(() => addMesh(limbs, GEO.bone, 'body', 'body'));
  const patellas = [0, 1].map(() => addMesh(limbs, GEO.carpal, 'body', 'body'));
  torso.visible = pelvis.visible = limbs.visible = false;
  return { torso, pelvis, limbs, bones, patellas, X: V(), Y: V(), Z: V(), C: V(), k: 1, ky: 1, hasHips: false, hip: { C: V(), X: V(), k: 1 } };
}


// ------------------------------------------------------------------ MediaPipe
let faceLM = null, handLM = null;
let fileset = null;
const forceCPU = /[?&]cpu\b/.test(location.search);
async function mkTask(Cls, opts) {
  if (forceCPU) return await Cls.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'CPU' } });
  try { return await Cls.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'GPU' } }); }
  catch (e) { console.warn('GPU indisponível, a usar CPU', e); return await Cls.createFromOptions(fileset, { ...opts, baseOptions: { ...opts.baseOptions, delegate: 'CPU' } }); }
}
// o modelo do corpo só é carregado quando é preciso
let poseLM = null, poseLoading = null;
function ensurePose() {
  if (poseLM || poseLoading || !fileset) return;
  poseLoading = (async () => {
    toast('🩻 A preparar o esqueleto do corpo…', 2200);
    const buf = await loadModel(CFG.poseModel, CFG.checkSha === false ? null : MODEL_SHA.pose);
    poseLM = await mkTask(PoseLandmarker, { baseOptions: { modelAssetBuffer: buf }, runningMode: 'VIDEO', numPoses: 1,
      minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
  })().catch(e => { console.error(e); toast('Não consegui carregar o modelo do corpo.'); poseLoading = null; });
}
async function loadVision(onMsg) {
  fileset = await FilesetResolver.forVisionTasks(CFG.wasm);
  onMsg('A preparar o laboratório… a carregar os modelos de IA');
  const [faceBuf, handBuf] = await Promise.all([loadModel(CFG.faceModel, CFG.checkSha === false ? null : MODEL_SHA.face), loadModel(CFG.handModel, CFG.checkSha === false ? null : MODEL_SHA.hand)]);
  const mk = mkTask;
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
const body = { active: false, lost: 0, filt: new OneEuro(33 * 3, 1.3, 0.015), lm: null, vis: new Float32Array(33), J: Array.from({ length: 33 }, () => new THREE.Vector3()), w: 1 };
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

  // objectos
  if (mode === 'objectos') {
    ensureObj();
    if (DEBUG.objs) updateObjects(DEBUG.objs.map(([cls, x, y, w, h, sc = 0.8]) => ({ categories: [{ categoryName: cls, score: sc }], boundingBox: { originX: x, originY: y, width: w, height: h } })), t);
    else if (objLM && now - objLast > 120) { objLast = now; const d = objLM.detectForVideo(source, ts).detections || []; objRaw = d.map(x => x.categories[0].categoryName + ':' + x.categories[0].score.toFixed(2)); updateObjects(d, t); }
  } else if (objTracks.length) objTracks.length = 0;

  // corpo
  const needPose = S.layers.body || (mode === 'desafio' && ch && ch.list[ch.i]?.corpo);
  if (needPose) ensurePose();
  if (poseLM && needPose && !(handSkip && frameN % 2 === 0)) {
    const pr = poseLM.detectForVideo(source, ts);
    const l = DEBUG.pose ? DEBUG.pose.map(([x, y, z, v = 1]) => ({ x: x / vw, y: y / vh, z: z / vw, visibility: v })) : pr.landmarks?.[0];
    if (l) {
      const raw = new Float32Array(99);
      for (let i = 0; i < 33; i++) { raw[i * 3] = l[i].x * vw; raw[i * 3 + 1] = l[i].y * vh; raw[i * 3 + 2] = l[i].z * vw; body.vis[i] = lerp(body.vis[i], l[i].visibility ?? 1, 0.5); }
      if (!body.active) body.filt.reset();
      body.lm = body.filt.filter(raw, t); body.active = true; body.lost = 0;
      for (let i = 0; i < 33; i++) body.J[i].set(body.lm[i * 3], -body.lm[i * 3 + 1], -body.lm[i * 3 + 2]);
    } else if (++body.lost > 10) body.active = false;
  } else if (!needPose) body.active = false;
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
  for (const [layer, list] of Object.entries(r.layer)) for (const m of list) m.visible = !!S.layers[layer] && (m.userData.kid === undefined || m.userData.kid === !!S.babyTeeth);
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
const VIS = 0.5;
function updateBody() {
  const b = bodyRig, J = body.J, vis = body.vis;
  const on = body.active && (S.layers.body || (mode === 'desafio' && ch?.list[ch.i]?.corpo)) && vis[11] > VIS && vis[12] > VIS;
  b.torso.visible = b.pelvis.visible = b.limbs.visible = on;
  b.on = on;
  if (!on) return;
  // tronco
  b.C.addVectors(J[11], J[12]).multiplyScalar(0.5);
  b.X.subVectors(J[11], J[12]); const w = b.X.length(); b.X.divideScalar(w); body.w = w;
  b.k = w / 36;
  b.hasHips = vis[23] > VIS && vis[24] > VIS && J[23].y > -vh * 1.05;
  const H = hv[0].addVectors(J[23], J[24]).multiplyScalar(0.5);
  if (b.hasHips) b.Y.subVectors(b.C, H); else b.Y.subVectors(J[0], b.C);
  b.Y.addScaledVector(b.X, -b.Y.dot(b.X)).normalize();
  b.Z.crossVectors(b.X, b.Y);
  b.ky = b.hasHips ? clamp(b.C.clone().sub(H).dot(b.Y) / 47, b.k * 0.7, b.k * 1.5) : b.k;
  const k = b.k, ky = b.ky;
  b.torso.matrix.set(b.X.x * k, b.Y.x * ky, b.Z.x * k, b.C.x, b.X.y * k, b.Y.y * ky, b.Z.y * k, b.C.y, b.X.z * k, b.Y.z * ky, b.Z.z * k, b.C.z, 0, 0, 0, 1);
  b.torso.matrixWorldNeedsUpdate = true;
  // bacia
  b.pelvis.visible = b.hasHips;
  if (b.hasHips) {
    const hx = hv[1].subVectors(J[23], J[24]); const hw = hx.length(); hx.divideScalar(hw);
    const hk = hw / 20, hz = hv[2].crossVectors(hx, b.Y);
    b.hip.C.copy(H); b.hip.X.copy(hx); b.hip.k = hk;
    b.pelvis.matrix.set(hx.x * hk, b.Y.x * hk, hz.x * hk, H.x, hx.y * hk, b.Y.y * hk, hz.y * hk, H.y, hx.z * hk, b.Y.z * hk, hz.z * hk, H.z, 0, 0, 0, 1);
    b.pelvis.matrixWorldNeedsUpdate = true;
  }
  // mãos já seguidas pelo modelo das mãos: não desenhar a mão aproximada
  const handNear = wi => hands.some(h => h.active && h.lm && Math.hypot(h.lm[0] - body.lm[wi * 3], h.lm[1] - body.lm[wi * 3 + 1]) < vw * 0.12);
  const skipHand = { 15: handNear(15), 16: handNear(16) };
  LIMBS.forEach(([ia, ib, id, th, off], i) => {
    const m = b.bones[i];
    const ok = vis[ia] > VIS && vis[ib] > VIS && !(id === 'mao' && (skipHand[ia] || !S.layers.hands));
    m.visible = ok; if (!ok) return;
    const A = hv[3].copy(J[ia]), Bp = hv[4].copy(J[ib]);
    const d = hv[5].subVectors(Bp, A); const len = d.length(); if (len < 1) { m.visible = false; return; } d.divideScalar(len);
    if (off) { const side = hv[6].set(-d.y, d.x, 0).normalize().multiplyScalar(off * w * 0.022); A.add(side); Bp.add(side); }
    m.position.copy(A).addScaledVector(d, len * 0.04);
    m.quaternion.setFromUnitVectors(UP, d);
    const rr = th * w;
    m.scale.set(rr, len * 0.92, rr);
  });
  [[25, 23], [26, 24]].forEach(([kn, hp], i) => {
    const m = b.patellas[i]; m.visible = vis[kn] > VIS && vis[hp] > VIS;
    if (!m.visible) return;
    const s = 0.035 * w; m.position.copy(J[kn]).addScaledVector(b.Z, s * 0.8); m.scale.set(s, s * 1.2, s * 0.6);
  });
}
function torsoPt(x, y, z) {
  const b = bodyRig; tmpV.set(x, y, z).applyMatrix4(b.torso.matrix); return [tmpV.x, -tmpV.y];
}
function bodyTargets(opts = {}) {
  const b = bodyRig, out = [];
  if (!b || !b.on || (!S.layers.body && !opts.all)) return out;
  const J = body.J, vis = body.vis, P = BODY_PARTS;
  const get = id => P.find(p => p.id === id);
  const add = (id, xy, fc = 1) => { if (xy[0] > 0 && xy[0] < vw && xy[1] > 0 && xy[1] < vh) out.push({ kind: 'body', item: get(id), id, x: xy[0], y: xy[1], fc, layer: 'body' }); };
  for (const s of [1, -1]) {
    const fc = 0.6 + 0.4 * s * b.X.z;
    add('costelas', torsoPt(s * 12.6, -14, 4.5), fc);
    add('clavicula', torsoPt(s * 9, -1.8, 6.5), fc);
    add('omoplata', torsoPt(s * 11.5, -9, -8.5), fc - 0.3);
  }
  add('esterno', torsoPt(0, -12, 8.6)); add('esterno', torsoPt(0, -5, 7.0), 0.9);
  add('coluna', torsoPt(0, -33, -3.5), 0.9);
  if (b.hasHips) { const hp = b.hip; tmpV.set(12 * hp.k, 0, 0); const p = hv[7].copy(hp.C).addScaledVector(hp.X, 12 * hp.k).addScaledVector(b.Y, 8 * hp.k); add('bacia', [p.x, -p.y]); }
  const mid = (a, c) => [(body.lm[a * 3] + body.lm[c * 3]) / 2, (body.lm[a * 3 + 1] + body.lm[c * 3 + 1]) / 2];
  for (const [a, c, id] of [[11, 13, 'umero'], [12, 14, 'umero'], [13, 15, 'antebracoC'], [14, 16, 'antebracoC'], [23, 25, 'femur'], [24, 26, 'femur'], [25, 27, 'tibia'], [26, 28, 'tibia']])
    if (vis[a] > VIS && vis[c] > VIS) add(id, mid(a, c), (vis[a] + vis[c]) / 2);
  return out;
}

function updateHand(h) {
  const r = h.rig, hs = h.hs;
  r.g.visible = S.layers.hands;
  if (!S.layers.hands) return;
  HAND_BONES.forEach(([a, b, rad, endGap = 0.07], i) => {
    const A = handPoint(h, a, hv[0]), B = handPoint(h, b, hv[1]);
    const d = hv[2].subVectors(B, A); const len = d.length(); if (len < 1e-3) return; d.divideScalar(len);
    const m = r.bones[i];
    m.visible = !(i >= HAND_BONES.length - 2 && body.active && S.layers.body);
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
function revealState(f0, peek = false) {
  const st = { mode: S.reveal };
  if (S.reveal === 'lens') {
    let target = null;
    const h = hands.find(h => h.active);
    if (h) target = [h.lm[8 * 3], h.lm[8 * 3 + 1]];
    else if (pointer) target = pointer;
    else if (f0) target = [f0.lm[168 * 3], f0.lm[168 * 3 + 1]];
    else target = [vw / 2, vh / 2];
    if (!peek || !lensPos) lensPos = lensPos ? [lerp(lensPos[0], target[0], 0.35), lerp(lensPos[1], target[1], 0.35)] : target;
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
  if (!f || !f.active || !f.rig) return out;
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
const itNome = it => (S.babyTeeth && it.nomeCrianca) ? it.nomeCrianca : it.nome;
const itFacto = it => (S.babyTeeth && it.factoCrianca) ? it.factoCrianca : it.facto;
function labelText(t) {
  const it = { ...t.item, nome: itNome(t.item) };
  if (S.sci) return it.cient && it.cient !== it.nome ? `${it.nome} · ${it.cient}` : it.nome;
  return it.nome;
}
function drawLabels(f, st) {
  const ctx = lctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, lCanvas.width, lCanvas.height);
  const bOn = bodyRig?.on && S.layers.body;
  const hideForQuiz = mode === 'desafio' && ch?.list && ch.phase === 'ask' && ch.list[ch.i]?.mostra;
  if (!S.labels || (!f && !bOn) || mode === 'objectos' || hideForQuiz) return;
  const sc = lCanvas.width / vw; ctx.setTransform(sc, 0, 0, sc, 0, 0);
  let T = [...collectTargets(f), ...handTargets(), ...bodyTargets()].filter(t => !t.extra);
  // um rótulo por parte: o lado mais virado para a câmara
  const best = new Map();
  for (const t of T) { const k = t.kind + t.id; if (!best.has(k) || best.get(k).fc < t.fc) best.set(k, t); }
  T = [...best.values()].filter(t => inReveal(st, t.x, t.y));
  if (!T.length) return;
  const u = vw / cssW;              // 1 px de ecrã em px de vídeo
  const dens = T.length > 14 ? 0.84 : 1;
  const fs = 15 * u * dens, padX = 9 * u * dens, h = 26 * u * dens, gap = 4 * u * dens;
  ctx.font = `600 ${fs}px Fredoka, "Segoe UI", sans-serif`; ctx.textBaseline = 'middle';
  const fx = f ? vw - f.lm[168 * 3] : vw - bodyRig.C.x;    // centro da cara (ou do corpo) no ecrã (espelhado)
  const half = f ? f.faceW * 0.62 + 30 * u : body.w * 0.55;
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
  $('#card .c-title').textContent = itNome(it);
  $('#card .c-sci').textContent = it.cient && it.cient !== itNome(it) ? it.cient : '';
  $('#card .c-text').textContent = itFacto(it);
  $('#card').hidden = false;
  $('#card').style.animation = 'none'; void $('#card').offsetWidth; $('#card').style.animation = '';
  if (say) speak(`${itNome(it)}. ${itFacto(it)}`);
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
  $('#prompt').hidden = true; ch = null; hunt = null; dwell.id = null; hideQuiz();
  $('#card').hidden = true; selected = null;
  if (m === 'tocar') {
    S.layers.hands = true; refreshUI();
    promptShow('👆', TXT.tocaIntro, '', null);
    speak(TXT.tocaIntro);
    setTimeout(() => { if (mode === 'tocar' && !ch) $('#prompt').hidden = true; }, 5000);
  }
  if (m === 'objectos') { objIntro(); setTimeout(() => { if (mode === 'objectos' && !hunt) promptShow('📦', 'Mostra um objecto!', '', null, null, '', [{ html: '<b>🎯</b>Caça ao tesouro', on: startHunt }]); }, 9000); }
  if (m === 'desafio') {
    S.layers.skull = true; S.layers.hands = true; refreshUI();
    if (sourceKind === 'image') {
      promptShow('🎥', 'O Desafio precisa de movimento: usa a câmara ou um vídeo.', '', null);
      return;
    }
    chooseLevel();
  }
}
function promptShow(emoji, text, stars, btn, onBtn, cls = '', opts = null) {
  const p = $('#prompt');
  const po = p.querySelector('.p-opts');
  po.hidden = !opts; po.innerHTML = '';
  if (opts) for (const o of opts) { const b = document.createElement('button'); b.innerHTML = o.html; b.onclick = o.on; if (o.cls) b.className = o.cls; po.appendChild(b); }
  p.querySelector('.p-timer').hidden = !cls.includes('timed');
  p.hidden = false; p.className = cls;
  p.querySelector('.p-emoji').textContent = emoji;
  p.querySelector('.p-text').textContent = text;
  p.querySelector('.p-stars').textContent = stars;
  const b = p.querySelector('.p-btn');
  b.hidden = !btn; if (btn) { b.textContent = btn; b.onclick = onBtn; }
  p.classList.remove('pop'); void p.offsetWidth; p.classList.add('pop');
  if (!quizEl.hidden) placeQuiz();
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// ---------- escada de 12 níveis
const prog = () => (S.prog && S.prog.best ? S.prog : (S.prog = { max: 1, best: {} }));
const levelUnlocked = n => !!S.unlockAll || n <= prog().max;
function chooseLevel() {
  if (sourceKind === 'image') { promptShow('🎥', 'O Desafio precisa de movimento: usa a câmara ou um vídeo.', '', null); return; }
  const opts = LADDER.map((L, i) => {
    const n = i + 1, ok = levelUnlocked(n), b = prog().best[n], e = ETAPAS[L.etapa];
    return {
      html: `<b>${ok ? n : '🔒'}</b><span>${e.emoji} ${L.titulo}</span><small>${b != null ? '⭐ ' + b + '/' + L.rondas : ok ? e.idade : 'trancado'}</small>`,
      cls: ok ? '' : 'locked',
      on: () => ok ? startLevel(n) : (toast('🔒 Ganha pelo menos 60% das estrelas no nível anterior para abrir este.', 3200), speak('Este nível ainda está trancado.')),
    };
  });
  const extra = sourceKind === 'video' ? ' Num vídeo gravado só passa se lá estiverem as caretas certas!' : '';
  promptShow('⭐', `Desafio! Escolhe o nível.${extra}`, '', null, null, 'levels', opts);
  speak('Desafio! Escolhe o nível.');
}
function startLevel(n) {
  const L = LADDER[n - 1];
  S.layers.skull = true; S.layers.hands = true; refreshUI();
  ch = { list: buildRounds(L), i: -1, stars: 0, phase: 'next', t: 0, hold: 0, n, L, lvl: L.cient ? 'cientistas' : 'base' };
  if (n >= 10) toast('🩺 Treino de anatomia — não é um instrumento de diagnóstico.', 4500);
  nextRound();
}
const FEM = new Set(['glabela', 'atm']);
const ladoWord = (side, g) => side === 1 ? (g === 'f' ? 'esquerda' : 'esquerdo') : (g === 'f' ? 'direita' : 'direito');
const mestreTxt = c => (c.pedeCient || c.pede).split(':')[0].replace(/[!.]?$/, '!');
function buildRounds(L) {
  const withBody = S.layers.body && bodyRig?.on;
  const gens = L.mix.filter(([k]) => k !== 'corpo' || withBody);
  const used = new Set(), out = [];
  const pick = (arr, key) => { const free = arr.filter(x => !used.has(key(x))); const src = free.length ? free : arr; const x = src[Math.floor(Math.random() * src.length)]; used.add(key(x)); return x; };
  const SIMPLE_C = ['mZigomatico', 'mandibula', 'mOrbBoca', 'mOrbOlho'], SIMPLE_T = ['nasal', 'mandibula', 'cranio', 'dentes'];
  const nm = it => L.cient && it.cient ? it.cient : it.nome;
  const make = ([k, arg]) => {
    if (k === 'cara') {
      const c = pick(CHALLENGES.filter(c => c.tipo === 'cara' && (arg !== 'simples' || SIMPLE_C.includes(c.alvo))), x => 'c' + x.alvo);
      return { ...c, txt: L.mestre ? mestreTxt(c) : L.cient && c.pedeCient ? c.pedeCient : c.pede, key: 'c' + c.alvo };
    }
    if (k === 'toque') {
      const c = pick(CHALLENGES.filter(c => c.tipo === 'toque' && (arg !== 'simples' || SIMPLE_T.includes(c.alvo))), x => 't' + x.alvo);
      return { ...c, txt: L.cient && c.pedeCient ? c.pedeCient : c.pede, key: 't' + c.alvo };
    }
    if (k === 'lado') {
      const t = pick(LADO, x => 'l' + x.alvo), side = Math.random() < 0.5 ? 1 : -1;
      const txt = (L.cient ? t.cient : t.pede).replace('{lado}', ladoWord(side, L.cient ? t.gc : t.g));
      return { tipo: 'toque', alvo: t.alvo, side, txt, emoji: side === 1 ? '👈' : '👉', ok: `Isso! Lado ${side === 1 ? 'esquerdo' : 'direito'} certinho.`, key: 'l' + t.alvo };
    }
    if (k === 'seq') {
      const items = shuffle(SEQ_ITEMS.slice()).slice(0, arg);
      return { tipo: 'seq', items, txt: 'Repete: ' + items.map(x => x.emoji).join(' → '), say: 'Repete: ' + items.map(x => x.nome).join(', depois '), emoji: '🧠', ok: 'Memória de campeão! Sequência completa.', key: 's' + Math.random() };
    }
    if (k === 'combo') { const c = pick(COMBOS, x => x.pede); return { tipo: 'cara', teste: c.teste, alvos: c.alvos, alvo: c.alvos[0], txt: c.pede, emoji: c.emoji, ok: c.ok, key: c.pede }; }
    if (k === 'quiz') {
      const q = pick(arg === 1 ? QUIZ : QUIZ_MAIS.filter(x => x.d === arg), x => x.p);
      return { tipo: 'quiz', q, txt: q.p, emoji: arg >= 4 ? '🩺' : arg === 3 ? '🎓' : '❓', key: q.p };
    }
    if (k === 'qualOsso') {
      const pool = PARTS.filter(p => ['skull', 'spine'].includes(p.layer));
      const p = pick(pool, x => 'o' + x.id);
      const opts = shuffle([p, ...shuffle(pool.filter(x => x !== p)).slice(0, 2)]);
      return { tipo: 'quiz', mostra: p.id, mostraKind: 'part', q: { p: 'Que osso é este?', o: opts.map(nm), c: opts.indexOf(p), explica: p.facto }, txt: 'Que osso está no círculo verde? Aponta para a resposta.', emoji: '🦴', key: 'o' + p.id };
    }
    if (k === 'qualMusculo') {
      const m = pick(MUSCLES, x => 'm' + x.id);
      const opts = shuffle([m, ...shuffle(MUSCLES.filter(x => x !== m)).slice(0, 2)]);
      return { tipo: 'quiz', mostra: m.id, mostraKind: 'muscle', alvo: m.id, q: { p: 'Que músculo é este?', o: opts.map(x => x.cient), c: opts.indexOf(m), explica: m.facto }, txt: 'Que músculo está a brilhar? Aponta para a resposta.', emoji: '💪', key: 'm' + m.id };
    }
    if (k === 'marco') {
      const lm = pick(LANDMARKS, x => 'k' + x.id), side = lm.par ? (Math.random() < 0.5 ? 1 : -1) : null;
      const art = FEM.has(lm.id) ? 'na tua' : 'no teu';
      return { tipo: 'toque', marco: true, alvo: lm.id, side, txt: `Toca ${art} ${lm.nome}${side ? ' ' + ladoWord(side, lm.g) : ''}!`, emoji: '📍', ok: 'Certo! ' + lm.facto, key: 'k' + lm.id };
    }
    if (k === 'clinico') { const c = pick(CLINICAL, x => x.pede); return { tipo: 'cara', teste: c.teste, alvos: c.alvos, alvo: c.alvos[0], hold: c.hold, txt: c.pede, emoji: c.emoji, ok: c.ok, key: c.pede }; }
    if (k === 'olhar') { const g = pick(GAZE, x => x.dir); return { tipo: 'olhar', dir: g.dir, txt: g.pede, emoji: g.emoji, ok: g.ok, key: 'g' + g.dir }; }
    if (k === 'corpo') { const c = pick(BODY_CHALLENGES, x => x.alvo); return { ...c, corpo: c.tipo === 'toque' || c.corpo, txt: L.cient && c.pedeCient ? c.pedeCient : c.pede, key: 'b' + c.alvo }; }
    return null;
  };
  const order = shuffle(gens.slice());
  for (let i = 0; i < L.rondas; i++) {
    let r = make(order[i % order.length]);
    if (r && out.length && out[out.length - 1].key === r.key) r = make(order[i % order.length]);
    if (r) out.push(r);
  }
  return out;
}
const pedido = c => c.txt || c.pede;
function starsStr() { return '⭐'.repeat(ch.stars) + '☆'.repeat(ch.list.length - ch.stars); }
function nextRound() {
  ch.i++; ch.hold = 0; ch.seqI = 0; ch.g0 = null; ch.t = performance.now();
  if (ch.i >= ch.list.length) {
    ch.phase = 'end'; hideQuiz();
    const n = ch.n, need = Math.ceil(ch.list.length * 0.6), pass = ch.stars >= need, P = prog();
    P.best[n] = Math.max(P.best[n] || 0, ch.stars);
    let msg = ch.stars === ch.list.length ? `Perfeito! ${ch.stars} estrelas no nível ${n}!` : `Nível ${n}: ${ch.stars} de ${ch.list.length} estrelas.`;
    if (pass && n < LADDER.length) { if (P.max <= n) { P.max = n + 1; msg += ` Desbloqueaste o nível ${n + 1}! 🔓`; } }
    else if (pass && n === LADDER.length) msg += ' És um mestre do raio-X! 🩺🏆';
    else msg += ` Precisas de ${need} estrelas para abrir o nível seguinte. Tenta outra vez!`;
    saveSettings();
    const opts = [];
    if (n < LADDER.length && levelUnlocked(n + 1)) opts.push({ html: `<b>▶</b>Nível ${n + 1}`, on: () => startLevel(n + 1) });
    opts.push({ html: '<b>🔁</b>Repetir', on: () => startLevel(n) }, { html: '<b>🎚️</b>Níveis', on: chooseLevel });
    promptShow(pass ? '🏆' : '💪', msg, starsStr(), null, null, pass ? 'ok' : '', opts);
    speak(msg.replace(/[🔓🩺🏆]/gu, '')); if (pass) { confetti(vw / 2, vh * 0.35, 160); sndOk(); }
    return;
  }
  ch.phase = 'ask';
  const c = ch.list[ch.i];
  hideQuiz();
  promptShow(c.emoji, pedido(c), starsStr(), null, null, 'timed', [{ html: '⏭️ Saltar', on: () => { if (ch?.phase === 'ask') { ch.phase = 'skip'; ch.t = performance.now(); ch.skipSaid = false; } } }]);
  if (c.tipo === 'quiz') showQuiz(c.q);
  speak(c.say || pedido(c));
}
// direcção do olhar a partir da íris (referencial local da cabeça: x = esquerda da pessoa, y = cima)
function toLocal(p, i, lm) {
  const wx = lm[i * 3] - p.C.x, wy = -lm[i * 3 + 1] - p.C.y, wz = -lm[i * 3 + 2] - p.C.z;
  return [(wx * p.X.x + wy * p.X.y + wz * p.X.z) / p.kx, (wx * p.Y.x + wy * p.Y.y + wz * p.Y.z) / p.ky];
}
function gazeOf(f) {
  const p = f.pose, lm = f.lm;
  const irisA = toLocal(p, 468, lm), irisB = toLocal(p, 473, lm);
  const eyes = [[33, 133], [263, 362]].map(([o, i]) => { const a = toLocal(p, o, lm), b = toLocal(p, i, lm); return { cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2, w: Math.abs(a[0] - b[0]) || 1 }; });
  let gx = 0, gy = 0;
  for (const ir of [irisA, irisB]) { const e = ir[0] < 0 ? eyes[0] : eyes[1]; gx += (ir[0] - e.cx) / e.w / 2; gy += (ir[1] - e.cy) / e.w / 2; }
  return { gx, gy };
}
// relativo à posição de partida (quem olha para um portátil já tem os olhos um pouco para baixo)
function gazeNow(f) {
  const g = gazeOf(f), b = f.bs;
  return { gx: g.gx, gy: g.gy, up: ((b.eyeLookUpLeft || 0) + (b.eyeLookUpRight || 0)) / 2, dn: ((b.eyeLookDownLeft || 0) + (b.eyeLookDownRight || 0)) / 2 };
}
function gazeOk(f, dir, g0) {
  if (DEBUG.gaze) return DEBUG.gaze === dir;
  const g = gazeNow(f), z = g0 || { gx: 0, gy: 0, up: 0, dn: 0 };
  if (dir === 'esq') return g.gx - z.gx > 0.09;
  if (dir === 'dir') return g.gx - z.gx < -0.09;
  if (dir === 'cima') return g.gy - z.gy > 0.05 || (g.up - z.up > 0.3 && g.up > 0.45);
  return z.gy - g.gy > 0.045 || (g.dn - z.dn > 0.25 && g.dn > 0.55);
}
function landmarkTargets(f, id, side) {
  const out = []; if (!f || !f.rig) return out;
  const lm = LANDMARKS.find(x => x.id === id); if (!lm) return out;
  for (const s of lm.par ? [1, -1] : [1]) {
    if (side != null && lm.par && s !== side) continue;
    const [x, y] = projRig(f.rig, lm.a[0] * s, lm.a[1], lm.a[2], lm.jaw ? f.rig.jawAngle : null);
    out.push({ kind: 'part', id, x, y, fc: 1, side: s });
  }
  return out;
}
// ---------- quiz (responde com o dedo ou com um clique)
const quizEl = $('#quiz');
function showQuiz(q) {
  quizEl.hidden = false;
  quizEl.innerHTML = q.o.map((o, i) => `<button data-i="${i}"><span class="fill"></span>${o}</button>`).join('');
  quizEl.dwell = { i: -1, t: 0 };
  placeQuiz();
}
function placeQuiz() {
  const pr = $('#prompt');
  if (matchMedia('(max-width: 700px)').matches) { quizEl.style.top = 'auto'; quizEl.style.bottom = pr.hidden ? '8px' : `${innerHeight - pr.getBoundingClientRect().top + 8}px`; return; }
  quizEl.style.bottom = '';
  quizEl.style.top = pr.hidden ? '' : `${Math.max(pr.offsetTop + pr.offsetHeight + 14, quizEl.parentElement.clientHeight * 0.24)}px`;
}
function hideQuiz() { quizEl.hidden = true; quizEl.innerHTML = ''; }
quizEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) answerQuiz(+b.dataset.i); });
function answerQuiz(i) {
  if (!ch || ch.phase !== 'ask') return;
  const c = ch.list[ch.i]; if (c?.tipo !== 'quiz') return;
  const btns = [...quizEl.querySelectorAll('button')];
  btns.forEach((b, k) => { b.classList.toggle('right', k === c.q.c); b.classList.toggle('wrong', k === i && i !== c.q.c); });
  const r = btns[i]?.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  const x = r ? (r.left + r.width / 2 - sr.left) / sr.width * vw : vw / 2, y = r ? (r.top - sr.top) / sr.height * vh : vh / 3;
  if (i === c.q.c) roundOk(x, y, `Certo! ${c.q.explica}`);
  else {
    ch.phase = 'ok'; ch.t = performance.now();
    const msg = `Quase! A resposta certa é ${c.q.o[c.q.c]}. ${c.q.explica}`;
    promptShow('🤔', msg, starsStr(), null); speak(msg);
  }
}
function roundOk(x, y, msg = null) {
  const c = ch.list[ch.i];
  ch.phase = 'ok'; ch.stars++; ch.t = performance.now();
  const txt = msg || c.ok;
  promptShow('🎉', txt, starsStr(), null, null, 'ok');
  speak(txt); sndOk(); confetti(x ?? vw / 2, y ?? vh * 0.3);
  const it = [...PARTS, ...MUSCLES, ...BODY_PARTS].find(p => p.id === c.alvo);
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
  const R = f0 ? f0.faceW * 0.13 : (bodyRig?.on ? body.w * 0.1 : vw * 0.05);
  fxDraw.tips = tips; fxDraw.progress = null; fxDraw.hintAt = null;

  if (mode === 'tocar' && (f0 || bodyRig?.on)) {
    const targets = [...collectTargets(f0, { touch: true }), ...bodyTargets()];
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

  if (mode === 'desafio' && ch && ch.list) {
    const c = ch.list[ch.i];
    const el = (now - ch.t) / 1000;
    if (ch.phase === 'ask' && c) {
      const limit = (ch.L?.tempo || 25) + (c.tipo === 'quiz' ? 12 : c.tipo === 'seq' ? 10 : 0);
      const bar = $('#prompt .p-timer i'); if (bar) bar.style.width = `${clamp(100 - el / limit * 100, 0, 100)}%`;
      const hintAfter = (ch.n || 1) >= 10 ? 12 : 7;
      if (c.tipo === 'cara' && f0) {
        const ok = c.teste(f0.bs, { mastigar: f0.chew });
        ch.hold = ok ? ch.hold + dt : Math.max(0, ch.hold - dt * 2);
        if (ch.hold > (c.hold || (c.alvo === 'mMasseter' ? 0.8 : 0.35))) roundOk(vw - f0.lm[1 * 3], f0.lm[1 * 3 + 1] - f0.faceW * 0.6);
      } else if (c.tipo === 'seq' && f0) {
        const it = c.items[ch.seqI];
        ch.hold = it.teste(f0.bs) ? ch.hold + dt : Math.max(0, ch.hold - dt * 2);
        if (ch.hold > 0.3) {
          ch.seqI++; ch.hold = 0; sndTick();
          $('#prompt .p-text').textContent = 'Repete: ' + c.items.map((x, k) => k < ch.seqI ? '✅' : x.emoji).join(' → ');
          if (ch.seqI >= c.items.length) roundOk(vw - f0.lm[3], f0.lm[4] - f0.faceW * 0.6);
        }
      } else if (c.tipo === 'olhar' && f0) {
        if (el < 0.7 || !ch.g0) {
          const g = gazeNow(f0);
          ch.g0 = ch.g0 ? Object.fromEntries(Object.keys(g).map(k => [k, lerp(ch.g0[k], g[k], 0.25)])) : g;
        }
        const ok = el >= 0.7 && gazeOk(f0, c.dir, ch.g0);
        ch.hold = ok ? ch.hold + dt : Math.max(0, ch.hold - dt * 2);
        if (ch.hold > 0.4) roundOk(vw - f0.lm[3], f0.lm[4] - f0.faceW * 0.6);
      } else if (c.tipo === 'corpo') {
        const v = body.vis, l = body.lm;
        const ok = body.active && l && v[15] > VIS && v[16] > VIS && l[15 * 3 + 1] < l[1] && l[16 * 3 + 1] < l[1];
        ch.hold = ok ? ch.hold + dt : Math.max(0, ch.hold - dt);
        if (ok && ch.hold > 0.4) roundOk(vw - l[0], l[1] - body.w * 0.5);
        if (!body.active && el > 4) $('#hint').textContent = TXT.semCorpo;
      } else if (c.tipo === 'quiz') {
        if (c.mostra) {
          selected = { id: c.mostra, until: now + 400 };
          let anchors = [];
          if (c.mostraKind === 'part') anchors = collectTargets(f0, { all: true }).filter(t => t.id === c.mostra && t.kind === 'part' && !t.extra);
          else if (f0?.mgeo) anchors = Object.entries(f0.mgeo).filter(([k]) => k.startsWith(c.mostra)).map(([, g]) => ({ x: g.c[0], y: g.c[1] }));
          fxDraw.hintAt = anchors;
        }
        const sr = stage.getBoundingClientRect();
        let hot = -1;
        const btns = [...quizEl.querySelectorAll('button')];
        for (const tip of tips) {
          const cx = sr.left + (vw - tip[0]) / vw * sr.width, cy = sr.top + tip[1] / vh * sr.height;
          btns.forEach((b, k) => { const r = b.getBoundingClientRect(); if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) hot = k; });
        }
        const d = quizEl.dwell || (quizEl.dwell = { i: -1, t: 0 });
        if (hot >= 0) { if (d.i === hot) d.t += dt; else { d.i = hot; d.t = 0; } } else { d.i = -1; d.t = 0; }
        btns.forEach((b, k) => { b.classList.toggle('hot', k === d.i); b.querySelector('.fill').style.transform = `scaleX(${k === d.i ? clamp(d.t / 0.9, 0, 1) : 0})`; });
        if (d.i >= 0 && d.t > 0.9) { const k = d.i; d.i = -1; answerQuiz(k); }
      } else if (c.tipo === 'toque' && (f0 || c.corpo)) {
        let targets;
        if (c.marco) targets = landmarkTargets(f0, c.alvo, c.side);
        else if (c.corpo) targets = bodyTargets({ all: true }).filter(t => t.id === c.alvo);
        else targets = collectTargets(f0, { all: true, touch: true }).filter(t => t.id === c.alvo && t.kind === 'part' && (c.side == null || (t.side === c.side && !t.extra)));
        const hit = nearestTarget(tips, targets, R * (c.marco ? 1.0 : 1.15));
        if (hit) { ch.hold += dt; fxDraw.progress = { x: hit.tip[0], y: hit.tip[1], p: clamp(ch.hold / 0.45, 0, 1) }; }
        else ch.hold = Math.max(0, ch.hold - dt);
        if (hit && ch.hold > 0.45) roundOk(vw - hit.tip[0], hit.tip[1]);
        if (el > hintAfter) fxDraw.hintAt = targets;
        if (!tips.length && noHandSince && now - noHandSince > 3500) $('#hint').textContent = TXT.semMao;
      }
      if (el > limit && ch.phase === 'ask') { ch.phase = 'skip'; ch.t = now; ch.skipSaid = false; }
    } else if (ch.phase === 'skip') {
      if (!ch.skipSaid) { ch.skipSaid = true; ch.t = now; promptShow('🙂', 'Esta fica para a próxima! Vamos à seguinte.', starsStr(), null); speak('Esta fica para a próxima!'); hideQuiz(); }
      else if (el > 1.8) nextRound();
    } else if (ch.phase === 'ok' && el > (c?.tipo === 'quiz' ? 5.5 : 3.2)) nextRound();
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


// ================================================================== MODO OBJECTOS
let objLM = null, objLoading = null, objLast = 0, objRaw = [];
const objTracks = []; let objNextId = 1;
const objSaid = {}; let objLastSay = 0, objNoneSince = 0;
function ensureObj() {
  if (objLM || objLoading || !fileset) return;
  objLoading = (async () => {
    toast('📦 A preparar o detector de objectos…', 2200);
    const buf = await loadModel(CFG.objModel, CFG.checkSha === false ? null : MODEL_SHA.obj);
    objLM = await mkTask(ObjectDetector, { baseOptions: { modelAssetBuffer: buf }, runningMode: 'VIDEO', maxResults: 8, scoreThreshold: 0.4 });
  })().catch(e => { console.error(e); toast('Não consegui carregar o detector de objectos.'); objLoading = null; });
}
function iou(a, b) {
  const x0 = Math.max(a[0], b[0]), y0 = Math.max(a[1], b[1]), x1 = Math.min(a[0] + a[2], b[0] + b[2]), y1 = Math.min(a[1] + a[3], b[1] + b[3]);
  const i = Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
  return i / (a[2] * a[3] + b[2] * b[3] - i || 1);
}
function updateObjects(dets, t) {
  const list = dets.map(d => ({ cls: d.categories[0].categoryName, score: d.categories[0].score, b: [d.boundingBox.originX, d.boundingBox.originY, d.boundingBox.width, d.boundingBox.height] }))
    .filter(d => OBJECTS[d.cls] && d.cls !== 'person' && (S.objMov || !OBJECTS[d.cls].mov));
  for (const tr of objTracks) tr.matched = false;
  for (const d of list) {
    let best = null, bi = 0.2;
    for (const tr of objTracks) if (!tr.matched && tr.cls === d.cls) { const v = iou(tr.b, d.b); if (v > bi) { bi = v; best = tr; } }
    if (best) { best.b = best.b.map((v, i) => lerp(v, d.b[i], 0.55)); best.score = lerp(best.score, d.score, 0.4); best.last = t; best.matched = true; best.hits++; }
    else objTracks.push({ id: objNextId++, cls: d.cls, b: d.b.slice(), score: d.score, first: t, last: t, hits: 1, matched: true });
  }
  for (let i = objTracks.length - 1; i >= 0; i--) if (t - objTracks[i].last > 1.0) objTracks.splice(i, 1);
}
const stableObjs = t => objTracks.filter(tr => tr.hits >= 3 && t - tr.first > 0.35);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const joinPT = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];
function objItem(cls) {
  const o = OBJECTS[cls];
  return { nome: cap(o.n), cient: `Em inglês: ${o.en}`, emoji: o.e, facto: o.f || 'Que mais consegues encontrar? Mostra-me outra coisa!' };
}
function objSummaryText(objs) {
  const cnt = {};
  for (const tr of objs) cnt[tr.cls] = (cnt[tr.cls] || 0) + 1;
  return joinPT(Object.entries(cnt).map(([c, n]) => `${n} ${n > 1 ? objPlural(OBJECTS[c]) : OBJECTS[c].n}`));
}

// ---------- raio-X dos objectos (desenhos ilustrativos dentro da caixa do objecto)
function objStyle(ctx, t, i, k) {
  const op = S.anat;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, k * 0.014);
  if (S.look === 'solid') {
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = `rgba(250,240,220,${0.95 * op})`; ctx.fillStyle = `rgba(245,232,205,${0.35 * op})`; ctx.shadowBlur = 0;
  } else {
    ctx.globalCompositeOperation = 'lighter';
    const col = S.look === 'neon' ? `hsla(${(t * 60 + i * 70) % 360},100%,70%,` : 'rgba(190,240,255,';
    ctx.strokeStyle = col + (0.85 * op * Math.min(1.3, S.bright)) + ')'; ctx.fillStyle = col + (0.1 * op) + ')';
    ctx.shadowColor = S.look === 'neon' ? ctx.strokeStyle : '#6fe3ff'; ctx.shadowBlur = objTracks.length <= 3 ? k * 0.04 : 0; // brilho só com poucos objectos (é pesado)
  }
}
const XR = {};
function drawObjXray(tr, t) {
  const o = OBJECTS[tr.cls]; if (!o.x || !XR[o.x]) return;
  const [bx, by, bw, bh] = tr.b, k = Math.min(bw, bh);
  const ctx = mctx; ctx.save();
  objStyle(ctx, t, tr.id, k);
  const fade = clamp((t - tr.first) / 0.5, 0, 1); ctx.globalAlpha = fade;
  // primitivas em coordenadas da caixa (u, v de 0 a 1)
  const g = {
    t, k, bw, bh, cls: tr.cls, wide: bw > bh,
    P: (u, v) => [bx + u * bw, by + v * bh],
    line(pts, close = false, fill = false) { ctx.beginPath(); pts.forEach(([u, v], i) => { const x = bx + u * bw, y = by + v * bh; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); if (close) ctx.closePath(); if (fill) ctx.fill(); ctx.stroke(); },
    ell(u, v, ru, rv, fill = false, rot = 0) { ctx.beginPath(); ctx.ellipse(bx + u * bw, by + v * bh, Math.max(0.5, ru * bw), Math.max(0.5, rv * bh), rot, 0, Math.PI * 2); if (fill) ctx.fill(); ctx.stroke(); },
    circ(u, v, r, fill = false) { ctx.beginPath(); ctx.arc(bx + u * bw, by + v * bh, Math.max(0.5, r * k), 0, Math.PI * 2); if (fill) ctx.fill(); ctx.stroke(); },
    dot(u, v, r) { ctx.beginPath(); ctx.arc(bx + u * bw, by + v * bh, Math.max(0.8, r * k), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); },
    rect(u, v, w, h, fill = false) { ctx.beginPath(); ctx.rect(bx + u * bw, by + v * bh, w * bw, h * bh); if (fill) ctx.fill(); ctx.stroke(); },
    dash(on) { ctx.setLineDash(on ? [k * 0.03, k * 0.025] : []); },
    thin(f = 0.5) { ctx.lineWidth = Math.max(1, k * 0.014 * f); },
    curve(fn, n = 24, from = 0, to = 1) { const pts = []; for (let i = 0; i <= n; i++) pts.push(fn(from + (to - from) * i / n)); this.line(pts); },
  };
  try { XR[o.x](g); } catch (e) { console.warn(e); }
  ctx.restore();
}
XR.banana = g => {
  const sw = (u, v) => g.wide ? [u, v] : [v, u];
  const c = s => [0.06 + 0.88 * s, 0.74 - 0.42 * Math.sin(Math.PI * s)];
  const th = s => 0.2 * Math.pow(Math.sin(Math.PI * s), 0.6) + 0.02;
  const nrm = s => { const a = c(Math.max(0, s - 0.01)), b = c(Math.min(1, s + 0.01)); const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  const side = (f) => Array.from({ length: 31 }, (_, i) => { const s = i / 30, p = c(s), n = nrm(s); return sw(p[0] + n[0] * th(s) * f, p[1] + n[1] * th(s) * f); });
  g.line([...side(1), ...side(-1).reverse()], true, true);
  g.thin(0.6); g.dash(true); g.line(side(0.45)); g.line(side(-0.45)); g.dash(false);
  for (let s = 0.18; s <= 0.82; s += 0.045) { const p = c(s); g.dot(...sw(p[0], p[1]), 0.008); }
  g.thin(1.2); const a = c(0); g.line([sw(a[0], a[1]), sw(a[0] - 0.04, a[1] - 0.05)]);
};
XR.apple = g => {
  g.line([[0.5, 0.2], [0.3, 0.12], [0.1, 0.3], [0.08, 0.6], [0.25, 0.9], [0.5, 0.95], [0.75, 0.9], [0.92, 0.6], [0.9, 0.3], [0.7, 0.12], [0.5, 0.2]], true, true);
  g.thin(0.7); g.ell(0.5, 0.55, 0.14, 0.27);
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; g.ell(0.5 + Math.cos(a) * 0.08, 0.55 + Math.sin(a) * 0.09, 0.025, 0.04, true, a + Math.PI / 2); }
  g.thin(1.2); g.line([[0.5, 0.2], [0.53, 0.04]]); g.thin(0.7); g.ell(0.62, 0.08, 0.08, 0.035, true, -0.4);
};
XR.orange = g => {
  g.ell(0.5, 0.5, 0.46, 0.46, true); g.thin(0.7); g.ell(0.5, 0.5, 0.4, 0.4);
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + g.t * 0.1; g.line([[0.5 + Math.cos(a) * 0.06, 0.5 + Math.sin(a) * 0.06], [0.5 + Math.cos(a) * 0.4, 0.5 + Math.sin(a) * 0.4]]); }
  g.ell(0.5, 0.5, 0.06, 0.06, true);
  [[0.62, 0.38], [0.36, 0.6], [0.6, 0.66]].forEach(([u, v]) => g.ell(u, v, 0.02, 0.035, true, 0.6));
};
XR.carrot = g => {
  const sw = (u, v) => g.wide ? [v, 1 - u] : [u, v];
  g.line([sw(0.25, 0.2), sw(0.75, 0.2), sw(0.52, 0.98), sw(0.48, 0.98)].map(p => p), true, true);
  g.thin(0.6); g.line([sw(0.5, 0.22), sw(0.5, 0.95)]);
  for (let v = 0.32; v < 0.9; v += 0.1) { const w = 0.25 * (1 - (v - 0.2) / 0.78); g.line([sw(0.5 - w, v), sw(0.5 - w * 0.4, v + 0.02)]); g.line([sw(0.5 + w * 0.4, v + 0.04), sw(0.5 + w, v + 0.02)]); }
  g.thin(1); for (const du of [-0.08, 0, 0.08]) g.line([sw(0.5, 0.2), sw(0.5 + du * 2, 0.02)]);
};
XR.broccoli = g => {
  g.line([[0.42, 1], [0.45, 0.6], [0.55, 0.6], [0.58, 1]], false, true);
  g.thin(0.8); for (const [u, v] of [[0.25, 0.35], [0.4, 0.25], [0.6, 0.25], [0.75, 0.35], [0.5, 0.2]]) g.line([[0.5, 0.62], [u, v]]);
  for (const [u, v, r] of [[0.25, 0.32, 0.12], [0.42, 0.2, 0.14], [0.6, 0.2, 0.14], [0.76, 0.33, 0.12], [0.5, 0.36, 0.12]]) { g.circ(u, v, r, true); g.dot(u, v, 0.012); }
};
XR.ball = g => {
  g.ell(0.5, 0.5, 0.47, 0.47, true); g.dash(true); g.ell(0.5, 0.5, 0.38, 0.38); g.dash(false);
  g.thin(0.8); const pent = Array.from({ length: 5 }, (_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5 + g.t * 0.3; return [0.5 + Math.cos(a) * 0.14, 0.5 + Math.sin(a) * 0.14]; });
  g.line(pent, true); pent.forEach(([u, v]) => g.line([[u, v], [0.5 + (u - 0.5) * 2.6, 0.5 + (v - 0.5) * 2.6]]));
  g.circ(0.5, 0.17, 0.02, true);
};
XR.teddy = g => {
  g.circ(0.5, 0.26, 0.2); g.circ(0.33, 0.1, 0.07); g.circ(0.67, 0.1, 0.07); g.ell(0.5, 0.66, 0.3, 0.3);
  g.thin(0.5);
  for (let i = 0; i < 22; i++) { const a = i * 2.39996, r = Math.sqrt(i / 22) * 0.24; g.circ(0.5 + Math.cos(a) * r, 0.66 + Math.sin(a) * r * 0.95 + Math.sin(g.t * 2 + i) * 0.005, 0.05, true); }
  for (let i = 0; i < 9; i++) { const a = i * 2.39996, r = Math.sqrt(i / 9) * 0.14; g.circ(0.5 + Math.cos(a) * r, 0.27 + Math.sin(a) * r, 0.04, true); }
  g.thin(0.8); g.dash(true); g.line([[0.5, 0.06], [0.5, 0.96]]); g.dash(false);
  const hb = 0.03 + 0.005 * Math.sin(g.t * 6);
  g.line([[0.5, 0.58 + hb], [0.5 - hb * 1.6, 0.58 - hb * 0.4], [0.5 - hb * 0.8, 0.58 - hb * 1.2], [0.5, 0.58 - hb * 0.6], [0.5 + hb * 0.8, 0.58 - hb * 1.2], [0.5 + hb * 1.6, 0.58 - hb * 0.4]], true, true);
};
XR.circuit = g => {
  g.line([[0.06, 0.06], [0.94, 0.06], [0.94, 0.94], [0.06, 0.94]], true);
  const tall = !g.wide;
  const batt = tall ? [0.18, 0.5, 0.64, 0.36] : [0.55, 0.2, 0.36, 0.6];
  g.rect(...batt, true); g.thin(0.7);
  const bc = [batt[0] + batt[2] / 2, batt[1] + batt[3] / 2];
  g.line([[bc[0] - 0.05, bc[1]], [bc[0] + 0.05, bc[1]]]); g.line([[bc[0], bc[1] - 0.04], [bc[0], bc[1] + 0.04]]);
  const chips = tall ? [[0.22, 0.14, 0.22, 0.14], [0.56, 0.18, 0.2, 0.1], [0.3, 0.36, 0.12, 0.07]] : [[0.12, 0.2, 0.18, 0.24], [0.14, 0.58, 0.14, 0.18], [0.36, 0.3, 0.1, 0.14]];
  chips.forEach(c => { g.rect(...c, true); for (let i = 1; i < 5; i++) { const u = c[0] + c[2] * i / 5; g.line([[u, c[1]], [u, c[1] - 0.025]]); g.line([[u, c[1] + c[3]], [u, c[1] + c[3] + 0.025]]); } });
  const tr = tall ? [[[0.33, 0.28], [0.33, 0.33], [0.36, 0.36]], [[0.66, 0.28], [0.66, 0.44], [0.5, 0.44], [0.5, 0.5]], [[0.42, 0.4], [0.82, 0.4], [0.82, 0.86]], [[0.1, 0.3], [0.1, 0.86], [0.18, 0.86]]]
    : [[[0.3, 0.32], [0.36, 0.32], [0.36, 0.36]], [[0.46, 0.37], [0.55, 0.37]], [[0.21, 0.44], [0.21, 0.58]], [[0.28, 0.67], [0.5, 0.67], [0.5, 0.75], [0.55, 0.75]], [[0.21, 0.2], [0.21, 0.1], [0.8, 0.1], [0.8, 0.2]]];
  tr.forEach(p => { g.line(p); g.dot(...p[0], 0.008); g.dot(...p[p.length - 1], 0.008); });
  // pulso de electricidade a percorrer os caminhos
  const p = tr[Math.floor(g.t * 1.2) % tr.length], f = (g.t * 1.2) % 1, i = Math.min(p.length - 2, Math.floor(f * (p.length - 1))), s = f * (p.length - 1) - i;
  g.dot(lerp(p[i][0], p[i + 1][0], s), lerp(p[i][1], p[i + 1][1], s), 0.018);
  if (g.cls === 'remote') { g.circ(0.5, 0.04, 0.03, true); for (const a of [-0.5, 0, 0.5]) g.line([[0.5 + a * 0.05, 0.0], [0.5 + a * 0.18, -0.08]]); }
};
function gear(g, u, v, r, teeth, rot) {
  const pts = [];
  for (let i = 0; i < teeth * 2; i++) { const a = rot + i * Math.PI / teeth, rr = r * (i % 2 ? 0.8 : 1); pts.push([u + Math.cos(a) * rr * g.k / g.bw, v + Math.sin(a) * rr * g.k / g.bh]); }
  g.line(pts, true, true); g.circ(u, v, r * 0.25);
}
XR.clock = g => {
  g.ell(0.5, 0.5, 0.47, 0.47); gear(g, 0.4, 0.42, 0.2, 10, g.t * 0.8); gear(g, 0.64, 0.62, 0.14, 7, -g.t * 1.15 + 0.2);
  g.thin(1.3); const a = g.t * 0.5; g.line([[0.5, 0.5], [0.5 + Math.cos(a) * 0.32, 0.5 + Math.sin(a) * 0.32]]); g.line([[0.5, 0.5], [0.5 + Math.cos(a / 12) * 0.2, 0.5 + Math.sin(a / 12) * 0.2]]);
};
XR.liquid = g => {
  const neck = g.cls === 'bottle' ? 0.3 : 0;
  g.line(neck ? [[0.38, 0.02], [0.38, 0.22], [0.15, 0.36], [0.15, 0.95], [0.85, 0.95], [0.85, 0.36], [0.62, 0.22], [0.62, 0.02]] : [[0.1, 0.05], [0.14, 0.95], [0.86, 0.95], [0.9, 0.05]]);
  const lvl = neck ? 0.5 : 0.45, x0 = neck ? 0.16 : 0.12, x1 = neck ? 0.84 : 0.88;
  const wave = Array.from({ length: 21 }, (_, i) => { const u = x0 + (x1 - x0) * i / 20; return [u, lvl + Math.sin(i * 0.9 + g.t * 3) * 0.015]; });
  g.line([...wave, [x1, 0.93], [x0, 0.93]], true, true);
  g.thin(0.6); for (let i = 0; i < 7; i++) { const ph = (g.t * 0.35 + i * 0.137) % 1; g.circ(x0 + 0.06 + ((i * 0.37) % 1) * (x1 - x0 - 0.12), 0.92 - ph * (0.92 - lvl - 0.03), 0.012 + 0.006 * (i % 3)); }
};
XR.book = g => {
  g.rect(0.05, 0.04, 0.9, 0.92, true); g.thin(1.4); g.line([[0.12, 0.04], [0.12, 0.96]]);
  g.thin(0.5); for (let v = 0.12; v < 0.9; v += 0.06) { let u = 0.2; while (u < 0.88) { const w = 0.04 + ((u * 97 + v * 31) % 0.1); g.line([[u, v], [Math.min(0.88, u + w), v]]); u += w + 0.025; } }
};
XR.quad = g => {
  if (g.bh > g.bw * 1.2) { // de frente / sentado
    g.ell(0.5, 0.18, 0.18, 0.12, true); g.circ(0.43, 0.17, 0.03); g.circ(0.57, 0.17, 0.03);
    g.line([[0.5, 0.3], [0.5, 0.82]]);
    for (let i = 0; i < 6; i++) { const v = 0.38 + i * 0.045, w = 0.17 - Math.abs(i - 2) * 0.015; g.curve(s => [0.5 - w + 2 * w * s, v + Math.sin(Math.PI * s) * 0.04], 12); }
    g.ell(0.5, 0.8, 0.16, 0.06); for (const s of [-1, 1]) { g.line([[0.5 + s * 0.15, 0.36], [0.5 + s * 0.2, 0.62], [0.5 + s * 0.17, 0.95]]); g.line([[0.5 + s * 0.12, 0.82], [0.5 + s * 0.28, 0.9], [0.5 + s * 0.22, 0.97]]); }
    return;
  }
  const gir = g.cls === 'giraffe', ele = g.cls === 'elephant';
  const sh = gir ? [0.62, 0.5] : [0.72, 0.36], hip = [0.24, 0.4];
  const skull = gir ? [0.82, 0.1] : ele ? [0.86, 0.32] : [0.86, 0.24];
  g.ell(skull[0], skull[1], ele ? 0.11 : 0.09, ele ? 0.13 : 0.07, true, gir ? -0.3 : 0.15);
  g.thin(0.8); g.curve(s => [lerp(sh[0], skull[0] - 0.04, s), lerp(sh[1], skull[1] + 0.04, s) - Math.sin(Math.PI * s) * 0.03], 10);
  for (let s = 0; s <= 1; s += 0.2) g.dot(lerp(sh[0], skull[0] - 0.04, s), lerp(sh[1], skull[1] + 0.04, s) - Math.sin(Math.PI * s) * 0.03, 0.012);
  if (ele) { g.curve(s => [0.9 + Math.sin(s * 2.2) * 0.05, 0.4 + s * 0.45], 12); g.curve(s => [0.84 + s * 0.12, 0.42 + Math.sin(s * 3) * 0.06], 8); }
  g.thin(1.2); g.curve(s => [lerp(hip[0], sh[0], s), lerp(hip[1], sh[1], s) - Math.sin(Math.PI * s) * 0.05], 16);
  g.thin(0.8); g.curve(s => [hip[0] - s * 0.2, hip[1] + Math.sin(s * 2) * 0.15], 10);
  for (let i = 0; i < 8; i++) { const u = lerp(sh[0] - 0.03, hip[0] + 0.14, i / 7), v0 = lerp(sh[1], hip[1], (u - sh[0]) / (hip[0] - sh[0])) - 0.04; g.curve(s => [u - s * 0.04, v0 + s * (0.24 - Math.abs(i - 3) * 0.015)], 8); }
  g.ell(hip[0] + 0.02, hip[1] + 0.03, 0.07, 0.06);
  for (const [x, dx] of [[sh[0] - 0.02, 0.02], [sh[0] + 0.02, -0.01], [hip[0], 0.03], [hip[0] + 0.05, -0.02]]) { g.line([[x, sh[1] === hip[1] ? hip[1] : (x > 0.5 ? sh[1] : hip[1]) + 0.05], [x + dx, 0.72], [x - dx, 0.94]]); g.dot(x + dx, 0.72, 0.012); }
};
XR.bird = g => {
  g.ell(0.75, 0.25, 0.09, 0.08, true); g.line([[0.83, 0.24], [0.97, 0.28], [0.83, 0.3]], true);
  g.thin(0.8); g.curve(s => [0.7 - s * 0.12, 0.3 + s * 0.15 + Math.sin(s * 6) * 0.02], 10);
  g.ell(0.48, 0.55, 0.16, 0.14, true); for (let i = 0; i < 5; i++) g.curve(s => [0.38 + i * 0.05, 0.45 + s * 0.2], 6);
  g.thin(1.1); g.line([[0.55, 0.45], [0.35, 0.3], [0.12, 0.38]]); g.thin(0.6); for (let i = 0; i < 5; i++) g.line([[0.12 + i * 0.04, 0.37 - i * 0.01], [0.05 + i * 0.05, 0.25 - i * 0.02]]);
  g.thin(0.9); g.line([[0.32, 0.6], [0.12, 0.66]]); for (const x of [0.44, 0.52]) { g.line([[x, 0.66], [x - 0.02, 0.8], [x + 0.01, 0.95]]); g.line([[x + 0.01, 0.95], [x + 0.06, 0.97]]); g.line([[x + 0.01, 0.95], [x - 0.04, 0.97]]); }
};
XR.car = g => {
  for (const u of [0.22, 0.78]) { g.ell(u, 0.8, 0.12, 0.14, true); g.ell(u, 0.8, 0.03, 0.035); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + g.t * 3; g.line([[u, 0.8], [u + Math.cos(a) * 0.1, 0.8 + Math.sin(a) * 0.12]]); } }
  g.thin(1.2); g.line([[0.22, 0.8], [0.78, 0.8]]); g.line([[0.05, 0.62], [0.95, 0.62]]);
  g.thin(0.8); g.rect(0.7, 0.4, 0.2, 0.2, true); for (let i = 0; i < 4; i++) { const ph = Math.sin(g.t * 10 + i * 1.6) * 0.03; g.rect(0.72 + i * 0.045, 0.43 + ph, 0.03, 0.08); }
  g.line([[0.7, 0.55], [0.55, 0.55], [0.55, 0.8]]); g.rect(0.15, 0.3, 0.12, 0.3); g.rect(0.35, 0.3, 0.12, 0.3);
};
XR.bike = g => {
  for (const u of [0.2, 0.8]) { g.circ(u, 0.68, 0.22); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + g.t * 2; g.line([[u, 0.68], [u + Math.cos(a) * 0.21 * g.k / g.bw, 0.68 + Math.sin(a) * 0.21 * g.k / g.bh]]); } }
  g.thin(1.3); g.line([[0.2, 0.68], [0.42, 0.68], [0.36, 0.38], [0.2, 0.68]]); g.line([[0.42, 0.68], [0.72, 0.38], [0.36, 0.38]]); g.line([[0.72, 0.38], [0.8, 0.68]]);
  g.line([[0.72, 0.38], [0.7, 0.22], [0.78, 0.2]]); g.line([[0.36, 0.38], [0.34, 0.28]]); g.line([[0.28, 0.27], [0.4, 0.27]]);
  if (g.cls === 'motorcycle') g.rect(0.42, 0.42, 0.18, 0.18, true);
};
XR.plane = g => { g.ell(0.5, 0.5, 0.46, 0.1, true); g.thin(0.8); for (let i = 0; i < 9; i++) g.line([[0.12 + i * 0.09, 0.41], [0.12 + i * 0.09, 0.59]]); g.line([[0.55, 0.5], [0.35, 0.05], [0.45, 0.05], [0.65, 0.5], [0.45, 0.95], [0.35, 0.95], [0.55, 0.5]]); g.line([[0.1, 0.5], [0.04, 0.25], [0.1, 0.25], [0.18, 0.48]]); };
XR.boat = g => { g.line([[0.03, 0.55], [0.97, 0.55], [0.82, 0.92], [0.18, 0.92]], true, true); g.thin(0.8); for (let i = 1; i < 9; i++) { const u = 0.03 + i * 0.105; g.line([[u, 0.56], [lerp(0.18, 0.82, (u - 0.03) / 0.94), 0.9]]); } g.line([[0.5, 0.55], [0.5, 0.05]]); g.line([[0.5, 0.08], [0.85, 0.48], [0.5, 0.48]], true); };
XR.umbrella = g => { g.curve(s => [0.04 + 0.92 * s, 0.45 - Math.sin(Math.PI * s) * 0.38], 24); g.thin(0.8); for (let i = 0; i <= 6; i++) { const s = i / 6; g.line([[0.5, 0.07], [0.04 + 0.92 * s, 0.45 - Math.sin(Math.PI * s) * 0.38 + (i % 6 ? 0 : 0)]]); } g.thin(1.3); g.line([[0.5, 0.07], [0.5, 0.88]]); g.curve(s => [0.5 - Math.sin(s * Math.PI) * 0.08, 0.88 + Math.cos(s * Math.PI) * -0.06 + 0.06], 10); };
XR.scissors = g => { g.thin(1.3); g.line([[0.05, 0.2], [0.62, 0.55]]); g.line([[0.05, 0.8], [0.62, 0.45]]); g.circ(0.5, 0.5, 0.05, true); g.ell(0.78, 0.35, 0.16, 0.16); g.ell(0.78, 0.68, 0.16, 0.16); };
XR.toothbrush = g => { const sw = (u, v) => g.wide ? [u, v] : [v, u]; g.line([sw(0.02, 0.6), sw(0.98, 0.6), sw(0.98, 0.75), sw(0.02, 0.75)].map(p => p), true, true); g.thin(0.6); for (let u = 0.04; u < 0.3; u += 0.025) g.line([sw(u, 0.58), sw(u, 0.2 + Math.sin(u * 60 + g.t * 4) * 0.03)]); };
XR.layers = g => { const n = g.cls === 'cake' ? 4 : 5; for (let i = 0; i <= n; i++) { const v = 0.25 + i * 0.7 / n; g.curve(s => [0.05 + 0.9 * s, v + Math.sin(s * 14 + i) * 0.015], 20); } g.line([[0.05, 0.25], [0.05, 0.95]]); g.line([[0.95, 0.25], [0.95, 0.95]]); if (g.cls === 'cake') for (const u of [0.3, 0.5, 0.7]) { g.line([[u, 0.25], [u, 0.08]]); g.ell(u, 0.05 + Math.sin(g.t * 9 + u * 9) * 0.01, 0.015, 0.03, true); } };
XR.pizza = g => { g.ell(0.5, 0.5, 0.47, 0.47, true); g.thin(0.8); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.line([[0.5, 0.5], [0.5 + Math.cos(a) * 0.47, 0.5 + Math.sin(a) * 0.47]]); } [[0.35, 0.3], [0.65, 0.35], [0.3, 0.62], [0.6, 0.7], [0.5, 0.48]].forEach(([u, v]) => g.ell(u, v, 0.05, 0.05, true)); };
XR.donut = g => { g.ell(0.5, 0.5, 0.47, 0.47, true); g.ell(0.5, 0.5, 0.15, 0.15); g.thin(0.8); for (let i = 0; i < 14; i++) { const a = i * 0.45, r = 0.25 + (i % 3) * 0.05; const u = 0.5 + Math.cos(a) * r, v = 0.5 + Math.sin(a) * r; g.line([[u, v], [u + 0.03, v + 0.02]]); } };
XR.plant = g => { g.line([[0.2, 0.55], [0.8, 0.55], [0.72, 0.98], [0.28, 0.98]], true, true); g.thin(0.7); const roots = (u, v, d, a) => { if (d > 3) return; const u2 = u + Math.sin(a) * 0.12 / d, v2 = v + 0.12 / d; g.line([[u, v], [u2, v2]]); roots(u2, v2, d + 1, a - 0.5); roots(u2, v2, d + 1, a + 0.5); }; roots(0.5, 0.58, 1, 0); g.thin(1); g.line([[0.5, 0.58], [0.5, 0.15]]); for (const [u, v] of [[0.3, 0.2], [0.72, 0.28], [0.32, 0.42], [0.7, 0.08]]) { g.ell(u, v, 0.13, 0.06, true, u < 0.5 ? 0.4 : -0.4); g.line([[0.5, v + 0.04], [u, v]]); } const ph = (g.t * 0.6) % 1; g.dot(0.5, 0.58 - ph * 0.4, 0.015); };
XR.layers2 = XR.layers;

// ---------- etiquetas dos objectos (no canvas das etiquetas, espelhado)
function drawObjLabels(t, st) {
  const ctx = lctx; const sc = lCanvas.width / vw; ctx.setTransform(sc, 0, 0, sc, 0, 0);
  const u = vw / cssW, fs = 16 * u, h = 30 * u;
  ctx.font = `600 ${fs}px Fredoka, "Segoe UI", sans-serif`; ctx.textBaseline = 'middle';
  const target = hunt && hunt.phase === 'ask' ? hunt.list[hunt.i] : null;
  for (const tr of objTracks) {
    if (tr.hits < 2) continue;
    const o = OBJECTS[tr.cls]; const [bx, by, bw, bh] = tr.b;
    const x0 = vw - (bx + bw), y0 = by, x1 = vw - bx, y1 = by + bh, c = Math.min(bw, bh) * 0.18;
    const hot = (selected && selected.id === 'obj-' + tr.cls) || tr.cls === target;
    ctx.globalAlpha = clamp((t - tr.first) / 0.4, 0, 1) * clamp(1 - (t - tr.last - 0.5) / 0.5, 0, 1);
    ctx.strokeStyle = hot ? '#ffd166' : '#6fe3ff'; ctx.lineWidth = (hot ? 4 : 2.5) * u; ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { ctx.moveTo(x, y + dy * c); ctx.lineTo(x, y); ctx.lineTo(x + dx * c, y); }
    ctx.stroke();
    const txt = `${o.e} ${cap(o.n)}`, en = S.objEN ? `  ${o.en}` : '';
    ctx.font = `600 ${fs}px Fredoka, "Segoe UI", sans-serif`; const w1 = ctx.measureText(txt).width;
    ctx.font = `400 ${fs * 0.85}px Fredoka, "Segoe UI", sans-serif`; const w2 = en ? ctx.measureText(en).width : 0;
    const pw = w1 + w2 + 20 * u, px = clamp(x0, 4 * u, vw - pw - 4 * u), py = y0 - h - 6 * u < 4 * u ? y0 + 6 * u : y0 - h - 6 * u;
    ctx.fillStyle = hot ? 'rgba(60,44,0,0.92)' : 'rgba(6,14,30,0.85)'; roundRect(ctx, px, py, pw, h, h / 2); ctx.fill();
    ctx.lineWidth = 1.5 * u; ctx.stroke();
    ctx.fillStyle = '#f2fbff'; ctx.font = `600 ${fs}px Fredoka, "Segoe UI", sans-serif`; ctx.fillText(txt, px + 10 * u, py + h / 2 + u);
    if (en) { ctx.fillStyle = '#9fe3ff'; ctx.font = `400 ${fs * 0.85}px Fredoka, "Segoe UI", sans-serif`; ctx.fillText(en, px + 10 * u + w1, py + h / 2 + u); }
    tr.labelBox = [px, py, pw, h];
  }
  ctx.globalAlpha = 1;
}

// ---------- caça ao tesouro
let hunt = null;
function objIntro() {
  promptShow('📦', TXT.objIntro, '', null, null, '', [{ html: '<b>🎯</b>Caça ao tesouro', on: startHunt }]);
  speak(TXT.objIntro);
}
function startHunt() {
  const pool = shuffle(Object.keys(OBJECTS).filter(k => OBJECTS[k].cacar));
  hunt = { list: pool.slice(0, 5), i: -1, stars: 0, phase: 'next', t: 0 };
  nextHunt();
}
const huntStars = () => '⭐'.repeat(hunt.stars) + '☆'.repeat(hunt.list.length - hunt.stars);
function nextHunt() {
  hunt.i++; hunt.t = performance.now();
  if (hunt.i >= hunt.list.length) {
    hunt.phase = 'end';
    const msg = hunt.stars === hunt.list.length ? 'Encontraste tudo! És um verdadeiro detective!' : `Encontraste ${hunt.stars} de ${hunt.list.length}! Muito bem!`;
    promptShow('🏆', msg, huntStars(), null, null, 'ok', [{ html: '<b>🔁</b>Jogar outra vez', on: startHunt }]);
    speak(msg); confetti(vw / 2, vh * 0.35, 160); sndOk();
    return;
  }
  hunt.phase = 'ask';
  const o = OBJECTS[hunt.list[hunt.i]];
  const msg = `Encontra ${o.a} ${o.n}!`;
  promptShow(o.e, msg, huntStars(), null, null, '', [{ html: '<b>⏭️</b>Não temos — outra!', on: () => { hunt.phase = 'skip'; hunt.t = 0; } }]);
  speak(msg + ' Mostra à câmara.');
}
function updateObjMode(t, now, dt) {
  const st = stableObjs(t);
  // resumo
  const sumEl = $('#objSummary');
  if (!objLM) { sumEl.hidden = true; }
  else {
    if (st.length) objNoneSince = 0; else if (!objNoneSince) objNoneSince = now;
    const txt = st.length ? `Vejo: ${objSummaryText(st)}` : (now - objNoneSince > 4000 ? TXT.objNada : '');
    if (sumEl.textContent !== txt) sumEl.textContent = txt;
    sumEl.hidden = !txt || !$('#card').hidden;
  }
  // caça ao tesouro
  if (hunt) {
    const el = (now - hunt.t) / 1000;
    if (hunt.phase === 'ask') {
      const tr = st.find(x => x.cls === hunt.list[hunt.i]);
      if (tr) {
        const o = OBJECTS[tr.cls]; hunt.phase = 'ok'; hunt.stars++; hunt.t = now;
        const msg = `Boa! Encontraste ${o.a} ${o.n}!` + (S.objEN ? ` Em inglês: ${o.en}.` : '');
        promptShow('🎉', msg, huntStars(), null, null, 'ok'); speak(msg); sndOk();
        confetti(vw - (tr.b[0] + tr.b[2] / 2), tr.b[1] + tr.b[3] / 2);
        selected = { id: 'obj-' + tr.cls, until: now + 3000 };
      } else if (el > 60) { hunt.phase = 'skip'; hunt.t = now; }
    } else if (hunt.phase === 'skip') {
      if (!hunt.skipSaid) { hunt.skipSaid = true; promptShow('🙂', 'Vamos procurar outra coisa!', huntStars(), null); speak('Vamos procurar outra coisa!'); hunt.t = now; }
      else if (el > 1.8) { hunt.skipSaid = false; nextHunt(); }
    } else if (hunt.phase === 'ok' && el > 3) nextHunt();
    return;
  }
  // anunciar objectos novos (um de cada vez; volta a dizer se o objecto desaparecer mais de 6 s)
  for (const tr of st) {
    const prev = objSaid[tr.cls];
    if (!prev || now - prev > 6000) {
      if (now - objLastSay > 2500) {
        const o = OBJECTS[tr.cls]; objSaid[tr.cls] = now; objLastSay = now;
        speak(`${cap(o.a)} ${o.n}!` + (S.objEN ? ` Em inglês: ${o.en}.` : ''));
      }
    } else objSaid[tr.cls] = now;
  }
  // apontar com o dedo para um objecto
  const tips = fingerTips();
  let hit = null;
  for (const tip of tips) for (const tr of st) { const [bx, by, bw, bh] = tr.b; if (tip[0] > bx && tip[0] < bx + bw && tip[1] > by && tip[1] < by + bh) hit = { tr, tip }; }
  if (hit) {
    const id = 'obj' + hit.tr.id;
    if (dwell.id === id) dwell.t += dt; else { dwell.id = id; dwell.t = 0; }
    if (!(dwell.last === id && now - dwell.lastAt < 5000)) {
      fxDraw.progress = { x: hit.tip[0], y: hit.tip[1], p: clamp(dwell.t / 0.7, 0, 1) };
      if (dwell.t > 0.7) { showCard({ item: objItem(hit.tr.cls), id: 'obj-' + hit.tr.cls, kind: 'obj' }); dwell.last = id; dwell.lastAt = now; }
    }
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
  updateBody();
  const f0 = primaryFace();

  // músculos
  mctx.clearRect(0, 0, vw, vh);
  const cr = mode === 'desafio' && ch && ch.list && ch.phase !== 'end' ? ch.list[ch.i] : null;
  const forced = cr ? [...(cr.alvos || [cr.alvo]), cr.alvo === 'mMasseter' || (cr.alvos || []).includes('mMasseter') ? 'mTemporal' : null].filter(Boolean) : null;
  for (const f of faces) if (f.active && f.lm) {
    if (S.layers.muscles) drawMuscles(f, t);
    else { f.mgeo = null; if (forced && f === f0 && MUSCLES.some(m => forced.includes(m.id))) drawMuscles(f, t, forced); }
  }

  if (mode === 'objectos' && S.objXray) for (const tr of objTracks) if (tr.hits >= 2) drawObjXray(tr, t);
  const st = revealState(f0);
  applyMaskCss(st); applyBackdrop();
  if (selected && now > selected.until && $('#card').hidden) selected = null;
  updateInteraction(f0, dt, now);
  renderer.render(scene, camera);
  drawLabels(f0, st);
  if (mode === 'objectos') { drawObjLabels(t, st); updateObjMode(t, now, dt); } else $('#objSummary').hidden = true;
  drawTracking();
  drawFx(dt, st, now);
  recFrame(now);

  // dicas
  const hint = $('#hint');
  if (!f0 && !bodyRig?.on) { if (!noFaceSince) noFaceSince = now; } else noFaceSince = 0;
  let msg = '';
  if (noFaceSince && now - noFaceSince > 1500 && mode !== 'objectos') msg = TXT.semCara;
  else if (f0 && f0.faceW < vw * 0.12 && mode !== 'objectos') msg = TXT.perto;
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
// compõe a imagem final (vídeo + anatomia + etiquetas) num canvas vw×vh — usado na foto e na gravação
let ovCanvas = null;
function composeFrame(g) {
  const st = revealState(primaryFace(), true);
  g.save(); g.setTransform(-1, 0, 0, 1, vw, 0);
  g.drawImage(source, 0, 0, vw, vh);
  if (!ovCanvas || ovCanvas.width !== vw || ovCanvas.height !== vh) { ovCanvas = document.createElement('canvas'); ovCanvas.width = vw; ovCanvas.height = vh; }
  const og = ovCanvas.getContext('2d');
  og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, vw, vh);
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
    og.globalCompositeOperation = 'source-over';
  }
  g.drawImage(ovCanvas, 0, 0);
  if (S.track) g.drawImage(tCanvas, 0, 0);
  g.restore();
  g.drawImage(lCanvas, 0, 0, vw, vh);
  g.drawImage(fxCanvas, 0, 0, vw, vh);
  g.font = `600 ${Math.round(vh * 0.03)}px Fredoka, sans-serif`; g.fillStyle = 'rgba(111,227,255,0.85)'; g.textBaseline = 'bottom';
  g.fillText('Espelho Raio-X', vh * 0.02, vh * 0.98);
}
const stamp = ext => { const d = new Date(), z = n => String(n).padStart(2, '0'); return `espelho-raio-x-${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}.${ext}`; };
function saveBlob(blob, name, okMsg) {
  if (ARTIFACT) {
    if (!capDownloads) { toast('Aqui não dá para guardar ficheiros 🙁'); return; }
    capDownloads.save({ filename: name, data: blob }).then(() => toast(okMsg)).catch(e => { if (e?.code !== 'declined') toast('Não consegui guardar o ficheiro.'); });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.download = name; a.href = url; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast(okMsg + ' (Transferências)');
}
function takePhoto() {
  if (!source) return;
  const c = document.createElement('canvas'); c.width = vw; c.height = vh;
  composeFrame(c.getContext('2d'));
  const fl = $('#flash'); fl.classList.add('on'); setTimeout(() => fl.classList.remove('on'), 60);
  tone([1400, 700], 0.04, 'square', 0.05);
  c.toBlob(b => saveBlob(b, stamp('png'), '📸 Foto guardada!'), 'image/png');
}
// ------------------------------------------------------------------ gravar vídeo
const REC_MAX = 20;
let rec = null;
function toggleRec() { if (rec) stopRec(); else startRec(); }
function startRec() {
  if (!source || rec || typeof MediaRecorder === 'undefined') { if (typeof MediaRecorder === 'undefined') toast('Este browser não consegue gravar vídeo.'); return; }
  const c = document.createElement('canvas'); c.width = vw; c.height = vh;
  const g = c.getContext('2d');
  composeFrame(g);
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
  let mr;
  try { mr = new MediaRecorder(c.captureStream(30), mime ? { mimeType: mime, videoBitsPerSecond: 5e6 } : undefined); }
  catch (e) { console.error(e); toast('Não consegui começar a gravar.'); return; }
  const chunks = [];
  mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  mr.onstop = () => { if (chunks.length) saveBlob(new Blob(chunks, { type: 'video/webm' }), stamp('webm'), '🎬 Vídeo guardado!'); };
  mr.start(500);
  rec = { mr, c, g, t0: performance.now() };
  $('#btnRec').classList.add('rec'); $('#btnRec').textContent = '⏹'; $('#recBadge').hidden = false;
  tone([660, 990], 0.06);
}
function stopRec() {
  if (!rec) return;
  try { rec.mr.stop(); } catch (e) { }
  rec = null;
  $('#btnRec').classList.remove('rec'); $('#btnRec').textContent = '🎬'; $('#recBadge').hidden = true;
  tone([990, 660], 0.06);
}
function recFrame(now) {
  if (!rec) return;
  composeFrame(rec.g);
  const el = (now - rec.t0) / 1000;
  $('#recBadge span').textContent = `0:${String(Math.floor(el)).padStart(2, '0')} / 0:${REC_MAX}`;
  if (el >= REC_MAX) stopRec();
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
function bodyNudge() {
  if (!S.layers.body) return;
  setTimeout(() => { if (S.layers.body && running && !bodyRig?.on) toast(TXT.semCorpo, 3500); }, 5000);
}
function initUI() {
  if (window.innerWidth < 900) S.panel = false;
  const chips = $('#layerChips');
  chips.innerHTML = Object.entries(LAYERS).map(([k, l]) => `<button class="chip" data-layer="${k}" style="--c:${l.cor}"><i></i>${l.nome}</button>`).join('');
  chips.onclick = e => { const b = e.target.closest('.chip'); if (!b) return; S.layers[b.dataset.layer] = !S.layers[b.dataset.layer]; refreshUI(); if (b.dataset.layer === 'body') bodyNudge(); };
  $$('[data-preset]').forEach(b => b.onclick = () => { S.layers = { ...PRESETS[b.dataset.preset] }; refreshUI(); sndTick(); bodyNudge(); });
  $$('.seg[data-set]').forEach(seg => seg.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    setPath(S, seg.dataset.set, b.dataset.val);
    if (seg.dataset.set === 'look') applyLook();
    refreshUI();
  });
  $('#btnProgReset').onclick = () => { S.prog = { max: 1, best: {} }; saveSettings(); toast('Progresso do Desafio recomeçado.'); if (mode === 'desafio' && (!ch || ch.phase === 'end')) chooseLevel(); };
  $$('input[data-set]').forEach(el => el.oninput = () => { setPath(S, el.dataset.set, el.type === 'checkbox' ? el.checked : parseFloat(el.value)); refreshUI(); if (el.dataset.set === 'unlockAll' && mode === 'desafio' && (!ch || ch.phase === 'end')) chooseLevel(); });
  $$('[data-fit]').forEach(b => b.onclick = () => { S.fit = { ...FIT_PRESETS[b.dataset.fit] }; S.babyTeeth = b.dataset.fit === 'crianca'; refreshUI(); });
  $('#btnFitReset').onclick = () => { S.fit = { ...FIT_PRESETS.adulto }; refreshUI(); };
  $$('.modes button').forEach(b => b.onclick = () => setMode(b.dataset.mode));
  $('#btnFoto').onclick = takePhoto;
  $('#objSummary').onclick = () => { const t = $('#objSummary').textContent; if (t) speak(t.replace('Vejo:', 'Estou a ver')); };
  $('#btnRec').onclick = toggleRec;
  $('#btnVoz').onclick = () => { S.voice = !S.voice; if (!S.voice) stopSpeech(); refreshUI(); };
  $('#btnFile').onclick = () => $('#fileIn').click();
  $('#btnPainel').onclick = () => { S.panel = !S.panel; refreshUI(); };
  $('#btnFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => { }); };
  window.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === 'f' || e.key === 'F') takePhoto();
    else if (e.key === 'v' || e.key === 'V') toggleRec();
    else if (e.key === 'p' || e.key === 'P') { S.panel = !S.panel; refreshUI(); }
    else if (e.key === 'l' || e.key === 'L') { S.labels = !S.labels; refreshUI(); }
    else if (e.key === 'Escape') { $('#card').hidden = true; selected = null; }
    else if ('12345'.includes(e.key) && e.key) { S.layers = { ...PRESETS[['ossos', 'corpo', 'cerebro', 'musculos', 'tudo'][+e.key - 1]] }; refreshUI(); }
  });
  const toVid = e => { const r = stage.getBoundingClientRect(); const xd = (e.clientX - r.left) / r.width * vw; return [vw - xd, (e.clientY - r.top) / r.height * vh]; };
  stage.addEventListener('pointermove', e => { pointer = toVid(e); });
  stage.addEventListener('pointerleave', () => { pointer = null; });
  stage.addEventListener('click', e => {
    if (e.target.closest('#card, #prompt, #quiz, #objSummary')) return;
    const [x0c, y0c] = toVid(e);
    if (mode === 'objectos') {
      const xd0 = vw - x0c;
      for (const tr of objTracks) {
        const lb = tr.labelBox, [bx, by, bw, bh] = tr.b;
        if ((lb && xd0 >= lb[0] && xd0 <= lb[0] + lb[2] && y0c >= lb[1] && y0c <= lb[1] + lb[3]) || (x0c > bx && x0c < bx + bw && y0c > by && y0c < by + bh)) { showCard({ item: objItem(tr.cls), id: 'obj-' + tr.cls, kind: 'obj' }); return; }
      }
    }
    const f0 = primaryFace(); if (!f0 && !bodyRig?.on) return;
    const [x, y] = toVid(e);
    // clique num rótulo
    const xd = vw - x;
    for (const t of lastLabels) if (t.box && xd >= t.box[0] && xd <= t.box[0] + t.box[2] && y >= t.box[1] && y <= t.box[1] + t.box[3]) { showCard(t); return; }
    const hit = nearestTarget([[x, y]], [...collectTargets(f0, { touch: true }), ...handTargets(), ...bodyTargets()], f0 ? f0.faceW * 0.16 : body.w * 0.12);
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
    bodyRig = makeBodyRig();
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
  $('#btnFoto').hidden = true; $('#btnRec').hidden = true;
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
window.espelho = { S, faces, hands, body, objTracks, getHunt: () => hunt, getObjRaw: () => objRaw, refreshUI, setMode, takePhoto, startFile, DEBUG, collectTargets: (o) => collectTargets(primaryFace(), o), bodyTargets: (o) => bodyTargets(o), getCh: () => ch, startLevel, LADDER, gaze: () => primaryFace() && gazeOf(primaryFace()), landmarkTargets: (id, side) => landmarkTargets(primaryFace(), id, side), toggleRec };
