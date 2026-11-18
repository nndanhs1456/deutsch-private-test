// Utility for German Text-to-Speech (de-DE) & Audio Synthesis fallback

class GermanSpeechEngine {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeakingState = false;
  private currentAudioCtx: AudioContext | null = null;
  private fallbackTimer: number | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getGermanVoices(): SpeechSynthesisVoice[] {
    if (!this.voices.length && this.synth) {
      this.voices = this.synth.getVoices();
    }
    return this.voices.filter(
      (v) => v.lang.toLowerCase().startsWith('de') || v.name.toLowerCase().includes('german') || v.name.toLowerCase().includes('deutsch')
    );
  }

  public speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onBoundary?: (charIndex: number) => void;
    }
  ) {
    this.stop();

    const cleanText = text.replace(/[*_~`]/g, '').trim();
    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    const rate = options?.rate ?? 0.95;
    const pitch = options?.pitch ?? 1.0;

    if (this.synth) {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'de-DE';
        utterance.rate = rate;
        utterance.pitch = pitch;

        const deVoices = this.getGermanVoices();
        if (deVoices.length > 0) {
          const preferred =
            deVoices.find((v) => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Anna') || v.name.includes('Helena')) ||
            deVoices[0];
          utterance.voice = preferred;
        }

        let started = false;

        utterance.onstart = () => {
          started = true;
          this.isSpeakingState = true;
          options?.onStart?.();
        };

        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            options?.onBoundary?.(event.charIndex);
          }
        };

        utterance.onend = () => {
          this.isSpeakingState = false;
          if (this.fallbackTimer) {
            window.clearTimeout(this.fallbackTimer);
            this.fallbackTimer = null;
          }
          options?.onEnd?.();
        };

        utterance.onerror = () => {
          this.isSpeakingState = false;
          options?.onEnd?.();
        };

        this.synth.speak(utterance);

        // Fallback timer in case browser TTS is muted/unresponsive in headless iframe
        const estimatedMs = Math.max(1800, (cleanText.split(/\s+/).length / (2.4 * rate)) * 1000);
        this.fallbackTimer = window.setTimeout(() => {
          if (!started) {
            this.isSpeakingState = true;
            options?.onStart?.();
            this.playSubtleChime();
            this.fallbackTimer = window.setTimeout(() => {
              this.isSpeakingState = false;
              options?.onEnd?.();
            }, estimatedMs);
          }
        }, 350);

        return;
      } catch {
        // Fallback below
      }
    }

    // Fallback simulated timing if speechSynthesis is unavailable
    this.isSpeakingState = true;
    options?.onStart?.();
    this.playSubtleChime();
    const duration = Math.max(1500, (cleanText.split(/\s+/).length / (2.5 * rate)) * 1000);
    this.fallbackTimer = window.setTimeout(() => {
      this.isSpeakingState = false;
      options?.onEnd?.();
    }, duration);
  }

  public playSubtleChime() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.currentAudioCtx) {
        this.currentAudioCtx = new AudioCtx();
      }
      const ctx = this.currentAudioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Ignore audio context restriction errors
    }
  }

  public stop() {
    if (this.fallbackTimer) {
      window.clearTimeout(this.fallbackTimer);
      this.fallbackTimer = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // ignore
      }
    }
    this.isSpeakingState = false;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }
}

export const speechEngine = new GermanSpeechEngine();
