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
  body:    { nome: 'Corpo',         emoji: '🩻', cor: '#b9c8ff' },
};

export const PRESETS = {
  ossos:    { skull: true,  teeth: true,  spine: true,  brain: false, eyes: false, muscles: false, hands: true,  body: false },
  corpo:    { skull: true,  teeth: true,  spine: true,  brain: false, eyes: false, muscles: false, hands: true,  body: true },
  cerebro:  { skull: false, teeth: false, spine: false, brain: true,  eyes: true,  muscles: false, hands: false, body: false },
  musculos: { skull: false, teeth: false, spine: false, brain: false, eyes: false, muscles: true,  hands: false, body: false },
  tudo:     { skull: true,  teeth: true,  spine: true,  brain: true,  eyes: true,  muscles: true,  hands: true,  body: true },
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
    facto: 'As crianças têm 20 dentes de leite e os adultos podem ter 32. O esmalte dos dentes é a parte mais dura do corpo!',
    nomeCrianca: 'Dentes de leite',
    factoCrianca: 'Tens 20 dentes de leite. Por baixo deles já estão a crescer os dentes definitivos — vês? Por volta dos 6 anos começam a trocar.' },
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
  { tipo: 'toque', alvo: 'nasal', pede: 'Toca no osso do teu nariz!', pedeCient: 'Toca no teu osso nasal!', ok: 'Boa! Esse é o osso nasal.', emoji: '👃' },
  { tipo: 'toque', alvo: 'frontal', pede: 'Toca na tua testa!', pedeCient: 'Toca no teu osso frontal!', ok: 'Isso! Debaixo da pele está o osso frontal.', emoji: '🤔' },
  { tipo: 'toque', alvo: 'zigomatico', pede: 'Toca no osso da tua bochecha!', pedeCient: 'Toca no teu osso zigomático!', ok: 'Muito bem! É o osso zigomático.', emoji: '😊' },
  { tipo: 'toque', alvo: 'mandibula', pede: 'Toca no teu queixo!', pedeCient: 'Toca na tua mandíbula, no queixo!', ok: 'Boa! O queixo faz parte da mandíbula.', emoji: '😮' },
  { tipo: 'toque', alvo: 'temporal', pede: 'Toca ao lado da cabeça, por cima da orelha!', pedeCient: 'Toca no teu osso temporal, por cima da orelha!', ok: 'Aí está o osso temporal. Lá dentro há ossinhos para ouvir.', emoji: '👂' },
  { tipo: 'toque', alvo: 'cranio', pede: 'Põe o dedo no cimo da tua cabeça!', pedeCient: 'Toca no cimo do teu crânio!', ok: 'Isso! O crânio protege o teu cérebro.', emoji: '💀' },
  { tipo: 'toque', alvo: 'dentes', pede: 'Aponta para os teus dentes!', pedeCient: 'Aponta para os teus incisivos!', ok: 'Boa! Os dentes estão presos nos maxilares.', emoji: '🦷' },
  { tipo: 'cara', alvo: 'mZigomatico', pede: 'Faz um sorriso bem grande!', pedeCient: 'Contrai os músculos zigomáticos: sorri!', ok: 'Boa! Para sorrir usaste os músculos zigomáticos.', emoji: '😁',
    teste: b => (b.mouthSmileLeft + b.mouthSmileRight) / 2 > 0.55 },
  { tipo: 'cara', alvo: 'mFrontal', pede: 'Faz cara de surpresa! Levanta as sobrancelhas!', pedeCient: 'Contrai o músculo frontal: levanta as sobrancelhas!', ok: 'Isso! O músculo frontal levantou as tuas sobrancelhas.', emoji: '😮',
    teste: b => b.browInnerUp > 0.55 || (b.browOuterUpLeft + b.browOuterUpRight) / 2 > 0.45 },
  { tipo: 'cara', alvo: 'mCorrugador', pede: 'Faz cara de zangado!', pedeCient: 'Contrai os corrugadores do supercílio: cara de zangado!', ok: 'Que zangado! O músculo corrugador juntou as tuas sobrancelhas.', emoji: '😠',
    teste: b => (b.browDownLeft + b.browDownRight) / 2 > 0.4 },
  { tipo: 'cara', alvo: 'mOrbBoca', pede: 'Faz um beijinho!', pedeCient: 'Contrai o orbicular da boca: faz um beijinho!', ok: 'Mua! O músculo orbicular da boca fez o beijinho.', emoji: '😘',
    teste: b => b.mouthPucker > 0.55 },
  { tipo: 'cara', alvo: 'mandibula', pede: 'Abre muito a boca!', pedeCient: 'Baixa a mandíbula: abre muito a boca!', ok: 'Viste? A mandíbula desceu — é o único osso da cabeça que consegues mexer!', emoji: '😲',
    teste: b => b.jawOpen > 0.5 },
  { tipo: 'cara', alvo: 'mOrbOlho', pede: 'Fecha os olhos com força e depois abre!', pedeCient: 'Contrai os orbiculares dos olhos: fecha-os com força!', ok: 'Muito bem! O músculo orbicular do olho fechou os teus olhos.', emoji: '😑',
    teste: b => (b.eyeBlinkLeft + b.eyeBlinkRight) / 2 > 0.6 },
  { tipo: 'cara', alvo: 'mMasseter', pede: 'Faz de conta que estás a mastigar!', pedeCient: 'Põe os masseteres a trabalhar: mastiga!', ok: 'Nham nham! O masseter e o temporal fizeram o trabalho.', emoji: '😋',
    teste: (b, extra) => extra.mastigar > 0.5 },
];

// Esqueleto do corpo (tracking do corpo inteiro)
export const BODY_PARTS = [
  { id: 'costelas', nome: 'Costelas', cient: 'Costelas (caixa torácica)', emoji: '🫁',
    facto: 'Tens 12 pares de costelas. Fazem uma gaiola de osso que protege o coração e os pulmões.' },
  { id: 'esterno', nome: 'Osso do peito', cient: 'Esterno', emoji: '🛡️',
    facto: 'As costelas da frente prendem-se a este osso achatado, no meio do peito, com cartilagem flexível.' },
  { id: 'clavicula', nome: 'Clavícula', cient: 'Clavícula', emoji: '🦴',
    facto: 'Vai do peito até ao ombro. Passa os dedos por baixo do pescoço e consegues senti-la!' },
  { id: 'omoplata', nome: 'Omoplata', cient: 'Escápula (omoplata)', emoji: '🪽',
    facto: 'É um osso em forma de triângulo nas costas. Mexe-se sempre que mexes o braço.' },
  { id: 'coluna', nome: 'Coluna', cient: 'Coluna vertebral', emoji: '🐍',
    facto: 'A coluna tem 33 vértebras e protege a medula espinal, o cabo que liga o cérebro ao resto do corpo.' },
  { id: 'bacia', nome: 'Bacia', cient: 'Pélvis (bacia)', emoji: '🦋',
    facto: 'A bacia aguenta o peso do corpo e liga a coluna às pernas.' },
  { id: 'umero', nome: 'Osso do braço', cient: 'Úmero', emoji: '💪',
    facto: 'O úmero é o único osso entre o ombro e o cotovelo.' },
  { id: 'antebracoC', nome: 'Ossos do antebraço', cient: 'Rádio e cúbito (ulna)', emoji: '🤚',
    facto: 'Entre o cotovelo e o pulso há dois ossos. Quando rodas a mão, um roda à volta do outro!' },
  { id: 'femur', nome: 'Osso da coxa', cient: 'Fémur', emoji: '🦵',
    facto: 'O fémur é o osso maior e mais forte do corpo!' },
  { id: 'tibia', nome: 'Ossos da perna', cient: 'Tíbia e perónio', emoji: '🦿',
    facto: 'A tíbia é a canela. Ao lado dela está o perónio, mais fininho.' },
];

