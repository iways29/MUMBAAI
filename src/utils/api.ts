import { getPrompt } from '../services/configService.ts';

export interface ApiResponse {
  response: string;
}

export interface ApiError {
  error: string;
}

export type MergeTemplate = 'smart' | 'compare' | 'extract' | 'resolve';

// Map template names to database keys
const templateKeyMap: Record<MergeTemplate, string> = {
  smart: 'merge_smart',
  compare: 'merge_compare',
  extract: 'merge_extract',
  resolve: 'merge_resolve',
};

export class ApiService {
  static async sendMessage(prompt: string, model: string = 'gemini-1.5-flash'): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error calling API:', error);
      return this.generateMockResponse(prompt);
    }
  }

  static async sendMessageStreaming(
    prompt: string,
    model: string = 'gemini-1.5-flash',
    onChunk: (chunk: string) => void
  ): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, model, stream: true })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                onChunk(parsed.content);
              } else if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Error calling streaming API:', error);
      const mockResponse = this.generateMockResponse(prompt);
      for (let i = 0; i < mockResponse.length; i += 10) {
        const chunk = mockResponse.slice(i, i + 10);
        onChunk(chunk);
        await this.delay(50);
      }
      return mockResponse;
    }
  }

  static async getMergeTemplatePrompt(template: MergeTemplate, userInput?: string): Promise<string> {
    const key = templateKeyMap[template];
    let prompt = await getPrompt(key);

    if (userInput && userInput.trim()) {
      prompt += '\n\nUser specific instructions: ' + userInput.trim();
    }

    return prompt;
  }

  static async generateMergedResponse(
    selectedMessages: string[],
    template: MergeTemplate = 'smart',
    userInput?: string,
    model: string = 'gemini-2.5-flash',
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    let finalPrompt: string;

    if (userInput && userInput.trim()) {
      finalPrompt = userInput.trim() + '\n\nContext from conversation branches:\n' + selectedMessages.join('\n\n') + '\n\nPlease provide a comprehensive response based on the above prompt and context.';
    } else {
      const templatePrompt = await this.getMergeTemplatePrompt(template);
      const synthesisSuffix = await getPrompt('merge_synthesis_suffix');
      finalPrompt = templatePrompt + '\n\n' + selectedMessages.join('\n\n') + '\n\n' + synthesisSuffix;
    }

    try {
      if (onChunk) {
        return await this.sendMessageStreaming(finalPrompt, model, onChunk);
      } else {
        return await this.sendMessage(finalPrompt, model);
      }
    } catch (error) {
      console.error('Merge generation failed:', error);
      return this.generateMockMergeResponse(selectedMessages);
    }
  }

  static async createContextPrompt(
    thread: Array<{type: string, content: string}>,
    userInput: string
  ): Promise<string> {
    const recentThread = thread.slice(-10);

    if (recentThread.length === 0) {
      const contextPrompt = await getPrompt('context_first_message');
      return contextPrompt + '\n\nHuman: ' + userInput + '\n\nPlease respond authentically as yourself while being helpful in this context.';
    }

    const contextMessages = recentThread.map(msg =>
      (msg.type === 'user' ? 'Human' : 'Assistant') + ': ' + msg.content
    ).join('\n');

    const ongoingContext = await getPrompt('context_ongoing');
    return ongoingContext + '\n\nConversation history:\n' + contextMessages + '\n\nHuman: ' + userInput + '\n\nPlease respond as yourself, maintaining your authentic identity while being helpful in this branching conversation context.';
  }

  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static generateMockResponse(prompt: string): string {
    const responses = [
      "That's an interesting question! Let me think about this from a few different angles...",
      "I can help you explore that topic. Here are some key considerations...",
      "Great point! This reminds me of several related concepts that might be useful...",
      "Let me break this down into a few main areas to consider...",
      "That's a complex topic with several important aspects to consider..."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    if (prompt.toLowerCase().includes('project')) {
      return randomResponse + '\n\nFor project planning, consider these key elements:\n• Scope and objectives\n• Timeline and milestones\n• Required resources\n• Potential challenges\n• Success metrics';
    } else if (prompt.toLowerCase().includes('creative')) {
      return randomResponse + '\n\nCreative approaches often benefit from:\n• Brainstorming without constraints\n• Drawing inspiration from diverse sources\n• Iterating on initial ideas\n• Combining unexpected elements\n• Embracing experimentation';
    } else if (prompt.toLowerCase().includes('tech')) {
      return randomResponse + '\n\nTechnology considerations include:\n• Current best practices\n• Scalability requirements\n• Security implications\n• User experience design\n• Maintenance and updates';
    }

    return randomResponse + '\n\nThis is a development environment response. The actual AI service would provide more detailed and contextual answers.';
  }

  private static generateMockMergeResponse(selectedMessages: string[]): string {
    const messageCount = selectedMessages.length;

    return 'I have synthesized insights from ' + messageCount + ' different conversation paths to provide a comprehensive perspective:\n\n**Key Themes Identified:**\n• Multiple approaches to the same core challenge\n• Complementary perspectives that build on each other\n• Common goals with different implementation strategies\n\n**Integrated Recommendations:**\nBased on combining these viewpoints, I suggest an approach that:\n1. Takes the strongest elements from each path\n2. Addresses the trade-offs between different options\n3. Provides a balanced solution that considers multiple factors\n\n**Next Steps:**\nThe merged perspective suggests focusing on the overlapping areas where these different approaches align, while also considering the unique benefits each individual path offers.\n\n*Note: This is a fallback response generated when the AI service is unavailable. In production, this would be a more sophisticated synthesis of the actual conversation content.*';
  }
}
