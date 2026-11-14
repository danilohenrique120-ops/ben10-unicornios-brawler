// Super Punch 3D - Rich Web Audio SFX & Playful Arcade Groove Synthesizer
window.PunchAudio = (() => {
  let ctx = null;
  let masterGain = null;
  let sfxGain = null;
  let musicGain = null;
  let compressor = null;
  let muted = false;
  let unlocked = false;
  let musicTimer = null;
  let musicStep = 0;
  let currentLevelRef = 1;

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();

      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -14;
      compressor.knee.value = 18;
      compressor.ratio.value = 6;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.18;

      masterGain = ctx.createGain();
      masterGain.gain.value = muted ? 0 : 0.92;

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 1.0;

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.24;

      sfxGain.connect(compressor);
      musicGain.connect(compressor);
      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);
    }

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (!unlocked) {
      try {
        const silentBuf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = silentBuf;
        src.connect(ctx.destination);
        src.start(0);
        unlocked = true;
      } catch (_) {}
    }

    if (!muted && !musicTimer) {
      startMusic(currentLevelRef);
    }

    return ctx;
  }

  function isMuted() {
    return muted;
  }

  function setMuted(nextMuted) {
    muted = Boolean(nextMuted);
    if (masterGain && ctx) {
      masterGain.gain.setTargetAtTime(muted ? 0 : 0.92, ctx.currentTime, 0.02);
    }
    if (muted) {
      stopMusic();
    } else {
      ensureContext();
      startMusic(currentLevelRef);
    }
    return muted;
  }

  function toggleMute() {
    return setMuted(!muted);
  }

  // ---- Low-level synth helpers ----
  function playTone({
    freq = 440,
    endFreq = null,
    type = 'triangle',
    duration = 0.14,
    vol = 0.2,
    delay = 0,
    targetGain = 'sfx'
  }) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;

    const start = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(20, freq), start);
    if (endFreq !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    }

    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(vol, start + Math.min(0.012, duration * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0008, start + duration);

    osc.connect(g);
    g.connect(targetGain === 'music' ? musicGain : sfxGain);

    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function playNoise({
    duration = 0.12,
    vol = 0.3,
    filterType = 'bandpass',
    filterFreq = 1100,
    q = 1.2,
    delay = 0,
    targetGain = 'sfx'
  }) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;

    const len = Math.max(1, Math.floor(c.sampleRate * duration));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.42));
    }

    const src = c.createBufferSource();
    src.buffer = buf;

    const filt = c.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.value = filterFreq;
    filt.Q.value = q;

    const start = c.currentTime + delay;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);

    src.connect(filt);
    filt.connect(g);
    g.connect(targetGain === 'music' ? musicGain : sfxGain);

    src.start(start);
    src.stop(start + duration + 0.02);
  }

  // ---- Mode Selection Sound ----
  function playModeSelect(mode) {
    if (muted) return;
    ensureContext();
    if (mode === 'gold') {
      playTone({ freq: 880, type: 'triangle', duration: 0.1, vol: 0.22 });
      playTone({ freq: 1318.5, type: 'sine', duration: 0.2, vol: 0.24, delay: 0.06 });
    } else if (mode === 'turbo') {
      playTone({ freq: 380, endFreq: 1380, type: 'sawtooth', duration: 0.15, vol: 0.14 });
    } else if (mode === 'heavy') {
      playTone({ freq: 150, endFreq: 55, type: 'square', duration: 0.18, vol: 0.22 });
      playNoise({ duration: 0.08, vol: 0.2, filterFreq: 500 });
    } else if (mode === 'gravity') {
      playTone({ freq: 520, endFreq: 960, type: 'sine', duration: 0.18, vol: 0.2 });
      playTone({ freq: 780, endFreq: 420, type: 'triangle', duration: 0.18, vol: 0.14, delay: 0.07 });
    } else if (mode === 'giant') {
      playTone({ freq: 130, endFreq: 210, type: 'triangle', duration: 0.22, vol: 0.3 });
    } else {
      playTone({ freq: 440, endFreq: 660, type: 'triangle', duration: 0.11, vol: 0.2 });
    }
  }

  // ---- Punch Launch & Spring Stretch ----
  function playPunchLaunch(mode) {
    if (muted) return;
    ensureContext();
    const isTurbo = mode === 'turbo';
    const isGiant = mode === 'giant' || mode === 'heavy';
    const isGravity = mode === 'gravity';

    // Spring coil zip
    playTone({
      freq: isGiant ? 130 : (isTurbo ? 290 : 195),
      endFreq: isTurbo ? 1280 : (isGiant ? 520 : 860),
      type: isTurbo ? 'sawtooth' : 'triangle',
      duration: isTurbo ? 0.1 : 0.16,
      vol: isTurbo ? 0.16 : 0.22
    });

    // Air swish
    playNoise({
      duration: isTurbo ? 0.09 : 0.14,
      vol: 0.2,
      filterType: 'bandpass',
      filterFreq: isTurbo ? 2000 : 1200
    });

    if (isGravity) {
      playTone({ freq: 620, endFreq: 1120, type: 'sine', duration: 0.15, vol: 0.14 });
    }
  }

  // ---- Elastic Spring Recoil ----
  function playSpringRecoil(mode) {
    if (muted) return;
    ensureContext();
    const base = mode === 'giant' ? 170 : 260;
    playTone({ freq: base * 1.5, endFreq: base, type: 'sine', duration: 0.14, vol: 0.11 });
    playTone({ freq: base, endFreq: base * 1.35, type: 'triangle', duration: 0.11, vol: 0.08, delay: 0.07 });
  }

  // ---- Ragdoll Enemy Impact ----
  function playImpact(mode, hitCount = 1) {
    if (muted) return;
    ensureContext();
    const isHeavy = mode === 'heavy' || mode === 'giant';

    // 1. Deep punch sub-thud
    playTone({
      freq: isHeavy ? 125 : 165,
      endFreq: 28,
      type: 'sine',
      duration: isHeavy ? 0.34 : 0.26,
      vol: isHeavy ? 0.78 : 0.58
    });

    // 2. Crisp leather glove snap + crunch
    playNoise({
      duration: isHeavy ? 0.18 : 0.12,
      vol: isHeavy ? 0.65 : 0.48,
      filterType: 'bandpass',
      filterFreq: isHeavy ? 820 : 1250
    });

    // 3. Cartoon knockback spring "BOING!"
    playTone({
      freq: 240,
      endFreq: 690,
      type: 'triangle',
      duration: 0.17,
      vol: 0.18,
      delay: 0.04
    });

    // 4. Mode-specific signature punch accent
    if (mode === 'gold') {
      // Boxing ring bell + coin sparkle
      playTone({ freq: 1174.66, type: 'sine', duration: 0.38, vol: 0.24 });
      playTone({ freq: 1567.98, type: 'triangle', duration: 0.32, vol: 0.16, delay: 0.05 });
    } else if (mode === 'turbo') {
      playTone({ freq: 950, endFreq: 220, type: 'sawtooth', duration: 0.14, vol: 0.18 });
    } else if (mode === 'gravity') {
      playTone({ freq: 440, endFreq: 1320, type: 'sine', duration: 0.26, vol: 0.22 });
      playTone({ freq: 880, endFreq: 330, type: 'triangle', duration: 0.24, vol: 0.16, delay: 0.05 });
    } else if (isHeavy) {
      playNoise({ duration: 0.26, vol: 0.38, filterType: 'lowpass', filterFreq: 340, delay: 0.02 });
    }

    // 5. Coin reward sparkle
    if (hitCount > 0) {
      playCoinPickup(0.11);
    }
  }

  function playPropHit() {
    if (muted) return;
    ensureContext();
    const base = 360 + Math.random() * 210;
    playTone({ freq: base, endFreq: base * 0.42, type: 'triangle', duration: 0.1, vol: 0.2 });
    playNoise({ duration: 0.08, vol: 0.18, filterFreq: 1500 });
  }

  function playRagdollBounce(strength = 1) {
    if (muted) return;
    ensureContext();
    const clamped = Math.max(0.25, Math.min(1, strength));
    playTone({
      freq: 145 * (0.9 + clamped * 0.25),
      endFreq: 55,
      type: 'sine',
      duration: 0.1,
      vol: 0.22 * clamped
    });
    playNoise({ duration: 0.05, vol: 0.12 * clamped, filterFreq: 700 });
  }

  function playCoinPickup(delay = 0) {
    if (muted) return;
    ensureContext();
    playTone({ freq: 987.77, type: 'sine', duration: 0.09, vol: 0.14, delay });
    playTone({ freq: 1318.51, type: 'triangle', duration: 0.16, vol: 0.16, delay: delay + 0.065 });
  }

  function playStageClear(level = 1) {
    if (muted) return;
    currentLevelRef = level;
    ensureContext();
    const fanfare = [523.25, 659.25, 783.99, 1046.5];
    fanfare.forEach((freq, i) => {
      playTone({
        freq,
        type: 'triangle',
        duration: i === fanfare.length - 1 ? 0.32 : 0.16,
        vol: 0.22,
        delay: i * 0.08
      });
    });
  }

  function playStageTransitionWhoosh() {
    if (muted) return;
    ensureContext();
    playTone({ freq: 260, endFreq: 580, type: 'sine', duration: 0.18, vol: 0.12 });
    playNoise({ duration: 0.18, vol: 0.1, filterType: 'bandpass', filterFreq: 950 });
  }

  // ---- Cheerful Playful Background Groove ----
  const MELODIES = [
    [523.25, 0, 659.25, 783.99, 659.25, 0, 587.33, 659.25],
    [587.33, 0, 698.46, 880.0, 783.99, 0, 659.25, 587.33],
    [659.25, 783.99, 880.0, 0, 783.99, 659.25, 587.33, 523.25]
  ];
  const BASSLINES = [
    [130.81, 0, 196.0, 0, 146.83, 0, 196.0, 0],
    [146.83, 0, 220.0, 0, 174.61, 0, 196.0, 0],
    [164.81, 0, 196.0, 0, 146.83, 0, 130.81, 0]
  ];

  function startMusic(level = 1) {
    currentLevelRef = level;
    if (muted || musicTimer) return;

    musicTimer = setInterval(() => {
      if (muted || !ctx || ctx.state !== 'running' || document.hidden) return;
      const patternIdx = Math.floor((currentLevelRef - 1) / 2) % MELODIES.length;
      const melody = MELODIES[patternIdx];
      const bass = BASSLINES[patternIdx];
      const stepIdx = musicStep % 8;

      const mNote = melody[stepIdx];
      if (mNote > 0) {
        playTone({
          freq: mNote,
          type: 'triangle',
          duration: 0.17,
          vol: 0.14,
          targetGain: 'music'
        });
      }

      const bNote = bass[stepIdx];
      if (bNote > 0) {
        playTone({
          freq: bNote,
          type: 'sine',
          duration: 0.21,
          vol: 0.24,
          targetGain: 'music'
        });
      }

      if (stepIdx % 2 === 1) {
        playNoise({
          duration: 0.035,
          vol: 0.05,
          filterType: 'highpass',
          filterFreq: 4200,
          targetGain: 'music'
        });
      }

      musicStep++;
    }, 240);
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function setLevel(level) {
    currentLevelRef = level;
  }

  // Unlock audio cleanly on any first user gesture across mobile/tablet/desktop
  function bindGlobalUnlock() {
    const unlockOnce = () => {
      ensureContext();
    };
    ['pointerdown', 'touchstart', 'mousedown', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlockOnce, { passive: true, capture: true });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) return;
      if (!muted && ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    });
  }

  bindGlobalUnlock();

  return {
    init: ensureContext,
    isMuted,
    setMuted,
    toggleMute,
    setLevel,
    playModeSelect,
    playPunchLaunch,
    playSpringRecoil,
    playImpact,
    playPropHit,
    playRagdollBounce,
    playCoinPickup,
    playStageClear,
    playStageTransitionWhoosh
  };
})();
