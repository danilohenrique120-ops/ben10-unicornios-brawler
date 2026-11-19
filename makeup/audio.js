// Salão de Maquiagem Realista Kids - Motor de Áudio ASMR (Web Audio API)
window.MakeupAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let enabled = true;
  let unlocked = false;
  let lastMoveTime = 0;

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = enabled ? 0.92 : 0;
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
      masterGain.gain.setValueAtTime(enabled ? 0.92 : 0, ctx.currentTime);
    }
    if (enabled) ensureContext();
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  function canTick(intervalMs = 95) {
    const now = performance.now();
    if (now - lastMoveTime < intervalMs) return false;
    lastMoveTime = now;
    return true;
  }

  function noiseBurst({ duration = 0.085, freq = 1500, q = 1.2, vol = 0.14, type = 'bandpass' }) {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * duration));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
    }
    const src = c.createBufferSource();
    src.buffer = buf;

    const filt = c.createBiquadFilter();
    filt.type = type;
    filt.frequency.value = freq;
    filt.Q.value = q;

    const g = c.createGain();
    const now = c.currentTime;
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.003, now + duration);

    src.connect(filt);
    filt.connect(g);
    g.connect(masterGain);
    src.start(now);
  }

  function playUiSelect(pitch = 560) {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 1.4, now + 0.065);
    g.gain.setValueAtTime(0.15, now);
    g.gain.exponentialRampToValueAtTime(0.002, now + 0.075);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Espuma / máscara facial cremosa
  function playSpaCream() {
    if (!canTick(105)) return;
    noiseBurst({ duration: 0.09, freq: 720 + Math.random() * 200, q: 0.9, vol: 0.12, type: 'lowpass' });
  }

  // Toalha / enxágue da máscara spa
  function playRinseWipe() {
    if (!canTick(100)) return;
    noiseBurst({ duration: 0.095, freq: 1250 + Math.random() * 350, q: 1.0, vol: 0.14 });
    if (enabled && Math.random() > 0.5) {
      const c = ensureContext();
      if (!c) return;
      const now = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600 + Math.random() * 320, now);
      osc.frequency.exponentialRampToValueAtTime(1080, now + 0.055);
      g.gain.setValueAtTime(0.07, now);
      g.gain.exponentialRampToValueAtTime(0.002, now + 0.06);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.065);
    }
  }

  // Pincel macio de blush, sombra e iluminador
  function playPowderBrush() {
    if (!canTick(95)) return;
    noiseBurst({ duration: 0.09, freq: 2400 + Math.random() * 500, q: 1.1, vol: 0.11 });
  }

  // Batom e Gloss cremoso
  function playLipstickGlide() {
    if (!canTick(100)) return;
    noiseBurst({ duration: 0.08, freq: 950, q: 1.2, vol: 0.1, type: 'lowpass' });
  }

  // Delineador, lápis de sobrancelha e escovinha de rímel
  function playPrecisionStroke() {
    if (!canTick(90)) return;
    noiseBurst({ duration: 0.065, freq: 3100, q: 1.8, vol: 0.09 });
  }

  // Glitter, pedrinhas faciais, brincos, coroa e colar
  function playGemSparkle() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    [1046.5, 1318.51, 1567.98].forEach((freq, i) => {
      const t = now + i * 0.04;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.002, t + 0.18);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.19);
    });
  }

  function playGlitterTick() {
    if (!canTick(115)) return;
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    const f = 1200 + Math.random() * 800;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 1.35, now + 0.08);
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.002, now + 0.09);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  function playCameraGlam() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    noiseBurst({ duration: 0.055, freq: 2900, q: 1.6, vol: 0.28, type: 'highpass' });
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((freq, i) => {
      const t = c.currentTime + 0.07 + i * 0.065;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.002, t + 0.28);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.3);
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
    playUiSelect,
    playSpaCream,
    playRinseWipe,
    playPowderBrush,
    playLipstickGlide,
    playPrecisionStroke,
    playGemSparkle,
    playGlitterTick,
    playCameraGlam
  };
})();
