// Espelho Raio-X — ossos da mão e do punho: formas anatómicas, posição a partir dos 21 pontos do tracking
// e painel "Detalhe da mão" (vista 3D que roda, legendas, lista dos ossos e dos seus nomes).
// Recebe o THREE de fora para usar a mesma cópia que o resto da app.

// ---------------------------------------------------------------- nomes e factos
export const MAO_INFO = [
  { id: 'falDistais', nome: 'Falanges distais', cor: '#ff9fbf', emoji: '💅',
    facto: 'Os ossos da ponta dos dedos. É por cima deles que crescem as unhas.',
    factoCient: 'Terminam na tuberosidade ungueal, que segura a polpa do dedo e o leito da unha. São 5 (uma por dedo).' },
  { id: 'falMedias', nome: 'Falanges médias', cor: '#ffcf6e', emoji: '☝️',
    facto: 'Os ossos do meio dos dedos. O polegar não tem nenhuma!',
    factoCient: 'São 4, do 2.º ao 5.º dedo; articulam com as proximais (interfalângica proximal) e as distais (interfalângica distal).' },
  { id: 'falProx', nome: 'Falanges proximais', cor: '#8fe3a0', emoji: '🖐️',
    facto: 'Os ossos dos dedos que ficam mais perto da palma.',
    factoCient: 'São 5; articulam com as cabeças dos metacarpos nas articulações metacarpofalângicas.' },
  { id: 'metacarpos', nome: 'Metacarpos', cor: '#86c2ff', emoji: '✋',
    facto: 'Os 5 ossos compridos da palma, numerados de I (polegar) a V (mindinho). Quando fechas a mão, as pontas deles são os "nós" dos dedos.',
    factoCient: 'Cada um tem base, corpo e cabeça. O I é o mais curto e o mais móvel; a fractura do colo do V é a "fractura do pugilista".' },
  { id: 'escafoide', nome: 'Escafóide', cor: '#ff8a8a', emoji: '⛵',
    facto: 'Tem forma de barquinho e fica do lado do polegar. É o osso do pulso que mais se parte quando caímos sobre a mão.',
    factoCient: 'Liga as duas filas do carpo. O sangue entra pela parte distal, por isso uma fractura do pólo proximal pode dar necrose avascular.' },
  { id: 'semilunar', nome: 'Semilunar', cor: '#ffbf66', emoji: '🌙',
    facto: 'Tem forma de meia-lua e fica no meio do pulso, encostado ao rádio.',
    factoCient: 'Articula com o rádio, o escafóide, o piramidal e o capitato; é o osso do carpo que mais se luxa.' },
  { id: 'piramidal', nome: 'Piramidal', cor: '#c3a1ff', emoji: '🔺',
    facto: 'Tem forma de pirâmide e fica do lado do mindinho.',
    factoCient: 'Articula com o semilunar, o hamato e, na face palmar, com o pisiforme.' },
  { id: 'pisiforme', nome: 'Pisiforme', cor: '#6fe0cf', emoji: '🫛',
    facto: 'É pequenino como uma ervilha. Consegues senti-lo na base da palma, do lado do mindinho.',
    factoCient: 'Osso sesamóide dentro do tendão do flexor ulnar do carpo; fica à frente do piramidal.' },
  { id: 'trapezio', nome: 'Trapézio', cor: '#ffe06e', emoji: '👍',
    facto: 'Fica na base do polegar e deixa-o mexer em todas as direcções.',
    factoCient: 'A articulação trapézio-metacárpica é em sela e permite a oposição do polegar; é muito atingida pela artrose (rizartrose).' },
  { id: 'trapezoide', nome: 'Trapezóide', cor: '#a5ef8c', emoji: '🔷',
    facto: 'É o mais pequeno da fila de baixo e fica encaixado na base do dedo indicador.',
    factoCient: 'Articula com o 2.º metacarpo, o trapézio, o capitato e o escafóide; raramente se fractura.' },
  { id: 'capitato', nome: 'Capitato', cient: 'Capitato (grande osso)', cor: '#7cabff', emoji: '👑',
    facto: 'É o maior osso do pulso e fica mesmo no centro.',
    factoCient: 'Também chamado grande osso; a sua cabeça encaixa na concavidade do semilunar e do escafóide.' },
  { id: 'hamato', nome: 'Hamato', cient: 'Hamato (unciforme)', cor: '#f39be6', emoji: '🪝',
    facto: 'Tem um gancho que se sente na palma, do lado do mindinho.',
    factoCient: 'O hâmulo (gancho) forma o limite do canal de Guyon, por onde passa o nervo ulnar; fractura-se em quem joga golfe ou ténis.' },
  { id: 'radio', nome: 'Rádio', cor: '#e9dcc6', emoji: '🔄',
    facto: 'O osso do antebraço do lado do polegar. Quando viras a palma para cima e para baixo, roda à volta do cúbito.',
    factoCient: 'A extremidade distal articula com o escafóide e o semilunar; a fractura de Colles é a fractura mais frequente do punho.' },
  { id: 'cubito', nome: 'Cúbito', cient: 'Cúbito (ulna)', cor: '#cfc2ad', emoji: '💪',
    facto: 'O osso do antebraço do lado do mindinho. A bolinha que vês no pulso é a cabeça dele.',
    factoCient: 'Separado do carpo pelo complexo da fibrocartilagem triangular; a apófise estilóide do cúbito palpa-se no lado ulnar do punho.' },
];
export const MAO_OVERVIEW = { nome: 'A mão e o punho: 27 ossos', cor: '#e8f6ff',
  facto: '8 no pulso (carpos), 5 na palma (metacarpos) e 14 nos dedos (falanges). As duas mãos juntas têm mais de um quarto dos ossos do corpo!',
  factoCient: 'Carpo: fila proximal (escafóide, semilunar, piramidal, pisiforme) e fila distal (trapézio, trapezóide, capitato, hamato). 5 metacarpos e 14 falanges.' };
