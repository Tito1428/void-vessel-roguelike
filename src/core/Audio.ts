/**
 * Procedural Web Audio API Sound and Music Synthesizer
 * Zero external audio files required, runs 100% locally with zero latency.
 */
export class SoundManager {
  private static instance: SoundManager;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private ambientInterval: number | null = null;

  private constructor() {}

  public static get(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.65, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.startAmbientMusic();
  }

  public resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ---- PROCEDURAL SFX ----

  /**
   * Arcane Magic Cast SFX (plasma / mana discharge with crystalline chime)
   */
  public playShoot(pitchMod = 1.0) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    // Core spell pulse
    const osc = this.ctx.createOscillator();
    const oscHarmonic = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(680 * pitchMod, t);
    osc.frequency.exponentialRampToValueAtTime(180 * pitchMod, t + 0.14);

    oscHarmonic.type = 'sine';
    oscHarmonic.frequency.setValueAtTime(1360 * pitchMod, t);
    oscHarmonic.frequency.exponentialRampToValueAtTime(360 * pitchMod, t + 0.12);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.14);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    oscHarmonic.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    oscHarmonic.start(t);
    osc.stop(t + 0.15);
    oscHarmonic.stop(t + 0.15);
  }

  /**
   * Squishy hit sound when a tear hits an enemy
   */
  public playEnemyHit() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const noise = this.createNoiseBuffer(0.08);
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.Q.setValueAtTime(3, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

    noiseSource.connect(filter);
    filter.connect(gain);
    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    noiseSource.start(t);
    osc.stop(t + 0.09);
    noiseSource.stop(t + 0.09);
  }

  /**
   * Meaty monster death explosion
   */
  public playEnemyKill() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Sub bass punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.3);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    // Crunch noise
    const noise = this.createNoiseBuffer(0.25);
    const nSource = this.ctx.createBufferSource();
    nSource.buffer = noise;
    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.setValueAtTime(600, t);
    nFilter.frequency.exponentialRampToValueAtTime(100, t + 0.25);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.35, t);
    nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    nSource.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.sfxGain);

    osc.start(t);
    nSource.start(t);
    osc.stop(t + 0.32);
    nSource.stop(t + 0.32);
  }

  /**
   * Player hurt crunch
   */
  public playPlayerHurt() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(160, t);
    osc2.frequency.setValueAtTime(115, t);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(30, t + 0.25);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.26);
    osc2.stop(t + 0.26);
  }

  /**
   * Coin pickup chime
   */
  public playCoin() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [987.77, 1318.51]; // B5 -> E6
    notes.forEach((freq, idx) => {
      const start = t + idx * 0.06;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(start);
      osc.stop(start + 0.16);
    });
  }

  /**
   * Heart heal sound
   */
  public playHeart() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [329.63, 392.00, 523.25, 659.25]; // E4, G4, C5, E5
    notes.forEach((freq, idx) => {
      const start = t + idx * 0.07;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /**
   * Heavy iron doors slamming shut
   */
  public playDoorLock() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  /**
   * Room cleared / doors opening
   */
  public playDoorOpen() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C major
    notes.forEach((freq, idx) => {
      const start = t + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(start);
      osc.stop(start + 0.36);
    });
  }

  /**
   * Triumphant Item Pickup Jingle
   */
  public playItemJingle() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const fanfare = [
      { f: 440.00, d: 0.1 }, // A4
      { f: 554.37, d: 0.1 }, // C#5
      { f: 659.25, d: 0.1 }, // E5
      { f: 880.00, d: 0.35 } // A5
    ];
    let timeAcc = t;
    fanfare.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, timeAcc);
      gain.gain.setValueAtTime(0.25, timeAcc);
      gain.gain.exponentialRampToValueAtTime(0.001, timeAcc + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(timeAcc);
      osc.stop(timeAcc + n.d + 0.05);
      timeAcc += n.d * 0.85;
    });
  }

  /**
   * Boss Roar / Earthquake
   */
  public playBossRoar() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(75, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 1.2);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(16, t);
    lfoGain.gain.setValueAtTime(25, t);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(this.sfxGain);

    lfo.start(t);
    osc.start(t);
    lfo.stop(t + 1.25);
    osc.stop(t + 1.25);
  }

  /**
   * Dash whoosh
   */
  public playDash() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const noise = this.createNoiseBuffer(0.18);
    const source = this.ctx.createBufferSource();
    source.buffer = noise;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.08);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.18);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    source.start(t);
    source.stop(t + 0.19);
  }

  // ---- PROCEDURAL AMBIENT MUSIC ENGINE ----

  public startAmbientMusic() {
    if (this.isMusicPlaying || !this.ctx || !this.musicGain) return;
    this.isMusicPlaying = true;

    // A dark ambient chord progression: D minor -> Bb maj7 -> G minor -> A sus4
    const chords = [
      [73.42, 110.00, 146.83, 174.61], // D2, A2, D3, F3
      [58.27, 116.54, 146.83, 174.61], // Bb1, Bb2, D3, F3
      [49.00, 98.00, 146.83, 174.61],  // G1, G2, D3, F3
      [55.00, 110.00, 164.81, 220.00]  // A1, A2, E3, A3
    ];

    let chordIndex = 0;

    const playChord = () => {
      if (!this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      const currentChord = chords[chordIndex % chords.length];
      chordIndex++;

      currentChord.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const filter = this.ctx!.createBiquadFilter();

        osc.type = idx === 0 ? 'sine' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320 + idx * 40, t);
        filter.frequency.exponentialRampToValueAtTime(160, t + 5.0);

        // Slow evolving envelope
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), t + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 5.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain!);

        osc.start(t);
        osc.stop(t + 6.0);
      });
    };

    playChord();
    this.ambientInterval = window.setInterval(playChord, 5200);
  }

  public stopAmbientMusic() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    this.isMusicPlaying = false;
  }

  private createNoiseBuffer(duration: number): AudioBuffer {
    const sampleRate = this.ctx!.sampleRate;
    const bufferSize = sampleRate * duration;
    const buffer = this.ctx!.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}
