// 16-Bit Arcade Sound & Music Synthesizer (Web Audio API)
class ArcadeAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.step = 0;
    this.currentStageTheme = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopMusic();
    } else {
      this.startMusic(this.currentStageTheme);
    }
    return this.muted;
  }

  playTone(freq, type, duration, vol = 0.16, slideTo = null) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playNoise(duration = 0.1, vol = 0.18) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  sfxPunch() {
    this.playTone(190, 'square', 0.09, 0.2, 65);
    this.playNoise(0.07, 0.16);
  }

  sfxHornCharge() {
    this.playTone(360, 'sawtooth', 0.18, 0.18, 880);
    setTimeout(() => this.playTone(620, 'triangle', 0.15, 0.16, 1120), 60);
  }

  sfxJump() {
    this.playTone(240, 'square', 0.16, 0.14, 580);
  }

  sfxSpecial(type) {
    if (type === 'fire') {
      this.playNoise(0.28, 0.25);
      this.playTone(320, 'sawtooth', 0.28, 0.18, 90);
    } else if (type === 'smash') {
      this.playNoise(0.35, 0.3);
      this.playTone(130, 'square', 0.35, 0.25, 35);
    } else if (type === 'speed') {
      this.playTone(440, 'sawtooth', 0.2, 0.18, 1300);
    } else if (type === 'crystal') {
      this.playTone(780, 'triangle', 0.12, 0.2, 1260);
      setTimeout(() => this.playTone(1040, 'sine', 0.16, 0.18, 1560), 65);
    } else {
      // Magic Unicorn Horn Special
      const notes = [523, 659, 784, 1046];
      notes.forEach((n, idx) => {
        setTimeout(() => this.playTone(n, 'triangle', 0.14, 0.16, n * 1.15), idx * 45);
      });
    }
  }

  sfxTransform() {
    // Classic Omnitrix / Power-up charge chime
    const seq = [330, 440, 554, 659, 880, 1174];
    seq.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.11, 0.18), i * 55);
    });
  }

  sfxPickup() {
    this.playTone(587, 'triangle', 0.1, 0.18);
    setTimeout(() => this.playTone(880, 'triangle', 0.18, 0.2), 85);
  }

  sfxEnemyDefeat() {
    this.playTone(300, 'sawtooth', 0.18, 0.15, 75);
  }

  sfxVictory() {
    const fanfare = [523, 659, 784, 1046, 784, 1046];
    const delays = [0, 130, 260, 390, 560, 700];
    fanfare.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 'square', 0.2, 0.2), delays[i]);
    });
  }

  startMusic(stageIndex = 0) {
    this.currentStageTheme = stageIndex;
    this.stopMusic();
    if (this.muted) return;

    const scales = [
      [261, 329, 392, 440, 392, 329, 293, 349], // City upbeat
      [293, 349, 440, 523, 440, 349, 329, 392], // Forest adventure
      [329, 392, 493, 587, 493, 392, 349, 440], // Snow crystal
      [220, 261, 329, 349, 329, 261, 246, 293], // Volcano intense
      [261, 329, 440, 523, 587, 523, 440, 392], // Bridge heroic
      [349, 440, 523, 659, 587, 523, 440, 523]  // Cosmic castle
    ];
    const melody = scales[stageIndex % scales.length];

    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const note = melody[this.step % melody.length];
      this.playTone(note * 0.5, 'triangle', 0.16, 0.045);
      if (this.step % 2 === 0) {
        this.playTone(note, 'square', 0.11, 0.03);
      }
      this.step++;
    }, 220);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

window.arcadeAudio = new ArcadeAudio();
