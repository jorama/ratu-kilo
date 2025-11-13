import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

// =========================
// SPEECH-TO-TEXT INTERFACE
// =========================

export interface STTProvider {
  transcribe(audio: Buffer, options?: STTOptions): Promise<STTResult>;
  supportsStreaming?: boolean;
}

export interface STTOptions {
  language?: string;
  model?: string;
  prompt?: string;
  temperature?: number;
}

export interface STTResult {
  text: string;
  language?: string;
  confidence?: number;
  duration?: number;
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
}

// =========================
// OPENAI WHISPER STT
// =========================

export class WhisperSTT implements STTProvider {
  private client: AxiosInstance;
  private model: string;

  constructor(config: {
    apiKey: string;
    apiBase?: string;
    model?: string;
  }) {
    this.model = config.model || 'whisper-1';
    
    this.client = axios.create({
      baseURL: config.apiBase || 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
      timeout: 60000,
    });
  }

  async transcribe(audio: Buffer, options?: STTOptions): Promise<STTResult> {
    try {
      const formData = new FormData();
      formData.append('file', audio, {
        filename: 'audio.wav',
        contentType: 'audio/wav',
      });
      formData.append('model', options?.model || this.model);
      
      if (options?.language) {
        formData.append('language', options.language);
      }
      
      if (options?.prompt) {
        formData.append('prompt', options.prompt);
      }
      
      if (options?.temperature !== undefined) {
        formData.append('temperature', options.temperature.toString());
      }

      const response = await this.client.post('/audio/transcriptions', formData, {
        headers: formData.getHeaders(),
      });

      return {
        text: response.data.text,
        language: response.data.language,
        duration: response.data.duration,
      };
    } catch (error: any) {
      throw new Error(`Whisper transcription failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

// =========================
// DEEPGRAM STT
// =========================

export class DeepgramSTT implements STTProvider {
  private client: AxiosInstance;
  private model: string;

  constructor(config: {
    apiKey: string;
    apiBase?: string;
    model?: string;
  }) {
    this.model = config.model || 'nova-2';
    
    this.client = axios.create({
      baseURL: config.apiBase || 'https://api.deepgram.com/v1',
      headers: {
        'Authorization': `Token ${config.apiKey}`,
        'Content-Type': 'audio/wav',
      },
      timeout: 60000,
    });
  }

  async transcribe(audio: Buffer, options?: STTOptions): Promise<STTResult> {
    try {
      const params = new URLSearchParams({
        model: options?.model || this.model,
        smart_format: 'true',
      });

      if (options?.language) {
        params.append('language', options.language);
      }

      const response = await this.client.post(
        `/listen?${params.toString()}`,
        audio
      );

      const result = response.data.results?.channels?.[0]?.alternatives?.[0];
      
      if (!result) {
        throw new Error('No transcription result');
      }

      return {
        text: result.transcript,
        confidence: result.confidence,
        segments: result.words?.map((word: any) => ({
          text: word.word,
          start: word.start,
          end: word.end,
        })),
      };
    } catch (error: any) {
      throw new Error(`Deepgram transcription failed: ${error.response?.data?.error || error.message}`);
    }
  }

  supportsStreaming = true;
}

// =========================
// CUSTOM STT
// =========================

export class CustomSTT implements STTProvider {
  private client: AxiosInstance;

  constructor(config: {
    apiBase: string;
    apiKey?: string;
    headers?: Record<string, string>;
  }) {
    const headers: Record<string, string> = {
      'Content-Type': 'audio/wav',
      ...config.headers,
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    this.client = axios.create({
      baseURL: config.apiBase,
      headers,
      timeout: 60000,
    });
  }

  async transcribe(audio: Buffer, options?: STTOptions): Promise<STTResult> {
    try {
      const response = await this.client.post('/transcribe', audio, {
        params: options,
      });

      return {
        text: response.data.text || response.data.transcript,
        language: response.data.language,
        confidence: response.data.confidence,
        segments: response.data.segments,
      };
    } catch (error: any) {
      throw new Error(`Custom STT failed: ${error.response?.data?.error || error.message}`);
    }
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createSTTProvider(config: {
  provider: 'whisper' | 'deepgram' | 'custom';
  apiKey?: string;
  apiBase?: string;
  model?: string;
  headers?: Record<string, string>;
}): STTProvider {
  switch (config.provider) {
    case 'whisper':
      if (!config.apiKey) {
        throw new Error('API key required for Whisper');
      }
      return new WhisperSTT({
        apiKey: config.apiKey,
        apiBase: config.apiBase,
        model: config.model,
      });

    case 'deepgram':
      if (!config.apiKey) {
        throw new Error('API key required for Deepgram');
      }
      return new DeepgramSTT({
        apiKey: config.apiKey,
        apiBase: config.apiBase,
        model: config.model,
      });

    case 'custom':
      if (!config.apiBase) {
        throw new Error('API base URL required for custom STT');
      }
      return new CustomSTT({
        apiBase: config.apiBase,
        apiKey: config.apiKey,
        headers: config.headers,
      });

    default:
      throw new Error(`Unknown STT provider: ${config.provider}`);
  }
}