// Conteúdo educativo do Espelho Raio-X (português de Moçambique / Portugal).
// Coordenadas em cm no referencial local da cabeça (x = esquerda da pessoa, y = cima, z = frente).
// "par: true" = existe dos dois lados da cara (x e -x).

export const LAYERS = {
  skull:   { nome: 'Crânio',        emoji: '💀', cor: '#9fe3ff' },
  teeth:   { nome: 'Dentes',        emoji: '🦷', cor: '#ffffff' },
  spine:   { nome: 'Pescoço',       emoji: '🦴', cor: '#8ff0c8' },
  brain:   { nome: 'Cérebro',       emoji: '🧠', cor: '#ff8fc0' },
  eyes:    { nome: 'Olhos',         emoji: '👀', cor: '#ffe066' },
  muscles: { nome: 'Músculos',      emoji: '💪', cor: '#ff5a6a' },
  hands:   { nome: 'Ossos da mão',  emoji: '✋', cor: '#d9f1ff' },
};

export const PRESETS = {
  ossos:    { skull: true,  teeth: true,  spine: true,  brain: false, eyes: false, muscles: false, hands: true },
  cerebro:  { skull: false, teeth: false, spine: false, brain: true,  eyes: true,  muscles: false, hands: false },
  musculos: { skull: false, teeth: false, spine: false, brain: false, eyes: false, muscles: true,  hands: false },
  tudo:     { skull: true,  teeth: true,  spine: true,  brain: true,  eyes: true,  muscles: true,  hands: true },
};

// Ossos, cérebro e olhos (presos ao modelo 3D da cabeça)
export const PARTS = [
  { id: 'cranio', layer: 'skull', nome: 'Crânio', cient: 'Crânio (neurocrânio)', a: [0, 10.1, 1.2], emoji: '💀', toque: [[0, 9.0, 4.6], [-3.6, 8.8, 2.0], [3.6, 8.8, 2.0]],
    facto: 'O crânio é um capacete de osso que protege o teu cérebro. Na cabeça há 22 ossos que se encaixam como peças de um puzzle.' },
  { id: 'frontal', layer: 'skull', nome: 'Osso da testa', cient: 'Osso frontal', a: [0, 5.0, 7.6], emoji: '🤔', toque: [[-2.8, 4.4, 7.3], [2.8, 4.4, 7.3], [0, 6.6, 7.0]],
    facto: 'É o osso da tua testa. Nos bebés começa em duas metades que depois se juntam numa só.' },
  { id: 'orbita', layer: 'skull', nome: 'Casa do olho', cient: 'Órbita', a: [3.3, 2.75, 6.4], par: true, emoji: '🕳️',
    facto: 'É um buraco de osso onde mora o teu olho. As paredes de osso protegem-no das pancadas.' },
  { id: 'nasal', layer: 'skull', nome: 'Osso do nariz', cient: 'Osso nasal', a: [0, 0.4, 8.1], emoji: '👃', toque: [[0, -1.6, 8.9]],
    facto: 'Só a parte de cima do nariz é osso. A ponta é cartilagem — por isso consegues dobrá-la!' },
  { id: 'zigomatico', layer: 'skull', nome: 'Osso da bochecha', cient: 'Osso zigomático', a: [4.7, -1.3, 5.4], par: true, emoji: '😊',
    facto: 'Forma a maçã do rosto. Põe os dedos nas bochechas e sente o osso duro por baixo da pele.' },
  { id: 'maxila', layer: 'skull', nome: 'Maxilar de cima', cient: 'Maxila', a: [2.1, -4.0, 6.2], par: true, emoji: '😬',
    facto: 'Segura os dentes de cima. Ao contrário do maxilar de baixo, este não se mexe.' },
  { id: 'temporal', layer: 'skull', nome: 'Osso temporal', cient: 'Osso temporal', a: [6.5, 2.0, -0.6], par: true, emoji: '👂',
    facto: 'Fica por cima da orelha. Lá dentro estão os ossos mais pequenos do corpo, que te ajudam a ouvir.' },
  { id: 'mandibula', layer: 'skull', nome: 'Maxilar de baixo', cient: 'Mandíbula', a: [3.6, -8.4, 3.4], par: true, jaw: true, emoji: '😮',
    toque: [[0, -9.3, 5.3]],
    facto: 'É o único osso da cabeça que consegues mexer à vontade! Abre e fecha a boca para o veres a trabalhar.' },
  { id: 'dentes', layer: 'teeth', nome: 'Dentes', cient: 'Dentes (esmalte e dentina)', a: [1.3, -5.6, 6.1], emoji: '🦷', toque: [[0, -6.0, 6.6]],
    facto: 'As crianças têm 20 dentes de leite e os adultos podem ter 32. O esmalte dos dentes é a parte mais dura do corpo!' },
  { id: 'vertebras', layer: 'spine', nome: 'Ossos do pescoço', cient: 'Vértebras cervicais', a: [0, -8.6, -2.2], emoji: '🦒',
    facto: 'Tens 7 vértebras no pescoço — tantas como uma girafa! Elas deixam-te rodar e baixar a cabeça.' },
  { id: 'cerebro', layer: 'brain', nome: 'Cérebro', cient: 'Cérebro (córtex)', a: [2.8, 7.6, 2.4], emoji: '🧠',
    facto: 'O cérebro manda em tudo: pensar, sentir, lembrar e mexer o corpo. O de um adulto pesa cerca de 1,4 kg.' },
  { id: 'cerebelo', layer: 'brain', nome: 'Cerebelo', cient: 'Cerebelo', a: [3.0, -0.4, -6.4], emoji: '🚲',
    facto: 'O cerebelo ajuda-te a ter equilíbrio: andar de bicicleta, saltar ao pé-coxinho, dançar!' },
  { id: 'olho', layer: 'eyes', nome: 'Olho', cient: 'Globo ocular', a: [3.16, 1.03, 6.1], par: true, emoji: '👁️',
    facto: 'Pestanejas cerca de 15 a 20 vezes por minuto para manter os olhos limpos e húmidos. Mexe os olhos: o desenho segue o teu olhar!' },
  { id: 'nervo', layer: 'eyes', nome: 'Nervo óptico', cient: 'Nervo óptico', a: [1.6, 1.15, 2.4], emoji: '🔌',
    facto: 'É um cabo que leva aquilo que os olhos vêem até ao cérebro.' },
];