const INFO = Object.fromEntries(MAO_INFO.map(i => [i.id, i]));
const CARPAIS = ['escafoide', 'semilunar', 'piramidal', 'pisiforme', 'trapezio', 'trapezoide', 'capitato', 'hamato'];

// ---------------------------------------------------------------- ossos compridos (perfis de revolução, comprimento 1)
const PROF = {
  meta: [[0, 0], [0.7, 0], [0.92, 0.03], [0.95, 0.08], [0.78, 0.15], [0.58, 0.25], [0.5, 0.42], [0.5, 0.6], [0.56, 0.75], [0.74, 0.85], [0.86, 0.91], [0.84, 0.96], [0.62, 0.995], [0, 1]],
  prox: [[0, 0], [0.78, 0], [0.98, 0.04], [0.95, 0.12], [0.7, 0.22], [0.56, 0.4], [0.54, 0.6], [0.6, 0.78], [0.78, 0.88], [0.82, 0.94], [0.6, 0.99], [0, 1]],
  mid: [[0, 0], [0.8, 0], [0.98, 0.05], [0.94, 0.15], [0.68, 0.27], [0.58, 0.45], [0.58, 0.62], [0.66, 0.8], [0.8, 0.9], [0.78, 0.96], [0.55, 0.995], [0, 1]],
  dist: [[0, 0], [0.75, 0], [0.95, 0.05], [0.88, 0.16], [0.6, 0.32], [0.46, 0.55], [0.42, 0.74], [0.55, 0.86], [0.62, 0.93], [0.48, 0.99], [0, 1]],
  radius: [[0, 0], [0.42, 0], [0.44, 0.3], [0.48, 0.55], [0.62, 0.72], [0.86, 0.86], [1, 0.94], [0.92, 0.99], [0, 1]],
  ulna: [[0, 0], [0.62, 0], [0.58, 0.35], [0.54, 0.7], [0.66, 0.84], [0.74, 0.92], [0.6, 0.97], [0.25, 1], [0, 1]],
};
// [id, geometria, ponto A, ponto B, raio (fracção do tamanho da mão), folga em A, folga em B, achatamento]
const LONG = [
  ['mc1', 'meta', '1', '2', 0.085, 0.03, 0.06], ['fp1', 'prox', '2', '3', 0.074, 0.07, 0.06], ['fd1', 'dist', '3', '4', 0.064, 0.07, 0.2],
  ['mc2', 'meta', 'b2', '5', 0.072, 0, 0.05], ['fp2', 'prox', '5', '6', 0.066, 0.07, 0.06], ['fm2', 'mid', '6', '7', 0.056, 0.08, 0.07], ['fd2', 'dist', '7', '8', 0.05, 0.08, 0.22],
  ['mc3', 'meta', 'b3', '9', 0.074, 0, 0.05], ['fp3', 'prox', '9', '10', 0.068, 0.07, 0.06], ['fm3', 'mid', '10', '11', 0.058, 0.08, 0.07], ['fd3', 'dist', '11', '12', 0.05, 0.08, 0.22],
  ['mc4', 'meta', 'b4', '13', 0.068, 0, 0.05], ['fp4', 'prox', '13', '14', 0.064, 0.07, 0.06], ['fm4', 'mid', '14', '15', 0.055, 0.08, 0.07], ['fd4', 'dist', '15', '16', 0.048, 0.08, 0.22],
  ['mc5', 'meta', 'b5', '17', 0.064, 0, 0.05], ['fp5', 'prox', '17', '18', 0.058, 0.07, 0.06], ['fm5', 'mid', '18', '19', 0.05, 0.08, 0.07], ['fd5', 'dist', '19', '20', 0.044, 0.08, 0.22],
  ['radio', 'radius', 'rad1', 'rad0', 0.17, 0, 0, 0.55], ['cubito', 'ulna', 'uln1', 'uln0', 0.095, 0, 0, 0.85],
];
const GROUP_OF = id => id.startsWith('fd') ? 'falDistais' : id.startsWith('fm') ? 'falMedias' : id.startsWith('fp') ? 'falProx' : id.startsWith('mc') ? 'metacarpos' : id;

