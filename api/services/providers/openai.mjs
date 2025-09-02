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

            return {
                response: data.choices[0].message.content,
                provider: 'openai',
                model: model
            };
        } catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`OpenAI API failed: ${error.message}`);
        }
    }
}