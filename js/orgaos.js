// Espelho Raio-X — órgãos do peito, da barriga e do pescoço: formas 3D (referencial do tronco, cm),
// animação (coração a bater, pulmões e diafragma a respirar) e painel "Órgãos do corpo".
// Referencial do tronco: origem a meio dos ombros, x = esquerda da pessoa, y = cima, z = frente; ancas em y ≈ -47.

export const SISTEMAS = [
  { id: 'circulacao', nome: 'Circulação', emoji: '❤️' },
  { id: 'respiracao', nome: 'Respiração', emoji: '🫁' },
  { id: 'digestao', nome: 'Digestão', emoji: '🍽️' },
  { id: 'urina', nome: 'Urina', emoji: '💧' },
  { id: 'hormonas', nome: 'Hormonas e defesa', emoji: '🦋' },
];
export const ORGAOS = [
  { id: 'coracao', sis: 'circulacao', nome: 'Coração', cor: '#ff4d6d', emoji: '❤️', principal: true,
    facto: 'É uma bomba do tamanho do teu punho que empurra o sangue para o corpo todo, sem parar, de dia e de noite.',
    factoCient: 'Quatro cavidades: duas aurículas e dois ventrículos. O ventrículo esquerdo bombeia para a aorta. Em repouso bate 60 a 100 vezes por minuto num adulto, mais nas crianças.' },
  { id: 'aorta', sis: 'circulacao', nome: 'Aorta', cient: 'Aorta (artéria)', cor: '#ff3b30', emoji: '🔴',
    facto: 'A maior artéria do corpo: leva o sangue cheio de oxigénio do coração para todo o lado.',
    factoCient: 'Sai do ventrículo esquerdo, faz o arco aórtico e desce à frente da coluna até se dividir nas artérias ilíacas.' },
  { id: 'veiasCavas', sis: 'circulacao', nome: 'Veias cavas', cor: '#4f7dff', emoji: '🔵',
    facto: 'Trazem o sangue de volta ao coração depois de ele dar a volta ao corpo.',
    factoCient: 'A veia cava superior e a inferior desaguam na aurícula direita.' },
  { id: 'traqueia', sis: 'respiracao', nome: 'Traqueia', cor: '#9ad8ff', emoji: '🌬️',
    facto: 'Um tubo com anéis que leva o ar do nariz e da boca até aos pulmões.',
    factoCient: 'Anéis de cartilagem em C; divide-se nos brônquios principais na carina, mais ou menos ao nível de T4–T5.' },
  { id: 'pulmoes', sis: 'respiracao', nome: 'Pulmões', cor: '#ff9fbf', emoji: '🫁', principal: true,
    facto: 'Enchem-se de ar como balões: o oxigénio passa para o sangue e o dióxido de carbono sai quando deitas o ar fora.',
    factoCient: 'O direito tem 3 lobos e o esquerdo 2, para dar lugar ao coração. As trocas de gases fazem-se em centenas de milhões de alvéolos.' },
  { id: 'diafragma', sis: 'respiracao', nome: 'Diafragma', cient: 'Diafragma (músculo)', cor: '#ffb877', emoji: '⛱️',
    facto: 'Um músculo em forma de cúpula por baixo dos pulmões. Quando desce, o ar entra; quando sobe, o ar sai.',
    factoCient: 'Principal músculo da inspiração, inervado pelo nervo frénico (raízes C3 a C5).' },
  { id: 'esofago', sis: 'digestao', nome: 'Esófago', cor: '#f5a3a0', emoji: '🥤',
    facto: 'O tubo que leva a comida da boca ao estômago — funciona mesmo que estejas de pernas para o ar!',
    factoCient: 'Cerca de 25 cm; ondas de peristaltismo empurram os alimentos; atravessa o diafragma pelo hiato esofágico.' },
  { id: 'estomago', sis: 'digestao', nome: 'Estômago', cor: '#ffa347', emoji: '🍽️', principal: true,
    facto: 'Um saco que mistura a comida com sucos muito ácidos e a transforma numa papa.',
    factoCient: 'Fundo, corpo, antro e piloro; o ácido clorídrico e a pepsina começam a digestão das proteínas.' },
  { id: 'figado', sis: 'digestao', nome: 'Fígado', cor: '#c0564c', emoji: '🟤', principal: true,
    facto: 'O maior órgão dentro do corpo: limpa o sangue, guarda energia e faz a bílis para digerir as gorduras.',
    factoCient: 'Pesa cerca de 1,5 kg num adulto; recebe sangue do intestino pela veia porta; produz bílis e proteínas do sangue e armazena glicogénio.' },
  { id: 'vesicula', sis: 'digestao', nome: 'Vesícula biliar', cor: '#6fd36a', emoji: '🫒',
    facto: 'Um saquinho por baixo do fígado que guarda a bílis até ser precisa.',
    factoCient: 'Concentra a bílis e lança-a no duodeno depois das refeições com gordura; é aqui que se formam as pedras da vesícula.' },
  { id: 'pancreas', sis: 'digestao', nome: 'Pâncreas', cor: '#f5cf6b', emoji: '🧪',
    facto: 'Faz sucos para a digestão e a insulina, que controla o açúcar no sangue.',
    factoCient: 'Glândula mista: exócrina (enzimas que vão para o duodeno) e endócrina (ilhéus de Langerhans: insulina e glucagina).' },
  { id: 'intDelgado', sis: 'digestao', nome: 'Intestino delgado', cor: '#ffb0a0', emoji: '🌀', principal: true,
    facto: 'Um tubo muito comprido e enrolado onde a comida passa para o sangue. Esticado, mede uns 6 metros!',
    factoCient: 'Duodeno, jejuno e íleo; as vilosidades aumentam enormemente a superfície de absorção.' },
  { id: 'intGrosso', sis: 'digestao', nome: 'Intestino grosso', cor: '#d98a5a', emoji: '🟫', principal: true,
    facto: 'Tira a água que sobra da comida e forma as fezes.',
    factoCient: 'Ceco, cólon ascendente, transverso, descendente e sigmóide, e recto; vive aqui a maior parte da microbiota.' },
  { id: 'apendice', sis: 'digestao', nome: 'Apêndice', cor: '#ff7a7a', emoji: '🪱',
    facto: 'Um tubinho no início do intestino grosso. Quando inflama, chama-se apendicite.',
    factoCient: 'Liga-se ao ceco e tem tecido linfóide. A dor da apendicite costuma começar à volta do umbigo e passar para o lado direito, em baixo.' },
  { id: 'rins', sis: 'urina', nome: 'Rins', cor: '#c94152', emoji: '🫘', principal: true,
    facto: 'Dois feijões grandes que filtram o sangue e fazem a urina.',
    factoCient: 'Cerca de um milhão de nefrónios cada; filtram uns 180 litros de plasma por dia e ajudam a regular a tensão arterial.' },
  { id: 'ureteres', sis: 'urina', nome: 'Ureteres', cor: '#f2e06b', emoji: '〰️',
    facto: 'Tubinhos que levam a urina dos rins até à bexiga.',
    factoCient: 'Cerca de 25 a 30 cm; uma pedra que fique presa aqui causa a cólica renal.' },
  { id: 'bexiga', sis: 'urina', nome: 'Bexiga', cor: '#ffd94d', emoji: '💧', principal: true,
    facto: 'Um balão que guarda a urina até ires à casa de banho.',
    factoCient: 'A parede é o músculo detrusor; num adulto a vontade de urinar começa por volta dos 200 a 300 ml.' },
  { id: 'tiroide', sis: 'hormonas', nome: 'Tiróide', cor: '#7fd4ff', emoji: '🦋',
    facto: 'Uma glândula em forma de borboleta no pescoço que controla a rapidez com que o corpo gasta energia.',
    factoCient: 'Produz T3 e T4 (precisam de iodo) e calcitonina; fica à frente da traqueia, abaixo da laringe.' },
  { id: 'suprarrenais', sis: 'hormonas', nome: 'Glândulas supra-renais', cor: '#c7a0ff', emoji: '⚡',
    facto: 'Dois chapeuzinhos em cima dos rins que fazem a adrenalina quando te assustas.',
    factoCient: 'Córtex (cortisol e aldosterona) e medula (adrenalina e noradrenalina).' },
  { id: 'baco', sis: 'hormonas', nome: 'Baço', cor: '#9b5bd6', emoji: '🛡️',
    facto: 'Ajuda a defender o corpo das infecções e recicla os glóbulos vermelhos velhos.',
    factoCient: 'Órgão linfóide no lado esquerdo, por baixo das costelas 9 a 11; pode romper com uma pancada forte.' },
];
export const ORGAOS_OVERVIEW = { nome: 'Os órgãos do corpo', cor: '#e8f6ff',
  facto: 'Cada órgão tem um trabalho e trabalham todos em equipa. Sabias que o maior órgão de todos é a pele?',
  factoCient: 'Os órgãos agrupam-se em sistemas (circulatório, respiratório, digestivo, urinário, endócrino e imunitário). O maior órgão é a pele; o maior órgão interno é o fígado.' };