// Níveis do Desafio
export const LEVELS = {
  pequeninos: { nome: 'Pequeninos', idade: '3–5 anos', emoji: '🐣' },
  exploradores: { nome: 'Exploradores', idade: '6–9 anos', emoji: '🧭' },
  cientistas: { nome: 'Cientistas', idade: '10+ anos', emoji: '🔬' },
};

// Desafios do corpo (só quando o corpo está a ser seguido)
export const BODY_CHALLENGES = [
  { tipo: 'corpo', alvo: 'umero', pede: 'Levanta os dois braços bem alto!', pedeCient: 'Levanta os dois úmeros acima da cabeça!',
    ok: 'Boa! Os teus úmeros estão a apontar para o céu!', emoji: '🙌' },
  { tipo: 'toque', alvo: 'esterno', pede: 'Põe a mão no meio do peito!', pedeCient: 'Toca no teu esterno!', ok: 'Isso! Aí está o esterno, que segura as costelas.', emoji: '🫁', corpo: true },
  { tipo: 'toque', alvo: 'clavicula', pede: 'Toca no osso por baixo do pescoço!', pedeCient: 'Toca na tua clavícula!', ok: 'Muito bem! É a clavícula.', emoji: '🦴', corpo: true },
];

// Quiz (nível Cientistas): responde a apontar com o dedo ou a clicar
export const QUIZ = [
  { p: 'Quantos ossos tem um adulto?', o: ['106', '206', '306'], c: 1, explica: 'Um adulto tem 206 ossos. Os bebés nascem com mais, que depois se juntam.' },
  { p: 'Quantos ossos tem cada mão?', o: ['17', '27', '37'], c: 1, explica: 'Cada mão tem 27 ossos: 8 no pulso, 5 na palma e 14 nos dedos.' },
  { p: 'Quantas vértebras há no pescoço?', o: ['5', '7', '12'], c: 1, explica: 'São 7 vértebras cervicais — tantas como as de uma girafa!' },
  { p: 'Qual é o maior osso do corpo?', o: ['Úmero', 'Crânio', 'Fémur'], c: 2, explica: 'O fémur, o osso da coxa, é o maior e o mais forte.' },
  { p: 'Quantos dentes de leite têm as crianças?', o: ['20', '24', '32'], c: 0, explica: 'São 20 dentes de leite. Os adultos podem ter 32.' },
  { p: 'Que osso da cabeça consegues mexer?', o: ['Maxila', 'Mandíbula', 'Osso frontal'], c: 1, explica: 'A mandíbula, o maxilar de baixo.' },
  { p: 'Quantos pares de costelas temos?', o: ['10', '12', '14'], c: 1, explica: 'Temos 12 pares de costelas, ou seja, 24 costelas.' },
  { p: 'Qual é a parte mais dura do corpo?', o: ['Esmalte dos dentes', 'Fémur', 'Crânio'], c: 0, explica: 'O esmalte dos dentes é ainda mais duro do que os ossos.' },
  { p: 'Que parte do cérebro ajuda no equilíbrio?', o: ['Nervo óptico', 'Cerebelo', 'Medula'], c: 1, explica: 'O cerebelo ajuda-te a andar de bicicleta e a dançar sem cair.' },
  { p: 'Que músculo usas para sorrir?', o: ['Zigomático', 'Masseter', 'Frontal'], c: 0, explica: 'Os zigomáticos puxam os cantos da boca para cima.' },
];

export const TXT = {
  semCara: 'Põe a cara à frente da câmara 🙂',
  perto: 'Chega-te um bocadinho mais perto!',
  semMao: 'Levanta a mão para a câmara ver o teu dedo ☝️',
  tocaIntro: 'Aponta com o dedo para uma parte da tua cara e espera um bocadinho!',
  desafioIntro: 'Vou pedir-te coisas. Consegues fazer todas?',
  aTrabalhar: 'a trabalhar!',
  semCorpo: 'Para o esqueleto do corpo, a câmara tem de ver a tua cabeça e os ombros: afasta-te um pouco 🙆',
  escolheNivel: 'Escolhe o teu nível:',
  objIntro: 'Mostra um objecto à câmara: uma fruta, um brinquedo, uma caneca…',
  objNada: 'Ainda não vejo nenhum objecto. Mostra-me um de perto! 🍌🧸📱',
};