// Ossos da mão (pontos do tracking da mão)
export const HAND_PARTS = [
  { id: 'falanges', nome: 'Ossos dos dedos', cient: 'Falanges', emoji: '☝️',
    facto: 'Cada dedo tem 3 ossos chamados falanges — menos o polegar, que só tem 2.' },
  { id: 'metacarpos', nome: 'Ossos da palma', cient: 'Metacarpos', emoji: '✋',
    facto: 'São os 5 ossos compridos da palma da mão. Cada mão tem 27 ossos ao todo!' },
  { id: 'carpos', nome: 'Ossos do pulso', cient: 'Carpos', emoji: '🤚',
    facto: 'No pulso há 8 ossinhos que deixam a mão dobrar e rodar.' },
  { id: 'antebraco', nome: 'Ossos do braço', cient: 'Rádio e cúbito (ulna)', emoji: '💪',
    facto: 'No antebraço há dois ossos lado a lado. Quando rodas a mão, um roda à volta do outro!' },
];

// Músculos da cara. Pontos: número = ponto do tracking da cara (lado direito da pessoa);
// [x,y,z] = ponto local em cm. O lado esquerdo é gerado por simetria.
//  tipo 'faixa'  : A e B são as bordas, fibras ligam A(t) a B(t)
//  tipo 'anel'   : A é o anel interior; B é gerado (anel exterior)
//  tipo 'leque'  : A = vértice, B = arco
//  tipo 'fita'   : A = linha central, w = larguras (cm)
export const MUSCLES = [
  { id: 'mFrontal', nome: 'Músculo da testa', cient: 'Frontal', tipo: 'faixa', par: true,
    A: [107, 66, 105, 63, 70], B: [109, 67, 103, 54, 21], fibras: 9, emoji: '😮',
    facto: 'Levanta as sobrancelhas quando ficas surpreendido. Experimenta!' },
  { id: 'mCorrugador', nome: 'Músculo do zangado', cient: 'Corrugador do supercílio', tipo: 'faixa', par: true,
    A: [55, 65, 52], B: [107, 66, 105], fibras: 5, emoji: '😠',
    facto: 'Junta as sobrancelhas quando ficas zangado ou muito concentrado.' },
  { id: 'mOrbOlho', nome: 'Músculo do piscar', cient: 'Orbicular do olho', tipo: 'anel', par: true,
    A: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
    centro: [-3.16, 1.05], raio: [2.35, 2.05], fibras: 5, emoji: '😑',
    facto: 'É um anel à volta do olho que o fecha quando pestanejas ou quando dormes.' },
  { id: 'mOrbBoca', nome: 'Músculo dos beijinhos', cient: 'Orbicular da boca', tipo: 'anel', par: false,
    A: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
    escala: [1.32, 1.75], fibras: 5, emoji: '😘',
    facto: 'É um anel à volta da boca: serve para dar beijinhos, assobiar e soprar velas.' },
  { id: 'mZigomatico', nome: 'Músculo do sorriso', cient: 'Zigomático maior', tipo: 'fita', par: true,
    A: [[-5.25, -0.7, 4.9], [-4.4, -2.6, 5.8], 61], w: [1.05, 0.8, 0.42], fibras: 5, emoji: '😁',
    facto: 'Puxa os cantos da boca para cima e para os lados quando sorris.' },
  { id: 'mMasseter', nome: 'Músculo da mastigação', cient: 'Masseter', tipo: 'faixa', par: true,
    A: [[-5.9, -1.6, 3.5], [-6.7, -1.35, 0.8]], B: [136, 172], fibras: 8, emoji: '😋',
    facto: 'Fecha a boca com muita força para mastigar. Para o tamanho que tem, é um dos músculos mais fortes do corpo!' },
  { id: 'mTemporal', nome: 'Músculo da têmpora', cient: 'Temporal', tipo: 'leque', par: true,
    A: [[-5.5, -1.2, 2.1]], B: [[-5.0, 6.9, 4.2], [-6.4, 6.2, 1.0], [-7.0, 4.4, -2.2], [-6.8, 1.8, -4.4], [-6.2, 0.2, -4.6]], fibras: 11, emoji: '🫡',
    facto: 'Põe os dedos nas têmporas e mastiga: sentes este músculo a mexer?' },
  { id: 'mDepressor', nome: 'Músculo da cara triste', cient: 'Depressor do ângulo da boca', tipo: 'leque', par: true,
    A: [61], B: [150, 149, 176], fibras: 6, emoji: '😢',
    facto: 'Puxa os cantos da boca para baixo quando fazes cara triste.' },
];

