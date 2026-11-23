// Espelho Raio-X — verificação guiada: uma criança segue os passos e a app mede se cada coisa é detectada.
// No fim sai um relatório de texto (só números, nunca imagens) para copiar e enviar a quem afina a app.

const avg = (b, a, c) => ((b[a] || 0) + (b[c] || 0)) / 2;
const r2 = v => (Math.round(v * 100) / 100).toFixed(2);

export function createCheck(ctx) {
  const { T } = ctx;
  const face = (key, t, pede, emoji, metric, thr, test, extra = {}) => ({ id: key, t, pede, emoji, dur: 9, kind: 'face', metric, thr, test, ...extra });
  const STEPS = [
    { id: 'cam', t: 'Câmara e velocidade', pede: 'A medir a câmara e a velocidade… fica quieto um bocadinho.', emoji: '🎥', dur: 3, kind: 'cam' },
    { id: 'cara', t: 'Cara encontrada', pede: 'Olha para a câmara, de frente.', emoji: '🙂', dur: 10, kind: 'cara' },
    { id: 'encaixe', t: 'Crânio encaixado na cara', pede: 'Olha para o ecrã: o crânio está bem encaixado na cara?', emoji: '💀', kind: 'manual', opts: ['👍 Sim', '😐 Mais ou menos', '👎 Não'] },
    face('sorrir', 'Sorrir', 'Faz um sorriso bem grande!', '😁', b => avg(b, 'mouthSmileLeft', 'mouthSmileRight'), 0.5, T.SMILE),
    face('boca', 'Abrir a boca', 'Abre muito a boca!', '😮', b => b.jawOpen || 0, 0.45, T.JAW),
    face('beijinho', 'Beijinho', 'Faz um beijinho!', '😘', b => b.mouthPucker || 0, 0.5, T.KISS),
    face('olhos', 'Fechar os olhos', 'Fecha os olhos com força… (alguém lê-te o passo seguinte)', '😑', b => avg(b, 'eyeBlinkLeft', 'eyeBlinkRight'), 0.55, T.EYES),
    face('sobrancelhas', 'Levantar as sobrancelhas', 'Levanta as sobrancelhas, cara de surpresa!', '🤨', b => Math.max(b.browInnerUp || 0, avg(b, 'browOuterUpLeft', 'browOuterUpRight') * 1.25), 0.5, T.BROWS),
    face('zangado', 'Cara de zangado', 'Faz cara de zangado!', '😠', b => avg(b, 'browDownLeft', 'browDownRight'), 0.35, T.ANGRY),
    face('triste', 'Lábio de baixo para baixo', 'Puxa os cantos da boca e o lábio de baixo para baixo, cara de triste.', '☹️', b => Math.max(avg(b, 'mouthFrownLeft', 'mouthFrownRight') * 2.4, avg(b, 'mouthLowerDownLeft', 'mouthLowerDownRight') * 1.28), 0.45, T.SAD),
    { id: 'mastigar', t: 'Mastigar', pede: 'Faz de conta que estás a mastigar uma pastilha!', emoji: '😋', dur: 9, kind: 'chew', thr: 0.5 },
    ...[['esq', 'esquerda', '👈'], ['dir', 'direita', '👉'], ['cima', 'cima', '👆'], ['baixo', 'baixo', '👇']].map(([dir, nome, e]) =>
      ({ id: 'olhar-' + dir, t: 'Olhar para ' + (dir === 'cima' || dir === 'baixo' ? nome : 'a ' + nome), pede: `Olha para o ecrã… e agora só com os olhos, sem rodar a cabeça, olha para ${dir === 'cima' || dir === 'baixo' ? nome : 'a tua ' + nome}!`, emoji: e, dur: 9, kind: 'gaze', dir })),
    { id: 'mao', t: 'Mão encontrada', pede: 'Mostra uma mão aberta à câmara.', emoji: '🖐️', dur: 9, kind: 'mao' },
    { id: 'nariz', t: 'Tocar no nariz', pede: 'Toca no teu nariz com o dedo indicador.', emoji: '👃', dur: 10, kind: 'nariz' },
    { id: 'maoDir', t: 'Mão direita reconhecida como direita', pede: 'Acena com a tua mão DIREITA (a outra mão fica em baixo).', emoji: '👋', dur: 8, kind: 'lado' },
    { id: 'corpo', t: 'Corpo (cabeça até à cintura)', pede: 'Afasta-te até se ver da cabeça à cintura e levanta os dois braços bem alto. (Podes saltar este passo.)', emoji: '🙌', dur: 14, kind: 'corpo' },
  ];

  const el = document.createElement('div');
  el.id = 'check'; el.hidden = true;
  ctx.host.appendChild(el);
  el.addEventListener('click', e => e.stopPropagation());
  let run = null;

  function show() {
    const s = STEPS[run.i];
    el.innerHTML = `<div class="ck-top"><b>🔧 Verificação</b><span>passo ${run.i + 1} de ${STEPS.length}</span><button class="ck-stop">✋ Parar</button></div>
      <div class="ck-main"><span class="ck-e">${s.emoji}</span><div><div class="ck-t">${s.pede}</div><div class="ck-val"></div></div></div>
      <div class="ck-bar"><i></i></div>
      <div class="ck-btns">${s.kind === 'manual' ? s.opts.map((o, k) => `<button data-o="${k}">${o}</button>`).join('') : '<button class="ck-skip">⏭️ Saltar</button><button class="ck-fail">❌ Não funcionou</button>'}</div>`;
    el.querySelector('.ck-stop').onclick = () => finish(true);
    el.querySelector('.ck-skip')?.addEventListener('click', () => done('saltado', run.best != null ? run.valTxt : ''));
    el.querySelector('.ck-fail')?.addEventListener('click', () => done(false, run.valTxt || 'marcado à mão'));
    el.querySelectorAll('[data-o]').forEach(b => b.onclick = () => done(+b.dataset.o === 0 ? true : +b.dataset.o === 1 ? 'meio' : false, s.opts[+b.dataset.o]));
    ctx.speak(s.pede.replace(/\(.*?\)/g, ''));
  }
  function next() {
    run.i++;
    if (run.i >= STEPS.length) return finish(false);
    Object.assign(run, { t: 0, hold: 0, best: null, bestBs: null, valTxt: '', ok: false, okT: 0, g0: null, sides: { L: 0, R: 0 }, seen: 0 });
    ctx.onStep?.(STEPS[run.i].id);
    show();
  }
  function done(res, val) {
    const s = STEPS[run.i];
    run.res.push({ id: s.id, t: s.t, res, val: val || run.valTxt || '' });
    if (res === true) ctx.ok?.();
    next();
  }
  function setVal(txt, frac) {
    run.valTxt = txt;
    const v = el.querySelector('.ck-val'); if (v && v.textContent !== txt) v.textContent = txt;
    const bar = el.querySelector('.ck-bar i'); if (bar) bar.style.width = `${Math.min(100, (frac ?? 0) * 100)}%`;
  }
  // chamado em cada imagem
  function update(dt) {
    if (!run || run.i >= STEPS.length) return;
    const s = STEPS[run.i]; if (s.kind === 'manual') return;
    run.t += dt;
    const f = ctx.getFace();
    const tFrac = run.t / s.dur;
    const pass = (ok, val) => {
      if (ok) run.hold += dt; else run.hold = Math.max(0, run.hold - dt);
      if (!run.ok && run.hold > 0.35) { run.ok = true; run.okT = run.t; }
      if (run.ok && run.t - run.okT > 0.9) return done(true, val);
      if (run.t > s.dur) done(false, val);
    };
    if (s.kind === 'cam') {
      const [w, h] = ctx.size();
      setVal(`${Math.round(ctx.fps())} imagens/s · câmara ${w}×${h} · ${ctx.gpu()}`, tFrac);
      if (run.t > s.dur) done(ctx.fps() >= 15, run.valTxt);
      return;
    }
    if (s.kind === 'cara') {
      const [w] = ctx.size();
      const val = f ? `largura da cara = ${Math.round(f.faceW / w * 100)}% da imagem` : 'sem cara';
      setVal(val, tFrac); return pass(!!f, val);
    }
    if (s.kind === 'face') {
      if (!f) { setVal('sem cara à vista', tFrac); if (run.t > s.dur) done(false, 'sem cara'); return; }
      const m = s.metric(f.bs); run.best = Math.max(run.best ?? 0, m);
      const val = `máx ${r2(run.best)} (precisa de ${r2(s.thr)})`;
      setVal(`agora ${r2(m)} · ${val}`, Math.max(tFrac, 0)); return pass(s.test(f.bs), val);
    }
    if (s.kind === 'chew') {
      if (!f) { setVal('sem cara à vista', tFrac); if (run.t > s.dur) done(false, 'sem cara'); return; }
      run.best = Math.max(run.best ?? 0, f.chew || 0);
      const val = `máx ${r2(run.best)} (precisa de ${r2(s.thr)})`;
      setVal(`agora ${r2(f.chew || 0)} · ${val}`, tFrac);
      if ((f.chew || 0) > s.thr) run.hold += dt * 0.6;
      return pass((f.chew || 0) > s.thr, val);
    }
    if (s.kind === 'gaze') {
      if (!f) { setVal('sem cara à vista', tFrac); if (run.t > s.dur) done(false, 'sem cara'); return; }
      const g = ctx.gazeNow(f);
      if (run.t < 1.2 || !run.g0) { run.g0 = run.g0 ? Object.fromEntries(Object.keys(g).map(k => [k, run.g0[k] + (g[k] - run.g0[k]) * 0.25])) : g; setVal('a medir o olhar em frente…', tFrac); return; }
      const d = s.dir === 'esq' ? g.gx - run.g0.gx : s.dir === 'dir' ? run.g0.gx - g.gx : s.dir === 'cima' ? g.gy - run.g0.gy : run.g0.gy - g.gy;
      const bsd = s.dir === 'cima' ? g.up - run.g0.up : s.dir === 'baixo' ? g.dn - run.g0.dn : 0;
      run.best = Math.max(run.best ?? -9, d); run.bestBs = Math.max(run.bestBs ?? -9, bsd);
      const thr = s.dir === 'esq' || s.dir === 'dir' ? 0.09 : s.dir === 'cima' ? 0.05 : 0.045;
      const val = `deslocamento máx ${r2(run.best)} (precisa de ${r2(thr)})${s.dir === 'cima' || s.dir === 'baixo' ? ` · expressão ${r2(run.bestBs)}` : ''}`;
      setVal(val, tFrac); return pass(ctx.gazeOk(f, s.dir, run.g0), val);
    }
    if (s.kind === 'mao') {
      const n = ctx.hands().filter(h => h.active).length;
      setVal(n ? `${n} mão(s) encontrada(s)` : 'ainda sem mãos', tFrac); return pass(n > 0, `${n} mão(s)`);
    }
    if (s.kind === 'nariz') {
      const tips = ctx.fingerTips();
      if (!f) { setVal('sem cara à vista', tFrac); if (run.t > s.dur) done(false, 'sem cara'); return; }
      const nx = f.lm[3], ny = f.lm[4];
      const d = tips.length ? Math.min(...tips.map(t => Math.hypot(t[0] - nx, t[1] - ny))) / f.faceW : null;
      if (d != null) run.best = Math.min(run.best ?? 9, d);
      const val = d == null ? 'sem dedo à vista' : `distância ao nariz ${r2(d)} larguras da cara (mín ${r2(run.best)}; precisa < 0.15)`;
      setVal(val, tFrac); return pass(d != null && d < 0.15, val);
    }
    if (s.kind === 'lado') {
      for (const h of ctx.hands()) if (h.active && h.lm && (h.actv || 0) > 0.3) { run.seen++; if (ctx.handSide(h, f) > 0) run.sides.L++; else run.sides.R++; }
      const tot = run.sides.L + run.sides.R;
      const val = tot ? `mão a mexer vista como direita ${Math.round(run.sides.R / tot * 100)}% das vezes` : 'ainda sem mão a mexer';
      setVal(val, tFrac);
      if (tot > 25) return done(run.sides.R / tot > 0.7, val);
      if (run.t > s.dur) done(tot ? run.sides.R / tot > 0.7 : false, val);
      return;
    }
    if (s.kind === 'corpo') {
      const b = ctx.body();
      const up = b && b.vis[15] > 0.5 && b.vis[16] > 0.5 && b.lm[15 * 3 + 1] < b.lm[1] && b.lm[16 * 3 + 1] < b.lm[1];
      const n = ctx.bodies().filter(x => x.rig?.on).length;
      const val = !b ? 'corpo ainda não encontrado' : `${n} corpo(s) · braços ${up ? 'no ar' : 'em baixo'}`;
      setVal(val, tFrac); return pass(!!up, val);
    }
  }
  function report() {
    const p = ctx.profile(); const d = new Date();
    const [w, h] = ctx.size();
    const ic = r => r === true ? '✅' : r === 'meio' ? '🟡' : r === 'saltado' ? '⏭️' : '❌';
    const ok = run.res.filter(r => r.res === true).length;
    return [
      `Espelho Raio-X ${ctx.version} — verificação guiada`,
      `Data: ${d.toLocaleDateString('pt-PT')} ${d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} · Perfil: ${p.nome}${p.idade ? ` (${p.idade} anos)` : ''}`,
      `Aparelho: ${ctx.device()} · câmara ${w}×${h} · ${Math.round(ctx.fps())} imagens/s · ${ctx.gpu()}`,
      `Resultado: ${ok} de ${run.res.length} passos OK`,
      '',
      ...run.res.map(r => `${ic(r.res)} ${r.t}${r.val ? ' — ' + r.val : ''}`),
      '',
      'Observações: (escreve aqui o que viste de estranho)',
    ].join('\n');
  }
  function finish(stopped) {
    if (!run) return;
    if (stopped && run.i < STEPS.length) run.res.push({ id: 'stop', t: 'Verificação parada a meio', res: 'saltado', val: `no passo ${run.i + 1}` });
    const txt = report();
    run.i = STEPS.length;
    el.innerHTML = `<div class="ck-top"><b>🔧 Verificação terminada</b><span></span><button class="ck-close">Fechar</button></div>
      <p class="ck-t2">Copia o relatório e envia-o: assim dá para afinar a app para esta criança. Não tem imagens, só números.</p>
      <textarea class="ck-rep" readonly rows="12"></textarea>
      <div class="ck-btns"><button class="ck-copy">📋 Copiar relatório</button><button class="ck-save">💾 Descarregar .txt</button><button class="ck-again">🔁 Repetir</button></div>`;
    el.querySelector('.ck-rep').value = txt;
    el.querySelector('.ck-close').onclick = () => api.close();
    el.querySelector('.ck-again').onclick = () => api.start();
    el.querySelector('.ck-copy').onclick = async () => {
      try { await navigator.clipboard.writeText(txt); ctx.toast('Relatório copiado 📋'); }
      catch (e) { const ta = el.querySelector('.ck-rep'); ta.focus(); ta.select(); ctx.toast('Selecciona e copia com Ctrl+C'); }
    };
    el.querySelector('.ck-save').onclick = () => ctx.saveBlob(new Blob([txt], { type: 'text/plain;charset=utf-8' }), `verificacao-espelho-${ctx.profile().nome}.txt`, 'Relatório guardado 💾');
    ctx.speak('Verificação terminada. Obrigado!');
    ctx.onEnd?.();
    api.lastReport = txt;
  }
  const api = {
    el, lastReport: '',
    get running() { return !!run && run.i < STEPS.length; },
    start() { run = { i: -1, res: [] }; el.hidden = false; ctx.onStart?.(); next(); },
    close() { el.hidden = true; run = null; ctx.onEnd?.(); },
    update,
    steps: STEPS,
  };
  return api;
}
