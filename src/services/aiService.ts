interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
  }
  
  interface AIResponse {
    content: string;
    timestamp: string;
  }
  
  class AIService {
    private apiUrl = '/api/chat';
  
    async sendMessage(message: string, conversationHistory: AIMessage[] = []): Promise<AIResponse> {
      try {
        // For now, we'll simulate the AI response like your current code
        // Later you can easily replace this with real API calls
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              content: `AI Response to: "${message}". This is a simulated response that will be replaced with real AI integration.`,
              timestamp: new Date().toISOString()
            });
          }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
        });
  
        // Real API call would look like this:
        /*
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: message,
            history: conversationHistory
          }),
        });
  
        if (!response.ok) {
          throw new Error(`AI API error: ${response.status}`);
        }
  
        const data = await response.json();
        return {
          content: data.response,
          timestamp: new Date().toISOString()
        };
        */
      } catch (error) {
        console.error('AI Service Error:', error);
        throw new Error('Failed to get AI response. Please try again.');
      }
    }
  
    async performIntelligentMerge(messages: string[]): Promise<AIResponse> {
      try {
        const mergePrompt = `Please create a coherent summary that merges these conversation points: ${messages.join(' | ')}`;
        
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              content: `Merged Summary: ${messages.join(' ... ')}. This would be an intelligent AI-generated merge in the real implementation.`,
              timestamp: new Date().toISOString()
            });
          }, 1500);
        });
      } catch (error) {
        console.error('AI Merge Error:', error);
        throw new Error('Failed to perform intelligent merge.');
      }
    }
  }
  
  // Export singleton instance
  export const aiService = new AIService();
  export type { AIMessage, AIResponse };