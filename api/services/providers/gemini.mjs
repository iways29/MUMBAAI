// api/services/providers/gemini.mjs

export class GeminiProvider {
  static async generateResponse(model, prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    // Map old/alias names to current v1 model slugs
    const MODEL_MAP = {
      'gemini-1.5-flash': 'gemini-1.5-flash-002',
      'gemini-1.5-flash-latest': 'gemini-1.5-flash-002',
      'gemini-1.5-pro': 'gemini-1.5-pro-002',
      'gemini-1.5-pro-latest': 'gemini-1.5-pro-002',
    };
    const resolvedModel = MODEL_MAP[model] || model;

    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/${resolvedModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        const msg = data?.error?.message || JSON.stringify(data);
        throw new Error(msg);
      }

      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map(p => p.text)
          .filter(Boolean)
          .join('\n') || 'No response';

      return {
        response: text,
        provider: 'google',
        model: resolvedModel,
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Gemini API failed: ${error.message}`);
    }
  }
}
