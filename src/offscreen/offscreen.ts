/**
 * Offscreen document for audio playback
 * Service workers cannot use Web Audio API, so we use an offscreen document
 */

class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private tickingInterval: number | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  startTicking() {
    this.stopTicking(); // Stop any existing ticking

    const ctx = this.getAudioContext();

    // Create a subtle ticking sound every second
    this.tickingInterval = window.setInterval(() => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = 800; // Hz
      oscillator.type = 'sine';

      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.05);

      oscillator.start(now);
      oscillator.stop(now + 0.05);
    }, 1000);

    console.log('Offscreen: Started ticking');
  }

  stopTicking() {
    if (this.tickingInterval !== null) {
      clearInterval(this.tickingInterval);
      this.tickingInterval = null;
      console.log('Offscreen: Stopped ticking');
    }
  }

  playCompletionBell() {
    const ctx = this.getAudioContext();

    const now = ctx.currentTime;
    const duration = 1.5;

    // Play three notes of a major chord
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = now + index * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });

    console.log('Offscreen: Played completion bell');
  }
}

const audioPlayer = new AudioPlayer();

// Listen for messages from the service worker
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Offscreen received message:', message.type);

  switch (message.type) {
    case 'START_TICKING':
      audioPlayer.startTicking();
      sendResponse({ success: true });
      return true;

    case 'STOP_TICKING':
      audioPlayer.stopTicking();
      sendResponse({ success: true });
      return true;

    case 'PLAY_COMPLETION_BELL':
      audioPlayer.playCompletionBell();
      sendResponse({ success: true });
      return true;

    default:
      // Don't respond to messages we don't handle - let other listeners handle them
      return false;
  }
});

console.log('Offscreen audio player initialized');
