import { useState, useCallback } from 'react';
import { Message } from '../types/conversation';
import { MessageHelpers } from '../utils/messageHelpers';
import { ApiService } from '../utils/api';

interface UseMessageOperationsProps {
  activeConversation: string;
  selectedMessageId: string;
  selectedNodes: Set<string>;
  addMessage: (conversationId: string, parentMessageId: string | null, newMessage: Message) => void;
  findMessage: (messageId: string) => Message | null;
  getMessageThread: (selectedMessageId: string) => Message[];
  onMessageSent?: (messageId: string) => void;
}

export const useMessageOperations = ({
  activeConversation,
  selectedMessageId,
  selectedNodes,
  addMessage,
  findMessage,
  getMessageThread,
  onMessageSent
}: UseMessageOperationsProps) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !activeConversation) return;

    const userMessage = MessageHelpers.createMessage('user', inputText);
    
    // Add user message
    addMessage(activeConversation, selectedMessageId, userMessage);
    onMessageSent?.(userMessage.id);

    const userInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Get conversation thread for context
      const thread = getMessageThread(selectedMessageId);
      const contextPrompt = ApiService.createContextPrompt(
        thread.map(msg => ({ type: msg.type, content: msg.content })),
        userInput
      );

      // Add small delay for better UX
      await ApiService.delay(500);

      // Get AI response
      const aiResponse = await ApiService.sendMessage(contextPrompt);

      const assistantMessage = MessageHelpers.createMessage('assistant', aiResponse);
      
      // Add AI response
      addMessage(activeConversation, userMessage.id, assistantMessage);
      onMessageSent?.(assistantMessage.id);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = MessageHelpers.createMessage(
        'assistant', 
        'Sorry, I encountered an error. Please try again.'
      );
      addMessage(activeConversation, userMessage.id, errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    inputText,
    activeConversation,
    selectedMessageId,
    addMessage,
    getMessageThread,
    onMessageSent
  ]);

  const performIntelligentMerge = useCallback(async () => {
    const effectiveMergeNodes = Array.from(selectedNodes);
    if (selectedMessageId && !selectedNodes.has(selectedMessageId)) {
      effectiveMergeNodes.push(selectedMessageId);
    }

    if (effectiveMergeNodes.length < 2 || !activeConversation) return;

    setIsLoading(true);
    try {
      // Get the selected messages content for merging
      const selectedMessages = effectiveMergeNodes
        .map(nodeId => {
          const message = findMessage(nodeId);
          return message ? `${message.type === 'user' ? 'Human' : 'Assistant'}: ${message.content}` : '';
        })
        .filter(Boolean);

      if (selectedMessages.length < 2) {
        throw new Error('Could not find enough messages to merge');
      }

      // Add delay for better UX
      await ApiService.delay(800);

      // Generate merged response
      const mergedContent = await ApiService.generateMergedResponse(selectedMessages);

      // Find a suitable parent for the merged message
      const parentMessage = effectiveMergeNodes
        .map(id => findMessage(id))
        .find(msg => msg !== null);

      if (!parentMessage) {
        throw new Error('Could not find parent message for merge');
      }

      const mergedMessage = MessageHelpers.createMessage('assistant', mergedContent, {
        mergedFrom: effectiveMergeNodes,
        isMergeRoot: true
      });

      addMessage(activeConversation, parentMessage.id, mergedMessage);
      onMessageSent?.(mergedMessage.id);

    } catch (error) {
      console.error('Intelligent merge failed:', error);
      
      // Create a fallback merged message
      const fallbackContent = `I've combined insights from ${effectiveMergeNodes.length} different conversation paths. While I couldn't generate a full synthesis due to a technical issue, these different perspectives offer valuable viewpoints on the topic.`;
      
      const parentMessage = effectiveMergeNodes
        .map(id => findMessage(id))
        .find(msg => msg !== null);

      if (parentMessage) {
        const fallbackMessage = MessageHelpers.createMessage('assistant', fallbackContent, {
          mergedFrom: effectiveMergeNodes,
          isMergeRoot: true
        });
        addMessage(activeConversation, parentMessage.id, fallbackMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedNodes,
    selectedMessageId,
    activeConversation,
    findMessage,
    addMessage,
    onMessageSent
  ]);

  const getEffectiveMergeCount = useCallback(() => {
    let count = selectedNodes.size;
    if (selectedMessageId && !selectedNodes.has(selectedMessageId)) {
      count += 1;
    }
    return count;
  }, [selectedNodes, selectedMessageId]);

  const canMerge = useCallback(() => {
    return getEffectiveMergeCount() >= 2 && activeConversation && !isLoading;
  }, [getEffectiveMergeCount, activeConversation, isLoading]);

  const getCurrentMessage = useCallback(() => {
    if (!selectedMessageId) return null;
    return findMessage(selectedMessageId);
  }, [selectedMessageId, findMessage]);

  return {
    // Input state
    inputText,
    setInputText,
    isLoading,
    
    // Operations
    sendMessage,
    performIntelligentMerge,
    
    // Helpers
    getEffectiveMergeCount,
    canMerge,
    getCurrentMessage,
    
    // State checkers
    canSendMessage: !isLoading && inputText.trim().length > 0,
    hasSelectedMessage: !!selectedMessageId,
    hasMultipleSelection: selectedNodes.size > 0
  };
};