const INFO = Object.fromEntries(ORGAOS.map(o => [o.id, o]));
export const orgaoInfo = id => INFO[id];
export const isOrgao = id => !!INFO[id];

// ---------------------------------------------------------------- geometria
function blob(THREE, r, f, seg = [28, 20], opts = {}) {
  const g = new THREE.SphereGeometry(1, seg[0], seg[1], 0, Math.PI * 2, 0, opts.half ? Math.PI / 2 : Math.PI);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let v = [p.getX(i), p.getY(i), p.getZ(i)];
    if (f) v = f(v[0], v[1], v[2]) || v;
    p.setXYZ(i, v[0] * r[0], v[1] * r[1], v[2] * r[2]);
  }
  g.computeVertexNormals();
  return g;
}
// tubo com raio variável ao longo de uma curva (com tampas)
function sweep(THREE, pts, rad, tub = 64, radial = 14) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  const fr = curve.computeFrenetFrames(tub, false);
  const pos = [], idx = [];
  const P = new THREE.Vector3();
  for (let i = 0; i <= tub; i++) {
    const t = i / tub; curve.getPointAt(t, P);
    const r = typeof rad === 'function' ? rad(t) : rad, N = fr.normals[i], B = fr.binormals[i];
    for (let j = 0; j <= radial; j++) { const a = (j / radial) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); pos.push(P.x + r * (c * N.x + s * B.x), P.y + r * (c * N.y + s * B.y), P.z + r * (c * N.z + s * B.z)); }
  }
  for (let i = 0; i < tub; i++) for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j, b = a + radial + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // tampas
  for (const [i, sgn] of [[0, -1], [tub, 1]]) {
    curve.getPointAt(i / tub, P); const c = pos.length / 3; pos.push(P.x, P.y, P.z);
    for (let j = 0; j < radial; j++) { const a = i * (radial + 1) + j; if (sgn < 0) idx.push(c, a + 1, a); else idx.push(c, a, a + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}
const D = Math.PI / 180;
// cada órgão → lista de peças { geo, pos, anim }  (anim: 'batida' | 'respira' | 'diafragma')
export function buildOrgans(THREE, mergeGeos) {
  const O = {};
  const sw = (pts, r, tub, rad) => sweep(THREE, pts, r, tub, rad);
  // coração: cone arredondado, com a ponta para a esquerda, para baixo e para a frente
  O.coracao = [{ anim: 'batida', pos: [2.0, -13.6, 3.3], geo: blob(THREE, [4.4, 5.6, 3.9], (x, y, z) => {
    const s = 1 + Math.min(0, y) * 0.5; x *= s; z *= s;
    if (y > 0.55) x *= 1 + 0.25 * Math.sign(x) * (y - 0.55);   // aurículas em cima
    return [x, y, z];
  }, [32, 24]).rotateZ(35 * D).rotateX(-25 * D) }];
  O.aorta = [{ pos: [0, 0, 0], geo: mergeGeos([
    sw([[1.0, -10.2, 3.4], [0.7, -7.2, 2.6], [0.9, -5.4, 0.8], [1.9, -6.2, -1.2], [2.2, -9.5, -2.2], [2.0, -18, -2.3], [1.4, -28, -2.0], [0.8, -37.5, -1.6]], t => 1.3 - 0.4 * t, 90, 12),
    sw([[0.8, -37.4, -1.6], [-2.6, -41.5, -1.0], [-5.8, -45.5, 0.2]], 0.62, 24, 10),
    sw([[0.8, -37.4, -1.6], [4.0, -41.3, -1.0], [6.8, -45.0, 0.2]], 0.62, 24, 10),
    sw([[0.8, -5.6, 0.9], [-0.6, -2.4, 1.6], [-1.6, 2.5, 2.2]], 0.5, 20, 8),
    sw([[1.3, -5.7, 0.4], [1.6, -1.5, 1.3], [1.8, 3.5, 2.0]], 0.42, 20, 8),
  ]) }];
  O.veiasCavas = [{ pos: [0, 0, 0], geo: mergeGeos([
    sw([[-2.4, 0.5, 1.0], [-2.4, -6, 1.6], [-1.9, -10.6, 2.2]], 0.95, 24, 10),
    sw([[-1.7, -16.2, 1.6], [-1.9, -22, -0.3], [-2.1, -30, -1.5], [-1.9, -37.6, -1.8]], 1.05, 40, 10),
  ]) }];
  O.traqueia = [{ pos: [0, 0, 0], geo: mergeGeos([
    sw([[0, 7.5, 2.6], [0, 1, 1.8], [0, -6.6, 0.6]], 0.95, 30, 12),
    sw([[0, -6.4, 0.6], [-2.2, -8.2, 0.3], [-4.0, -9.6, 0]], 0.7, 16, 10),
    sw([[0, -6.4, 0.6], [2.4, -8.6, 0.3], [4.3, -10.6, 0]], 0.65, 16, 10),
  ]) }];
  const lung = side => blob(THREE, side < 0 ? [6.3, 11.4, 7.0] : [5.9, 11.0, 6.8], (x, y, z) => {
    const top = Math.max(0, y); x *= 1 - 0.35 * top * top; z *= 1 - 0.3 * top * top;
    if (y < 0) y *= 1 - 0.28 * Math.max(0, 1 - (x * x + z * z) * 1.3);       // a base encaixa na cúpula do diafragma
    if (x * side < 0) x *= 0.55;                                              // face de dentro, achatada
    if (side > 0 && x < 0 && z > 0 && y < 0.35) x *= 0.45;                   // incisura cardíaca do pulmão esquerdo
    return [x, y, z];
  }, [30, 24]);
  O.pulmoes = [{ anim: 'respira', pos: [-7.7, -10.6, -0.4], geo: lung(-1) }, { anim: 'respira', pos: [7.9, -11.4, -0.4], geo: lung(1) }];
  O.diafragma = [{ anim: 'diafragma', pos: [0, -25.2, -0.5], geo: blob(THREE, [12.8, 6.4, 7.6], (x, y, z) => [x, y * (1 - 0.22 * Math.exp(-(x * x) / 0.05)) * (x > 0 ? 0.92 : 1), z], [32, 12], { half: true }) }];
  O.esofago = [{ pos: [0, 0, 0], geo: sw([[0, 7.5, 1.0], [0, 0, 0.1], [0.3, -8, -1.3], [1.2, -15, -1.7], [2.0, -18.6, -1.1], [2.7, -19.8, -0.4]], 0.72, 60, 10) }];
  O.estomago = [{ pos: [0, 0, 0], geo: sw([[2.6, -19.6, -0.4], [5.5, -19.0, 0.6], [8.2, -21.6, 1.6], [8.3, -25.6, 2.8], [6.5, -29.4, 4.0], [3.0, -30.4, 4.4], [0.0, -29.0, 4.0], [-2.0, -27.0, 3.2]],
    t => t < 0.12 ? 1.0 + 22 * t : t < 0.45 ? 3.65 : 3.65 - (t - 0.45) * 4.6, 80, 16) }];
  O.figado = [{ pos: [-4.4, -23.4, 1.8], geo: blob(THREE, [10.2, 6.4, 7.0], (x, y, z) => {
    if (x > 0) { y *= 1 - 0.55 * x; z *= 1 - 0.3 * x; x *= 1.18; }
    if (y < 0) y *= 0.62; else y *= 0.95;
    return [x, y - 0.12 * x, z];
  }, [32, 22]) }];
  O.vesicula = [{ pos: [-6.2, -27.6, 5.4], geo: blob(THREE, [1.4, 2.7, 1.4], (x, y, z) => { const s = 1 + 0.35 * Math.min(0, y); return [x * s, y, z * s]; }).rotateZ(22 * D) }];
  O.pancreas = [{ pos: [0, 0, 0], geo: sw([[-3.0, -30.6, -0.2], [-0.5, -29.6, -1.5], [3, -28.6, -2.5], [6.5, -27.0, -3.5], [9.5, -25.4, -4.2]], t => 2.0 - 1.1 * t, 40, 12) }];
  // intestino delgado: duodeno em C + jejuno e íleo enrolados
  const si = [[-2.0, -27.0, 3.2], [-3.8, -28.5, 1.5], [-4.2, -31.5, 0.5], [-2.5, -33.4, 0.2], [0.5, -33.2, 0.4], [2.6, -31.8, 1.0], [5.2, -33.0, 2.4]];
  const rows = [-34.6, -36.4, -38.2, -40.0, -41.8, -43.4];
  rows.forEach((y, k) => {
    const dir = k % 2 ? 1 : -1;
    for (let j = 0; j <= 6; j++) { const x = dir * (-5.6 + j * 11.2 / 6); si.push([x, y + 0.5 * Math.sin(j * 1.7 + k), 2.6 + 2.2 * Math.sin(j * 1.3 + k * 0.9)]); }
  });
  si.push([-5.5, -44.0, 2.4], [-7.0, -43.2, 2.2]);
  O.intDelgado = [{ pos: [0, 0, 0], geo: sw(si, 1.12, 520, 10) }];
  O.intGrosso = [{ pos: [0, 0, 0], geo: sw([[-7.6, -45.6, 2.2], [-8.0, -42, 2.2], [-8.6, -36, 2.0], [-8.2, -30.6, 2.8], [-5, -31.2, 4.8], [0, -33.6, 5.6], [5, -31, 4.8], [8.6, -26.6, 1.8], [9.2, -32, 0.5], [9.3, -40, 0.3], [8.2, -45, 1.0], [5, -46.6, 1.5], [2, -45.6, 0.5], [0.5, -47.6, -2], [0, -50.6, -3.5]],
    t => (t < 0.05 ? 2.7 : t < 0.86 ? 2.15 + 0.28 * Math.sin(t * 110) : 1.75), 240, 14) }];
  O.apendice = [{ pos: [0, 0, 0], geo: sw([[-7.2, -46.8, 2.4], [-6.6, -48.6, 3.0], [-6.0, -49.9, 3.4]], t => 0.42 - 0.12 * t, 16, 8) }];
  const kid = side => blob(THREE, [2.8, 5.2, 2.4], (x, y, z) => { if (x * side < 0) x *= 1 - 0.5 * Math.exp(-(y * y) / 0.12); return [x, y, z]; }).rotateZ(side * 12 * D);   // hilo virado para dentro, pólo de cima inclinado para a coluna
  O.rins = [{ pos: [-5.8, -30.0, -3.8], geo: kid(-1) }, { pos: [5.8, -28.5, -3.8], geo: kid(1) }];
  O.suprarrenais = [{ pos: [-5.0, -24.9, -3.4], geo: blob(THREE, [1.5, 1.0, 0.8], (x, y, z) => [x * (1 - 0.4 * Math.max(0, y)), y, z]) }, { pos: [5.2, -23.4, -3.4], geo: blob(THREE, [1.5, 1.0, 0.8], (x, y, z) => [x * (1 - 0.4 * Math.max(0, y)), y, z]) }];
  O.ureteres = [{ pos: [0, 0, 0], geo: mergeGeos([
    sw([[-4.0, -31.4, -2.6], [-3.5, -38, -2.0], [-2.8, -43, 0], [-1.5, -46.2, 2.2]], 0.32, 40, 8),
    sw([[4.0, -29.8, -2.6], [3.5, -37, -2.0], [2.8, -43, 0], [1.5, -46.2, 2.2]], 0.32, 40, 8),
  ]) }];
  O.bexiga = [{ pos: [0, -46.8, 3.2], geo: blob(THREE, [3.6, 3.0, 3.2], (x, y, z) => [x, y > 0 ? y * 0.8 : y, z]) }];
  O.tiroide = [{ pos: [0, 3.0, 3.6], geo: mergeGeos([
    blob(THREE, [1.1, 2.0, 0.9], (x, y, z) => [x - 1.45, y, z - 0.2]), blob(THREE, [1.1, 2.0, 0.9], (x, y, z) => [x + 1.45, y, z - 0.2]),
    blob(THREE, [1.4, 0.5, 0.5], (x, y, z) => [x, y - 1.0, z + 0.5]),
  ]) }];
  O.baco = [{ pos: [10.3, -22.6, -4.2], geo: blob(THREE, [2.8, 5.0, 2.0], (x, y, z) => [x + 0.3 * (1 - y * y), y, z]).rotateZ(-25 * D) }];
  return O;
}

// cria as malhas de todos os órgãos dentro de um grupo; addMesh(parent, geo, idOrgao)
export function makeOrganMeshes(THREE, O, addMesh) {
  const g = new THREE.Group();
  const parts = [];
  for (const o of ORGAOS) for (const p of O[o.id]) {
    const m = addMesh(g, p.geo, o.id);
    m.position.set(...p.pos); m.userData.base = p.pos.slice();
    parts.push({ id: o.id, sis: o.sis, anim: p.anim, mesh: m, pos: p.pos });
  }
  return { g, parts };
}
// coração a bater e pulmões a respirar: bpm e respirações por minuto
export function animateOrgans(rig, t, bpm = 80, rpm = 16) {
  const beatPh = (t * bpm / 60) % 1, beat = Math.pow(Math.max(0, Math.sin(beatPh * Math.PI * 2)), 6) + 0.5 * Math.pow(Math.max(0, Math.sin((beatPh - 0.18) * Math.PI * 2)), 6);
  const br = 0.5 - 0.5 * Math.cos(t * rpm / 60 * Math.PI * 2);
  for (const p of rig.parts) {
    const m = p.mesh;
    if (p.anim === 'batida') { const s = 1 + 0.07 * beat; m.scale.set(s, s, s); }
    else if (p.anim === 'respira') { m.scale.set(1 + 0.05 * br, 1 + 0.07 * br, 1 + 0.06 * br); m.position.y = p.pos[1] - 0.6 * br; }
    else if (p.anim === 'diafragma') m.position.y = p.pos[1] - 1.8 * br;
  }
  return { beat, br };
}
// ponto da etiqueta de cada órgão (referencial do tronco)
export const ANCORA = {
  coracao: [3.6, -15.5, 5.6], aorta: [1.0, -5.6, 0.6], veiasCavas: [-2.4, -5.5, 1.6], traqueia: [0, 2.5, 2.4], pulmoes: [-9.5, -8.5, 2.5],
  diafragma: [-9, -20.6, 3.5], esofago: [0.2, -12, -1.6], estomago: [7.2, -25.0, 4.5], figado: [-7.5, -22.8, 5.5], vesicula: [-6.4, -29.5, 6.4],
  pancreas: [2.5, -28.6, -1.0], intDelgado: [1.5, -40.0, 5.0], intGrosso: [-8.6, -36.5, 4.0], apendice: [-6.3, -49.3, 3.4], rins: [-6.2, -30.5, -1.6],
  ureteres: [-3.2, -40, -1.2], bexiga: [0, -47.5, 6.2], tiroide: [1.6, 3.0, 4.6], suprarrenais: [-5.0, -24.6, -2.6], baco: [10.6, -22.5, -2.0],
};

// ---------------------------------------------------------------- painel
const VIEWS = {
  frente: { yaw: 0, pitch: 0.05, sub: 'Vista de frente' },
  lado: { yaw: -Math.PI / 2, pitch: 0.05, sub: 'Vista do lado direito' },
  tras: { yaw: Math.PI, pitch: 0.05, sub: 'Vista de trás' },
};
export function createOrganPanel(THREE, { organs, context, host, sci, speak, onSelect, onClose, onBrain }) {
  const el = document.createElement('div');
  el.id = 'organPanel'; el.className = 'detail-panel'; el.hidden = true;
  el.innerHTML = `
    <div class="bp-head"><span class="bp-ico">🫀</span><div class="bp-tt"><b>Órgãos do corpo</b><small class="bp-sub"></small></div>
      <button class="bp-close" aria-label="Fechar">✕</button></div>
    <div class="op-sis"><button data-s="" class="on">Todos</button>${SISTEMAS.map(s => `<button data-s="${s.id}">${s.emoji} ${s.nome}</button>`).join('')}<button data-s="cerebro">🧠 Cérebro</button></div>
    <div class="op-vitals"></div>
    <div class="bp-view op-view"><canvas></canvas><svg class="bp-lines"></svg><div class="bp-labels"></div><div class="bp-drag">arrasta para rodar · toca num órgão</div></div>
    <div class="bp-tools"><button data-v="frente">Frente</button><button data-v="lado">Lado</button><button data-v="tras">Trás</button><button data-v="rodar">↻ Rodar</button><button class="bp-info" aria-pressed="true">ℹ️ Funções</button></div>
    <div class="bp-list"><h4>ⓘ Os órgãos e para que servem</h4><div class="bp-rows"></div></div>`;
  host.appendChild(el);
  el.addEventListener('click', e => e.stopPropagation());
  const $$ = s => el.querySelectorAll(s);
  const view = el.querySelector('.bp-view'), canvas = el.querySelector('canvas'), svg = el.querySelector('.bp-lines'), labBox = el.querySelector('.bp-labels');
  const rowsEl = el.querySelector('.bp-rows'), listEl = el.querySelector('.bp-list'), vitals = el.querySelector('.op-vitals');

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xeaf4ff, 0x2a2040, 1.1));
  const dl = new THREE.DirectionalLight(0xffffff, 1.5); dl.position.set(3, 4, 6); scene.add(dl);
  const dl2 = new THREE.DirectionalLight(0x99bbff, 0.6); dl2.position.set(-4, -2, -5); scene.add(dl2);
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 500);
  const ctxMat = new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.1, depthWrite: false });
  for (const c of context || []) { const m = new THREE.Mesh(c.geo, ctxMat); m.position.set(...(c.pos || [0, 0, 0])); m.renderOrder = 2; scene.add(m); }
  const mats = {};
  const rig = makeOrganMeshes(THREE, organs, (g, geo, id) => {
    const col = new THREE.Color(INFO[id].cor);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0.05, emissive: col.clone().multiplyScalar(0.1), transparent: true }));
    (mats[id] = mats[id] || []).push(m.material); g.add(m); return m;
  });
  scene.add(rig.g);
  const tgt = new THREE.Vector3(0, -21, 1);

  let W = 10, H = 10;
  function resize() {
    const r = view.getBoundingClientRect(); W = Math.max(10, Math.round(r.width)); H = Math.max(10, Math.round(r.height));
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix(); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }
  new ResizeObserver(resize).observe(view);
  const cam = { yaw: 0, pitch: 0.05, ty: 0, tp: 0.05, auto: false, view: 'frente' };
  function setView(v) {
    $$('.bp-tools [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    if (v === 'rodar') { cam.auto = !cam.auto; if (!cam.auto) setView(cam.view); else el.querySelector('.bp-sub').textContent = 'A rodar — arrasta para virar'; return; }
    cam.auto = false; cam.view = v; const V = VIEWS[v];
    let dd = V.yaw - cam.yaw; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); cam.ty = cam.yaw + dd; cam.tp = V.pitch;
    el.querySelector('.bp-sub').textContent = V.sub;
  }
  $$('.bp-tools [data-v]').forEach(b => b.onclick = () => setView(b.dataset.v));
  let sis = '';
  $$('.op-sis button').forEach(b => b.onclick = () => {
    if (b.dataset.s === 'cerebro') { onBrain?.(); return; }
    sis = b.dataset.s; $$('.op-sis button').forEach(x => x.classList.toggle('on', x === b)); api.select(null, false); fillRows(); mark();
    if (sis) { const S = SISTEMAS.find(x => x.id === sis); speak(`${S.nome}.`); }
  });
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
    cam.yaw = cam.ty = drag.yaw - dx * 0.012; cam.pitch = cam.tp = Math.max(-1.2, Math.min(1.2, drag.pitch + dy * 0.01));
    el.querySelector('.bp-sub').textContent = 'Vista livre';
  });
  view.addEventListener('pointerup', e => { if (drag && !drag.moved) { const id = pick(e); if (id) api.select(id === api.selected ? null : id, true); } drag = null; });
  view.addEventListener('pointercancel', () => (drag = null));
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const vis = rig.parts.filter(p => !sis || p.sis === sis).map(p => p.mesh);
    const hit = ray.intersectObjects(vis, false)[0];
    return hit ? rig.parts.find(p => p.mesh === hit.object)?.id : null;
  }

  const labs = {}, lines = {};
  for (const o of ORGAOS) {
    const b = document.createElement('button'); b.className = 'bp-lab'; b.style.setProperty('--c', o.cor);
    b.innerHTML = `<i></i>${o.nome}`; b.onclick = e => { e.stopPropagation(); api.select(o.id === api.selected ? null : o.id, true); };
    b.addEventListener('pointerdown', e => e.stopPropagation());
    labBox.appendChild(b); labs[o.id] = b;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.innerHTML = `<line stroke="${o.cor}"/><circle r="3" fill="${o.cor}"/>`; svg.appendChild(g); lines[o.id] = g;
  }
  const v3 = new THREE.Vector3(), last = {};
  function placeLabels() {
    const items = [];
    for (const o of ORGAOS) {
      const show = !sis || o.sis === sis;
      if (!show) { labs[o.id].hidden = true; lines[o.id].style.display = 'none'; last[o.id] = null; continue; }
      v3.set(...ANCORA[o.id]).applyMatrix4(rig.g.matrixWorld).project(camera);
      items.push({ id: o.id, ax: (v3.x + 1) / 2 * W, ay: (1 - v3.y) / 2 * H });
    }
    items.sort((a, b) => a.ax - b.ax);
    const half = Math.ceil(items.length / 2), lh = 22, pad = 4;
    items.forEach((t, k) => (t.side = k < half ? -1 : 1));
    for (const side of [-1, 1]) {
      const list = items.filter(t => t.side === side).sort((a, b) => a.ay - b.ay);
      let y = -1e9;
      for (const t of list) { t.ly = Math.max(t.ay, y + lh + 2, lh / 2 + pad); y = t.ly; }
      let lim = H - lh / 2 - pad; for (let k = list.length - 1; k >= 0; k--) { if (list[k].ly > lim) list[k].ly = lim; lim = list[k].ly - lh - 2; }
    }
    for (const t of items) {
      const b = labs[t.id]; b.hidden = false; lines[t.id].style.display = ''; const bw = b.offsetWidth || 90;
      const lx = t.side < 0 ? pad : W - bw - pad;
      b.style.transform = `translate(${lx}px, ${t.ly - lh / 2}px)`;
      const ex = t.side < 0 ? lx + bw : lx, g = lines[t.id], ln = g.firstChild;
      ln.setAttribute('x1', t.ax); ln.setAttribute('y1', t.ay); ln.setAttribute('x2', ex); ln.setAttribute('y2', t.ly);
      g.lastChild.setAttribute('cx', t.ax); g.lastChild.setAttribute('cy', t.ay);
      last[t.id] = { ...t, lx, bw };
    }
  }
  function fillRows() {
    const S = sci();
    const list = ORGAOS.filter(o => !sis || o.sis === sis);
    const head = sis ? null : { ...ORGAOS_OVERVIEW, id: '' };
    rowsEl.innerHTML = [head, ...list].filter(Boolean).map(r => `<button class="bp-row" data-id="${r.id}" style="--c:${r.cor}"><i></i><span><b>${S && r.cient ? r.cient : r.nome}</b>${S ? r.factoCient : r.facto}</span></button>`).join('');
    rowsEl.querySelectorAll('.bp-row').forEach(b => b.onclick = () => {
      const id = b.dataset.id;
      if (!id) { api.select(null, false); speak(`${ORGAOS_OVERVIEW.nome}. ${S ? ORGAOS_OVERVIEW.factoCient : ORGAOS_OVERVIEW.facto}`); return; }
      api.select(id === api.selected ? null : id, true);
    });
    mark();
  }
  function mark() {
    rowsEl.querySelectorAll('.bp-row').forEach(b => b.classList.toggle('on', !!api.selected && b.dataset.id === api.selected));
    for (const [id, b] of Object.entries(labs)) b.classList.toggle('on', id === api.selected);
    for (const [id, list] of Object.entries(mats)) for (const m of list) {
      const col = new THREE.Color(INFO[id].cor), inSis = !sis || INFO[id].sis === sis;
      const sel = api.selected === id, dim = (api.selected && !sel) || !inSis;
      m.color.copy(col).multiplyScalar(dim ? 0.4 : 1);
      m.emissive.copy(col).multiplyScalar(sel ? 0.5 : dim ? 0.02 : 0.1);
      m.opacity = !inSis ? 0.12 : api.selected && !sel ? 0.45 : 1;
      m.depthWrite = m.opacity > 0.9;
    }
  }
  let tPrev = 0, bpm = 80, rpm = 16;
  const api = {
    el, selected: null, isOpen: false,
    get system() { return sis; },
    open(v) { el.hidden = false; api.isOpen = true; fillRows(); resize(); if (v || !el.querySelector('.bp-sub').textContent) setView(v || 'frente'); },
    close() { el.hidden = true; api.isOpen = false; api.selected = null; mark(); },
    refreshText: fillRows,
    setVitals(b, r) { bpm = b; rpm = r; vitals.textContent = `❤️ ${Math.round(b)} batimentos/min · 🫁 ${Math.round(r)} respirações/min (simulado)`; },
    select(id, say) {
      api.selected = id || null;
      if (id && sis && INFO[id].sis !== sis) { sis = ''; $$('.op-sis button').forEach(x => x.classList.toggle('on', x.dataset.s === '')); fillRows(); }
      mark();
      if (id) {
        const o = INFO[id], S = sci();
        if (say) speak(`${S && o.cient ? o.cient : o.nome}. ${S ? o.factoCient : o.facto}`);
        const row = rowsEl.querySelector(`.bp-row[data-id="${id}"]`); if (row && !listEl.hidden) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      onSelect?.(api.selected);
    },
    render(now) {
      if (!api.isOpen) return;
      const dt = Math.min(0.1, (now - (tPrev || now)) / 1000); tPrev = now;
      animateOrgans(rig, now / 1000, bpm, rpm);
      if (cam.auto) { cam.ty += dt * 0.5; cam.tp = 0.12; }
      cam.yaw += (cam.ty - cam.yaw) * Math.min(1, dt * 6); cam.pitch += (cam.tp - cam.pitch) * Math.min(1, dt * 6);
      const d = 118, cp = Math.cos(cam.pitch);
      camera.position.set(tgt.x + d * Math.sin(cam.yaw) * cp, tgt.y + d * Math.sin(cam.pitch), tgt.z + d * Math.cos(cam.yaw) * cp);
      camera.lookAt(tgt);
      rig.g.updateMatrixWorld(true);
      renderer.render(scene, camera);
      placeLabels();
    },
    drawInto(g, x, y, w) {
      if (!api.isOpen) return;
      const vr = view.getBoundingClientRect(), pr = el.getBoundingClientRect(), k = w / pr.width;
      const h = (vr.bottom - pr.top) * k + 10 * k;
      g.save();
      g.fillStyle = 'rgba(8,18,40,0.9)'; g.strokeStyle = 'rgba(111,227,255,0.7)'; g.lineWidth = 2 * k;
      rr(g, x, y, w, h, 16 * k); g.fill(); g.stroke();
      g.fillStyle = '#e8f6ff'; g.font = `600 ${16 * k}px Fredoka, sans-serif`; g.textBaseline = 'top';
      g.fillText('🫀 Órgãos do corpo', x + 12 * k, y + 10 * k);
      const ox = x + (vr.left - pr.left) * k, oy = y + (vr.top - pr.top) * k, s = (vr.width * k) / W;
      g.drawImage(canvas, ox, oy, vr.width * k, vr.height * k);
      g.font = `600 ${11 * k}px Fredoka, sans-serif`; g.textBaseline = 'middle';
      for (const o of ORGAOS) {
        const t = last[o.id]; if (!t) continue;
        g.strokeStyle = o.cor; g.lineWidth = 1.2 * k; g.beginPath(); g.moveTo(ox + t.ax * s, oy + t.ay * s); g.lineTo(ox + (t.side < 0 ? t.lx + t.bw : t.lx) * s, oy + t.ly * s); g.stroke();
        g.fillStyle = 'rgba(8,18,40,0.92)'; rr(g, ox + t.lx * s, oy + (t.ly - 10) * s, t.bw * s, 20 * s, 10 * s); g.fill(); g.strokeStyle = o.cor; g.stroke();
        g.fillStyle = '#fff'; g.fillText(o.nome, ox + (t.lx + 15) * s, oy + t.ly * s);
        g.fillStyle = o.cor; g.beginPath(); g.arc(ox + (t.lx + 8) * s, oy + t.ly * s, 3 * s, 0, 7); g.fill();
      }
      g.restore();
    },
  };
  return api;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
