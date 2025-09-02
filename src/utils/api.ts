export interface ApiResponse {
  response: string;
}

export interface ApiError {
  error: string;
}

export type MergeTemplate = 'smart' | 'compare' | 'extract' | 'resolve';

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
      
      // Fallback to mock response for development
      return this.generateMockResponse(prompt);
    }
  }

  static getMergeTemplatePrompt(template: MergeTemplate, userInput?: string): string {
    const templates = {
      smart: "Please analyze and synthesize these different conversation branches into a unified response that captures the key insights from each path:",
      compare: "Compare and contrast these different approaches, highlighting key similarities and differences while providing a balanced analysis:",
      extract: "Extract the key insights and main points from these conversations in a clear, organized format with bullet points or numbered lists:",
      resolve: "These conversations show different viewpoints. Find common ground and resolve any conflicts while addressing the core concerns from each perspective:"
    };

    let prompt = templates[template];
    
    if (userInput && userInput.trim()) {
      prompt += `\n\nUser specific instructions: ${userInput.trim()}`;
    }
    
    return prompt;
  }

  static async generateMergedResponse(
    selectedMessages: string[], 
    template: MergeTemplate = 'smart',
    userInput?: string
  ): Promise<string> {
    let finalPrompt: string; 
   
    if (userInput && userInput.trim()) {
      // User provided custom prompt - use it directly with context
      finalPrompt = `${userInput.trim()}

Context from conversation branches:
${selectedMessages.join('\n\n')}

Please provide a comprehensive response based on the above prompt and context.`;
    } else {
      // Use template-based approach
      const templatePrompt = this.getMergeTemplatePrompt(template);
      finalPrompt = `${templatePrompt}

${selectedMessages.join('\n\n')}

Create a comprehensive response that merges the best elements from these different directions while maintaining coherence and adding new insights where appropriate.`;
    }

    try {
      return await this.sendMessage(finalPrompt);
    } catch (error) {
      console.error('Merge generation failed:', error);
      
      // Fallback merge response
      return this.generateMockMergeResponse(selectedMessages);
    }
  }

  static createContextPrompt(thread: Array<{type: string, content: string}>, userInput: string): string {
    // Limit to last 10 messages for normal conversation
    const recentThread = thread.slice(-10);
    
    if (recentThread.length === 0) {
      // First message - provide MUMBAAI context while preserving model identity
      return `Context: You are responding within MUMBAAI, a branching conversation platform that allows users to explore multiple conversation paths and compare responses from different AI models. Users can branch conversations at any point to explore different directions, then merge insights from multiple branches. This enables more thorough exploration of topics and better decision-making.

Your role: Maintain your authentic identity and capabilities while being helpful in this branching conversation context. Users may compare your responses with other AI models, so showcase your unique strengths and perspective.Human: ${
userInput}

Please respond authentically as yourself while being helpful in this context.`;
    }
    
    // Ongoing conversation - include context
    const contextMessages = recentThread.map(msg =>
      `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    return `Context: You are in MUMBAAI, a branching conversation platform where users explore multiple conversation paths and compare different AI models. This conversation may be branched or merged with others.

Conversation history:
${contextMessages}Human
: ${userInput}

Please respond as yourself, maintaining your authentic identity while being helpful in this branching conversation context.`;
  }

  // Mock delay for better UX
  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fallback mock responses for development/offline use
  private static generateMockResponse(prompt: string): string {
    const responses = [
      "That's an interesting question! Let me think about this from a few different angles...",
      "I can help you explore that topic. Here are some key considerations...",
      "Great point! This reminds me of several related concepts that might be useful...",
      "Let me break this down into a few main areas to consider...",
      "That's a complex topic with several important aspects to consider..."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Add topic-specific content based on keywords
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
    
    return `I've synthesized insights from ${messageCount} different conversation paths to provide a comprehensive perspective:

**Key Themes Identified:**
• Multiple approaches to the same core challenge
• Complementary perspectives that build on each other
• Common goals with different implementation strategies

**Integrated Recommendations:**
Based on combining these viewpoints, I suggest an approach that:
1. Takes the strongest elements from each path
2. Addresses the trade-offs between different options
3. Provides a balanced solution that considers multiple factors

**Next Steps:**
The merged perspective suggests focusing on the overlapping areas where these different approaches align, while also considering the unique benefits each individual path offers.

*Note: This is a fallback response generated when the AI service is unavailable. In production, this would be a more sophisticated synthesis of the actual conversation content.*`;
  }
}