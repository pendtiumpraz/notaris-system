/**
 * Token Estimator Utility
 * Estimate and track token usage for AI chatbot conversations
 */

// Pricing per 1M tokens (USD)
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Gemini
  'gemini-3-flash': { input: 0.1, output: 0.4 },
  'gemini-3-pro': { input: 1.25, output: 5.0 },
  'gemini-2.5-flash': { input: 0.075, output: 0.3 },
  'gemini-2.5-pro': { input: 1.25, output: 5.0 },
  'gemini-2.5-flash-lite': { input: 0.025, output: 0.1 },
  // OpenAI
  'gpt-5.2': { input: 2.5, output: 10.0 },
  'gpt-5.1': { input: 2.0, output: 8.0 },
  'gpt-5': { input: 2.0, output: 8.0 },
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  // DeepSeek
  'deepseek-chat': { input: 0.27, output: 1.1 },
  'deepseek-reasoner': { input: 0.55, output: 2.19 },
};

const USD_TO_IDR = 16500; // approximate exchange rate

/**
 * Estimate token count from text using simple heuristic
 * Rule of thumb: ~1 token ≈ 3.5 characters for Indonesian/mixed text
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.5);
}

/**
 * Extract actual token usage from API response
 * Works with OpenAI-compatible APIs (Gemini, OpenAI, DeepSeek)
 */
export function extractTokensFromResponse(apiResponse: Record<string, unknown>): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} {
  const usage = apiResponse?.usage as Record<string, number> | undefined;
  if (!usage) {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }

  const inputTokens = usage.prompt_tokens || 0;
  const outputTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || inputTokens + outputTokens;

  return { inputTokens, outputTokens, totalTokens };
}

/**
 * Estimate cost in USD for given token usage
 */
export function estimateCostUSD(inputTokens: number, outputTokens: number, model: string): number {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gemini-2.5-flash'];
  return (inputTokens / 1_000_000) * pricing.input + (outputTokens / 1_000_000) * pricing.output;
}

/**
 * Estimate cost in IDR for given token usage
 */
export function estimateCostIDR(inputTokens: number, outputTokens: number, model: string): number {
  return estimateCostUSD(inputTokens, outputTokens, model) * USD_TO_IDR;
}

/**
 * Format cost as readable string
 */
export function formatCostUSD(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(6)}`;
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

export function formatCostIDR(cost: number): string {
  return `Rp ${Math.round(cost).toLocaleString('id-ID')}`;
}
