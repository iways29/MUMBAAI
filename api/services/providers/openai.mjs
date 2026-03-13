export class OpenAIProvider {
    static async generateResponse(model, prompt) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_completion_tokens: 4000,
                    // Some newer models like GPT-5 Mini only support default temperature (1)
                    ...(model.includes('gpt-5') ? {} : { temperature: 0.7 })
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();

            // Extract token usage from response
            const usage = data.usage ? {
                prompt_tokens: data.usage.prompt_tokens || 0,
                completion_tokens: data.usage.completion_tokens || 0,
                total_tokens: data.usage.total_tokens || 0
            } : null;

            return {
                response: data.choices[0].message.content,
                provider: 'openai',
                model: model,
                usage
            };
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`OpenAI API failed: ${error.message}`);
        }
    }

    static async generateStreamingResponse(model, prompt) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY not configured');
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_completion_tokens: 4000,
                    stream: true, // Enable streaming
                    stream_options: { include_usage: true }, // Include token usage in final chunk
                    // Some newer models like GPT-5 Mini only support default temperature (1)
                    ...(model.includes('gpt-5') ? {} : { temperature: 0.7 })
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            // Return the readable stream
            return {
                stream: response.body,
                provider: 'openai',
                model: model
            };
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`OpenAI API failed: ${error.message}`);
        }
    }
}