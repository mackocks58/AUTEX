export function triggerErrorFeedback() {
  // 1. Vibrate device if supported
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    // Vibrate 3 quick times: on, off, on, off, on
    navigator.vibrate([50, 50, 50, 50, 50]);
  }

  // 2. Play short error beep using Web Audio API
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    console.warn("Audio playback failed", e);
  }
}