// ---------------------------------------------------------------- carpos (cm no referencial da mão)
// u: do polegar para o mindinho · v: do pulso para os dedos · w: para a palma. r = semi-eixos (cm), rot = rotação no plano da mão (graus)
const CARPOS = [
  { id: 'escafoide', c: [-1.55, 0.5, 0.05], r: [1.25, 0.62, 0.62], rot: -52, forma: 'feijao' },
  { id: 'semilunar', c: [-0.05, 0.35, 0], r: [0.82, 0.72, 0.78], rot: 0, forma: 'lua' },
  { id: 'piramidal', c: [1.3, 0.62, -0.05], r: [0.78, 0.6, 0.6], rot: 20, forma: 'piramide' },
  { id: 'pisiforme', c: [1.55, 0.85, 0.72], r: [0.42, 0.5, 0.42], rot: 0, forma: 'ervilha' },
  { id: 'trapezio', c: [-2.2, 1.65, 0.3], r: [0.78, 0.72, 0.68], rot: -25, forma: 'sela' },
  { id: 'trapezoide', c: [-1.15, 1.95, 0.05], r: [0.5, 0.62, 0.55], rot: -5, forma: 'cunha' },
  { id: 'capitato', c: [-0.05, 1.7, 0], r: [0.66, 1.12, 0.72], rot: 0, forma: 'cabeca' },
  { id: 'hamato', c: [1.12, 1.78, 0], r: [0.68, 0.95, 0.66], rot: 12, forma: 'gancho' },
];
const MC_BASE = { b2: [-1.2, 2.85, 0], b3: [-0.05, 2.95, 0], b4: [0.95, 2.85, 0], b5: [1.8, 2.6, 0] };
const ANTEBRACO = { rad0: [-0.85, -0.45, 0], rad1: [-0.85, -12.0, 0], uln0: [1.45, -0.55, 0], uln1: [1.45, -12.4, 0] };
const HAND_CM = 8.9;   // distância pulso → base do dedo do meio num adulto (cm)

