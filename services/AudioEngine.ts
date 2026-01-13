
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buzzers: Map<number, { oscillator: OscillatorNode, panner: PannerNode, gain: GainNode }> = new Map();

  constructor() {}

  public init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.value = 0.3;
  }

  public resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playSquish() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // High frequency crunch (noise)
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();

    // Low frequency thud
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    g.gain.setValueAtTime(0.8, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(now + 0.15);
  }

  public playThud() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.1);
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(now + 0.1);
  }

  public updateBuzzers(flies: any[], canvasWidth: number) {
    if (!this.ctx || !this.masterGain) return;

    // Remove old buzzers
    for (const id of Array.from(this.buzzers.keys())) {
      if (!flies.find(f => f.id === id && f.alive)) {
        const b = this.buzzers.get(id);
        if (b) {
          b.gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
          b.oscillator.stop(this.ctx.currentTime + 0.1);
          this.buzzers.delete(id);
        }
      }
    }

    // Add or update buzzers
    flies.forEach(fly => {
      if (!fly.alive) return;
      
      let b = this.buzzers.get(fly.id);
      if (!b) {
        const osc = this.ctx!.createOscillator();
        const panner = this.ctx!.createPanner();
        const gain = this.ctx!.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.value = 150 + Math.random() * 50;
        
        // High pass filter for annoying sound
        const filter = this.ctx!.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;

        gain.gain.value = 0;
        gain.gain.exponentialRampToValueAtTime(0.05, this.ctx!.currentTime + 0.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain!);
        
        osc.start();
        b = { oscillator: osc, panner, gain };
        this.buzzers.set(fly.id, b);
      }

      // Update position (spatial audio)
      const panX = (fly.x / canvasWidth) * 2 - 1; // -1 to 1
      b.panner.positionX.setTargetAtTime(panX, this.ctx!.currentTime, 0.1);
      
      // Slight frequency jitter for realism
      b.oscillator.frequency.setTargetAtTime(150 + Math.sin(Date.now() * 0.01) * 20, this.ctx!.currentTime, 0.1);
    });
  }

  public stopAllBuzzers() {
    this.buzzers.forEach(b => {
      b.gain.gain.value = 0;
      b.oscillator.stop();
    });
    this.buzzers.clear();
  }
}

export const audioEngine = new AudioEngine();
