// Speech-to-Text and Text-to-Speech utilities

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export class SpeechHandler {
  private recognition: any = null;
  private isListening = false;
  private synth: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'ar-EG'; // Egyptian Arabic dialect default
      }
      if ('speechSynthesis' in window) {
        this.synth = window.speechSynthesis;
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public isTtsSupported(): boolean {
    return !!this.synth;
  }

  public startListening(
    lang: string = 'ar-EG',
    onResult: (result: SpeechRecognitionResult) => void,
    onError: (err: any) => void
  ) {
    if (!this.recognition) {
      onError('خاصية التعرف على الصوت غير مدعومة في هذا المتصفح');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    this.recognition.lang = lang;
    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      onResult({
        transcript: finalTranscript || interimTranscript,
        isFinal: !!finalTranscript,
      });
    };

    this.recognition.onerror = (event: any) => {
      onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (e) {
      console.warn('Speech recognition start failed:', e);
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  public speak(text: string, lang: string = 'ar-EG', rate = 1.0, pitch = 1.0) {
    if (!this.synth) return;
    this.synth.cancel(); // Stop current speech

    // Clean markdown before speaking
    const plainText = text
      .replace(/[*_#`~>]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/```[\s\S]*?```/g, 'كود برمجي')
      .trim();

    if (!plainText) return;

    const utterance = new SpeechSynthesisUtterance(plainText.slice(0, 500));
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Pick best Arabic voice if available
    const voices = this.synth.getVoices();
    const arabicVoice = voices.find((v) => v.lang.startsWith('ar') || v.name.includes('Arabic'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    this.synth.speak(utterance);
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const speechHandler = new SpeechHandler();