function deform(THREE, forma, sinal = 1) {
  const g = new THREE.SphereGeometry(1, 22, 16);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (forma === 'feijao') { y += 0.38 * x * x - 0.16; z *= 1 - 0.12 * x * x; }
    else if (forma === 'lua') { if (y > 0) y -= 0.6 * y * (1 - x * x) * (1 - 0.5 * z * z); else y *= 1.05; }
    else if (forma === 'piramide') { const s = 1 - 0.38 * Math.max(0, x); y *= s; z *= s; }
    else if (forma === 'sela') { if (y > 0) y += 0.28 * (x * x - z * z) * y; x *= 1 + 0.1 * y; }
    else if (forma === 'cunha') { x *= 1 - 0.28 * Math.max(0, z * sinal); }
    else if (forma === 'cabeca') { if (y < 0) { x *= 1 - 0.3 * -y; z *= 1 - 0.18 * -y; } if (y > 0.72) y = 0.72 + (y - 0.72) * 0.35; }
    else if (forma === 'gancho') { x *= 1 - 0.3 * Math.max(0, -y); if (y > 0.75) y = 0.75 + (y - 0.75) * 0.4; }
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}
export function buildHandGeos(THREE, mergeGeos) {
  const G = {};
  for (const [k, pts] of Object.entries(PROF)) G[k] = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 16);
  G.carpo = {};
  for (const c of CARPOS) if (c.forma !== 'gancho') G.carpo[c.id] = deform(THREE, c.forma);
  // hamato com o gancho (hâmulo) virado para a palma: uma versão para cada mão
  for (const s of [1, -1]) {
    const hook = new THREE.CapsuleGeometry(0.3, 0.55, 4, 10);
    hook.rotateX(Math.PI / 2); hook.translate(0.25, 0.15, s * 0.95);
    hook.computeVertexNormals();
    G.carpo['hamato' + (s > 0 ? 'P' : 'N')] = mergeGeos([deform(THREE, 'gancho'), hook]);
  }
  return G;
}

// ---------------------------------------------------------------- montar e posicionar
// addMesh(parent, geo, id) cria a malha com o material que a app quiser
export function makeHandMeshes(THREE, G, addMesh) {
  const g = new THREE.Group();
  const meshes = [];
  for (const [id, geo, a, b, rad, ga, gb, flat = 0.82] of LONG) meshes.push({ id, group: GROUP_OF(id), kind: 'long', def: { a, b, rad, ga, gb, flat }, mesh: addMesh(g, G[geo], id) });
  for (const c of CARPOS) {
    const geoP = c.forma === 'gancho' ? G.carpo.hamatoP : G.carpo[c.id], geoN = c.forma === 'gancho' ? G.carpo.hamatoN : geoP;
    meshes.push({ id: c.id, group: c.id, kind: 'carpo', def: c, geoP, geoN, mesh: addMesh(g, geoP, c.id) });
  }
  return { g, meshes, byGroup: grp => meshes.filter(m => m.group === grp) };
}
const T = {};
function tv(THREE, k) { return T[k] || (T[k] = new THREE.Vector3()); }
// J: 21 pontos (Vector3, mundo). palmar: +1 mão direita, -1 mão esquerda (vista pela câmara, imagem não espelhada).
export function layoutHand(THREE, rig, J, { palmar = 1, armHidden = false, forearm = 1 } = {}) {
  const O = J[0];
  const Y = tv(THREE, 'Y').subVectors(J[9], J[0]); const hs = Y.length(); if (hs < 1e-4) return; Y.normalize();
  const X = tv(THREE, 'X').subVectors(J[17], J[5]); X.addScaledVector(Y, -X.dot(Y)).normalize();
  const Z = tv(THREE, 'Z').crossVectors(X, Y);
  const cm = hs / HAND_CM;
  const F = (c, out) => out.copy(O).addScaledVector(X, c[0] * cm).addScaledVector(Y, c[1] * cm).addScaledVector(Z, c[2] * cm * palmar);
  const pt = (k, out) => { if (/^\d+$/.test(k)) return out.copy(J[+k]); const c = MC_BASE[k] || ANTEBRACO[k]; return F(k === 'rad1' || k === 'uln1' ? [c[0], c[1] * forearm, c[2]] : c, out); };
  const A = tv(THREE, 'A'), B = tv(THREE, 'B'), d = tv(THREE, 'd'), bx = tv(THREE, 'bx'), bz = tv(THREE, 'bz');
  const m4 = T.m4 || (T.m4 = new THREE.Matrix4()), q = T.q || (T.q = new THREE.Quaternion()), qz = T.qz || (T.qz = new THREE.Quaternion());
  const P = tv(THREE, 'P').copy(Z).multiplyScalar(palmar);
  // trapézio: encostado à base do polegar (ponto 1), seja qual for a posição do polegar
  const tdir = tv(THREE, 'td').subVectors(J[2], J[1]).normalize();
  for (const it of rig.meshes) {
    const m = it.mesh;
    if (it.kind === 'long') {
      const { a, b, rad, ga, gb, flat } = it.def;
      pt(a, A); pt(b, B);
      d.subVectors(B, A); const len = d.length(); if (len < 1e-4) continue; d.divideScalar(len);
      bz.copy(P).addScaledVector(d, -P.dot(d)); if (bz.lengthSq() < 1e-6) bz.copy(Z); bz.normalize();
      bx.crossVectors(d, bz);
      m.quaternion.setFromRotationMatrix(m4.makeBasis(bx, d, bz));
      m.position.copy(A).addScaledVector(d, len * ga);
      m.scale.set(rad * hs, len * (1 - ga - gb), rad * hs * flat);
      m.visible = !(armHidden && (it.id === 'radio' || it.id === 'cubito'));
    } else {
      const c = it.def;
      F(c.c, m.position);
      if (c.id === 'trapezio') m.position.lerp(A.copy(J[1]).addScaledVector(tdir, -0.85 * cm).addScaledVector(P, 0.2 * cm), 0.65);
      m.quaternion.setFromRotationMatrix(m4.makeBasis(X, Y, Z));
      qz.setFromAxisAngle(tv(THREE, 'zAx').set(0, 0, 1), (c.rot * Math.PI) / 180);
      m.quaternion.multiply(qz);
      m.scale.set(c.r[0] * cm, c.r[1] * cm, c.r[2] * cm);
      const want = palmar > 0 ? it.geoP : it.geoN; if (m.geometry !== want) m.geometry = want;
    }
  }
  rig.hs = hs; rig.cm = cm;
}
// ponto de cada grupo para pôr a etiqueta (no mundo)
const LABEL_OF = { falDistais: 'fd2', falMedias: 'fm4', falProx: 'fp5', metacarpos: 'mc2' };
export function groupAnchor(THREE, rig, grp, out) {
  const id = LABEL_OF[grp] || grp;
  const it = rig.meshes.find(m => m.id === id); if (!it) return null;
  const m = it.mesh;
  if (it.kind === 'long') { out.set(0, grp === 'radio' || grp === 'cubito' ? 0.86 : 0.5, 0).applyMatrix4(m.matrixWorld); return out; }
  return out.copy(m.position).applyMatrix4(m.parent.matrixWorld);
}
export const LIVE_GROUPS = MAO_INFO.map(i => i.id);
export const maoInfo = id => INFO[id];
export const isHandBone = id => !!INFO[id];