// ================================================================== MODO OBJECTOS
// Classes do detector (COCO, 80). n = nome, p = plural (se irregular), a = artigo, en = inglês, e = emoji,
// f = curiosidade, x = tipo de raio-X, mov = móvel/fundo (escondido por defeito), cacar = entra na caça ao tesouro
export const OBJECTS = {
  'person': { n: 'pessoa', a: 'uma', en: 'person', e: '🧍', mov: true },
  'bicycle': { n: 'bicicleta', a: 'uma', en: 'bicycle', e: '🚲', x: 'bike', f: 'A bicicleta não tem motor: o motor és tu, a pedalar!' },
  'car': { n: 'carro', a: 'um', en: 'car', e: '🚗', x: 'car', f: 'Na maioria dos carros, o motor fica à frente, debaixo do capô.', cacar: true },
  'motorcycle': { n: 'mota', a: 'uma', en: 'motorbike', e: '🏍️', x: 'bike' },
  'airplane': { n: 'avião', p: 'aviões', a: 'um', en: 'airplane', e: '✈️', x: 'plane', f: 'As asas do avião empurram o ar para baixo, e o ar empurra o avião para cima.' },
  'bus': { n: 'machimbombo', a: 'um', en: 'bus', e: '🚌', x: 'car', f: 'Em Moçambique chamamos machimbombo ao autocarro!' },
  'train': { n: 'comboio', a: 'um', en: 'train', e: '🚂', x: 'car' },
  'truck': { n: 'camião', p: 'camiões', a: 'um', en: 'truck', e: '🚚', x: 'car' },
  'boat': { n: 'barco', a: 'um', en: 'boat', e: '⛵', x: 'boat', f: 'Os barcos flutuam porque empurram a água para o lado.' },
  'traffic light': { n: 'semáforo', a: 'um', en: 'traffic light', e: '🚦' },
  'fire hydrant': { n: 'boca de incêndio', p: 'bocas de incêndio', a: 'uma', en: 'fire hydrant', e: '🧯' },
  'stop sign': { n: 'sinal de STOP', p: 'sinais de STOP', a: 'um', en: 'stop sign', e: '🛑' },
  'parking meter': { n: 'parquímetro', a: 'um', en: 'parking meter', e: '🅿️', mov: true },
  'bench': { n: 'banco', a: 'um', en: 'bench', e: '🪑', mov: true },
  'bird': { n: 'pássaro', a: 'um', en: 'bird', e: '🐦', x: 'bird', f: 'Muitos ossos dos pássaros são ocos, com ar lá dentro — por isso são leves para voar.' },
  'cat': { n: 'gato', a: 'um', en: 'cat', e: '🐱', x: 'quad', f: 'Os gatos andam nas pontas dos dedos e conseguem cair de pé!' },
  'dog': { n: 'cão', p: 'cães', a: 'um', en: 'dog', e: '🐶', x: 'quad', f: 'Os cães também andam nas pontas dos dedos, e o nariz deles sente cheiros que nós nem imaginamos.' },
  'horse': { n: 'cavalo', a: 'um', en: 'horse', e: '🐴', x: 'quad', f: 'Os cavalos conseguem dormir de pé!' },
  'sheep': { n: 'ovelha', a: 'uma', en: 'sheep', e: '🐑', x: 'quad', f: 'A lã das ovelhas não pára de crescer, por isso é preciso tosquiá-las.' },
  'cow': { n: 'vaca', a: 'uma', en: 'cow', e: '🐮', x: 'quad', f: 'As vacas têm um estômago com quatro partes.' },
  'elephant': { n: 'elefante', a: 'um', en: 'elephant', e: '🐘', x: 'quad', f: 'A tromba do elefante é o nariz e o lábio de cima juntos!' },
  'bear': { n: 'urso', a: 'um', en: 'bear', e: '🐻', x: 'quad', f: 'Alguns ursos passam quase todo o Inverno a dormir.' },
  'zebra': { n: 'zebra', a: 'uma', en: 'zebra', e: '🦓', x: 'quad', f: 'Cada zebra tem riscas diferentes, como as nossas impressões digitais.' },
  'giraffe': { n: 'girafa', a: 'uma', en: 'giraffe', e: '🦒', x: 'quad', f: 'A girafa tem só 7 vértebras no pescoço — tantas como tu! Mas cada uma é enorme.' },
  'backpack': { n: 'mochila', a: 'uma', en: 'backpack', e: '🎒', f: 'Para não doerem as costas, usa sempre as duas alças da mochila!', cacar: true },
  'umbrella': { n: 'guarda-chuva', a: 'um', en: 'umbrella', e: '☂️', x: 'umbrella', f: 'As varetas do guarda-chuva parecem os ossos de uma asa de morcego.' },
  'handbag': { n: 'mala', a: 'uma', en: 'handbag', e: '👜' },
  'tie': { n: 'gravata', a: 'uma', en: 'tie', e: '👔' },
  'suitcase': { n: 'mala de viagem', p: 'malas de viagem', a: 'uma', en: 'suitcase', e: '🧳' },
  'frisbee': { n: 'disco voador', p: 'discos voadores', a: 'um', en: 'frisbee', e: '🥏' },
  'skis': { n: 'esquis', p: 'esquis', a: 'uns', en: 'skis', e: '🎿' },
  'snowboard': { n: 'prancha de neve', p: 'pranchas de neve', a: 'uma', en: 'snowboard', e: '🏂' },
  'sports ball': { n: 'bola', a: 'uma', en: 'ball', e: '⚽', x: 'ball', f: 'Dentro de muitas bolas há uma câmara de ar — é o ar que a faz saltar.', cacar: true },
  'kite': { n: 'papagaio de papel', p: 'papagaios de papel', a: 'um', en: 'kite', e: '🪁' },
  'baseball bat': { n: 'taco', a: 'um', en: 'bat', e: '🏏' },
  'baseball glove': { n: 'luva de basebol', p: 'luvas de basebol', a: 'uma', en: 'baseball glove', e: '🧤' },
  'skateboard': { n: 'skate', a: 'um', en: 'skateboard', e: '🛹' },
  'surfboard': { n: 'prancha de surf', p: 'pranchas de surf', a: 'uma', en: 'surfboard', e: '🏄' },
  'tennis racket': { n: 'raquete', a: 'uma', en: 'tennis racket', e: '🎾' },
  'bottle': { n: 'garrafa', a: 'uma', en: 'bottle', e: '🍼', x: 'liquid', f: 'Mais de metade do teu corpo é água. Lembra-te de beber!', cacar: true },
  'wine glass': { n: 'taça', a: 'uma', en: 'glass', e: '🍷', x: 'liquid' },
  'cup': { n: 'caneca', a: 'uma', en: 'cup', e: '☕', x: 'liquid', f: 'Mais de metade do teu corpo é água. Lembra-te de beber!', cacar: true },
  'fork': { n: 'garfo', a: 'um', en: 'fork', e: '🍴', cacar: true },
  'knife': { n: 'faca', a: 'uma', en: 'knife', e: '🔪', f: 'Cuidado: as facas cortam! Pede sempre ajuda a um adulto.' },
  'spoon': { n: 'colher', p: 'colheres', a: 'uma', en: 'spoon', e: '🥄', f: 'A colher é um dos talheres mais antigos — muito mais antiga do que o garfo.', cacar: true },
  'bowl': { n: 'tigela', a: 'uma', en: 'bowl', e: '🥣', x: 'liquid', cacar: true },
  'banana': { n: 'banana', a: 'uma', en: 'banana', e: '🍌', x: 'banana', f: 'A bananeira não é uma árvore: é uma erva gigante! E as bananas crescem viradas para cima, para o sol.', cacar: true },
  'apple': { n: 'maçã', a: 'uma', en: 'apple', e: '🍎', x: 'apple', f: 'Corta uma maçã ao meio de lado: as sementes formam uma estrela de cinco pontas!', cacar: true },
  'sandwich': { n: 'sanduíche', a: 'uma', en: 'sandwich', e: '🥪', x: 'layers' },
  'orange': { n: 'laranja', a: 'uma', en: 'orange', e: '🍊', x: 'orange', f: 'Por dentro, a laranja tem gomos — costumam ser uns dez. Conta-os da próxima vez!', cacar: true },
  'broccoli': { n: 'brócolos', p: 'brócolos', a: 'uns', en: 'broccoli', e: '🥦', x: 'broccoli', f: 'Cada arvorezinha dos brócolos é um monte de botões de flor que ainda não abriram.' },
  'carrot': { n: 'cenoura', a: 'uma', en: 'carrot', e: '🥕', x: 'carrot', f: 'A cenoura é uma raiz: a parte cor de laranja cresce debaixo da terra.', cacar: true },
  'hot dog': { n: 'cachorro-quente', p: 'cachorros-quentes', a: 'um', en: 'hot dog', e: '🌭', x: 'layers' },
  'pizza': { n: 'pizza', a: 'uma', en: 'pizza', e: '🍕', x: 'pizza', f: 'A pizza que conhecemos nasceu em Itália, na cidade de Nápoles.' },
  'donut': { n: 'donut', a: 'um', en: 'donut', e: '🍩', x: 'donut' },
  'cake': { n: 'bolo', a: 'um', en: 'cake', e: '🎂', x: 'layers' },
  'chair': { n: 'cadeira', a: 'uma', en: 'chair', e: '🪑', mov: true },
  'couch': { n: 'sofá', a: 'um', en: 'sofa', e: '🛋️', mov: true },
  'potted plant': { n: 'planta', a: 'uma', en: 'plant', e: '🪴', x: 'plant', f: 'As plantas fazem o seu próprio alimento com luz do sol, água e ar.', cacar: true },
  'bed': { n: 'cama', a: 'uma', en: 'bed', e: '🛏️', mov: true, f: 'As crianças precisam de dormir entre 9 e 12 horas por noite.' },
  'dining table': { n: 'mesa', a: 'uma', en: 'table', e: '🍽️', mov: true },
  'toilet': { n: 'sanita', a: 'uma', en: 'toilet', e: '🚽', mov: true },
  'tv': { n: 'televisão', p: 'televisões', a: 'uma', en: 'TV', e: '📺', x: 'circuit', mov: true },
  'laptop': { n: 'computador portátil', p: 'computadores portáteis', a: 'um', en: 'laptop', e: '💻', x: 'circuit', f: 'Dentro do computador há um processador, que é o cérebro dele, e uma bateria.' },
  'mouse': { n: 'rato', a: 'um', en: 'mouse', e: '🖱️', x: 'circuit', f: 'Chama-se rato porque o fio parecia uma cauda!' },
  'remote': { n: 'comando', a: 'um', en: 'remote control', e: '📡', x: 'circuit', f: 'O comando fala com a televisão com uma luz invisível, chamada infravermelha.', cacar: true },
  'keyboard': { n: 'teclado', a: 'um', en: 'keyboard', e: '⌨️', x: 'circuit' },
  'cell phone': { n: 'telemóvel', p: 'telemóveis', a: 'um', en: 'phone', e: '📱', x: 'circuit', f: 'Dentro do telemóvel há uma bateria, chips e uma placa com caminhos de metal por onde passa a electricidade.', cacar: true },
  'microwave': { n: 'micro-ondas', p: 'micro-ondas', a: 'um', en: 'microwave', e: '📻', mov: true, f: 'O micro-ondas aquece a comida a fazer abanar a água que está lá dentro.' },
  'oven': { n: 'forno', a: 'um', en: 'oven', e: '🔥', mov: true },
  'toaster': { n: 'torradeira', a: 'uma', en: 'toaster', e: '🍞', mov: true },
  'sink': { n: 'lava-loiça', p: 'lava-loiças', a: 'um', en: 'sink', e: '🚰', mov: true },
  'refrigerator': { n: 'geleira', a: 'uma', en: 'fridge', e: '🧊', mov: true },
  'book': { n: 'livro', a: 'um', en: 'book', e: '📖', x: 'book', f: 'O papel dos livros faz-se, sobretudo, com madeira das árvores.', cacar: true },
  'clock': { n: 'relógio', a: 'um', en: 'clock', e: '🕒', x: 'clock', f: 'Os relógios de ponteiros antigos tinham rodas dentadas lá dentro a rodar.', cacar: true },
  'vase': { n: 'jarra', a: 'uma', en: 'vase', e: '🏺', x: 'liquid' },
  'scissors': { n: 'tesoura', a: 'uma', en: 'scissors', e: '✂️', x: 'scissors', f: 'A tesoura são duas lâminas presas por um parafuso: é uma alavanca!', cacar: true },
  'teddy bear': { n: 'ursinho de peluche', p: 'ursinhos de peluche', a: 'um', en: 'teddy bear', e: '🧸', x: 'teddy', f: 'Os ursinhos de peluche não têm ossos — por dentro só há enchimento fofinho!', cacar: true },
  'hair drier': { n: 'secador', a: 'um', en: 'hair dryer', e: '💨', f: 'O secador tem uma ventoinha e uma resistência que aquece o ar.' },
  'toothbrush': { n: 'escova de dentes', p: 'escovas de dentes', a: 'uma', en: 'toothbrush', e: '🪥', x: 'toothbrush', f: 'Escova os dentes duas vezes por dia, durante dois minutos!', cacar: true },
};
export const objPlural = o => o.p || (o.n.endsWith('l') ? o.n.slice(0, -1) + 'is' : o.n.endsWith('r') ? o.n + 'es' : o.n + 's');

