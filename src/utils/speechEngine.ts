// Universal Speech Engine: Gemini 3.8 Flash Lite TTS + Browser SpeechSynthesis fallback + SpeechRecognition
// Equipped with Volume Booster for hearing-impaired accessibility

let activeAudio: HTMLAudioElement | null = null;
let isCurrentlySpeaking = false;

export interface SpeechListenerCallbacks {
  onStart?: () => void;
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export class SpeechEngine {
  private recognition: any = null;
  private isListening = false;
  private ttsSpeed = 0.92; // Slightly slower, clearer pacing for seniors
  private boostEnabled = false;
  private boostLevel = 100; // 100% to 250%

  constructor() {
    this.initRecognition();
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

  private initRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    return !!this.recognition;
  }

  public setTtsSpeed(speed: number) {
    this.ttsSpeed = Math.max(0.6, Math.min(1.4, speed));
  }

  public getTtsSpeed(): number {
    return this.ttsSpeed;
  }

  // Volume Booster controls for hearing impairment
  public setVolumeBoost(level: number, enabled: boolean) {
    this.boostLevel = Math.max(100, Math.min(250, level));
    this.boostEnabled = enabled;
  }

  public getVolumeBoost(): { level: number; enabled: boolean } {
    return {
      level: this.boostLevel,
      enabled: this.boostEnabled,
    };
  }

  // Stop all active speech (both audio elements and native synthesis)
  public stopSpeech() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isCurrentlySpeaking = false;
  }

  public isSpeaking(): boolean {
    return isCurrentlySpeaking;
  }

  // Speaks text using Gemini TTS with automatic browser SpeechSynthesis fallback
  public async speakText(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    if (!text || !text.trim()) return;
    this.stopSpeech();
    isCurrentlySpeaking = true;
    if (onStart) onStart();

    // Clean text of markdown asterisks or code symbols for pure natural speech
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/[*_#`]/g, '')
      .replace(/\[.*?\]/g, '')
      .trim();

    try {
      // Try Gemini TTS server endpoint first
      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: 'Kore' }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          activeAudio = audio;
          audio.playbackRate = this.ttsSpeed;

          // If volume booster is on, route through Web Audio GainNode
          if (this.boostEnabled && typeof window !== 'undefined') {
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const source = ctx.createMediaElementSource(audio);
                const gain = ctx.createGain();
                const factor = Math.max(1.0, this.boostLevel / 100);
                gain.gain.setValueAtTime(factor, ctx.currentTime);

                const comp = ctx.createDynamicsCompressor();
                source.connect(comp);
                comp.connect(gain);
                gain.connect(ctx.destination);
              }
            } catch {
              // Browser may restrict multiple createMediaElementSource on same element
            }
          }

          audio.onended = () => {
            isCurrentlySpeaking = false;
            activeAudio = null;
            if (onEnd) onEnd();
          };
          audio.onerror = () => {
            this.fallbackBrowserSpeech(cleanText, onEnd);
          };
          await audio.play();
          return;
        }
      }
      // If server returned fallback or failed, use browser speech
      this.fallbackBrowserSpeech(cleanText, onEnd);
    } catch {
      this.fallbackBrowserSpeech(cleanText, onEnd);
    }
  }

  private fallbackBrowserSpeech(cleanText: string, onEnd?: () => void) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = this.ttsSpeed;
      utterance.pitch = this.boostEnabled ? 1.05 : 1.0;
      utterance.volume = 1.0; // Maximum browser synthesis volume
      utterance.lang = 'en-US';

      // Pick natural English voice if present
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha') ||
            v.name.includes('Daniel'))
      );
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onend = () => {
        isCurrentlySpeaking = false;
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        isCurrentlySpeaking = false;
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      isCurrentlySpeaking = false;
      if (onEnd) onEnd();
    }
  }

  // Voice listener using Web Speech Recognition
  public startListening(callbacks: SpeechListenerCallbacks) {
    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      if (callbacks.onError) {
        callbacks.onError(
          'Voice recognition is not supported in this browser. Please type your message.'
        );
      }
      return;
    }

    // Stop speaking so mic doesn't pick up speaker
    this.stopSpeech();

    if (this.isListening) {
      try {
        this.recognition.abort();
      } catch {}
    }

    this.isListening = true;

    this.recognition.onstart = () => {
      if (callbacks.onStart) callbacks.onStart();
    };

    this.recognition.onresult = (event: any) => {
      const results = event.results;
      if (results && results[0] && results[0][0]) {
        const transcript = results[0][0].transcript;
        if (callbacks.onResult) callbacks.onResult(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
      if (callbacks.onError) {
        callbacks.onError(event.error || 'Voice recognition error occurred.');
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (callbacks.onEnd) callbacks.onEnd();
    };

    try {
      this.recognition.start();
    } catch (e: any) {
      this.isListening = false;
      if (callbacks.onError) {
        callbacks.onError(e.message || 'Could not start microphone.');
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {}
      this.isListening = false;
    }
  }
}

export const speech = new SpeechEngine();
