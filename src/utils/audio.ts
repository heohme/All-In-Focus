/**
 * Audio utility for playing sounds using Web Audio API
 */

class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private tickingGainNode: GainNode | null = null;
  private tickingOscillator: OscillatorNode | null = null;
  private tickingInterval: number | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Play ticking sound (clock tick-tock)
   */
  startTicking() {
    this.stopTicking(); // Stop any existing ticking

    const ctx = this.getAudioContext();

    // Create a subtle ticking sound every second
    this.tickingInterval = window.setInterval(() => {
      // Create oscillator for tick sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Tick sound: short high frequency beep
      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';

      // Envelope: quick attack and decay
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01); // Attack
      gainNode.gain.linearRampToValueAtTime(0, now + 0.05); // Decay

      oscillator.start(now);
      oscillator.stop(now + 0.05);
    }, 1000); // Every second
  }

  /**
   * Stop ticking sound
   */
  stopTicking() {
    if (this.tickingInterval !== null) {
      clearInterval(this.tickingInterval);
      this.tickingInterval = null;
    }

    if (this.tickingOscillator) {
      try {
        this.tickingOscillator.stop();
      } catch (e) {
        // Already stopped
      }
      this.tickingOscillator = null;
    }

    if (this.tickingGainNode) {
      this.tickingGainNode = null;
    }
  }

  /**
   * Play completion bell sound
   */
  playCompletionBell() {
    const ctx = this.getAudioContext();

    // Create a pleasant bell sound with multiple frequencies
    const now = ctx.currentTime;
    const duration = 1.5;

    // Play three notes of a major chord
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      // Envelope: attack and long decay for bell effect
      const startTime = now + index * 0.1; // Stagger slightly
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01); // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Long decay

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  }
}

export const audioPlayer = new AudioPlayer();
