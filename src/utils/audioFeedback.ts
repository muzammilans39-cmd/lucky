// High-clarity audible tones for senior and low-vision accessibility
// Generated purely via Web Audio API with hearing-impairment volume booster

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private boostEnabled: boolean = false;
  private boostLevel: number = 100; // 100% to 250%
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private sirenInterval: any = null;

  constructor() {
    // AudioContext and booster initialized on first user gesture
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('assistai_volume_boost_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed.enabled === 'boolean') this.boostEnabled = parsed.enabled;
          if (typeof parsed.level === 'number') this.boostLevel = parsed.level;
        }
      } catch {}
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Dynamics Compressor prevents clipping distortion when boosting volume
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

        this.masterGain = this.ctx.createGain();
        this.updateMasterGain();

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private updateMasterGain() {
    if (!this.masterGain || !this.ctx) return;
    const factor = this.boostEnabled ? Math.max(1.0, this.boostLevel / 100) : 1.0;
    this.masterGain.gain.setValueAtTime(factor, this.ctx.currentTime);
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Volume Booster controls for users with hearing impairments
  public setVolumeBoost(level: number, enabled: boolean) {
    this.boostLevel = Math.max(100, Math.min(250, level));
    this.boostEnabled = enabled;
    this.updateMasterGain();
  }

  public getVolumeBoost(): { level: number; enabled: boolean } {
    return {
      level: this.boostLevel,
      enabled: this.boostEnabled,
    };
  }

  private connectToOutput(node: AudioNode) {
    if (this.compressor) {
      node.connect(this.compressor);
    } else if (this.masterGain) {
      node.connect(this.masterGain);
    } else if (this.ctx) {
      node.connect(this.ctx.destination);
    }
  }

  // Soft tactile click for button presses
  public playTap() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.06);

      const baseGain = 0.2;
      gain.gain.setValueAtTime(baseGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      this.connectToOutput(gain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch {
      // Ignore audio context autoplay warnings
    }
  }

  // Pleasant rising chime for successfully completed tasks, saved reminders, etc.
  public playSuccess() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.1);

        const baseGain = 0.24;
        gain.gain.setValueAtTime(baseGain, this.ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.1 + 0.25);

        osc.connect(gain);
        this.connectToOutput(gain);
        osc.start(this.ctx.currentTime + idx * 0.1);
        osc.stop(this.ctx.currentTime + idx * 0.1 + 0.25);
      });
    } catch {
      // Ignore
    }
  }

  // High distinct tone when Voice Assistant starts listening
  public playMicStart() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.15);

      const baseGain = 0.25;
      gain.gain.setValueAtTime(baseGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      this.connectToOutput(gain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }

  // Descending tone when Voice Assistant stops listening
  public playMicStop() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.15);

      const baseGain = 0.2;
      gain.gain.setValueAtTime(baseGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      osc.connect(gain);
      this.connectToOutput(gain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Ignore
    }
  }

  // Loud, clear pulsating alarm sound
  public playAlarmBeep() {
    if (!this.soundEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now + i * 0.2);

        const baseGain = 0.35;
        gain.gain.setValueAtTime(baseGain, now + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.2 + 0.12);

        osc.connect(gain);
        this.connectToOutput(gain);
        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.12);
      }
    } catch {
      // Ignore
    }
  }

  // Dual-tone high-visibility Emergency Siren
  public startEmergencySiren() {
    this.stopEmergencySiren();
    this.playSingleSirenCycle();
    this.sirenInterval = setInterval(() => {
      this.playSingleSirenCycle();
    }, 1200);
  }

  private playSingleSirenCycle() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      // Low to High to Low European ambulance / emergency siren sweep
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.linearRampToValueAtTime(1050, now + 0.5);
      osc.frequency.linearRampToValueAtTime(650, now + 1.1);

      const baseGain = 0.45;
      gain.gain.setValueAtTime(baseGain, now);
      gain.gain.setValueAtTime(baseGain, now + 1.0);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.15);

      osc.connect(gain);
      this.connectToOutput(gain);
      osc.start(now);
      osc.stop(now + 1.15);
    } catch {
      // Ignore
    }
  }

  public stopEmergencySiren() {
    if (this.sirenInterval) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
  }
}

export const sound = new SoundSynthesizer();
