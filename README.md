# Espelho Raio-X 🩻

Um espelho mágico para crianças, em português: a câmara mostra-te como um espelho e desenha por cima, em tempo real, o crânio, os dentes, o cérebro, os olhos, os músculos da cara e os ossos das mãos.

**Abrir:** https://leonelbeira.github.io/sigd/ (Chrome ou Edge; carrega em “Ligar a câmara” e escolhe “Permitir”).

- Modos: **Explorar**, **Toca e descobre** (aponta com o dedo para uma parte da cara) e **Desafio** (8 desafios com voz e estrelas).
- Aspectos Raio-X, Osso e Néon; lupa mágica que segue o dedo; meia cara; foto.
- **Privacidade:** o vídeo é processado só no browser e nunca é enviado. A página só descarrega as bibliotecas (jsDelivr) e os modelos de IA (Google); uma política de segurança bloqueia todas as outras ligações, incluindo as métricas do MediaPipe.
- A anatomia é um modelo 3D ilustrativo de um adulto — não é um raio-X verdadeiro nem um instrumento médico.

Tecnologia: MediaPipe Tasks Vision 1.2.3 (cara 478 pontos + expressões; mãos 21 pontos), Three.js r187, Canvas 2D. Textos e curiosidades em `js/parts.js`.

Licenças: MediaPipe e modelos — Apache-2.0 (Google); Three.js — MIT; letra Fredoka — SIL OFL 1.1 (Google Fonts).
