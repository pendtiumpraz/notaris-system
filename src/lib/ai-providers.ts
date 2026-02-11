/**
 * AI Provider Configuration
 * Contains all supported providers, their models, and API endpoints
 */

export interface AIModel {
  id: string;
  name: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  pricing?: string; // e.g. "$2.50/1M input, $10/1M output"
}

export interface AIProvider {
  id: string;
  name: string;
  logo: string; // emoji or icon identifier
  baseUrl: string;
  completionPath: string;
  authHeader: string; // Header name for API key
  authPrefix: string; // e.g. "Bearer "
  models: AIModel[];
  docsUrl: string;
}

export interface AISettings {
  activeProviderId: string;
  activeModelId: string;
  providers: Record<
    string,
    {
      apiKey: string;
      isConfigured: boolean;
    }
  >;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '🟢',
    baseUrl: 'https://api.openai.com',
    completionPath: '/v1/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    docsUrl: 'https://platform.openai.com/docs/api-reference/chat',
    models: [
      {
        id: 'gpt-5.2',
        name: 'GPT-5.2',
        description: 'Model terbaru & terkuat dari OpenAI. Reasoning superior, multimodal.',
        maxTokens: 16384,
        contextWindow: 128000,
        pricing: '$2.50/1M input, $10/1M output',
      },
      {
        id: 'gpt-5.1',
        name: 'GPT-5.1',
        description: 'Model cepat dengan kepribadian yang hangat. Cocok untuk chatbot.',
        maxTokens: 16384,
        contextWindow: 128000,
        pricing: '$2/1M input, $8/1M output',
      },
      {
        id: 'gpt-5',
        name: 'GPT-5',
        description: 'Model flagship multimodal. Stabil dan general-purpose.',
        maxTokens: 16384,
        contextWindow: 128000,
        pricing: '$2/1M input, $8/1M output',
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Model cepat & hemat biaya. Cocok untuk tugas ringan.',
        maxTokens: 4096,
        contextWindow: 128000,
        pricing: '$2.50/1M input, $10/1M output',
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        description: 'Model paling hemat biaya dari OpenAI. Ideal untuk volume tinggi.',
        maxTokens: 4096,
        contextWindow: 128000,
        pricing: '$0.15/1M input, $0.60/1M output',
      },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    logo: '🔵',
    baseUrl: 'https://generativelanguage.googleapis.com',
    completionPath: '/v1beta/openai/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    docsUrl: 'https://ai.google.dev/gemini-api/docs',
    models: [
      {
        id: 'gemini-3-flash',
        name: 'Gemini 3 Flash',
        description: 'Model terbaru & tercepat. Visual reasoning & agentic coding.',
        maxTokens: 8192,
        contextWindow: 1000000,
        pricing: '$0.10/1M input, $0.40/1M output',
      },
      {
        id: 'gemini-3-pro',
        name: 'Gemini 3 Pro',
        description: 'State-of-the-art reasoning, multimodal, & agentic. Model paling powerful.',
        maxTokens: 8192,
        contextWindow: 1000000,
        pricing: '$1.25/1M input, $5/1M output',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Model cepat & murah. Cocok untuk search dan general queries.',
        maxTokens: 8192,
        contextWindow: 1000000,
        pricing: '$0.075/1M input, $0.30/1M output',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Model Pro stabil dengan adaptive thinking. Sangat reliable.',
        maxTokens: 8192,
        contextWindow: 1000000,
        pricing: '$1.25/1M input, $5/1M output',
      },
      {
        id: 'gemini-2.5-flash-lite',
        name: 'Gemini 2.5 Flash Lite',
        description: 'Model ultra-hemat. Ideal untuk mobile apps & high-volume.',
        maxTokens: 8192,
        contextWindow: 1000000,
        pricing: '$0.025/1M input, $0.10/1M output',
      },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    logo: '🟣',
    baseUrl: 'https://api.deepseek.com',
    completionPath: '/chat/completions',
    authHeader: 'Authorization',
    authPrefix: 'Bearer ',
    docsUrl: 'https://platform.deepseek.com/api-docs',
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek V3.2 Chat',
        description: 'Model terbaru. Performa setara GPT-5. Daily driver terbaik.',
        maxTokens: 8192,
        contextWindow: 128000,
        pricing: '$0.27/1M input, $1.10/1M output',
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek V3.2 Reasoner',
        description: 'Mode thinking/reasoning. Chain-of-thought untuk masalah kompleks.',
        maxTokens: 8192,
        contextWindow: 128000,
        pricing: '$0.55/1M input, $2.19/1M output',
      },
    ],
  },
];

/**
 * Get provider by ID
 */
export function getProvider(providerId: string): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === providerId);
}

/**
 * Get model by provider ID and model ID
 */
export function getModel(providerId: string, modelId: string): AIModel | undefined {
  const provider = getProvider(providerId);
  return provider?.models.find((m) => m.id === modelId);
}

/**
 * Get the full completion URL for a provider
 */
export function getCompletionUrl(providerId: string): string | undefined {
  const provider = getProvider(providerId);
  if (!provider) return undefined;
  return `${provider.baseUrl}${provider.completionPath}`;
}

/**
 * Default AI settings
 */
export const DEFAULT_AI_SETTINGS: AISettings = {
  activeProviderId: 'gemini',
  activeModelId: 'gemini-2.5-flash',
  providers: {},
};