// ---------------------------------------------------------------- mão canónica (cm) para o painel: mão direita aberta, palma para +z
const CANON_J = [
  [0, 0, 0], [-2.5, 2.4, 0.8], [-3.9, 4.8, 1.6], [-4.8, 7.1, 2.0], [-5.5, 9.0, 2.2],
  [-2.3, 8.6, 0.3], [-2.6, 12.6, 0.3], [-2.75, 15.0, 0.3], [-2.85, 17.0, 0.3],
  [-0.4, 8.9, 0.4], [-0.4, 13.4, 0.4], [-0.4, 16.2, 0.4], [-0.4, 18.3, 0.4],
  [1.5, 8.5, 0.2], [1.75, 12.6, 0.2], [1.9, 15.2, 0.2], [2.0, 17.2, 0.2],
  [3.2, 7.7, -0.1], [3.75, 10.9, -0.1], [4.05, 12.9, -0.1], [4.3, 14.6, -0.1],
];
// dobrar os dedos (0 = aberta, 1 = fechada)
function canonPose(THREE, curl, out) {
  for (let i = 0; i < 21; i++) out[i].set(...CANON_J[i]);
  const chains = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
  const ang = [[0.25, 0.45, 0.6], [0.9, 1.5, 1.1], [0.9, 1.55, 1.1], [0.95, 1.55, 1.1], [1.0, 1.5, 1.05]];
  const axisF = new THREE.Vector3(1, 0, 0), q = new THREE.Quaternion(), v = new THREE.Vector3();
  const tdir = new THREE.Vector3().subVectors(out[2], out[1]).normalize();
  const axisT = new THREE.Vector3().crossVectors(tdir, new THREE.Vector3(0.7, 0, 0.7)).normalize();   // o polegar dobra para a palma e para o mindinho
  chains.forEach((ch, f) => {
    const axis = f === 0 ? axisT : axisF;
    for (let j = 1; j < ch.length; j++) {
      const piv = out[ch[j - 1]];
      q.setFromAxisAngle(axis, curl * ang[f][j - 1]);
      for (let k = j; k < ch.length; k++) { v.subVectors(out[ch[k]], piv).applyQuaternion(q); out[ch[k]].copy(piv).add(v); }
    }
  });
  return out;
}

