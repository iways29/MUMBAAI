export interface ApiResponse {
    response: string;
  }
  
  export interface ApiError {
    error: string;
  }
  
  export class ApiService {
    static async sendMessage(prompt: string): Promise<string> {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt })
        });
  
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }
  
        const data: ApiResponse = await response.json();
        return data.response;
      } catch (error) {
        console.error('Error calling API:', error);
        throw new Error('Failed to get response from AI. Please try again.');
      }
    }
  
    static async generateMergedResponse(selectedMessages: string[]): Promise<string> {
      const mergePrompt = `Please analyze and synthesize these different conversation branches into a unified response that captures the key insights from each path:
  
  ${selectedMessages.join('\n\n')}
  
  Create a comprehensive response that merges the best elements from these different directions while maintaining coherence and adding new insights where appropriate.`;
  
      return this.sendMessage(mergePrompt);
    }
  
    static createContextPrompt(thread: Array<{type: string, content: string}>, userInput: string): string {
      const contextMessages = thread.map(msg =>
        `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n');
  
      return `Here is our conversation history:\n\n${contextMessages}\n\nHuman: ${userInput}\n\nPlease respond naturally, taking into account the full conversation context above.`;
    }
  
    // Mock delay for better UX
    static async delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }