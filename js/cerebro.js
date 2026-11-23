// Espelho Raio-X — detalhe do cérebro: lobos coloridos no modelo 3D e painel "Detalhe da anatomia cerebral"
// (vista 3D que se pode rodar, legendas, tocar num lobo e lista das estruturas e das suas funções).
// Recebe o THREE de fora para usar a mesma cópia que o resto da app.

// ---------------------------------------------------------------- classificação por lobos
// Coordenadas do referencial da cabeça (cm): x = esquerda da pessoa, y = cima, z = frente.
// Fronteiras aproximadas a partir da forma do cérebro gerada em ferramentas/gerar_anatomia.py.
const ss = (a, b, t) => { t = Math.min(1, Math.max(0, (t - a) / (b - a))); return t * t * (3 - 2 * t); };
function segDist(p, a, b) {
  const abx = b[0] - a[0], aby = b[1] - a[1], abz = b[2] - a[2];
  const t = Math.min(1, Math.max(0, ((p[0] - a[0]) * abx + (p[1] - a[1]) * aby + (p[2] - a[2]) * abz) / (abx * abx + aby * aby + abz * abz)));
  return Math.hypot(p[0] - a[0] - abx * t, p[1] - a[1] - aby * t, p[2] - a[2] - abz * t);
}
// 0 frontal, 1 parietal, 2 temporal, 3 occipital, 4 cerebelo, 5 tronco encefálico
export function lobeOf(x, y, z) {
  const p = [x, y, z], ax = Math.abs(x);
  // tronco encefálico e medula
  if (segDist(p, [0, 1.2, -3.3], [0, -2.6, -4.2]) < 1.25 && y < 1.3 && ax < 1.6) return 5;
  if (segDist(p, [0, -2.6, -4.2], [0, -6.8, -4.35]) < 0.75) return 5;
  // cerebelo (por baixo do lobo occipital)
  const e = (x / 4.3) ** 2 + ((y + 0.3) / 1.9) ** 2 + ((z + 6.7) / 2.6) ** 2;
  if (e < 1.7 && y < 1.15 + 0.25 * Math.sin(x * 1.3) && z < -3.6) return 4;
  const wig = 0.35 * Math.sin(y * 1.7 + x * 0.8) + 0.25 * Math.sin(z * 2.1 - y);
  // occipital (o polo de trás)
  if (z < -6.1 + 0.12 * (y - 4) + wig * 0.8) return 3;
  // temporal (por baixo do sulco lateral, que sobe para trás a partir do polo temporal e depois fica quase horizontal)
  const ys = (z >= 3.0 ? 2.3 - (z - 3.0) * 0.8 : z > -3.5 ? 2.3 + (3.0 - z) * 0.29 : 4.2) + wig * 0.4;
  if (z < 3.9 && y < ys && (ax > 1.9 || y < 1.4)) return 2;
  // frontal / parietal (sulco central, inclinado para a frente em baixo)
  const zc = -1.3 + (9.0 - y) * 0.3 + wig;
  return z > zc ? 0 : 1;
}
const hexRgb = h => { const c = parseInt(h.slice(1), 16); return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255]; };
// acrescenta à geometria do cérebro: aLobe (índice), aCol e color (cor do lobo)
export function addLobeAttributes(THREE, geo, lobes) {
  const pos = geo.attributes.position, n = pos.count;
  const lobe = new Float32Array(n), col = new Float32Array(n * 3);
  const cols = lobes.map(l => hexRgb(l.cor));
  for (let i = 0; i < n; i++) {
    const k = lobeOf(pos.getX(i), pos.getY(i), pos.getZ(i));
    lobe[i] = k; col.set(cols[k], i * 3);
  }
  geo.setAttribute('aLobe', new THREE.BufferAttribute(lobe, 1));
  geo.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return geo;
}

// ---------------------------------------------------------------- painel
const PANEL_VS = `
attribute vec3 aCol; attribute float aLobe;
varying vec3 vN; varying vec3 vV; varying vec3 vCol; varying float vLobe;
void main(){ vCol = aCol; vLobe = aLobe; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`;
const PANEL_FS = `
uniform float uHi, uTime;
varying vec3 vN; varying vec3 vV; varying vec3 vCol; varying float vLobe;
void main(){
  vec3 n = normalize(vN); vec3 v = normalize(vV);
  if (!gl_FrontFacing) n = -n;
  vec3 L = normalize(vec3(0.35, 0.75, 0.6));
  float dif = max(dot(n, L), 0.0);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.4);
  float spec = pow(max(dot(reflect(-L, n), v), 0.0), 22.0);
  float k = 1.0;
  if (uHi > -0.5) k = abs(vLobe - uHi) < 0.5 ? 1.2 + 0.18 * sin(uTime * 4.0) : 0.3;
  vec3 c = vCol * (0.22 + 0.85 * dif) * k + vCol * rim * 1.2 * k + vec3(spec * 0.4 * k);
  gl_FragColor = vec4(min(c, vec3(1.0)), 1.0);
}`;
// pontos das legendas: vários candidatos por lobo; escolhe-se o mais virado para a câmara
const ANCH = [
  [[-4.6, 6.4, 3.0], [4.6, 6.4, 3.0], [0, 8.4, 2.4], [-2.6, 5.5, 5.6], [2.6, 5.5, 5.6]],
  [[-4.6, 7.0, -3.4], [4.6, 7.0, -3.4], [-1.6, 8.8, -3.0], [1.6, 8.8, -3.0]],
  [[-5.9, 1.4, 0.0], [5.9, 1.4, 0.0], [-4.6, 0.2, 2.6], [4.6, 0.2, 2.6]],
  [[-3.2, 4.4, -8.4], [3.2, 4.4, -8.4], [0, 5.6, -8.8]],
  [[-3.4, -0.9, -6.8], [3.4, -0.9, -6.8], [0, -1.2, -8.6]],
  [[-0.95, -1.6, -3.9], [0.95, -1.6, -3.9], [0, -2.5, -3.2]],
];
const TARGET = [0, 1.6, -1.4];
const VIEWS = {
  dir: { yaw: -Math.PI / 2, pitch: 0.06, sub: 'Vista lateral (hemisfério direito)' },
  esq: { yaw: Math.PI / 2, pitch: 0.06, sub: 'Vista lateral (hemisfério esquerdo)' },
  cima: { yaw: Math.PI, pitch: 1.45, sub: 'Vista de cima (os dois hemisférios)' },   // por trás e por cima: a frente fica em cima, sem virar a imagem
  tras: { yaw: Math.PI, pitch: 0.15, sub: 'Vista de trás' },
  frente: { yaw: 0, pitch: 0.1, sub: 'Vista de frente' },
};

export function createBrainPanel(THREE, { geo, lobes, overview, host, sci, speak, onSelect, onClose }) {
  const el = document.createElement('div');
  el.id = 'brainPanel'; el.hidden = true;
  el.innerHTML = `
    <div class="bp-head"><span class="bp-ico">🧠</span><div class="bp-tt"><b>Detalhe da anatomia cerebral</b><small class="bp-sub"></small></div>
      <button class="bp-close" aria-label="Fechar">✕</button></div>
    <div class="bp-view"><canvas></canvas><svg class="bp-lines"></svg><div class="bp-labels"></div><div class="bp-drag">arrasta para rodar · toca num lobo</div></div>
    <div class="bp-tools">
      <button data-v="dir">Direito</button><button data-v="esq">Esquerdo</button><button data-v="cima">Cima</button><button data-v="tras">Trás</button>
      <button data-v="rodar">↻ Rodar</button><button class="bp-info" aria-pressed="true">ℹ️ Funções</button></div>
    <div class="bp-list"><h4>ⓘ Principais estruturas e funções</h4><div class="bp-rows"></div></div>`;
  host.appendChild(el);
  const view = el.querySelector('.bp-view'), canvas = el.querySelector('canvas'), svg = el.querySelector('.bp-lines'), labBox = el.querySelector('.bp-labels');
  const rowsEl = el.querySelector('.bp-rows'), listEl = el.querySelector('.bp-list');

  // 3D
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 1, 300);
  const mat = new THREE.ShaderMaterial({ vertexShader: PANEL_VS, fragmentShader: PANEL_FS, side: THREE.DoubleSide, uniforms: { uHi: { value: -1 }, uTime: { value: 0 } } });
  const mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
  const tgt = new THREE.Vector3(...TARGET);

  let W = 10, H = 10;
  function resize() {
    const r = view.getBoundingClientRect(); W = Math.max(10, Math.round(r.width)); H = Math.max(10, Math.round(r.height));
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  }
  new ResizeObserver(resize).observe(view);

  // câmara orbital
  const cam = { yaw: VIEWS.dir.yaw, pitch: VIEWS.dir.pitch, ty: VIEWS.dir.yaw, tp: VIEWS.dir.pitch, auto: false, view: 'dir' };
  function setView(v) {
    $$('.bp-tools [data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v));
    if (v === 'rodar') { cam.auto = !cam.auto; if (!cam.auto) setView(cam.view); else el.querySelector('.bp-sub').textContent = 'A rodar — arrasta para virar'; return; }
    cam.auto = false; cam.view = v; const V = VIEWS[v];
    // escolher o caminho mais curto
    let d = V.yaw - cam.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); cam.ty = cam.yaw + d; cam.tp = V.pitch;
    el.querySelector('.bp-sub').textContent = V.sub;
  }
  function $$(s) { return el.querySelectorAll(s); }
  $$('.bp-tools [data-v]').forEach(b => b.onclick = () => setView(b.dataset.v));
  el.querySelector('.bp-info').onclick = e => { const on = listEl.hidden; listEl.hidden = !on; e.currentTarget.setAttribute('aria-pressed', on); };
  el.querySelector('.bp-close').onclick = () => { api.close(); onClose?.(); };

  // arrastar / tocar
  let drag = null;
  view.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch, moved: false }; view.setPointerCapture(e.pointerId); e.stopPropagation(); });
  view.addEventListener('pointermove', e => {
    if (!drag) { hover(e); return; }
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 5) drag.moved = true;
    if (!drag.moved) return;
    cam.auto = false; $$('.bp-tools [data-v]').forEach(b => b.classList.remove('on'));
    cam.yaw = cam.ty = drag.yaw - dx * 0.012; cam.pitch = cam.tp = Math.max(-1.2, Math.min(1.45, drag.pitch + dy * 0.01));
    el.querySelector('.bp-sub').textContent = 'Vista livre';
  });
  view.addEventListener('pointerup', e => { if (drag && !drag.moved) { const k = pick(e); if (k >= 0) api.select(k === api.selected ? -1 : k, true); } drag = null; });
  view.addEventListener('pointercancel', () => (drag = null));
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(mesh, false)[0];
    return hit ? geo.attributes.aLobe.getX(hit.face.a) : -1;
  }
  function hover(e) { view.style.cursor = pick(e) >= 0 ? 'pointer' : 'grab'; }

  // legendas
  const labs = lobes.map((L, i) => {
    const b = document.createElement('button'); b.className = 'bp-lab'; b.style.setProperty('--c', L.cor);
    b.innerHTML = `<i></i>${L.nome}`; b.onclick = e => { e.stopPropagation(); api.select(i === api.selected ? -1 : i, true); };
    b.addEventListener('pointerdown', e => e.stopPropagation());
    labBox.appendChild(b); return b;
  });
  const lines = lobes.map(L => { const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.innerHTML = `<line stroke="${L.cor}"/><circle r="3.5" fill="${L.cor}"/>`; svg.appendChild(g); return g; });
  const v3 = new THREE.Vector3(), cd = new THREE.Vector3();
  const lastLab = [];
  function placeLabels() {
    cd.copy(camera.position).sub(tgt).normalize();
    const c0 = v3.copy(tgt).project(camera); const cx = (c0.x + 1) / 2 * W, cy = (1 - c0.y) / 2 * H;
    const items = [];
    lobes.forEach((L, i) => {
      let best = null, bd = -1e9;
      for (const a of ANCH[i]) { const d = (a[0] - tgt.x) * cd.x + (a[1] - tgt.y) * cd.y + (a[2] - tgt.z) * cd.z; if (d > bd) { bd = d; best = a; } }
      const show = bd > -0.5;
      if (!show) { labs[i].hidden = true; lines[i].style.display = 'none'; lastLab[i] = null; return; }
      const p = v3.set(...best).project(camera); const ax = (p.x + 1) / 2 * W, ay = (1 - p.y) / 2 * H;
      const dx = ax - cx, dy = ay - cy, dl = Math.hypot(dx, dy) || 1;
      items.push({ i, ax, ay, side: dx >= 0 ? 1 : -1, ly: ay + dy / dl * H * 0.12 });
    });
    const pad = 6, lh = 28;
    for (const side of [-1, 1]) {
      const list = items.filter(t => t.side === side).sort((a, b) => a.ly - b.ly);
      let y = -1e9;
      for (const t of list) { t.ly = Math.max(t.ly, y + lh + 4, lh / 2 + pad); y = t.ly; }
      const over = y + lh / 2 + pad - H;
      if (over > 0) for (const t of list) t.ly -= over;
    }
    for (const t of items) {
      const b = labs[t.i]; b.hidden = false;
      const bw = b.offsetWidth || 110;
      const lx = t.side > 0 ? Math.min(W - bw - pad, Math.max(t.ax + 30, W * 0.62)) : Math.max(pad, Math.min(t.ax - 30 - bw, W * 0.38 - bw));
      b.style.transform = `translate(${lx}px, ${t.ly - lh / 2}px)`;
      const ex = t.side > 0 ? lx : lx + bw;
      const g = lines[t.i]; g.style.display = '';
      const ln = g.firstChild; ln.setAttribute('x1', t.ax); ln.setAttribute('y1', t.ay); ln.setAttribute('x2', ex); ln.setAttribute('y2', t.ly);
      g.lastChild.setAttribute('cx', t.ax); g.lastChild.setAttribute('cy', t.ay);
      lastLab[t.i] = { ax: t.ax, ay: t.ay, lx, ly: t.ly, bw, side: t.side };
    }
  }

  // lista das funções
  function fillRows() {
    const S = sci();
    const all = [{ ...overview, i: -1 }, ...lobes.map((L, i) => ({ ...L, i }))];
    rowsEl.innerHTML = all.map(r => `<button class="bp-row" data-i="${r.i}" style="--c:${r.cor}"><i></i><span><b>${r.nome}</b>${S ? r.funcaoCient : r.funcao}</span></button>`).join('');
    rowsEl.querySelectorAll('.bp-row').forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      if (i < 0) { api.select(-1, false); const r = overview; speak(`${r.nome}. ${S ? r.funcaoCient : r.funcao}`); return; }
      api.select(i === api.selected ? -1 : i, true);
    });
    markRows();
  }
  function markRows() { rowsEl.querySelectorAll('.bp-row').forEach(b => b.classList.toggle('on', api.selected >= 0 && +b.dataset.i === api.selected)); labs.forEach((b, i) => b.classList.toggle('on', i === api.selected)); }

  let tPrev = 0;
  const api = {
    el, selected: -1, isOpen: false,
    open(v) { el.hidden = false; api.isOpen = true; fillRows(); resize(); if (v) setView(v); else if (!el.querySelector('.bp-sub').textContent) setView('dir'); },
    close() { el.hidden = true; api.isOpen = false; api.selected = -1; mat.uniforms.uHi.value = -1; markRows(); },
    toggle() { api.isOpen ? api.close() : api.open(); },
    refreshText: fillRows,
    select(i, say) {
      api.selected = i; mat.uniforms.uHi.value = i; markRows();
      if (i >= 0) {
        const L = lobes[i]; const S = sci();
        if (say) speak(`${L.nome}. ${S ? L.funcaoCient : L.funcao}`);
        const row = rowsEl.querySelector(`.bp-row[data-i="${i}"]`); if (row && !listEl.hidden) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      onSelect?.(i);
    },
    render(now) {
      if (!api.isOpen) return;
      const dt = Math.min(0.1, (now - (tPrev || now)) / 1000); tPrev = now;
      if (cam.auto) { cam.ty += dt * 0.5; cam.tp = 0.15; }
      cam.yaw += (cam.ty - cam.yaw) * Math.min(1, dt * 6); cam.pitch += (cam.tp - cam.pitch) * Math.min(1, dt * 6);
      const d = 43, cp = Math.cos(cam.pitch);
      camera.position.set(tgt.x + d * Math.sin(cam.yaw) * cp, tgt.y + d * Math.sin(cam.pitch), tgt.z + d * Math.cos(cam.yaw) * cp);
      camera.lookAt(tgt);
      mat.uniforms.uTime.value = now / 1000;
      renderer.render(scene, camera);
      placeLabels();
    },
    // para as fotos e vídeos: desenha o painel (vista 3D, legendas e lobo escolhido) num canvas 2D
    drawInto(g, x, y, w, h, scale = 1) {
      if (!api.isOpen) return;
      const vr = view.getBoundingClientRect(), pr = el.getBoundingClientRect();
      const k = w / pr.width;
      h = (vr.bottom - pr.top) * k + (api.selected >= 0 ? 74 * k : 10 * k);
      g.save();
      g.fillStyle = 'rgba(8,18,40,0.9)'; g.strokeStyle = 'rgba(111,227,255,0.7)'; g.lineWidth = 2 * k;
      rr(g, x, y, w, h, 16 * k); g.fill(); g.stroke();
      g.fillStyle = '#e8f6ff'; g.font = `600 ${16 * k}px Fredoka, sans-serif`; g.textBaseline = 'top';
      g.fillText('🧠 Detalhe da anatomia cerebral', x + 12 * k, y + 10 * k);
      g.fillStyle = '#7fd8ff'; g.font = `500 ${11 * k}px Fredoka, sans-serif`; g.fillText(el.querySelector('.bp-sub').textContent.toUpperCase(), x + 12 * k, y + 32 * k);
      const ox = x + (vr.left - pr.left) * k, oy = y + (vr.top - pr.top) * k, s = (vr.width * k) / W;
      g.drawImage(canvas, ox, oy, vr.width * k, vr.height * k);
      g.font = `600 ${12 * k}px Fredoka, sans-serif`; g.textBaseline = 'middle';
      lobes.forEach((L, i) => {
        const t = lastLab[i]; if (!t) return;
        g.strokeStyle = L.cor; g.lineWidth = 1.5 * k; g.beginPath(); g.moveTo(ox + t.ax * s, oy + t.ay * s); g.lineTo(ox + (t.side > 0 ? t.lx : t.lx + t.bw) * s, oy + t.ly * s); g.stroke();
        g.fillStyle = L.cor; g.beginPath(); g.arc(ox + t.ax * s, oy + t.ay * s, 3.5 * k, 0, 7); g.fill();
        g.fillStyle = 'rgba(8,18,40,0.92)'; rr(g, ox + t.lx * s, oy + (t.ly - 12) * s, t.bw * s, 24 * s, 12 * s); g.fill();
        g.strokeStyle = L.cor; g.stroke();
        g.fillStyle = '#ffffff'; g.fillText(L.nome, ox + (t.lx + 18) * s, oy + t.ly * s);
        g.fillStyle = L.cor; g.beginPath(); g.arc(ox + (t.lx + 9) * s, oy + t.ly * s, 3.5 * s, 0, 7); g.fill();
      });
      if (api.selected >= 0) {
        const L = lobes[api.selected], S = sci();
        const ty = oy + vr.height * k + 8 * k;
        g.fillStyle = L.cor; g.font = `600 ${14 * k}px Fredoka, sans-serif`; g.textBaseline = 'top'; g.fillText(L.nome, x + 12 * k, ty);
        g.fillStyle = '#e8f6ff'; g.font = `400 ${12 * k}px Fredoka, sans-serif`;
        wrap(g, S ? L.funcaoCient : L.funcao, x + 12 * k, ty + 20 * k, w - 24 * k, 16 * k, y + h - 8 * k);
      }
      g.restore();
    },
  };
  return api;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function wrap(g, txt, x, y, w, lh, maxY) {
  let line = '';
  for (const word of txt.split(' ')) {
    const t = line ? line + ' ' + word : word;
    if (g.measureText(t).width > w && line) { if (y + lh > maxY) return; g.fillText(line, x, y); y += lh; line = word; } else line = t;
  }
  if (line && y + lh <= maxY + lh) g.fillText(line, x, y);
}