// ================================================================== ESCADA DE 12 NÍVEIS (dos 3 anos ao médico)
export const ETAPAS = {
  pequeninos: { nome: 'Pequeninos', emoji: '🐣', idade: '3–5 anos' },
  exploradores: { nome: 'Exploradores', emoji: '🧭', idade: '6–9 anos' },
  cientistas: { nome: 'Cientistas', emoji: '🔬', idade: '10–14 anos' },
  medicina: { nome: 'Estudante de Medicina', emoji: '🎓', idade: 'universidade' },
  medico: { nome: 'Médico', emoji: '🩺', idade: 'profissional' },
};
// mix: tipos de ronda que se alternam. cient: nomes científicos. mestre: só o nome do músculo, sem dica.
export const LADDER = [
  { etapa: 'pequeninos', titulo: 'Caretas', rondas: 6, tempo: 35, mix: [['cara', 'simples']] },
  { etapa: 'pequeninos', titulo: 'Mais caretas', rondas: 6, tempo: 35, mix: [['cara', 'todas']] },
  { etapa: 'pequeninos', titulo: 'Toca e faz', rondas: 7, tempo: 32, mix: [['cara', 'todas'], ['toque', 'simples']] },
  { etapa: 'exploradores', titulo: 'Exploradores', rondas: 8, tempo: 25, mix: [['cara', 'todas'], ['toque', 'todas'], ['corpo']] },
  { etapa: 'exploradores', titulo: 'Esquerda e direita', rondas: 8, tempo: 25, mix: [['lado'], ['toque', 'todas'], ['seq', 2], ['corpo']] },
  { etapa: 'exploradores', titulo: 'Duas coisas ao mesmo tempo', rondas: 9, tempo: 22, mix: [['combo'], ['seq', 3], ['quiz', 1], ['lado']] },
  { etapa: 'cientistas', titulo: 'Nomes científicos', rondas: 9, tempo: 22, cient: true, mix: [['toque', 'todas'], ['cara', 'todas'], ['quiz', 1]] },
  { etapa: 'cientistas', titulo: 'Que osso é este?', rondas: 10, tempo: 20, cient: true, mix: [['qualOsso'], ['lado'], ['quiz', 2]] },
  { etapa: 'cientistas', titulo: 'Músculos pelo nome', rondas: 10, tempo: 20, cient: true, mestre: true, mix: [['cara', 'todas'], ['qualMusculo'], ['quiz', 2], ['combo']] },
  { etapa: 'medicina', titulo: 'Pontos craniométricos e forames', rondas: 10, tempo: 18, cient: true, mix: [['marco'], ['quiz', 3], ['qualOsso']] },
  { etapa: 'medicina', titulo: 'Exame dos nervos cranianos', rondas: 10, tempo: 18, cient: true, mix: [['clinico'], ['olhar'], ['quiz', 4], ['marco']] },
  { etapa: 'medico', titulo: 'Exame completo', rondas: 12, tempo: 14, cient: true, mestre: true, mix: [['marco'], ['clinico'], ['olhar'], ['quiz', 4], ['seq', 4], ['qualMusculo'], ['quiz', 3]] },
];

