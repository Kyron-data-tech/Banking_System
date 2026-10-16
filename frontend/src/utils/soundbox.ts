/**
 * KyroPay Merchant & Consumer Soundbox Audio Synthesizer
 * Plays high-fidelity audio confirmation alert when payment is received.
 */
export function playKyroPaySoundbox(amount: number, language: 'hi' | 'en' = 'hi') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }

  try {
    // 1. Play high chime tone first
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.12); // C6
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    }
  } catch (e) {
    // Audio tone fallback
  }

  // 2. Play Web Speech Voice announcement
  setTimeout(() => {
    try {
      window.speechSynthesis.cancel(); // Clear any pending speech
      const text =
        language === 'hi'
          ? `काएरो पे पर ${amount} रुपये प्राप्त हुए. Received ${amount} rupees on KyroPay.`
          : `Received ${amount} rupees on KyroPay.`;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(
        (v) =>
          v.lang.includes('hi') ||
          v.lang.includes('en-IN') ||
          v.name.includes('India') ||
          v.name.includes('Hindi')
      );
      if (indianVoice) {
        utterance.voice = indianVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Soundbox speech synthesis not available', e);
    }
  }, 350);
}
