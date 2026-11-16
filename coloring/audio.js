// Estúdio de Desenho & Colorir Kids - Sintetizador de Áudio Divertido (Web Audio API)
window.ColoringAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let enabled = true;
  let unlocked = false;
  let lastMoveSound = 0;

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = enabled ? 0.9 : 0;
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
      masterGain.gain.setValueAtTime(enabled ? 0.9 : 0, ctx.currentTime);
    }
    if (enabled) ensureContext();
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  function playUiPop(pitch = 560) {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.45, now + 0.065);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.003, now + 0.075);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Som fofo de balde de tinta preenchendo ("BLOOP!")
  function playBucketSplash() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(640, now + 0.11);
    g.gain.setValueAtTime(0.32, now);
    g.gain.exponentialRampToValueAtTime(0.003, now + 0.13);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Som suave ao deslizar giz/pincel/arco-íris
  function playStrokeTick(toolId) {
    if (!enabled) return;
    const nowMs = performance.now();
    if (nowMs - lastMoveSound < 110) return;
    lastMoveSound = nowMs;

    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;

    if (toolId === 'rainbow' || toolId === 'sparkle') {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      const f = 760 + Math.random() * 680;
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.25, now + 0.07);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.002, now + 0.08);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.085);
    } else {
      const len = Math.floor(c.sampleRate * 0.045);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
      }
      const src = c.createBufferSource();
      src.buffer = buf;
      const filt = c.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = toolId === 'crayon' ? 1850 : (toolId === 'eraser' ? 900 : 1300);
      const g = c.createGain();
      g.gain.setValueAtTime(0.07, now);
      g.gain.exponentialRampToValueAtTime(0.002, now + 0.045);
      src.connect(filt);
      filt.connect(g);
      g.connect(masterGain);
      src.start(now);
    }
  }

  function playStamp() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    [659.25, 987.77].forEach((freq, idx) => {
      const t = now + idx * 0.045;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.003, t + 0.13);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.14);
    });
  }

  function playSaveFanfare() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const t = c.currentTime + idx * 0.075;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.2, t);
      g.gain.exponentialRampToValueAtTime(0.003, t + 0.24);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, () => ensureContext(), { passive: true, capture: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && enabled && ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  });

  return {
    init: ensureContext,
    setEnabled,
    isEnabled,
    playUiPop,
    playBucketSplash,
    playStrokeTick,
    playStamp,
    playSaveFanfare
  };
})();
