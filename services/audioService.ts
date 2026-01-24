
class AudioService {
  private ctx: AudioContext | null = null;
  private bgmAudio: HTMLAudioElement | null = null;
  private isBgmPlaying: boolean = false;

  constructor() {
    // Using a reliable source for a festive background track
    this.bgmAudio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'); 
    if (this.bgmAudio) {
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = 0.4;
    }
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  public toggleBgm(): boolean {
    if (!this.bgmAudio) return false;
    
    // Resume context if suspended (browser policy)
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isBgmPlaying) {
      this.bgmAudio.pause();
      this.isBgmPlaying = false;
    } else {
      this.bgmAudio.play().catch(e => console.error("BGM autoplay prevented:", e));
      this.isBgmPlaying = true;
    }
    return this.isBgmPlaying;
  }

  public startBgmIfNotPlaying() {
    if (!this.bgmAudio || this.isBgmPlaying) return;
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    
    this.bgmAudio.play().then(() => {
        this.isBgmPlaying = true;
    }).catch(e => {
        // Autoplay policy might block this until interaction
        console.log("Waiting for interaction to play BGM");
    });
  }

  // Generate a scrolling "tick" sound
  public playTick() {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Sharp Mechanical Click Sound
    // Uses a triangle wave rapidly sweeping up in pitch to simulate a ratchet click
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t); // Start low for "body"
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.02); // Rapid sweep up

    // Short, percussive envelope
    gain.gain.setValueAtTime(0.3, t); // Loud attack
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05); // Fast decay

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Generate a "tada" celebratory sound
  public playWin() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'triangle') => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Major Chord arpeggio
    playTone(523.25, now, 0.4); // C5
    playTone(659.25, now + 0.1, 0.4); // E5
    playTone(783.99, now + 0.2, 0.4); // G5
    playTone(1046.50, now + 0.3, 1.0, 'sine'); // C6
    
    // Confetti sound effect simulation (noise burst)
    // Simple implementation using multiple random oscillators if noise buffer is complex
    for(let i=0; i<5; i++) {
        playTone(200 + Math.random()*1000, now, 0.3, 'sawtooth');
    }
  }
}

export const audioService = new AudioService();
