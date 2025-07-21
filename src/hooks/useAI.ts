import { useState, useCallback } from 'react';
import { aiService, AIMessage } from '../services/aiService';
import { Message } from '../types/conversation';

export const useAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send message to AI
  const sendMessage = useCallback(async (
    message: string, 
    conversationHistory: Message[] = []
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert conversation history to AI format
      const aiHistory: AIMessage[] = conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await aiService.sendMessage(message, aiHistory);
      return response.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown AI error';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Perform intelligent merge
  const performIntelligentMerge = useCallback(async (messages: string[]): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiService.performIntelligentMerge(messages);
      return response.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown merge error';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    sendMessage,
    performIntelligentMerge,
    clearError
  };
};