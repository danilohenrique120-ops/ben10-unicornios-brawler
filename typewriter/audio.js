// Máquina de Escrever Divertida - Sintetizador Mecânico Web Audio API
window.TypewriterAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let enabled = true;
  let unlocked = false;

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = enabled ? 0.95 : 0;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    if (!unlocked) {
      try {
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        unlocked = true;
      } catch (_) {}
    }
    return ctx;
  }

  function setEnabled(next) {
    enabled = Boolean(next);
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(enabled ? 0.95 : 0, ctx.currentTime, 0.015);
    }
    if (enabled) ensureContext();
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  function makeNoiseBuffer(duration, decayRate = 0.35) {
    const c = ensureContext();
    if (!c) return null;
    const len = Math.max(1, Math.floor(c.sampleRate * duration));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * decayRate));
    }
    return buf;
  }

  // Som clássico de tecla mecânica + martelinho batendo no papel
  function playKeyClack(pitchSeed = 0) {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    const jitter = ((pitchSeed % 7) - 3) * 28 + (Math.random() - 0.5) * 45;

    // 1. Batida seca da tecla descendo (estalo agudo)
    const clickBuf = makeNoiseBuffer(0.032, 0.25);
    if (clickBuf) {
      const src = c.createBufferSource();
      src.buffer = clickBuf;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 2400 + jitter;
      filt.Q.value = 2.0;
      const g = c.createGain();
      g.gain.setValueAtTime(0.65, now);
      g.gain.exponentialRampToValueAtTime(0.005, now + 0.032);
      src.connect(filt);
      filt.connect(g);
      g.connect(masterGain);
      src.start(now);
    }

    // 2. Impacto do martelinho metálico no rolo de borracha (~18ms depois)
    const strikeTime = now + 0.016;
    const thudOsc = c.createOscillator();
    const thudGain = c.createGain();
    thudOsc.type = 'triangle';
    thudOsc.frequency.setValueAtTime(280 + jitter * 0.4, strikeTime);
    thudOsc.frequency.exponentialRampToValueAtTime(85, strikeTime + 0.045);
    thudGain.gain.setValueAtTime(0.55, strikeTime);
    thudGain.gain.exponentialRampToValueAtTime(0.004, strikeTime + 0.05);
    thudOsc.connect(thudGain);
    thudGain.connect(masterGain);
    thudOsc.start(strikeTime);
    thudOsc.stop(strikeTime + 0.055);

    const strikeBuf = makeNoiseBuffer(0.045, 0.3);
    if (strikeBuf) {
      const src2 = c.createBufferSource();
      src2.buffer = strikeBuf;
      const filt2 = c.createBiquadFilter();
      filt2.type = 'highpass';
      filt2.frequency.value = 1400 + jitter;
      const g2 = c.createGain();
      g2.gain.setValueAtTime(0.45, strikeTime);
      g2.gain.exponentialRampToValueAtTime(0.005, strikeTime + 0.045);
      src2.connect(filt2);
      filt2.connect(g2);
      g2.connect(masterGain);
      src2.start(strikeTime);
    }
  }

  // Barra de espaço (mais grave e oca)
  function playSpaceClack() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;

    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(165, now);
    osc.frequency.exponentialRampToValueAtTime(62, now + 0.065);
    g.gain.setValueAtTime(0.52, now);
    g.gain.exponentialRampToValueAtTime(0.004, now + 0.07);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.075);

    const buf = makeNoiseBuffer(0.04, 0.35);
    if (buf) {
      const src = c.createBufferSource();
      src.buffer = buf;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = 950;
      const ng = c.createGain();
      ng.gain.setValueAtTime(0.42, now);
      ng.gain.exponentialRampToValueAtTime(0.005, now + 0.04);
      src.connect(filt);
      filt.connect(ng);
      ng.connect(masterGain);
      src.start(now);
    }
  }

  // Backspace mecânico (engrenagem voltando um dente)
  function playBackspaceClick() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;

    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.045);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.004, now + 0.05);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  // Campainha metálica + som do carro voltando ("DING! ziiip-clack")
  function playCarriageReturn() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;

    // 1. Sininho clássico da máquina de escrever (parciais metálicos)
    [2093, 3135.96, 4186].forEach((freq, idx) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.24 / (idx + 1), now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.55 - idx * 0.1);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.58);
    });

    // 2. Deslizar mecânico da engrenagem
    const slideBuf = makeNoiseBuffer(0.2, 0.6);
    if (slideBuf) {
      const src = c.createBufferSource();
      src.buffer = slideBuf;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.setValueAtTime(800, now + 0.04);
      filt.frequency.linearRampToValueAtTime(1900, now + 0.22);
      const g = c.createGain();
      g.gain.setValueAtTime(0.28, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.005, now + 0.24);
      src.connect(filt);
      filt.connect(g);
      g.connect(masterGain);
      src.start(now + 0.04);
    }

    // 3. Travinha final do carro batendo
    const latch = c.createOscillator();
    const lg = c.createGain();
    latch.type = 'triangle';
    latch.frequency.setValueAtTime(210, now + 0.22);
    latch.frequency.exponentialRampToValueAtTime(80, now + 0.28);
    lg.gain.setValueAtTime(0.35, now + 0.22);
    lg.gain.exponentialRampToValueAtTime(0.004, now + 0.29);
    latch.connect(lg);
    lg.connect(masterGain);
    latch.start(now + 0.22);
    latch.stop(now + 0.3);
  }

  // Som fofo para carimbos/stickers
  function playStampPop() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;

    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.09);
    g.gain.setValueAtTime(0.28, now);
    g.gain.exponentialRampToValueAtTime(0.004, now + 0.11);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Som de colocar papel novo
  function playNewPaper() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    const buf = makeNoiseBuffer(0.24, 0.55);
    if (buf) {
      const src = c.createBufferSource();
      src.buffer = buf;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.setValueAtTime(1200, now);
      filt.frequency.exponentialRampToValueAtTime(2600, now + 0.22);
      const g = c.createGain();
      g.gain.setValueAtTime(0.32, now);
      g.gain.exponentialRampToValueAtTime(0.004, now + 0.24);
      src.connect(filt);
      filt.connect(g);
      g.connect(masterGain);
      src.start(now);
    }
  }

  // Fanfarra de palavra completada
  function playWordComplete() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const t = c.currentTime + i * 0.08;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.004, t + 0.25);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  ['pointerdown', 'touchstart', 'mousedown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, () => ensureContext(), { passive: true, capture: true });
  });

  return {
    init: ensureContext,
    setEnabled,
    isEnabled,
    playKeyClack,
    playSpaceClack,
    playBackspaceClick,
    playCarriageReturn,
    playStampPop,
    playNewPaper,
    playWordComplete
  };
})();
