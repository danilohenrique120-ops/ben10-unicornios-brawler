// Salão de Manicure Kids - Sintetizador de Sons Realistas por Ferramenta (Web Audio API)
window.ManicureAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let enabled = true;
  let unlocked = false;
  let lastMoveSoundTime = 0;

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
      masterGain.gain.setTargetAtTime(enabled ? 0.9 : 0, ctx.currentTime, 0.02);
    }
    if (enabled) ensureContext();
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  function noiseBurst({ duration = 0.08, freq = 1400, q = 1.4, vol = 0.2, type = 'bandpass' }) {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const len = Math.max(1, Math.floor(c.sampleRate * duration));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const env = Math.sin((i / len) * Math.PI);
      ch[i] = (Math.random() * 2 - 1) * env;
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
    g.gain.exponentialRampToValueAtTime(0.004, now + duration);

    src.connect(filt);
    filt.connect(g);
    g.connect(masterGain);
    src.start(now);
  }

  function canPlayContinuous(intervalMs = 85) {
    const now = performance.now();
    if (now - lastMoveSoundTime < intervalMs) return false;
    lastMoveSoundTime = now;
    return true;
  }

  function playUiSelect() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.07);
    g.gain.setValueAtTime(0.16, now);
    g.gain.exponentialRampToValueAtTime(0.003, now + 0.08);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  // Cortador de unha metálico ("TLIC!")
  function playClipperSnip() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;

    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1650, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.045);
    g.gain.setValueAtTime(0.36, now);
    g.gain.exponentialRampToValueAtTime(0.003, now + 0.055);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.06);

    noiseBurst({ duration: 0.035, freq: 3200, q: 2.2, vol: 0.28, type: 'highpass' });
  }

  // Lixa ("shhh-shhh" suave)
  function playFileScrape() {
    if (!canPlayContinuous(90)) return;
    noiseBurst({ duration: 0.08, freq: 2400 + Math.random() * 450, q: 1.8, vol: 0.14 });
  }

  // Espuma / Esponja
  function playSoapScrub() {
    if (!canPlayContinuous(100)) return;
    noiseBurst({ duration: 0.09, freq: 1100 + Math.random() * 400, q: 1.0, vol: 0.13 });
    if (enabled && Math.random() > 0.45) {
      const c = ensureContext();
      if (!c) return;
      const now = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520 + Math.random() * 300, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + 0.05);
      g.gain.setValueAtTime(0.08, now);
      g.gain.exponentialRampToValueAtTime(0.003, now + 0.055);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  }

  // Creme / Hidratante / Espátula macia
  function playCreamMassage() {
    if (!canPlayContinuous(110)) return;
    noiseBurst({ duration: 0.08, freq: 680, q: 0.9, vol: 0.11, type: 'lowpass' });
  }

  // Pincel de esmalte sedoso
  function playBrushStroke() {
    if (!canPlayContinuous(95)) return;
    noiseBurst({ duration: 0.075, freq: 1750, q: 1.2, vol: 0.09 });
  }

  // Algodão removedor
  function playCottonWipe() {
    if (!canPlayContinuous(100)) return;
    noiseBurst({ duration: 0.085, freq: 950, q: 1.0, vol: 0.12 });
  }

  // Glitter mágico
  function playGlitterSparkle() {
    if (!canPlayContinuous(115)) return;
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    const f = 1100 + Math.random() * 700;
    osc.frequency.setValueAtTime(f, now);
    osc.frequency.exponentialRampToValueAtTime(f * 1.35, now + 0.09);
    g.gain.setValueAtTime(0.09, now);
    g.gain.exponentialRampToValueAtTime(0.002, now + 0.1);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  // Colar pedrinha / adesivo ("plim!")
  function playStickerPlace() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    const now = c.currentTime;
    [987.77, 1479.98].forEach((freq, i) => {
      const t = now + i * 0.045;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.003, t + 0.16);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }

  // Secador de unhas (brisa leve)
  function playDryerBreeze() {
    if (!canPlayContinuous(115)) return;
    noiseBurst({ duration: 0.12, freq: 540, q: 0.8, vol: 0.14, type: 'bandpass' });
  }

  // Foto do salão / Conclusão
  function playCameraFlash() {
    if (!enabled) return;
    const c = ensureContext();
    if (!c) return;
    noiseBurst({ duration: 0.06, freq: 2600, q: 1.5, vol: 0.3, type: 'highpass' });
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const t = c.currentTime + 0.08 + i * 0.075;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.003, t + 0.25);
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
    playUiSelect,
    playClipperSnip,
    playFileScrape,
    playSoapScrub,
    playCreamMassage,
    playBrushStroke,
    playCottonWipe,
    playGlitterSparkle,
    playStickerPlace,
    playDryerBreeze,
    playCameraFlash
  };
})();
