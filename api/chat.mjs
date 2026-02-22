import { LLMService } from './services/llm-service.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, model = 'gemini-2.5-flash', stream = false } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!model) {
      return res.status(400).json({ error: 'Model is required' });
    }

    console.log(`Processing request with model: ${model}, streaming: ${stream}`);

    // Handle streaming requests
    if (stream) {
      try {
        const streamResult = await LLMService.generateStreamingResponse(model, prompt);
        const readableStream = streamResult.stream;

        // Set headers for Server-Sent Events
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Parse and forward the stream based on provider
        const provider = streamResult.provider;
        const reader = readableStream.getReader();
        const decoder = new TextDecoder();
        let buffer = ''; // Buffer for incomplete chunks

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process complete lines from buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          // Parse based on provider format
          if (provider === 'openai') {
            // OpenAI streams data as "data: {...}\n\n"
            for (const line of lines) {
              if (line.trim().startsWith('data: ')) {
                const data = line.trim().slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          } else if (provider === 'anthropic') {
            // Anthropic streams as SSE events with event names
            for (const line of lines) {
              if (line.trim().startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.trim().slice(6));
                  if (data.type === 'content_block_delta') {
                    const content = data.delta?.text;
                    if (content) {
                      res.write(`data: ${JSON.stringify({ content })}\n\n`);
                    }
                  }
                } catch (e) {
                  // Skip malformed JSON
                }
              }
            }
          } else if (provider === 'google') {
            // Gemini streams as SSE with "data:" prefix
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine.startsWith('data: ')) {
                try {
                  const jsonStr = trimmedLine.slice(6);
                  const data = JSON.parse(jsonStr);

                  // Gemini streaming response structure
                  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (content) {
                    console.log(`[Gemini Stream] Chunk length: ${content.length}, content: "${content.substring(0, 50)}..."`);
                    res.write(`data: ${JSON.stringify({ content })}\n\n`);
                  }
                } catch (e) {
                  // Skip malformed JSON or incomplete chunks
                }
              }
            }
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }
    } else {
      // Handle non-streaming requests (original behavior)
      const result = await LLMService.generateResponse(model, prompt);
      // Include usage info in response for client-side tracking
      res.status(200).json({
        ...result,
        usage: result.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
      });
    }
  } catch (error) {
    console.error('Error calling LLM API:', error);
    res.status(500).json({
      error: 'Failed to get response from AI',
      details: error.message
    });
  }
}