// Tocar no lado certo. {lado} é substituído por esquerda/esquerdo ou direita/direito (lado da pessoa).
export const LADO = [
  { alvo: 'zigomatico', pede: 'Toca na tua bochecha {lado}!', g: 'f', cient: 'Toca no teu osso zigomático {lado}!', gc: 'm' },
  { alvo: 'temporal', pede: 'Toca por cima da tua orelha {lado}!', g: 'f', cient: 'Toca no teu osso temporal {lado}!', gc: 'm' },
  { alvo: 'mandibula', pede: 'Toca no teu maxilar de baixo, do lado {lado}!', g: 'm', cient: 'Toca no ângulo {lado} da tua mandíbula!', gc: 'm' },
  { alvo: 'maxila', pede: 'Toca ao lado do nariz, em cima do lábio, do lado {lado}!', g: 'm', cient: 'Toca na tua maxila, do lado {lado}!', gc: 'm' },
];

// Duas coisas ao mesmo tempo
const avg = (b, a, c) => ((b[a] || 0) + (b[c] || 0)) / 2;
const SMILE = b => avg(b, 'mouthSmileLeft', 'mouthSmileRight') > 0.5;
const EYES = b => avg(b, 'eyeBlinkLeft', 'eyeBlinkRight') > 0.55;
const BROWS = b => (b.browInnerUp || 0) > 0.5 || avg(b, 'browOuterUpLeft', 'browOuterUpRight') > 0.4;
const JAW = b => (b.jawOpen || 0) > 0.45;
const KISS = b => (b.mouthPucker || 0) > 0.5;
const ANGRY = b => avg(b, 'browDownLeft', 'browDownRight') > 0.35;
const SAD = b => avg(b, 'mouthFrownLeft', 'mouthFrownRight') * 2.4 > 0.45 || avg(b, 'mouthLowerDownLeft', 'mouthLowerDownRight') > 0.35;
export const COMBOS = [
  { pede: 'Sorri e fecha os olhos ao mesmo tempo!', emoji: '😊', alvos: ['mZigomatico', 'mOrbOlho'], teste: b => SMILE(b) && EYES(b), ok: 'Uau! Dois músculos ao mesmo tempo!' },
  { pede: 'Abre a boca e levanta as sobrancelhas!', emoji: '😱', alvos: ['mFrontal'], teste: b => JAW(b) && BROWS(b), ok: 'Que susto! Mandíbula e músculo frontal a trabalhar juntos.' },
  { pede: 'Faz um beijinho e fecha os olhos!', emoji: '😚', alvos: ['mOrbBoca', 'mOrbOlho'], teste: b => KISS(b) && EYES(b), ok: 'Mua! Os dois orbiculares ao mesmo tempo.' },
  { pede: 'Faz cara de zangado e abre a boca!', emoji: '😡', alvos: ['mCorrugador'], teste: b => ANGRY(b) && JAW(b), ok: 'Grrr! Corrugadores e mandíbula juntos.' },
  { pede: 'Sorri e levanta as sobrancelhas!', emoji: '😄', alvos: ['mZigomatico', 'mFrontal'], teste: b => SMILE(b) && BROWS(b), ok: 'Que alegria! Zigomáticos e frontal.' },
];
// Sequências (Simão diz)
export const SEQ_ITEMS = [
  { emoji: '😁', nome: 'sorri', teste: SMILE }, { emoji: '😮', nome: 'abre a boca', teste: JAW },
  { emoji: '😘', nome: 'faz um beijinho', teste: KISS }, { emoji: '😑', nome: 'fecha os olhos', teste: EYES },
  { emoji: '🤨', nome: 'levanta as sobrancelhas', teste: BROWS }, { emoji: '😠', nome: 'faz cara de zangado', teste: ANGRY },
];

