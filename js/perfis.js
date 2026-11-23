// Espelho Raio-X — perfis da família: cada criança com o seu progresso no Desafio, o seu ajuste da cabeça,
// dentes de leite e nomes científicos. Tudo fica guardado só neste browser.

const KEY = 'espelhoPerfis';
export const PROFILE_KEYS = ['prog', 'fit', 'babyTeeth', 'sci', 'unlockAll'];
export const AVATARES = ['🦁', '🐘', '🦒', '🦓', '🐢', '🐬', '🦋', '🐙', '🦖', '🚀', '⚽', '🌟', '🎨', '🎸', '👑', '🌈'];

// nível do Desafio por onde começar, pela idade
export function nivelSugerido(idade) {
  if (!idade) return 1;
  if (idade <= 4) return 1;
  if (idade === 5) return 2;
  if (idade === 6) return 3;
  if (idade === 7) return 4;
  if (idade <= 9) return 5;
  if (idade === 10) return 6;
  if (idade === 11) return 7;
  if (idade <= 14) return 8;
  return 9;
}
export function dadosIniciais(idade, fitPresets) {
  const crianca = idade != null && idade <= 13;
  return {
    prog: { max: nivelSugerido(idade), best: {} },
    fit: structuredClone(crianca ? fitPresets.crianca : fitPresets.adulto),
    babyTeeth: idade != null && idade <= 11,
    sci: idade != null && idade >= 12,
    unlockAll: false,
  };
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function createProfiles({ S, save, fitPresets, host, speak, onChange }) {
  let st = null;
  try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { }
  if (!st || !Array.isArray(st.list) || !st.list.length) {
    // primeira vez: o que já estava guardado passa a ser o perfil "Família"
    st = { list: [{ id: 'p' + Date.now().toString(36), nome: 'Família', emoji: '🌟', idade: null, data: pick(S), stats: {} }], cur: null };
    st.cur = st.list[0].id;
  }
  function pick(src) { const o = {}; for (const k of PROFILE_KEYS) o[k] = structuredClone(src[k]); return o; }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }
  const cur = () => st.list.find(p => p.id === st.cur) || st.list[0];
  function apply(p) {
    const d = { ...dadosIniciais(p.idade, fitPresets), ...(p.data || {}) };
    for (const k of PROFILE_KEYS) S[k] = structuredClone(d[k]);
    if (!S.prog || !S.prog.best) S.prog = { max: 1, best: {} };
  }
  apply(cur());

  // ---------- janela "Quem está a jogar?"
  const el = document.createElement('div');
  el.id = 'profiles'; el.hidden = true;
  host.appendChild(el);
  let editing = null, confirmDel = null, afterPick = null;
  function stars(p) { const b = (p.id === st.cur ? S.prog : p.data?.prog)?.best || {}; return Object.values(b).reduce((a, v) => a + v, 0); }
  function render() {
    if (editing) {
      const p = editing;
      el.innerHTML = `<div class="pf-box"><h2>${p.id ? 'Editar perfil' : 'Novo perfil'}</h2>
        <label class="pf-f">Nome <input class="pf-nome" maxlength="18" value="${esc(p.nome || '')}" placeholder="Ex.: Ana"></label>
        <label class="pf-f">Idade <input class="pf-idade" type="number" min="2" max="99" inputmode="numeric" value="${p.idade ?? ''}" placeholder="anos"></label>
        <div class="pf-av">${AVATARES.map(a => `<button class="${a === p.emoji ? 'on' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
        <p class="pf-note">A idade escolhe o nível do Desafio por onde começar e liga os dentes de leite e o ajuste de criança. Fica tudo guardado só neste computador.</p>
        <div class="pf-btns">
          ${p.id && st.list.length > 1 ? (confirmDel ? `<span class="pf-q">Apagar ${esc(p.nome)} e as estrelas?</span><button class="pf-del2 danger">Apagar</button><button class="pf-no">Não</button>` : `<button class="pf-del ghost">🗑️ Apagar perfil</button>`) : ''}
          <span class="sp"></span><button class="pf-cancel ghost">Cancelar</button><button class="pf-ok big">Guardar</button></div></div>`;
      el.querySelectorAll('.pf-av button').forEach(b => b.onclick = () => { p.emoji = b.dataset.a; el.querySelectorAll('.pf-av button').forEach(x => x.classList.toggle('on', x === b)); });
      el.querySelector('.pf-cancel').onclick = () => { editing = null; confirmDel = null; render(); };
      el.querySelector('.pf-ok').onclick = () => {
        const nome = el.querySelector('.pf-nome').value.trim(); const ida = parseInt(el.querySelector('.pf-idade').value, 10);
        if (!nome) { el.querySelector('.pf-nome').focus(); return; }
        const idade = Number.isFinite(ida) && ida >= 2 && ida <= 99 ? ida : null;
        if (p.id) { const q = st.list.find(x => x.id === p.id); Object.assign(q, { nome, idade, emoji: p.emoji }); persist(); editing = null; render(); onChange?.(cur(), 'edit'); }
        else {
          const np = { id: 'p' + Date.now().toString(36), nome, idade, emoji: p.emoji || AVATARES[st.list.length % AVATARES.length], data: dadosIniciais(idade, fitPresets), stats: {} };
          st.list.push(np); persist(); editing = null; api.switchTo(np.id); api.close();
        }
      };
      el.querySelector('.pf-del')?.addEventListener('click', () => { confirmDel = true; render(); });
      el.querySelector('.pf-no')?.addEventListener('click', () => { confirmDel = null; render(); });
      el.querySelector('.pf-del2')?.addEventListener('click', () => {
        st.list = st.list.filter(x => x.id !== p.id);
        if (st.cur === p.id) { st.cur = st.list[0].id; apply(cur()); save(); onChange?.(cur(), 'switch'); }
        persist(); editing = null; confirmDel = null; render();
      });
      el.querySelector('.pf-nome').focus();
      return;
    }
    el.innerHTML = `<div class="pf-box"><h2>Quem está a jogar?</h2>
      <div class="pf-grid">${st.list.map(p => `<button class="pf-p ${p.id === st.cur ? 'on' : ''}" data-id="${p.id}"><span class="pf-e">${p.emoji}</span><b>${esc(p.nome)}</b><small>${p.idade ? p.idade + ' anos · ' : ''}⭐ ${stars(p)}</small><i class="pf-ed" data-ed="${p.id}" title="Editar">✏️</i></button>`).join('')}
        <button class="pf-new"><span class="pf-e">➕</span><b>Novo perfil</b><small>para cada criança</small></button></div>
      <div class="pf-btns"><span class="sp"></span><button class="pf-close ghost">Fechar</button></div></div>`;
    el.querySelectorAll('.pf-p').forEach(b => b.onclick = e => {
      if (e.target.closest('.pf-ed')) { const p = st.list.find(x => x.id === e.target.closest('.pf-ed').dataset.ed); editing = { ...p }; confirmDel = null; render(); return; }
      api.switchTo(b.dataset.id); api.close();
    });
    el.querySelector('.pf-new').onclick = () => { editing = { nome: '', idade: null, emoji: AVATARES[st.list.length % AVATARES.length] }; render(); };
    el.querySelector('.pf-close').onclick = () => api.close();
  }
  el.addEventListener('click', e => { if (e.target === el) api.close(); e.stopPropagation(); });
  el.addEventListener('keydown', e => e.stopPropagation());

  const api = {
    el,
    get current() { return cur(); },
    get count() { return st.list.length; },
    open(then) { afterPick = then || null; editing = null; confirmDel = null; render(); el.hidden = false; },
    close() { el.hidden = true; const f = afterPick; afterPick = null; f?.(); },
    // guardar o estado actual no perfil (chamado quando as definições são gravadas)
    sync() { const p = cur(); p.data = pick(S); persist(); },
    switchTo(id) {
      if (id === st.cur) return;
      api.sync(); st.cur = id; apply(cur()); persist(); save();
      const p = cur(); speak?.(`Olá, ${p.nome}!`);
      onChange?.(p, 'switch');
    },
    // estatísticas para o resumo dos pais
    recordQuiz(pergunta, certo) {
      const p = cur(); p.stats = p.stats || {}; const q = (p.stats.quiz = p.stats.quiz || {});
      const r = (q[pergunta] = q[pergunta] || [0, 0]); r[certo ? 0 : 1]++; persist();
    },
    addTime(sec) { const p = cur(); p.stats = p.stats || {}; p.stats.seg = (p.stats.seg || 0) + sec; },
    suggested() { return nivelSugerido(cur().idade); },
  };
  return api;
}
