class FeedbackEngine {
  private static audioCtx: AudioContext | null = null;

  static init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // A subtle "tick" for sliders and 1-9 hedonic selection
  static tick() {
    if (navigator.vibrate) navigator.vibrate(10);
    this.playTone(600, 'sine', 0.05);
  }

  // A deep "thud" for confirming an evaluation
  static confirm() {
    if (navigator.vibrate) navigator.vibrate([30, 50, 40]);
    this.playTone(400, 'triangle', 0.1);
    setTimeout(() => this.playTone(600, 'triangle', 0.15), 100);
  }

  // A sharp "buzz" for off-flavor detection or error
  static error() {
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    this.playTone(150, 'sawtooth', 0.2);
  }

  private static playTone(freq: number, type: OscillatorType, duration: number) {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, this.audioCtx.currentTime); // Volume
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }
}

export default FeedbackEngine;