// Pontos anatómicos (craniometria e forames) — coordenadas no referencial da cabeça (cm)
export const LANDMARKS = [
  { id: 'glabela', nome: 'glabela', a: [0, 2.9, 7.75], facto: 'A glabela é a saliência lisa entre as sobrancelhas, no osso frontal.' },
  { id: 'nasio', nome: 'násio', a: [0, 1.5, 7.55], facto: 'O násio é onde o osso frontal encontra os ossos nasais, na raiz do nariz.' },
  { id: 'vertice', nome: 'vértice', a: [0, 10.5, 0.5], facto: 'O vértice é o ponto mais alto do crânio.' },
  { id: 'pogonio', nome: 'pogónio', a: [0, -9.3, 5.6], jaw: true, facto: 'O pogónio é o ponto mais anterior do mento, no queixo.' },
  { id: 'gonio', nome: 'gónio', a: [4.9, -7.0, 0.6], par: true, jaw: true, g: 'm', facto: 'O gónio é o ponto do ângulo da mandíbula.' },
  { id: 'atm', nome: 'articulação temporomandibular', a: [5.7, -0.4, -0.4], par: true, g: 'f', facto: 'A ATM palpa-se à frente do trago: sente-a a mexer quando abres a boca.' },
  { id: 'arcoZig', nome: 'arco zigomático', a: [6.1, -1.1, 1.8], par: true, g: 'm', facto: 'O arco zigomático une o osso zigomático ao temporal; o masseter prende-se por baixo dele.' },
  { id: 'mastoide', nome: 'processo mastoide', a: [5.9, -2.6, -2.0], par: true, g: 'm', facto: 'O processo mastoide fica atrás da orelha; nele insere-se o músculo esternocleidomastóideo.' },
  { id: 'pterio', nome: 'ptério', a: [6.0, 3.0, 2.8], par: true, g: 'm', facto: 'No ptério juntam-se o frontal, o parietal, o temporal e o esfenóide; por baixo passa a artéria meníngea média.' },
  { id: 'forSupra', nome: 'forame supraorbitário', a: [2.5, 2.9, 7.1], par: true, g: 'm', facto: 'Por ele saem o nervo e os vasos supraorbitários, ramos do nervo oftálmico (V1).' },
  { id: 'forInfra', nome: 'forame infraorbitário', a: [2.5, -1.6, 6.6], par: true, g: 'm', facto: 'Por ele sai o nervo infraorbitário, ramo do nervo maxilar (V2).' },
  { id: 'forMento', nome: 'forame mentoniano', a: [2.4, -8.3, 4.6], par: true, jaw: true, g: 'm', facto: 'Por ele sai o nervo mentoniano, ramo do nervo mandibular (V3). Os três forames ficam mais ou menos na mesma vertical.' },
];

// Simulação de exame (treino — não é diagnóstico)
export const CLINICAL = [
  { pede: 'Exame do VII — ramo temporal: eleva as sobrancelhas e franze a testa.', emoji: '🤨', alvos: ['mFrontal'], teste: BROWS, ok: 'Frontal contraído: ramo temporal do nervo facial (VII).' },
  { pede: 'Exame do VII — ramo zigomático: fecha os olhos com força.', emoji: '😖', alvos: ['mOrbOlho'], teste: EYES, ok: 'Orbicular do olho contraído: ramos temporal e zigomático do VII.' },
  { pede: 'Exame do VII — ramo bucal: mostra os dentes num sorriso largo.', emoji: '😬', alvos: ['mZigomatico'], teste: SMILE, ok: 'Zigomáticos e levantadores do lábio: ramos zigomático e bucal do VII.' },
  { pede: 'Exame do VII — ramo bucal: faz bico, como para assobiar.', emoji: '😗', alvos: ['mOrbBoca'], teste: KISS, ok: 'Orbicular da boca contraído: ramo bucal do VII.' },
  { pede: 'Exame do VII — ramo marginal da mandíbula: puxa os cantos da boca e o lábio de baixo para baixo.', emoji: '☹️', alvos: ['mDepressor'], teste: SAD, ok: 'Depressores do ângulo e do lábio inferior: ramo marginal da mandíbula do VII.' },
  { pede: 'Exame do V3 motor: cerra os dentes e mastiga.', emoji: '😤', alvos: ['mMasseter'], teste: (b, e) => e.mastigar > 0.5, hold: 0.8, ok: 'Masseter e temporal: raiz motora do nervo mandibular (V3).' },
];
// Movimentos oculares (III, IV, VI). dir: esq/dir = lado da pessoa.
export const GAZE = [
  { dir: 'esq', pede: 'Motilidade ocular: olha para a tua esquerda, sem rodar a cabeça.', emoji: '👈', ok: 'Olhar conjugado à esquerda: recto lateral esquerdo (VI) e recto medial direito (III).' },
  { dir: 'dir', pede: 'Motilidade ocular: olha para a tua direita, sem rodar a cabeça.', emoji: '👉', ok: 'Olhar conjugado à direita: recto lateral direito (VI) e recto medial esquerdo (III).' },
  { dir: 'cima', pede: 'Motilidade ocular: olha para cima, sem mexer a cabeça.', emoji: '👆', ok: 'Olhar para cima: rectos superiores e oblíquos inferiores (III).' },
  { dir: 'baixo', pede: 'Motilidade ocular: olha para baixo, sem mexer a cabeça.', emoji: '👇', ok: 'Olhar para baixo: rectos inferiores (III) e oblíquos superiores (IV).' },
];

