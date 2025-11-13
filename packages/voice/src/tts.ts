import axios, { AxiosInstance } from 'axios';

// =========================
// TEXT-TO-SPEECH INTERFACE
// =========================

export interface TTSProvider {
  synthesize(text: string, options?: TTSOptions): Promise<Buffer>;
  getVoices?(): Promise<Voice[]>;
}

export interface TTSOptions {
  voice?: string;
  model?: string;
  speed?: number;
  pitch?: number;
  format?: 'mp3' | 'wav' | 'opus' | 'aac';
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  preview?: string;
}

// =========================
// OPENAI TTS
// =========================

export class OpenAITTS implements TTSProvider {
  private client: AxiosInstance;
  private model: string;

  constructor(config: {
    apiKey: string;
    apiBase?: string;
    model?: string;
  }) {
    this.model = config.model || 'tts-1';
    
    this.client = axios.create({
      baseURL: config.apiBase || 'https://api.openai.com/v1',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
      responseType: 'arraybuffer',
    });
  }

  async synthesize(text: string, options?: TTSOptions): Promise<Buffer> {
    try {
      const response = await this.client.post('/audio/speech', {
        model: options?.model || this.model,
        input: text,
        voice: options?.voice || 'alloy',
        response_format: options?.format || 'mp3',
        speed: options?.speed || 1.0,
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`OpenAI TTS failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  async getVoices(): Promise<Voice[]> {
    return [
      { id: 'alloy', name: 'Alloy', language: 'en', gender: 'neutral' },
      { id: 'echo', name: 'Echo', language: 'en', gender: 'male' },
      { id: 'fable', name: 'Fable', language: 'en', gender: 'neutral' },
      { id: 'onyx', name: 'Onyx', language: 'en', gender: 'male' },
      { id: 'nova', name: 'Nova', language: 'en', gender: 'female' },
      { id: 'shimmer', name: 'Shimmer', language: 'en', gender: 'female' },
    ];
  }
}

// =========================
// ELEVENLABS TTS
// =========================

export class ElevenLabsTTS implements TTSProvider {
  private client: AxiosInstance;
  private model: string;

  constructor(config: {
    apiKey: string;
    apiBase?: string;
    model?: string;
  }) {
    this.model = config.model || 'eleven_monolingual_v1';
    
    this.client = axios.create({
      baseURL: config.apiBase || 'https://api.elevenlabs.io/v1',
      headers: {
        'xi-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
      responseType: 'arraybuffer',
    });
  }

  async synthesize(text: string, options?: TTSOptions): Promise<Buffer> {
    try {
      const voiceId = options?.voice || '21m00Tcm4TlvDq8ikWAM'; // Default voice

      const response = await this.client.post(`/text-to-speech/${voiceId}`, {
        text,
        model_id: options?.model || this.model,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`ElevenLabs TTS failed: ${error.response?.data?.detail || error.message}`);
    }
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await this.client.get('/voices');
      
      return response.data.voices.map((v: any) => ({
        id: v.voice_id,
        name: v.name,
        language: v.labels?.language || 'en',
        gender: v.labels?.gender,
        preview: v.preview_url,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch voices: ${error.message}`);
    }
  }
}

// =========================
// CUSTOM TTS
// =========================

export class CustomTTS implements TTSProvider {
  private client: AxiosInstance;

  constructor(config: {
    apiBase: string;
    apiKey?: string;
    headers?: Record<string, string>;
  }) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    this.client = axios.create({
      baseURL: config.apiBase,
      headers,
      timeout: 60000,
      responseType: 'arraybuffer',
    });
  }

  async synthesize(text: string, options?: TTSOptions): Promise<Buffer> {
    try {
      const response = await this.client.post('/synthesize', {
        text,
        ...options,
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      throw new Error(`Custom TTS failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async getVoices(): Promise<Voice[]> {
    try {
      const response = await this.client.get('/voices');
      return response.data.voices || response.data;
    } catch (error) {
      return [];
    }
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createTTSProvider(config: {
  provider: 'openai' | 'elevenlabs' | 'custom';
  apiKey?: string;
  apiBase?: string;
  model?: string;
  headers?: Record<string, string>;
}): TTSProvider {
  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) {
        throw new Error('API key required for OpenAI TTS');
      }
      return new OpenAITTS({
        apiKey: config.apiKey,
        apiBase: config.apiBase,
        model: config.model,
      });

    case 'elevenlabs':
      if (!config.apiKey) {
        throw new Error('API key required for ElevenLabs');
      }
      return new ElevenLabsTTS({
        apiKey: config.apiKey,
        apiBase: config.apiBase,
        model: config.model,
      });

    case 'custom':
      if (!config.apiBase) {
        throw new Error('API base URL required for custom TTS');
      }
      return new CustomTTS({
        apiBase: config.apiBase,
        apiKey: config.apiKey,
        headers: config.headers,
      });

    default:
      throw new Error(`Unknown TTS provider: ${config.provider}`);
  }
}