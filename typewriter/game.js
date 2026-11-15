// Máquina de Escrever Divertida - Motor Interativo para Crianças
(() => {
  const sound = window.TypewriterAudio;

  const INK_MODES = [
    { id: 'black', label: 'Preta', color: '#1e293b', swatch: '#1e293b' },
    { id: 'blue', label: 'Azul', color: '#0284c7', swatch: '#0284c7' },
    { id: 'pink', label: 'Rosa', color: '#db2777', swatch: '#db2777' },
    { id: 'green', label: 'Verde', color: '#16a34a', swatch: '#16a34a' },
    { id: 'purple', label: 'Roxo', color: '#7c3aed', swatch: '#7c3aed' },
    { id: 'rainbow', label: 'Arco-Íris', color: 'rainbow', swatch: 'linear-gradient(135deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)' }
  ];

  const RAINBOW_COLORS = ['#ef4444', '#f97316', '#eab308', '#16a34a', '#0284c7', '#7c3aed', '#ec4899'];

  const STAMPS = ['⭐', '❤️', '🦄', '🦕', '🌈', '🚀'];

  const WORD_CHALLENGES = [
    { word: 'SOL', icon: '☀️' },
    { word: 'GATO', icon: '🐱' },
    { word: 'BOLA', icon: '⚽' },
    { word: 'CASA', icon: '🏠' },
    { word: 'PATO', icon: '🦆' },
    { word: 'AMOR', icon: '❤️' },
    { word: 'FLOR', icon: '🌸' },
    { word: 'DINO', icon: '🦕' },
    { word: 'FOGUETE', icon: '🚀' },
    { word: 'UNICORNIO', icon: '🦄' }
  ];

  const KEYBOARD_ROWS = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '!', '?', '.']
  ];

  let lines = [{ chars: [] }];
  let currentInk = 'black';
  let rainbowIdx = 0;
  let keyCounter = 0;
  let challengeMode = false;
  let challengeIndex = 0;
  let starsEarned = 0;
  let typebarTimeout = null;
  const keyElementsMap = new Map();

  function getMaxCols() {
    return window.innerWidth < 520 ? 18 : (window.innerWidth < 900 ? 24 : 30);
  }

  function resolveInkColor() {
    if (currentInk === 'rainbow') {
      const c = RAINBOW_COLORS[rainbowIdx % RAINBOW_COLORS.length];
      rainbowIdx++;
      return c;
    }
    const found = INK_MODES.find(m => m.id === currentInk);
    return found ? found.color : '#1e293b';
  }

  // ================== RENDERIZAÇÃO DO TECLADO E CONTROLES ==================
  function renderInkPalette() {
    const wrap = document.getElementById('ink-palette');
    wrap.innerHTML = '';
    INK_MODES.forEach(mode => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.title = `Tinta ${mode.label}`;
      btn.className = `ink-dot ${currentInk === mode.id ? 'active' : ''}`;
      btn.style.background = mode.swatch;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.init();
        currentInk = mode.id;
        sound.playStampPop();
        renderInkPalette();
      });
      wrap.appendChild(btn);
    });
  }

  function renderStampsBar() {
    const wrap = document.getElementById('stamps-bar');
    wrap.innerHTML = '';
    STAMPS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stamp-btn';
      btn.textContent = emoji;
      btn.title = `Carimbar ${emoji}`;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        sound.init();
        stampCharacter(emoji);
      });
      wrap.appendChild(btn);
    });
  }

  function createTypewriterKey(label, action, extraClass = '') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `tw-key ${extraClass}`;
    btn.textContent = label;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      sound.init();
      animateKeyPress(btn);
      action();
    });
    return btn;
  }

  function renderKeyboard() {
    const kb = document.getElementById('typewriter-keyboard');
    kb.innerHTML = '';
    keyElementsMap.clear();

    KEYBOARD_ROWS.forEach((rowKeys, rowIdx) => {
      const rowEl = document.createElement('div');
      rowEl.className = `kb-row kb-row-${rowIdx}`;

      rowKeys.forEach(ch => {
        const keyBtn = createTypewriterKey(ch, () => typeCharacter(ch));
        keyElementsMap.set(ch, keyBtn);
        rowEl.appendChild(keyBtn);
      });

      if (rowIdx === 2) {
        const backBtn = createTypewriterKey('⌫', () => handleBackspace(), 'tw-key-action tw-key-back');
        backBtn.title = 'Apagar';
        keyElementsMap.set('BACKSPACE', backBtn);
        rowEl.appendChild(backBtn);
      }

      kb.appendChild(rowEl);
    });

    // Última linha: Vírgula, Barra de Espaço Grande e Enter (Nova Linha)
    const bottomRow = document.createElement('div');
    bottomRow.className = 'kb-row kb-row-bottom';

    const commaBtn = createTypewriterKey(',', () => typeCharacter(','), 'tw-key-punct');
    keyElementsMap.set(',', commaBtn);

    const spaceBtn = createTypewriterKey('ESPAÇO', () => typeSpace(), 'tw-key-space');
    keyElementsMap.set(' ', spaceBtn);

    const enterBtn = createTypewriterKey('⏎ PULAR LINHA', () => handleNewLine(true), 'tw-key-enter');
    keyElementsMap.set('ENTER', enterBtn);

    bottomRow.appendChild(commaBtn);
    bottomRow.appendChild(spaceBtn);
    bottomRow.appendChild(enterBtn);
    kb.appendChild(bottomRow);
  }

  function animateKeyPress(btn) {
    if (!btn) return;
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 110);
  }

  function triggerTypebarStrike(charLabel) {
    const arm = document.getElementById('typebar-arm');
    const tip = document.getElementById('typebar-tip');
    if (!arm || !tip) return;
    tip.textContent = charLabel;
    arm.classList.remove('striking');
    void arm.offsetWidth;
    arm.classList.add('striking');
    clearTimeout(typebarTimeout);
    typebarTimeout = setTimeout(() => {
      arm.classList.remove('striking');
    }, 110);
  }

  // ================== AÇÕES DE DIGITAÇÃO ==================
  function typeCharacter(ch) {
    const maxCols = getMaxCols();
    let activeLine = lines[lines.length - 1];
    if (activeLine.chars.length >= maxCols) {
      sound.playCarriageReturn();
      lines.push({ chars: [] });
      activeLine = lines[lines.length - 1];
    }

    const color = resolveInkColor();
    activeLine.chars.push({ text: ch, color, isStamp: false, popNew: true });

    keyCounter++;
    sound.playKeyClack(keyCounter);
    triggerTypebarStrike(ch);

    if (navigator.vibrate) {
      try { navigator.vibrate(8); } catch (_) {}
    }

    renderPaper();
    checkWordChallengeProgress();
  }

  function stampCharacter(emoji) {
    const maxCols = getMaxCols();
    let activeLine = lines[lines.length - 1];
    if (activeLine.chars.length >= maxCols) {
      sound.playCarriageReturn();
      lines.push({ chars: [] });
      activeLine = lines[lines.length - 1];
    }

    activeLine.chars.push({ text: emoji, color: '#1e293b', isStamp: true, popNew: true });
    sound.playStampPop();
    triggerTypebarStrike(emoji);
    renderPaper();
  }

  function typeSpace() {
    const maxCols = getMaxCols();
    let activeLine = lines[lines.length - 1];
    if (activeLine.chars.length >= maxCols) {
      handleNewLine(true);
      return;
    }
    activeLine.chars.push({ text: ' ', color: '#1e293b', isStamp: false, popNew: false });
    sound.playSpaceClack();
    triggerTypebarStrike('␣');
    renderPaper();
  }

  function handleBackspace() {
    let activeLine = lines[lines.length - 1];
    if (activeLine.chars.length > 0) {
      activeLine.chars.pop();
    } else if (lines.length > 1) {
      lines.pop();
    }
    sound.playBackspaceClick();
    renderPaper();
    checkWordChallengeProgress();
  }

  function handleNewLine(withBell = true) {
    lines.push({ chars: [] });
    if (withBell) {
      sound.playCarriageReturn();
      const carriage = document.getElementById('paper-carriage');
      if (carriage) {
        carriage.classList.remove('returning');
        void carriage.offsetWidth;
        carriage.classList.add('returning');
      }
    }
    renderPaper();
  }

  function clearPaper() {
    lines = [{ chars: [] }];
    sound.playNewPaper();
    const sheet = document.getElementById('paper-sheet');
    if (sheet) {
      sheet.classList.remove('fresh-sheet');
      void sheet.offsetWidth;
      sheet.classList.add('fresh-sheet');
    }
    renderPaper();
  }

  // ================== MODO DESAFIO DE PALAVRAS ==================
  function getTypedUpperPlainText() {
    return lines
      .map(l => l.chars.filter(c => !c.isStamp).map(c => c.text).join(''))
      .join(' ')
      .replace(/\s+/g, '')
      .toUpperCase();
  }

  function updateChallengeBanner() {
    const banner = document.getElementById('challenge-banner');
    const toggleBtn = document.getElementById('mode-toggle-btn');
    const starsEl = document.getElementById('stars-count');
    if (starsEl) starsEl.textContent = starsEarned;

    if (!challengeMode) {
      banner.classList.add('hidden');
      toggleBtn.textContent = '🎯 Copiar Palavras';
      toggleBtn.classList.remove('active');
      return;
    }

    banner.classList.remove('hidden');
    toggleBtn.textContent = '✍️ Escrita Livre';
    toggleBtn.classList.add('active');

    const target = WORD_CHALLENGES[challengeIndex % WORD_CHALLENGES.length];
    document.getElementById('challenge-emoji').textContent = target.icon;

    const typed = getTypedUpperPlainText();
    // Match suffix or full typed sequence relative to current target word
    const lettersWrap = document.getElementById('challenge-letters');
    lettersWrap.innerHTML = '';

    // Find longest prefix of target.word matched by the end of typed string
    let matchedCount = 0;
    for (let len = Math.min(typed.length, target.word.length); len >= 1; len--) {
      const sub = typed.slice(-len);
      if (target.word.startsWith(sub)) {
        matchedCount = len;
        break;
      }
    }

    target.word.split('').forEach((ltr, idx) => {
      const span = document.createElement('span');
      span.className = 'challenge-letter ' + (idx < matchedCount ? 'done' : (idx === matchedCount ? 'next' : ''));
      span.textContent = ltr;
      lettersWrap.appendChild(span);
    });
  }

  function checkWordChallengeProgress() {
    if (!challengeMode) return;
    updateChallengeBanner();

    const target = WORD_CHALLENGES[challengeIndex % WORD_CHALLENGES.length];
    const typed = getTypedUpperPlainText();
    if (typed.endsWith(target.word)) {
      starsEarned++;
      sound.playWordComplete();
      spawnPaperConfetti();
      challengeIndex = (challengeIndex + 1) % WORD_CHALLENGES.length;
      setTimeout(() => {
        if (challengeMode) {
          lines.push({ chars: [] });
          renderPaper();
          updateChallengeBanner();
        }
      }, 650);
    }
  }

  function spawnPaperConfetti() {
    const stage = document.getElementById('paper-confetti');
    if (!stage) return;
    const emojis = ['⭐', '🎉', '✨', '🌈', '💫'];
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('span');
      el.className = 'confetti-pop';
      el.textContent = emojis[i % emojis.length];
      el.style.left = (15 + Math.random() * 70) + '%';
      el.style.animationDelay = (i * 0.03) + 's';
      stage.appendChild(el);
      setTimeout(() => el.remove(), 1100);
    }
  }

  // ================== RENDERIZAÇÃO DA FOLHA DE PAPEL ==================
  function renderPaper() {
    const container = document.getElementById('paper-lines');
    const scrollArea = document.getElementById('paper-scroll');
    const carriage = document.getElementById('paper-carriage');
    container.innerHTML = '';

    lines.forEach((line, lineIdx) => {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'paper-line';

      line.chars.forEach(item => {
        const span = document.createElement('span');
        span.className = item.isStamp ? 'typed-stamp' : 'typed-char';
        if (item.popNew) {
          span.classList.add('just-typed');
          item.popNew = false;
        }
        span.textContent = item.text === ' ' ? '\u00A0' : item.text;
        span.style.color = item.color;
        lineDiv.appendChild(span);
      });

      if (lineIdx === lines.length - 1) {
        const cursor = document.createElement('span');
        cursor.className = 'type-cursor';
        lineDiv.appendChild(cursor);
      }

      container.appendChild(lineDiv);
    });

    // Subtle mechanical carriage shift as current line fills up
    const activeLen = lines[lines.length - 1].chars.length;
    const maxCols = getMaxCols();
    const shiftPx = Math.min(24, (activeLen / maxCols) * 24);
    if (carriage) {
      carriage.style.transform = `translateX(${-shiftPx + 10}px)`;
    }

    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }

    updateChallengeBanner();
  }

  // ================== LEITURA EM VOZ ALTA (TTS PT-BR) ==================
  function readPaperAloud() {
    sound.init();
    const plain = lines
      .map(l => l.chars.filter(c => !c.isStamp).map(c => c.text).join(''))
      .join(' ')
      .trim();

    if (!plain) {
      sound.playStampPop();
      return;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(plain.toLowerCase());
        utter.lang = 'pt-BR';
        utter.rate = 0.92;
        utter.pitch = 1.1;
        window.speechSynthesis.speak(utter);
      } catch (_) {}
    } else {
      sound.playWordComplete();
    }
  }

  // ================== TECLADO FÍSICO (DESKTOP) ==================
  function normalizeKey(rawKey) {
    if (!rawKey) return '';
    if (rawKey === 'Backspace') return 'BACKSPACE';
    if (rawKey === 'Enter') return 'ENTER';
    if (rawKey === ' ') return ' ';
    const upper = rawKey.toUpperCase();
    if (/^[A-ZÇ0-9!?\.,]$/.test(upper)) return upper;
    // Map accented base vowels cleanly if kid presses physical keyboard
    const clean = upper.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (/^[A-Z]$/.test(clean)) return clean;
    return '';
  }

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const mapped = normalizeKey(e.key);
    if (!mapped) return;

    e.preventDefault();
    sound.init();
    animateKeyPress(keyElementsMap.get(mapped));

    if (mapped === 'BACKSPACE') {
      handleBackspace();
    } else if (mapped === 'ENTER') {
      handleNewLine(true);
    } else if (mapped === ' ') {
      typeSpace();
    } else {
      typeCharacter(mapped);
    }
  });

  // ================== INICIALIZAÇÃO ==================
  function init() {
    renderInkPalette();
    renderStampsBar();
    renderKeyboard();
    renderPaper();

    document.getElementById('btn-sound').addEventListener('click', () => {
      const next = sound.setEnabled(!sound.isEnabled());
      document.getElementById('btn-sound').textContent = next ? '🔊' : '🔇';
      if (next) sound.playKeyClack(1);
    });

    document.getElementById('btn-clear').addEventListener('click', clearPaper);
    document.getElementById('btn-speak').addEventListener('click', readPaperAloud);

    document.getElementById('mode-toggle-btn').addEventListener('click', () => {
      sound.init();
      challengeMode = !challengeMode;
      sound.playStampPop();
      if (challengeMode) {
        lines = [{ chars: [] }];
      }
      renderPaper();
    });

    window.addEventListener('resize', () => {
      renderPaper();
    });
  }

  window.addEventListener('DOMContentLoaded', init);
})();
