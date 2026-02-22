import { GeminiProvider } from './providers/gemini.mjs';
import { AnthropicProvider } from './providers/anthropic.mjs';
import { OpenAIProvider } from './providers/openai.mjs';

export class LLMService {
  static async generateResponse(model, prompt) {
    try {
      const provider = this.getProviderForModel(model);
      if (!provider) {
        throw new Error(`No provider found for model: ${model}`);
      }

      return await provider.generateResponse(model, prompt);
    } catch (error) {
      console.error(`LLM Service Error for model ${model}:`, error);
      throw error;
    }
  }

  static async generateStreamingResponse(model, prompt) {
    try {
      const provider = this.getProviderForModel(model);
      if (!provider) {
        throw new Error(`No provider found for model: ${model}`);
      }

      return await provider.generateStreamingResponse(model, prompt);
    } catch (error) {
      console.error(`LLM Service Streaming Error for model ${model}:`, error);
      throw error;
    }
  }

  static getProviderForModel(model) {
    // Gemini models
    if (model.startsWith('gemini')) {
      return GeminiProvider;
    }
    
    // Claude models
    if (model.startsWith('claude')) {
      return AnthropicProvider;
    }
    
    // OpenAI models
    if (model.startsWith('gpt')) {
      return OpenAIProvider;
    }
    
    return null;
  }

  static getSupportedModels() {
    return {
      google: ['gemini-1.5-flash', 'gemini-1.5-pro'],
      anthropic: [
        'claude-3-7-sonnet-20250219',
        'claude-sonnet-4-20250514',
        'claude-opus-4-20250514',
        'claude-opus-4-1-20250805'
      ],
      openai: ['gpt-5-mini', 'gpt-4.1-mini', 'gpt-4o-mini', 'gpt-5', 'gpt-4.1', 'gpt-4o']
    };
  }
}