// Desafios: tocar numa parte ou fazer uma careta
export const CHALLENGES = [
  { tipo: 'toque', alvo: 'nasal', pede: 'Toca no osso do teu nariz!', ok: 'Boa! Esse é o osso nasal.', emoji: '👃' },
  { tipo: 'toque', alvo: 'frontal', pede: 'Toca na tua testa!', ok: 'Isso! Debaixo da pele está o osso frontal.', emoji: '🤔' },
  { tipo: 'toque', alvo: 'zigomatico', pede: 'Toca no osso da tua bochecha!', ok: 'Muito bem! É o osso zigomático.', emoji: '😊' },
  { tipo: 'toque', alvo: 'mandibula', pede: 'Toca no teu queixo!', ok: 'Boa! O queixo faz parte da mandíbula.', emoji: '😮' },
  { tipo: 'toque', alvo: 'temporal', pede: 'Toca ao lado da cabeça, por cima da orelha!', ok: 'Aí está o osso temporal. Lá dentro há ossinhos para ouvir.', emoji: '👂' },
  { tipo: 'toque', alvo: 'cranio', pede: 'Põe o dedo no cimo da tua cabeça!', ok: 'Isso! O crânio protege o teu cérebro.', emoji: '💀' },
  { tipo: 'toque', alvo: 'dentes', pede: 'Aponta para os teus dentes!', ok: 'Boa! Os dentes estão presos nos maxilares.', emoji: '🦷' },
  { tipo: 'cara', alvo: 'mZigomatico', pede: 'Faz um sorriso bem grande!', ok: 'Boa! Para sorrir usaste os músculos zigomáticos.', emoji: '😁',
    teste: b => (b.mouthSmileLeft + b.mouthSmileRight) / 2 > 0.55 },
  { tipo: 'cara', alvo: 'mFrontal', pede: 'Faz cara de surpresa! Levanta as sobrancelhas!', ok: 'Isso! O músculo frontal levantou as tuas sobrancelhas.', emoji: '😮',
    teste: b => b.browInnerUp > 0.55 || (b.browOuterUpLeft + b.browOuterUpRight) / 2 > 0.45 },
  { tipo: 'cara', alvo: 'mCorrugador', pede: 'Faz cara de zangado!', ok: 'Que zangado! O músculo corrugador juntou as tuas sobrancelhas.', emoji: '😠',
    teste: b => (b.browDownLeft + b.browDownRight) / 2 > 0.4 },
  { tipo: 'cara', alvo: 'mOrbBoca', pede: 'Faz um beijinho!', ok: 'Mua! O músculo orbicular da boca fez o beijinho.', emoji: '😘',
    teste: b => b.mouthPucker > 0.55 },
  { tipo: 'cara', alvo: 'mandibula', pede: 'Abre muito a boca!', ok: 'Viste? A mandíbula desceu — é o único osso da cabeça que consegues mexer!', emoji: '😲',
    teste: b => b.jawOpen > 0.5 },
  { tipo: 'cara', alvo: 'mOrbOlho', pede: 'Fecha os olhos com força e depois abre!', ok: 'Muito bem! O músculo orbicular do olho fechou os teus olhos.', emoji: '😑',
    teste: b => (b.eyeBlinkLeft + b.eyeBlinkRight) / 2 > 0.6 },
  { tipo: 'cara', alvo: 'mMasseter', pede: 'Faz de conta que estás a mastigar!', ok: 'Nham nham! O masseter e o temporal fizeram o trabalho.', emoji: '😋',
    teste: (b, extra) => extra.mastigar > 0.5 },
];

export const TXT = {
  semCara: 'Põe a cara à frente da câmara 🙂',
  perto: 'Chega-te um bocadinho mais perto!',
  semMao: 'Levanta a mão para a câmara ver o teu dedo ☝️',
  tocaIntro: 'Aponta com o dedo para uma parte da tua cara e espera um bocadinho!',
  desafioIntro: 'Vou pedir-te coisas. Consegues fazer todas?',
  aTrabalhar: 'a trabalhar!',
};
