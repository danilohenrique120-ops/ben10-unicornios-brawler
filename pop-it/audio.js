// Pop It 3D - Sistema de Áudio Web Audio API (com desbloqueio completo Mobile/Tablet/Desktop + WAV Fallback)
window.PopItAudio = (() => {
  class SoundSystem {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.enabled = true;
      this.unlocked = false;
      this.wavCache = {};
      this.audioPool = {};
      this.buildWavFallbacks();
    }

    createWavUrl(samples, sampleRate = 22050) {
      const buffer = new ArrayBuffer(44 + samples.length * 2);
      const view = new DataView(buffer);
      const writeString = (offset, str) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
      };
      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples.length * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, samples.length * 2, true);
      for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
      const blob = new Blob([buffer], { type: 'audio/wav' });
      return URL.createObjectURL(blob);
    }

    buildWavFallbacks() {
      try {
        const sr = 22050;
        // 1. Silent 20ms WAV to unlock iOS/iPadOS Media Audio Channel
        this.wavCache.silent = this.createWavUrl(new Float32Array(Math.floor(sr * 0.02)), sr);

        // 2. Pop WAV
        const popLen = Math.floor(sr * 0.12);
        const popSamples = new Float32Array(popLen);
        let phase = 0;
        for (let i = 0; i < popLen; i++) {
          const t = i / popLen;
          const freq = 380 * Math.pow(0.26, t) + (i < popLen * 0.28 ? 680 * (1 - t * 3.2) : 0);
          phase += (2 * Math.PI * freq) / sr;
          const env = Math.pow(1 - t, 1.8);
          popSamples[i] = Math.sin(phase) * env * 0.85;
        }
        this.wavCache.pop = this.createWavUrl(popSamples, sr);

        // 3. Snap WAV
        const snapLen = Math.floor(sr * 0.14);
        const snapSamples = new Float32Array(snapLen);
        phase = 0;
        for (let i = 0; i < snapLen; i++) {
          const t = i / snapLen;
          const freq = 260 + 640 * t;
          phase += (2 * Math.PI * freq) / sr;
          const env = Math.pow(1 - t, 1.4);
          snapSamples[i] = Math.sin(phase) * env * 0.8;
        }
        this.wavCache.snap = this.createWavUrl(snapSamples, sr);

        // 4. Pickup WAV
        const pickLen = Math.floor(sr * 0.09);
        const pickSamples = new Float32Array(pickLen);
        phase = 0;
        for (let i = 0; i < pickLen; i++) {
          const t = i / pickLen;
          const freq = 340 + 260 * t;
          phase += (2 * Math.PI * freq) / sr;
          const env = 1 - t;
          pickSamples[i] = Math.sin(phase) * env * 0.65;
        }
        this.wavCache.pickup = this.createWavUrl(pickSamples, sr);

        Object.keys(this.wavCache).forEach(k => {
          const el = new Audio(this.wavCache[k]);
          el.preload = 'auto';
          el.playsInline = true;
          this.audioPool[k] = el;
        });
      } catch (e) {
        console.warn('Erro ao criar cache WAV:', e);
      }
    }

    playFallbackWav(type, playbackRate = 1.0) {
      if (!this.enabled) return;
      try {
        const url = this.wavCache[type];
        if (!url) return;
        const audio = new Audio(url);
        audio.volume = 0.85;
        audio.playbackRate = playbackRate;
        audio.play().catch(() => {});
      } catch (_) {}
    }

    init() {
      try {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) {
            this.ctx = new AudioCtx();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.enabled ? 0.95 : 0;
            this.masterGain.connect(this.ctx.destination);
          }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (!this.unlocked) {
          if (this.ctx) {
            const buffer = this.ctx.createBuffer(1, 1, 22050);
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.ctx.destination);
            if (source.start) source.start(0);
          }
          // Unlock iOS/iPadOS media session so Web Audio is audible even if ringer switch is muted
          if (this.audioPool.silent) {
            this.audioPool.silent.volume = 0.01;
            this.audioPool.silent.play().catch(() => {});
          }
          this.unlocked = true;
        }
      } catch (_) {}
    }

    setEnabled(nextEnabled) {
      this.enabled = Boolean(nextEnabled);
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setValueAtTime(this.enabled ? 0.95 : 0, this.ctx.currentTime);
      }
      if (this.enabled) {
        this.init();
      }
      return this.enabled;
    }

    runSynth(callback, fallbackType = null, rate = 1.0) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) {
        if (fallbackType) this.playFallbackWav(fallbackType, rate);
        return;
      }
      const dest = this.masterGain || this.ctx.destination;
      if (this.ctx.state === 'running') {
        callback(this.ctx, dest);
      } else {
        this.ctx.resume().then(() => {
          if (this.enabled && this.ctx && this.ctx.state === 'running') {
            callback(this.ctx, dest);
          } else if (fallbackType) {
            this.playFallbackWav(fallbackType, rate);
          }
        }).catch(() => {
          if (fallbackType) this.playFallbackWav(fallbackType, rate);
        });
      }
    }

    playPickup() {
      this.runSynth((ctx, dest) => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.linearRampToValueAtTime(590, now + 0.085);

        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.002, now + 0.09);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.095);
      }, 'pickup', 1.0);
    }

    playSnap() {
      this.runSynth((ctx, dest) => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(840, now + 0.12);

        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.002, now + 0.13);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.14);

        const ding = ctx.createOscillator();
        const dGain = ctx.createGain();
        ding.type = 'sine';
        ding.frequency.setValueAtTime(1046.5, now + 0.04);
        dGain.gain.setValueAtTime(0.22, now + 0.04);
        dGain.gain.exponentialRampToValueAtTime(0.002, now + 0.22);
        ding.connect(dGain);
        dGain.connect(dest);
        ding.start(now + 0.04);
        ding.stop(now + 0.23);
      }, 'snap', 1.0);
    }

    // Som realista ASMR de bolinha de silicone ("Plop / Pop!")
    playPop(variation = 0, flipped = false) {
      const rate = 0.92 + (variation % 8) * 0.04;
      this.runSynth((ctx, dest) => {
        const now = ctx.currentTime;

        // 1. Corpo oco de silicone (pitch bend rápido)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';

        const pitchOffset = (variation % 8) * 28 + (flipped ? 45 : 0);
        const startFreq = 320 + pitchOffset + Math.random() * 18;
        const endFreq = 92 + Math.random() * 14;

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.095);

        gain.gain.setValueAtTime(0.75, now);
        gain.gain.exponentialRampToValueAtTime(0.002, now + 0.105);

        // 2. Estalo seco da membrana virando
        const snapOsc = ctx.createOscillator();
        const snapGain = ctx.createGain();
        snapOsc.type = 'triangle';
        snapOsc.frequency.setValueAtTime(960 + Math.random() * 160, now);
        snapOsc.frequency.exponentialRampToValueAtTime(210, now + 0.045);

        snapGain.gain.setValueAtTime(0.48, now);
        snapGain.gain.exponentialRampToValueAtTime(0.002, now + 0.05);

        osc.connect(gain);
        gain.connect(dest);
        snapOsc.connect(snapGain);
        snapGain.connect(dest);

        osc.start(now);
        osc.stop(now + 0.11);
        snapOsc.start(now);
        snapOsc.stop(now + 0.055);
      }, 'pop', rate);
    }

    playWin(isPuzzleComplete = false) {
      this.runSynth((ctx, dest) => {
        const notes = isPuzzleComplete
          ? [440, 554.37, 659.25, 880]
          : [523.25, 659.25, 783.99, 1046.5, 1318.51];
        notes.forEach((freq, idx) => {
          const now = ctx.currentTime + idx * 0.085;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.002, now + 0.34);

          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.35);
        });
      }, 'snap', 1.15);
    }

    playWhoosh() {
      this.runSynth((ctx, dest) => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(185, now);
        osc.frequency.linearRampToValueAtTime(430, now + 0.14);
        osc.frequency.linearRampToValueAtTime(165, now + 0.28);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.42, now + 0.13);
        gain.gain.linearRampToValueAtTime(0.002, now + 0.29);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 0.3);
      }, 'pickup', 0.85);
    }
  }

  const instance = new SoundSystem();

  ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'click', 'keydown'].forEach(evt => {
    window.addEventListener(evt, () => instance.init(), { passive: true, capture: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && instance.enabled && instance.ctx && instance.ctx.state === 'suspended') {
      instance.ctx.resume().catch(() => {});
    }
  });

  return instance;
})();
