export class AnthropicProvider {
  static async generateResponse(model, prompt) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();

      // Extract token usage from response (Anthropic uses input_tokens/output_tokens)
      const usage = data.usage ? {
        prompt_tokens: data.usage.input_tokens || 0,
        completion_tokens: data.usage.output_tokens || 0,
        total_tokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0)
      } : null;

      return {
        response: data.content[0].text,
        provider: 'anthropic',
        model: model,
        usage
      };
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw new Error(`Anthropic API failed: ${error.message}`);
    }
  }

  static async generateStreamingResponse(model, prompt) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: true // Enable streaming
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      // Return the readable stream
      return {
        stream: response.body,
        provider: 'anthropic',
        model: model
      };
    } catch (error) {
      console.error('Anthropic API Error:', error);
      throw new Error(`Anthropic API failed: ${error.message}`);
    }
  }
}