// Perguntas mais difíceis (d = grau: 2 escola, 3 anatomia, 4 clínica)
export const QUIZ_MAIS = [
  { d: 2, p: 'Quantos ossos tem o crânio?', o: ['12', '22', '32'], c: 1, explica: 'São 22: 8 do neurocrânio e 14 da face.' },
  { d: 2, p: 'Qual é o osso mais pequeno do corpo?', o: ['Estribo, no ouvido', 'Falange do mindinho', 'Osso nasal'], c: 0, explica: 'O estribo, no ouvido médio, mede só uns 3 milímetros.' },
  { d: 2, p: 'Que ossos protegem o coração e os pulmões?', o: ['Bacia', 'Costelas e esterno', 'Omoplatas'], c: 1, explica: 'A caixa torácica é feita pelas costelas, o esterno e a coluna.' },
  { d: 2, p: 'Onde fica o cerebelo?', o: ['Atrás e por baixo do cérebro', 'Atrás da testa', 'Dentro do pescoço'], c: 0, explica: 'O cerebelo fica na parte de trás e de baixo da cabeça.' },
  { d: 2, p: 'O que liga os músculos aos ossos?', o: ['Ligamentos', 'Tendões', 'Nervos'], c: 1, explica: 'Os tendões ligam músculo a osso; os ligamentos ligam osso a osso.' },
  { d: 2, p: 'Quantos ossos tem cada pulso?', o: ['5', '8', '12'], c: 1, explica: 'São 8 ossos do carpo em cada pulso.' },
  { d: 2, p: 'O nariz é feito só de osso?', o: ['Sim', 'Não — a ponta é cartilagem'], c: 1, explica: 'Só a parte de cima é osso; a ponta e as asas do nariz são cartilagem.' },
  { d: 2, p: 'Os bebés nascem com mais ou menos ossos do que os adultos?', o: ['Mais', 'Menos', 'O mesmo número'], c: 0, explica: 'Nascem com cerca de 270 a 300, que depois se juntam até ficarem 206.' },
  { d: 2, p: 'Quantas vértebras tem a coluna toda?', o: ['24', '33', '50'], c: 1, explica: '33 vértebras, contando as do sacro e do cóccix, que se fundem.' },
  { d: 2, p: 'Quantos dentes definitivos pode ter um adulto?', o: ['20', '28', '32'], c: 2, explica: 'Até 32, contando os 4 dentes do siso.' },
  { d: 3, p: 'Quantos ossos formam a órbita?', o: ['5', '7', '9'], c: 1, explica: 'Sete: frontal, zigomático, maxila, esfenóide, etmóide, lacrimal e palatino.' },
  { d: 3, p: 'Como se chama o encontro das suturas sagital e coronal?', o: ['Bregma', 'Lambda', 'Ptério'], c: 0, explica: 'Bregma. O lambda é o encontro da sagital com a lambdóide.' },
  { d: 3, p: 'Que ossos se juntam no ptério?', o: ['Frontal, parietal, temporal e esfenóide', 'Occipital, parietal e temporal', 'Maxila, zigomático e nasal'], c: 0, explica: 'Frontal, parietal, temporal e asa maior do esfenóide.' },
  { d: 3, p: 'A vértebra C1 chama-se…', o: ['Áxis', 'Atlas', 'Proeminente'], c: 1, explica: 'C1 é o atlas; C2 é o áxis; C7 é a vértebra proeminente.' },
  { d: 3, p: 'O processo odontóide (dente) pertence a…', o: ['Atlas (C1)', 'Áxis (C2)', 'C7'], c: 1, explica: 'O dente do áxis articula com o arco anterior do atlas.' },
  { d: 3, p: 'Quantos pares de costelas verdadeiras (vertebroesternais) há?', o: ['7', '10', '12'], c: 0, explica: 'As 7 primeiras ligam-se directamente ao esterno pela sua cartilagem.' },
  { d: 3, p: 'Quais são as costelas flutuantes?', o: ['1.ª e 2.ª', '8.ª a 10.ª', '11.ª e 12.ª'], c: 2, explica: 'A 11.ª e a 12.ª não se ligam à frente.' },
  { d: 3, p: 'O ângulo esternal (de Louis) está ao nível da…', o: ['1.ª costela', '2.ª cartilagem costal', '4.ª costela'], c: 1, explica: 'Marca a 2.ª cartilagem costal — o ponto de partida para contar as costelas.' },
  { d: 3, p: 'Qual destes NÃO é um músculo da mastigação?', o: ['Bucinador', 'Temporal', 'Pterigóideo lateral'], c: 0, explica: 'O bucinador é um músculo da expressão facial, inervado pelo VII.' },
  { d: 3, p: 'Quantos dentes decíduos (de leite) há por quadrante?', o: ['4', '5', '8'], c: 1, explica: '2 incisivos, 1 canino e 2 molares: 5 por quadrante, 20 no total.' },
  { d: 3, p: 'O forame mentoniano fica habitualmente por baixo de que dente?', o: ['Canino', '2.º pré-molar', '2.º molar'], c: 1, explica: 'Geralmente por baixo do 2.º pré-molar, ou entre os pré-molares.' },
  { d: 3, p: 'Que osso do carpo se fractura com mais frequência?', o: ['Semilunar', 'Pisiforme', 'Escafóide'], c: 2, explica: 'O escafóide, sobretudo em quedas sobre a mão estendida.' },
  { d: 3, p: 'A articulação temporomandibular é do tipo…', o: ['Fibrosa', 'Sinovial', 'Cartilagínea'], c: 1, explica: 'É sinovial, com um disco articular entre o côndilo e a fossa mandibular.' },
  { d: 4, p: 'Que nervo inerva os músculos da expressão facial?', o: ['Trigémio (V)', 'Facial (VII)', 'Hipoglosso (XII)'], c: 1, explica: 'O nervo facial (VII), pelos ramos temporal, zigomático, bucal, marginal da mandíbula e cervical.' },
  { d: 4, p: 'Que nervo dá a inervação motora do masseter?', o: ['Mandibular (V3)', 'Facial (VII)', 'Glossofaríngeo (IX)'], c: 0, explica: 'Os músculos da mastigação são inervados pelo V3.' },
  { d: 4, p: 'Na paralisia de Bell (lesão periférica do VII), o doente franze a testa do lado afectado?', o: ['Sim', 'Não'], c: 1, explica: 'Não: na lesão periférica fica paralisada toda a hemiface, testa incluída.' },
  { d: 4, p: 'Numa lesão central do VII (por exemplo, um AVC), que região fica geralmente poupada?', o: ['A testa', 'A boca', 'A bochecha'], c: 0, explica: 'A testa, porque a sua parte do núcleo facial recebe fibras dos dois hemisférios.' },
  { d: 4, p: 'Que músculo eleva a pálpebra superior?', o: ['Orbicular do olho', 'Levantador da pálpebra superior', 'Frontal'], c: 1, explica: 'O levantador da pálpebra superior, inervado pelo oculomotor (III).' },
  { d: 4, p: 'Que nervo craniano inerva o recto lateral?', o: ['Troclear (IV)', 'Oculomotor (III)', 'Abducente (VI)'], c: 2, explica: 'O abducente (VI): sem ele o olho não vai para fora.' },
  { d: 4, p: 'O nervo troclear (IV) inerva o…', o: ['Oblíquo superior', 'Recto inferior', 'Oblíquo inferior'], c: 0, explica: 'O oblíquo superior, cujo tendão passa pela tróclea — daí o nome do nervo.' },
  { d: 4, p: 'Por baixo do ptério passa um ramo de que artéria?', o: ['Carótida interna', 'Meníngea média', 'Facial'], c: 1, explica: 'O ramo anterior da artéria meníngea média — fracturas aqui podem dar hematoma epidural.' },
  { d: 4, p: 'Dor na tabaqueira anatómica após queda sobre a mão estendida sugere fractura do…', o: ['Escafóide', 'Rádio distal', '5.º metacarpo'], c: 0, explica: 'Escafóide — mesmo com radiografia inicial normal, deve ser valorizada.' },
  { d: 4, p: 'A lesão do nervo radial no sulco do úmero provoca…', o: ['Mão em garra', 'Mão pendente', 'Mão de pregador'], c: 1, explica: 'Mão pendente (queda do punho), por paralisia dos extensores.' },
  { d: 4, p: 'O nervo que dá "choque" quando batemos no cotovelo passa atrás do…', o: ['Epicôndilo medial', 'Epicôndilo lateral', 'Olecrânio'], c: 0, explica: 'É o nervo ulnar, atrás do epicôndilo medial.' },
  { d: 4, p: 'Ptose com o olho "para baixo e para fora" sugere lesão do…', o: ['Abducente (VI)', 'Oculomotor (III)', 'Facial (VII)'], c: 1, explica: 'Do oculomotor (III): ficam a actuar só o recto lateral (VI) e o oblíquo superior (IV).' },
  { d: 4, p: 'Que artéria se palpa habitualmente no pescoço para avaliar o pulso?', o: ['Vertebral', 'Subclávia', 'Carótida comum'], c: 2, explica: 'A carótida comum, à frente do esternocleidomastóideo.' },
];

