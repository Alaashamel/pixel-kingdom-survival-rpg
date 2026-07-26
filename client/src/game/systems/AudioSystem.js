export default class AudioSystem {
  constructor(scene) {
    this.scene = scene;
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.isMuted = false;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.5;
    this.musicOscillators = [];
    this.isMusicPlaying = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 1;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch {
      // Audio not supported
    }
  }

  resume() {
    if (!this.ctx) return Promise.resolve();
    if (this.ctx.state === "suspended") {
      return this.ctx.resume().catch(() => {});
    }
    return Promise.resolve();
  }

  playAttack() {
    if (!this.ctx || this.isMuted) return;
    this.resume().then(() => this._playSound("sawtooth", 800, 200, 0.15, 0.3));
  }

  playHit() {
    if (!this.ctx || this.isMuted) return;
    this.resume().then(() => this._playSound("square", 300, 80, 0.12, 0.25));
  }

  playDamage() {
    if (!this.ctx || this.isMuted) return;
    this.resume().then(() => this._playSound("sawtooth", 150, 50, 0.2, 0.2));
  }

  playPickup() {
    if (!this.ctx || this.isMuted) return;
    this.resume().then(() => {
      const notes = [523, 659, 784];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        const start = this.ctx.currentTime + i * 0.08;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.15);
      });
    });
  }

  playLevelUp() {
    if (!this.ctx || this.isMuted) return;
    this.resume().then(() => {
      const notes = [392, 494, 587, 784, 988];
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        const start = this.ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    });
  }

  playDeath() {
    if (!this.ctx || this.isMuted) return;
    this.resume().then(() => this._playSound("sawtooth", 400, 30, 0.8, 0.3));
  }

  playUIClick() {
    if (!this.ctx || this.isMuted) return;
    this.resume().then(() => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = 600;

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + 0.05);
    });
  }

  playCriticalHit() {
    if (!this.ctx || this.isMuted) return;
    this.resume().then(() => {
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(1200, now);
      osc1.frequency.exponentialRampToValueAtTime(100, now + 0.2);

      osc2.type = "square";
      osc2.frequency.setValueAtTime(600, now);
      osc2.frequency.exponentialRampToValueAtTime(50, now + 0.2);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
    });
  }

  _playSound(type, freqStart, freqEnd, duration, volume) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  startMusic() {
    if (!this.ctx || this.isMuted || this.isMusicPlaying) return;
    this.resume().then(() => {
      this.isMusicPlaying = true;
      this.playMusicLoop();
    });
  }

  playMusicLoop() {
    if (!this.isMusicPlaying || !this.ctx) return;

    const tempo = 140;
    const beatDuration = 60 / tempo;
    const barDuration = beatDuration * 4;

    const bassNotes = [130, 147, 165, 147];
    const melodyNotes = [523, 587, 659, 784, 659, 587, 523, 494];

    bassNotes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "triangle";
      osc.frequency.value = freq;

      const startTime = this.ctx.currentTime + i * beatDuration;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.05);
      gain.gain.setValueAtTime(0.12, startTime + beatDuration * 0.7);
      gain.gain.linearRampToValueAtTime(0, startTime + beatDuration * 0.95);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(startTime);
      osc.stop(startTime + beatDuration);
      this.musicOscillators.push(osc);
    });

    melodyNotes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      const startTime = this.ctx.currentTime + i * (beatDuration * 0.5);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.03);
      gain.gain.setValueAtTime(0.08, startTime + beatDuration * 0.3);
      gain.gain.linearRampToValueAtTime(0, startTime + beatDuration * 0.45);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(startTime);
      osc.stop(startTime + beatDuration * 0.5);
      this.musicOscillators.push(osc);
    });

    this.musicTimer = setTimeout(() => {
      this.musicOscillators = [];
      if (this.isMusicPlaying) {
        this.playMusicLoop();
      }
    }, barDuration * 1000);
  }

  stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    this.musicOscillators.forEach((osc) => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    this.musicOscillators = [];
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
    }
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.resume().then(() => this.startMusic());
    }
    return this.isMuted;
  }

  setMusicVolume(vol) {
    this.musicVolume = vol;
    if (this.musicGain) {
      this.musicGain.gain.value = vol;
    }
  }

  setSFXVolume(vol) {
    this.sfxVolume = vol;
    if (this.sfxGain) {
      this.sfxGain.gain.value = vol;
    }
  }

  destroy() {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
    }
  }
}
