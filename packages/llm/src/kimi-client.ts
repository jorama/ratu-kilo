import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

// =========================
// KIMI K2 CLIENT
// =========================

export interface KimiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: KimiToolCall[];
  tool_call_id?: string;
}

export interface KimiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface KimiTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export interface KimiChatRequest {
  model: string;
  messages: KimiMessage[];
  tools?: KimiTool[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

export interface KimiChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: KimiMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface KimiConfig {
  apiBase: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  maxRetries?: number;
}

export class KimiK2Client {
  private client: AxiosInstance;
  private config: Required<KimiConfig>;
  private modelChecksum: string | null = null;

  constructor(config: KimiConfig) {
    this.config = {
      maxTokens: 4096,
      temperature: 0.4,
      timeout: 60000,
      maxRetries: 3,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.apiBase,
      timeout: this.config.timeout,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Chat completion with Kimi K2
   */
  async chat(
    messages: KimiMessage[],
    options?: {
      tools?: KimiTool[];
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ): Promise<KimiChatResponse> {
    const request: KimiChatRequest = {
      model: this.config.model,
      messages,
      temperature: options?.temperature ?? this.config.temperature,
      max_tokens: options?.maxTokens ?? this.config.maxTokens,
      stream: options?.stream ?? false,
    };

    if (options?.tools && options.tools.length > 0) {
      request.tools = options.tools;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await this.client.post<KimiChatResponse>(
          '/chat/completions',
          request
        );
        return response.data;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          throw new Error(`Kimi K2 API error: ${error.response.data?.error?.message || error.message}`);
        }
        
        // Exponential backoff for retries
        if (attempt < this.config.maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Kimi K2 API failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Simple text completion
   */
  async complete(
    prompt: string,
    systemPrompt?: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<string> {
    const messages: KimiMessage[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.chat(messages, options);
    return response.choices[0]?.message?.content || '';
  }

  /**
   * Chat with tool calling support
   */
  async chatWithTools(
    messages: KimiMessage[],
    tools: KimiTool[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{
    message: KimiMessage;
    toolCalls: KimiToolCall[];
    usage: KimiChatResponse['usage'];
  }> {
    const response = await this.chat(messages, { ...options, tools });
    const choice = response.choices[0];
    
    return {
      message: choice.message,
      toolCalls: choice.message.tool_calls || [],
      usage: response.usage,
    };
  }

  /**
   * Get model checksum for integrity verification
   * This creates a deterministic hash of the model configuration
   */
  async getModelChecksum(): Promise<string> {
    if (this.modelChecksum) {
      return this.modelChecksum;
    }

    try {
      // Try to fetch model info from API
      const response = await this.client.get('/models');
      const modelInfo = response.data.data?.find((m: any) => m.id === this.config.model);
      
      if (modelInfo) {
        // Create checksum from model metadata
        const checksumData = JSON.stringify({
          id: modelInfo.id,
          created: modelInfo.created,
          owned_by: modelInfo.owned_by,
        });
        this.modelChecksum = crypto.createHash('sha256').update(checksumData).digest('hex');
      } else {
        // Fallback: create checksum from model name and config
        const checksumData = JSON.stringify({
          model: this.config.model,
          apiBase: this.config.apiBase,
        });
        this.modelChecksum = crypto.createHash('sha256').update(checksumData).digest('hex');
      }
    } catch (error) {
      // Fallback if API doesn't support /models endpoint
      const checksumData = JSON.stringify({
        model: this.config.model,
        apiBase: this.config.apiBase,
      });
      this.modelChecksum = crypto.createHash('sha256').update(checksumData).digest('hex');
    }

    return this.modelChecksum;
  }

  /**
   * Parse citations from response content
   * Looks for [CIT:doc_id:chunk_ix] patterns
   */
  parseCitations(content: string): Array<{ docId: string; chunkIx: number; key: string }> {
    const citationRegex = /\[CIT:([a-f0-9-]+):(\d+)\]/g;
    const citations: Array<{ docId: string; chunkIx: number; key: string }> = [];
    let match;

    while ((match = citationRegex.exec(content)) !== null) {
      citations.push({
        docId: match[1],
        chunkIx: parseInt(match[2], 10),
        key: match[0],
      });
    }

    return citations;
  }

  /**
   * Build system prompt for Ratu
   */
  static buildRatuSystemPrompt(orgName: string, context?: string): string {
    return `You are Ratu, the Sovereign AI assistant for ${orgName}.

IMPORTANT RULES:
1. The base model is FROZEN and never retrained. Do not claim to have been trained on new data.
2. Answer ONLY from the retrieved context provided below.
3. Cite ALL sources using the format [CIT:doc_id:chunk_ix] inline in your response.
4. If the context is insufficient, say "I don't have that information yet" and suggest which source should be crawled.
5. Be precise, factual, and cite every claim.
6. Never make up information or hallucinate facts.

${context ? `RETRIEVED CONTEXT:\n${context}\n` : ''}

Provide your answer with inline citations.`;
  }

  /**
   * Build role-specific system prompt for Council agents
   */
  static buildCouncilRolePrompt(role: string, orgName: string, context?: string): string {
    const rolePrompts: Record<string, string> = {
      researcher: `You are the Researcher for ${orgName}. Your role is to:
- Find and extract relevant facts from the context
- List key information with citations [CIT:doc_id:chunk_ix]
- Note any gaps or missing information
- Be thorough and systematic`,

      analyst: `You are the Analyst for ${orgName}. Your role is to:
- Synthesize facts into concise, actionable conclusions
- Provide citations [CIT:doc_id:chunk_ix] for all claims
- Flag ambiguities or contradictions
- Offer clear recommendations`,

      editor: `You are the Editor for ${orgName}. Your role is to:
- Review and refine the analysis
- Ensure clarity and coherence
- Verify all citations are present
- Produce the final polished output`,

      critic: `You are the Critic for ${orgName}. Your role is to:
- Challenge assumptions and conclusions
- Check citation adequacy
- Identify logical flaws or gaps
- Propose clarifying questions`,
    };

    const basePrompt = rolePrompts[role.toLowerCase()] || rolePrompts.analyst;

    return `${basePrompt}

${context ? `RETRIEVED CONTEXT:\n${context}\n` : ''}

Provide your analysis with inline citations.`;
  }
}

// =========================
// FACTORY FUNCTION
// =========================

export function createKimiClient(config?: Partial<KimiConfig>): KimiK2Client {
  const defaultConfig: KimiConfig = {
    apiBase: process.env.KIMI_K2_API_BASE || 'https://api.moonshot.cn/v1',
    apiKey: process.env.KIMI_K2_API_KEY || '',
    model: process.env.KIMI_K2_MODEL || 'moonshot-v1-128k',
    maxTokens: parseInt(process.env.KIMI_K2_MAX_TOKENS || '4096', 10),
    temperature: parseFloat(process.env.KIMI_K2_TEMPERATURE || '0.4'),
  };

  return new KimiK2Client({ ...defaultConfig, ...config });
}