// ================================================================== DETALHE DO CÉREBRO (lobos e funções)
// A ordem é o índice usado no modelo 3D (atributo aLobe). cor = cor do lobo nas duas vistas.
export const BRAIN_LOBES = [
  { id: 'loboFrontal', nome: 'Lobo frontal', cient: 'Lobo frontal', cor: '#b25bff', emoji: '🧭',
    funcao: 'Planear, decidir, controlar os movimentos, a fala e o comportamento.',
    funcaoCient: 'Córtex motor (giro pré-central), área de Broca (produção da fala) e córtex pré-frontal (planeamento, atenção e controlo do comportamento).' },
  { id: 'loboParietal', nome: 'Lobo parietal', cient: 'Lobo parietal', cor: '#3a78ff', emoji: '✋',
    funcao: 'Sentir o toque, a dor e a temperatura, e saber onde está cada parte do corpo.',
    funcaoCient: 'Córtex somatossensitivo (giro pós-central), integração sensorial e noção do espaço e do próprio corpo.' },
  { id: 'loboTemporal', nome: 'Lobo temporal', cient: 'Lobo temporal', cor: '#27d6e8', emoji: '👂',
    funcao: 'Ouvir, guardar memórias, sentir emoções e reconhecer vozes e caras.',
    funcaoCient: 'Córtex auditivo, área de Wernicke (compreensão da linguagem), hipocampo (memória) e amígdala (emoções).' },
  { id: 'loboOccipital', nome: 'Lobo occipital', cient: 'Lobo occipital', cor: '#ffc83a', emoji: '👁️',
    funcao: 'É o principal centro da visão: transforma o que os olhos vêem em imagens.',
    funcaoCient: 'Córtex visual primário (V1), à volta da fissura calcarina, e áreas visuais de associação.' },
  { id: 'cerebelo', nome: 'Cerebelo', cient: 'Cerebelo', cor: '#ff70d0', emoji: '🚲',
    funcao: 'Coordena os movimentos, o equilíbrio e a precisão.',
    funcaoCient: 'Coordenação, equilíbrio, tónus e aprendizagem motora; compara o movimento planeado com o que os músculos e o ouvido interno informam.' },
  { id: 'tronco', nome: 'Tronco encefálico', cient: 'Tronco encefálico (mesencéfalo, ponte e bulbo)', cor: '#47e472', emoji: '🫁',
    funcao: 'Liga o cérebro à medula espinal e controla funções vitais: respirar, o bater do coração e o sono.',
    funcaoCient: 'Mesencéfalo, ponte e bulbo raquidiano: centros respiratório e cardiovascular, vigília e núcleos de 10 dos 12 nervos cranianos (III a XII).' },
];
export const BRAIN_OVERVIEW = { nome: 'Cérebro', cor: '#e08bff',
  funcao: 'O centro de controlo do corpo e da mente: junta o que sentes, pensas, lembras e fazes.',
  funcaoCient: 'Dois hemisférios cerebrais com córtex dividido em lobos; cada hemisfério controla sobretudo o lado oposto do corpo.' };
// pontos onde se pode tocar na cabeça para ver cada lobo (referencial da cabeça, cm)
export const LOBE_PARTS = [
  { id: 'loboFrontal', a: [2.7, 6.3, 4.6], par: true },
  { id: 'loboParietal', a: [4.0, 8.2, -2.4], par: true },
  { id: 'loboTemporal', a: [5.9, 2.4, 0.9], par: true },
].map(p => { const L = BRAIN_LOBES.find(l => l.id === p.id); return { ...p, layer: 'brain', lobo: true, nome: L.nome, cient: L.cient, emoji: L.emoji, facto: L.funcao, factoCient: L.funcaoCient }; });

QUIZ_MAIS.push(
  { d: 2, p: 'Que lobo do cérebro trata sobretudo da visão?', o: ['Frontal', 'Occipital', 'Temporal'], c: 1, explica: 'O lobo occipital, na parte de trás da cabeça — longe dos olhos!' },
  { d: 2, p: 'Que parte do encéfalo controla a respiração e o bater do coração?', o: ['Cerebelo', 'Lobo frontal', 'Tronco encefálico'], c: 2, explica: 'O tronco encefálico, que liga o cérebro à medula espinal.' },
  { d: 2, p: 'Ouvir e reconhecer vozes é sobretudo trabalho do lobo…', o: ['Temporal', 'Parietal', 'Occipital'], c: 0, explica: 'Do lobo temporal, que fica por cima das orelhas.' },
  { d: 3, p: 'A área de Broca, ligada à produção da fala, fica no lobo…', o: ['Temporal', 'Frontal', 'Parietal'], c: 1, explica: 'Frontal (giro frontal inferior, normalmente no hemisfério esquerdo).' },
  { d: 3, p: 'O giro pós-central (sensibilidade do corpo) pertence ao lobo…', o: ['Parietal', 'Frontal', 'Occipital'], c: 0, explica: 'Parietal. O giro pré-central, motor, fica no lobo frontal.' },
  { d: 3, p: 'Que sulco separa o lobo frontal do lobo parietal?', o: ['Sulco lateral (de Sylvius)', 'Sulco central (de Rolando)', 'Sulco calcarino'], c: 1, explica: 'O sulco central, de Rolando. O lateral separa o lobo temporal.' },
  { d: 3, p: 'O hipocampo, essencial para formar memórias, fica no lobo…', o: ['Occipital', 'Frontal', 'Temporal'], c: 2, explica: 'Temporal, na sua face medial.' },
  { d: 4, p: 'Fala fluente mas sem sentido e má compreensão (afasia de Wernicke) sugere lesão do lobo…', o: ['Frontal', 'Temporal', 'Occipital'], c: 1, explica: 'Temporal posterior (área de Wernicke), em geral no hemisfério esquerdo.' },
  { d: 4, p: 'Um AVC no lobo occipital esquerdo provoca habitualmente…', o: ['Hemianopsia homónima direita', 'Cegueira do olho esquerdo', 'Hemianopsia bitemporal'], c: 0, explica: 'Perde-se o campo visual direito dos dois olhos (hemianopsia homónima direita).' },
  { d: 4, p: 'Ataxia e dismetria do braço direito sugerem lesão do…', o: ['Hemisfério cerebeloso direito', 'Hemisfério cerebeloso esquerdo', 'Lobo occipital'], c: 0, explica: 'O cerebelo actua sobre o mesmo lado do corpo: lesão cerebelosa direita, sintomas à direita.' },
);
// "Que parte do cérebro é esta?" nos níveis 7 e 12
LADDER[6].mix.push(['qualLobo']);
LADDER[11].mix.push(['qualLobo']);