// ---------------------------------------------------------------- painel
const VIEWS = {
  palma: { yaw: 0, pitch: 0.05, sub: 'Mão direita, vista da palma' },
  costas: { yaw: Math.PI, pitch: 0.05, sub: 'Mão direita, vista das costas' },
  lado: { yaw: -Math.PI / 2, pitch: 0.1, sub: 'Mão direita, vista do lado do polegar' },
};
export function createHandPanel(THREE, { geos, host, sci, speak, onSelect, onClose }) {
  const el = document.createElement('div');
  el.id = 'handPanel'; el.className = 'detail-panel'; el.hidden = true;
  el.innerHTML = `
    <div class="bp-head"><span class="bp-ico">✋</span><div class="bp-tt"><b>Ossos da mão e do punho</b><small class="bp-sub"></small></div>
      <button class="bp-close" aria-label="Fechar">✕</button></div>
    <div class="bp-view hp-view"><canvas></canvas><svg class="bp-lines"></svg><div class="bp-labels"></div><div class="bp-drag">arrasta para rodar · toca num osso</div></div>
    <div class="bp-tools">
      <button data-v="palma">Palma</button><button data-v="costas">Costas</button><button data-v="lado">Polegar</button><button data-v="rodar">↻ Rodar</button>
      <label class="hp-curl">✊ <input type="range" min="0" max="1" step="0.01" value="0"></label><button class="bp-info" aria-pressed="true">ℹ️ Nomes</button></div>
    <div class="bp-list"><h4>ⓘ Os ossos e para que servem</h4><div class="bp-rows"></div></div>`;
  host.appendChild(el);
  el.addEventListener('click', e => e.stopPropagation());
  const $$ = s => el.querySelectorAll(s);
  const view = el.querySelector('.bp-view'), canvas = el.querySelector('canvas'), svg = el.querySelector('.bp-lines'), labBox = el.querySelector('.bp-labels');
  const rowsEl = el.querySelector('.bp-rows'), listEl = el.querySelector('.bp-list');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xdfefff, 0x203050, 1.1));
  const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(2, 3, 4); scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0x88bbff, 0.6); dl2.position.set(-3, -1, -4); scene.add(dl2);
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 400);
  const mats = {};
  const rig = makeHandMeshes(THREE, geos, (g, geo, id) => {
    const grp = GROUP_OF(id); const col = new THREE.Color(INFO[grp].cor);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.05, emissive: col.clone().multiplyScalar(0.08) }));
    (mats[grp] = mats[grp] || []).push(m.material); g.add(m); return m;
  });
  scene.add(rig.g);
  const J = Array.from({ length: 21 }, () => new THREE.Vector3());
  let curl = 0, curlShown = -1;
  const tgt = new THREE.Vector3(-0.6, 7.0, 0.4);
  function pose() { canonPose(THREE, curl, J); layoutHand(THREE, rig, J, { palmar: 1, forearm: 0.42 }); rig.g.updateMatrixWorld(true); curlShown = curl; }

  let W = 10, H = 10;
  function resize() {
    const r = view.getBoundingClientRect(); W = Math.max(10, Math.round(r.width)); H = Math.max(10, Math.round(r.height));
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix(); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }
  new ResizeObserver(resize).observe(view);

  const cam = { yaw: 0, pitch: 0.05, ty: 0, tp: 0.05, auto: false, view: 'palma' };
  function setView(v) {
    $$('.bp-tools [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    if (v === 'rodar') { cam.auto = !cam.auto; if (!cam.auto) setView(cam.view); else el.querySelector('.bp-sub').textContent = 'A rodar — arrasta para virar'; return; }
    cam.auto = false; cam.view = v; const V = VIEWS[v];
    let dd = V.yaw - cam.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); cam.ty = cam.yaw + dd; cam.tp = V.pitch;
    el.querySelector('.bp-sub').textContent = V.sub;
  }
  $$('.bp-tools [data-v]').forEach(b => b.onclick = () => setView(b.dataset.v));
  el.querySelector('.hp-curl input').oninput = e => { curl = +e.target.value; };
  el.querySelector('.bp-info').onclick = e => { const on = listEl.hidden; listEl.hidden = !on; e.currentTarget.setAttribute('aria-pressed', on); };
  el.querySelector('.bp-close').onclick = () => { api.close(); onClose?.(); };

  let drag = null;
  view.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, moved: false }; view.setPointerCapture(e.pointerId); e.stopPropagation(); });
  view.addEventListener('pointermove', e => {
    if (!drag) { view.style.cursor = pick(e) ? 'pointer' : 'grab'; return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    if (!drag.moved) return;
    cam.auto = false; $$('.bp-tools [data-v]').forEach(b => b.classList.remove('on'));
    cam.yaw = cam.ty = drag.yaw - dx * 0.012; cam.pitch = cam.tp = Math.max(-1.3, Math.min(1.3, drag.pitch + dy * 0.01));
    el.querySelector('.bp-sub').textContent = 'Vista livre';
  });
  view.addEventListener('pointerup', e => { if (drag && !drag.moved) { const g = pick(e); if (g) api.select(g === api.selected ? null : g, true); } drag = null; });
  view.addEventListener('pointercancel', () => (drag = null));
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(rig.meshes.map(m => m.mesh), false)[0];
    return hit ? rig.meshes.find(m => m.mesh === hit.object)?.group : null;
  }

  // legendas
  const labs = {}, lines = {};
  for (const L of MAO_INFO) {
    const b = document.createElement('button'); b.className = 'bp-lab'; b.style.setProperty('--c', L.cor);
    b.innerHTML = `<i></i>${L.nome}`; b.onclick = e => { e.stopPropagation(); api.select(L.id === api.selected ? null : L.id, true); };
    b.addEventListener('pointerdown', e => e.stopPropagation());
    labBox.appendChild(b); labs[L.id] = b;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.innerHTML = `<line stroke="${L.cor}"/><circle r="3" fill="${L.cor}"/>`; svg.appendChild(g); lines[L.id] = g;
  }
  const v3 = new THREE.Vector3(), last = {};
  function placeLabels() {
    const items = [];
    for (const L of MAO_INFO) {
      const p = groupAnchor(THREE, rig, L.id, v3); if (!p) continue;
      p.project(camera);
      items.push({ id: L.id, ax: (p.x + 1) / 2 * W, ay: (1 - p.y) / 2 * H });
    }
    items.sort((a, b) => a.ax - b.ax);
    const half = Math.ceil(items.length / 2), lh = 24, pad = 4;
    items.forEach((t, k) => (t.side = k < half ? -1 : 1));
    for (const side of [-1, 1]) {
      const list = items.filter(t => t.side === side).sort((a, b) => a.ay - b.ay);
      let y = -1e9;
      for (const t of list) { t.ly = Math.max(t.ay, y + lh + 3, lh / 2 + pad); y = t.ly; }
      const over = y + lh / 2 + pad - H; if (over > 0) for (let k = list.length - 1, lim = H - lh / 2 - pad; k >= 0; k--) { list[k].ly = Math.min(list[k].ly, lim); lim = list[k].ly - lh - 3; }
    }
    for (const t of items) {
      const b = labs[t.id]; b.hidden = false; const bw = b.offsetWidth || 90;
      const lx = t.side < 0 ? pad : W - bw - pad;
      b.style.transform = `translate(${lx}px, ${t.ly - lh / 2}px)`;
      const ex = t.side < 0 ? lx + bw : lx;
      const g = lines[t.id]; const ln = g.firstChild;
      ln.setAttribute('x1', t.ax); ln.setAttribute('y1', t.ay); ln.setAttribute('x2', ex); ln.setAttribute('y2', t.ly);
      g.lastChild.setAttribute('cx', t.ax); g.lastChild.setAttribute('cy', t.ay);
      last[t.id] = { ...t, lx, bw };
    }
  }

  function fillRows() {
    const S = sci();
    const all = [{ ...MAO_OVERVIEW, id: '' }, ...MAO_INFO];
    rowsEl.innerHTML = all.map(r => `<button class="bp-row" data-id="${r.id}" style="--c:${r.cor}"><i></i><span><b>${S && r.cient ? r.cient : r.nome}</b>${S ? r.factoCient : r.facto}</span></button>`).join('');
    rowsEl.querySelectorAll('.bp-row').forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      if (!id) { api.select(null, false); speak(`${MAO_OVERVIEW.nome}. ${S ? MAO_OVERVIEW.factoCient : MAO_OVERVIEW.facto}`); return; }
      api.select(id === api.selected ? null : id, true);
    });
    mark();
  }
  function mark() {
    rowsEl.querySelectorAll('.bp-row').forEach(b => b.classList.toggle('on', !!api.selected && b.dataset.id === api.selected));
    for (const [id, b] of Object.entries(labs)) b.classList.toggle('on', id === api.selected);
    for (const [grp, list] of Object.entries(mats)) for (const m of list) {
      const col = new THREE.Color(INFO[grp].cor);
      const sel = api.selected === grp, dim = api.selected && !sel;
      m.color.copy(col).multiplyScalar(dim ? 0.35 : 1);
      m.emissive.copy(col).multiplyScalar(sel ? 0.55 : dim ? 0.02 : 0.08);
    }
  }

  let tPrev = 0;
  const api = {
    el, selected: null, isOpen: false,
    open(v) { el.hidden = false; api.isOpen = true; fillRows(); resize(); pose(); if (v || !el.querySelector('.bp-sub').textContent) setView(v || 'palma'); },
    close() { el.hidden = true; api.isOpen = false; api.selected = null; mark(); },
    refreshText: fillRows,
    select(id, say) {
      api.selected = id || null; mark();
      if (id) {
        const L = INFO[id], S = sci();
        if (say) speak(`${S && L.cient ? L.cient : L.nome}. ${S ? L.factoCient : L.facto}`);
        const row = rowsEl.querySelector(`.bp-row[data-id="${id}"]`); if (row && !listEl.hidden) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      onSelect?.(api.selected);
    },
    render(now) {
      if (!api.isOpen) return;
      const dt = Math.min(0.1, (now - (tPrev || now)) / 1000); tPrev = now;
      if (curl !== curlShown) pose();
      if (cam.auto) { cam.ty += dt * 0.5; cam.tp = 0.15; }
      cam.yaw += (cam.ty - cam.yaw) * Math.min(1, dt * 6); cam.pitch += (cam.tp - cam.pitch) * Math.min(1, dt * 6);
      const d = 50, cp = Math.cos(cam.pitch);
      camera.position.set(tgt.x + d * Math.sin(cam.yaw) * cp, tgt.y + d * Math.sin(cam.pitch), tgt.z + d * Math.cos(cam.yaw) * cp);
      camera.lookAt(tgt);
      renderer.render(scene, camera);
      placeLabels();
    },
    // para as fotos e vídeos
    drawInto(g, x, y, w) {
      if (!api.isOpen) return;
      const vr = view.getBoundingClientRect(), pr = el.getBoundingClientRect(), k = w / pr.width;
      const h = (vr.bottom - pr.top) * k + 10 * k;
      g.save();
      g.fillStyle = 'rgba(8,18,40,0.9)'; g.strokeStyle = 'rgba(111,227,255,0.7)'; g.lineWidth = 2 * k;
      rr(g, x, y, w, h, 16 * k); g.fill(); g.stroke();
      g.fillStyle = '#e8f6ff'; g.font = `600 ${16 * k}px Fredoka, sans-serif`; g.textBaseline = 'top';
      g.fillText('✋ Ossos da mão e do punho', x + 12 * k, y + 10 * k);
      const ox = x + (vr.left - pr.left) * k, oy = y + (vr.top - pr.top) * k, s = (vr.width * k) / W;
      g.drawImage(canvas, ox, oy, vr.width * k, vr.height * k);
      g.font = `600 ${11 * k}px Fredoka, sans-serif`; g.textBaseline = 'middle';
      for (const L of MAO_INFO) {
        const t = last[L.id]; if (!t) continue;
        g.strokeStyle = L.cor; g.lineWidth = 1.2 * k; g.beginPath(); g.moveTo(ox + t.ax * s, oy + t.ay * s); g.lineTo(ox + (t.side < 0 ? t.lx + t.bw : t.lx) * s, oy + t.ly * s); g.stroke();
        g.fillStyle = 'rgba(8,18,40,0.92)'; rr(g, ox + t.lx * s, oy + (t.ly - 11) * s, t.bw * s, 22 * s, 11 * s); g.fill(); g.strokeStyle = L.cor; g.stroke();
        g.fillStyle = '#fff'; g.fillText(L.nome, ox + (t.lx + 16) * s, oy + t.ly * s);
        g.fillStyle = L.cor; g.beginPath(); g.arc(ox + (t.lx + 8) * s, oy + t.ly * s, 3 * s, 0, 7); g.fill();
      }
      g.restore();
    },
  };
  return api;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
