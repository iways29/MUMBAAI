import { useState, useCallback } from 'react';
import { Message } from '../types/conversation.ts';
import { MessageHelpers } from '../utils/messageHelpers.ts';
import { ApiService, MergeTemplate } from '../utils/api.ts';

interface UseMessageOperationsProps {
  activeConversation: string;
  selectedMessageId: string;
  selectedNodes: Set<string>;
  addMessage: (conversationId: string, parentMessageId: string | null, newMessage: Message) => void;
  findMessage: (messageId: string) => Message | null;
  getMessageThread: (selectedMessageId: string) => Message[];
  onMessageSent?: (messageId: string) => void;
  onClearSelection?: () => void;
  selectedModel?: string;
}

export const useMessageOperations = ({
  activeConversation,
  selectedMessageId,
  selectedNodes,
  addMessage,
  findMessage,
  getMessageThread,
  onMessageSent,
  onClearSelection,
  selectedModel = 'gemini-1.5-flash'
}: UseMessageOperationsProps) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mergeTemplate, setMergeTemplate] = useState<MergeTemplate>('smart');
  const [streamingContent, setStreamingContent] = useState<string>('');

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !activeConversation) return;

    const userMessage = MessageHelpers.createMessage('user', inputText);

    // Add user message - use null as parent for first message in conversation
    const parentId = selectedMessageId || null;
    addMessage(activeConversation, parentId, userMessage);
    onMessageSent?.(userMessage.id);

    const userInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // Get conversation thread for context
      const thread = getMessageThread(selectedMessageId || userMessage.id);
      const contextPrompt = await ApiService.createContextPrompt(
        thread.map(msg => ({ type: msg.type, content: msg.content })),
        userInput
      );

      // Add small delay for better UX
      await ApiService.delay(500);

      // Get AI response with streaming
      setStreamingContent(''); // Reset streaming content
      const aiResponse = await ApiService.sendMessageStreaming(
        contextPrompt,
        selectedModel,
        (chunk: string) => {
          // Update streaming content as chunks arrive
          setStreamingContent(prev => prev + chunk);
        }
      );

      // Clear streaming content before adding final message
      setStreamingContent('');

      // Now that stream is complete, create the final message and add to tree
      const assistantMessage = MessageHelpers.createMessage('assistant', aiResponse, { model: selectedModel });

      // Add AI response to tree ONLY after stream completes
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
    onMessageSent,
    selectedModel
  ]);

  const performIntelligentMerge = useCallback(async (customTemplate?: MergeTemplate, userInput?: string) => {
    const effectiveMergeNodes = Array.from(selectedNodes);
    if (selectedMessageId && !selectedNodes.has(selectedMessageId)) {
      effectiveMergeNodes.push(selectedMessageId);
    }

    if (effectiveMergeNodes.length < 2 || !activeConversation) return;

    setIsLoading(true);
    try {
      // Get the conversation branches with limited context (15 recent messages per branch)
      const selectedMessages = effectiveMergeNodes
        .map(nodeId => {
          const thread = getMessageThread(nodeId);
          if (thread.length === 0) return '';
          
          // Limit to last 15 messages for context
          const recentThread = thread.slice(-15);
          const branchContent = recentThread
            .map(msg => `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
            .join('\n');
          
          return `=== Conversation Branch ${nodeId.slice(0, 8)} ===\n${branchContent}\n=== End Branch ===`;
        })
        .filter(Boolean);

      if (selectedMessages.length < 2) {
        throw new Error('Could not find enough messages to merge');
      }

      // Add delay for better UX
      await ApiService.delay(800);

      // Find a suitable parent for the merged message
      const parentMessage = effectiveMergeNodes
        .map(id => findMessage(id))
        .find(msg => msg !== null);

      if (!parentMessage) {
        throw new Error('Could not find parent message for merge');
      }

      // Create the merged message node FIRST (before streaming starts)
      const mergedMessage = MessageHelpers.createMessage('assistant', '', {
        mergedFrom: effectiveMergeNodes,
        isMergeRoot: true,
        model: selectedModel
      });

      // Add empty merged message to tree and navigate to it BEFORE streaming
      addMessage(activeConversation, parentMessage.id, mergedMessage);
      onMessageSent?.(mergedMessage.id);

      // Now generate merged response with streaming
      // This will stream in the NEW thread context (the merged message node)
      setStreamingContent(''); // Reset streaming content
      const templateToUse = customTemplate || mergeTemplate;
      const mergedContent = await ApiService.generateMergedResponse(
        selectedMessages,
        templateToUse,
        userInput,
        selectedModel,
        (chunk: string) => {
          // Update streaming content as chunks arrive
          // This will now display in the merged message's thread
          setStreamingContent(prev => prev + chunk);
        }
      );

      // Clear streaming content after merge completes
      setStreamingContent('');

      // Update the merged message with the final content
      mergedMessage.content = mergedContent;

      // Clear selections after successful merge
      onClearSelection?.();

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
          isMergeRoot: true,
          model: selectedModel
        });
        addMessage(activeConversation, parentMessage.id, fallbackMessage);
        onMessageSent?.(fallbackMessage.id);
        
        // Clear selections after fallback merge too
        onClearSelection?.();
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
    onMessageSent,
    onClearSelection,
    mergeTemplate,
    getMessageThread,
    selectedModel
  ]);

  // New function specifically for custom prompt merges from chat input
  const performCustomMerge = useCallback(async (customPrompt?: string) => {
    // If no custom prompt provided, use the current template
    if (!customPrompt) {
      return performIntelligentMerge();
    }
    
    // Clear the input text when using custom prompt
    setInputText('');
    
    // Use the custom prompt as user input to the merge function
    return performIntelligentMerge(undefined, customPrompt);
  }, [performIntelligentMerge, setInputText]);

  const getEffectiveMergeCount = useCallback(() => {
    let count = selectedNodes.size;
    if (selectedMessageId && !selectedNodes.has(selectedMessageId)) {
      count += 1;
    }
    console.log('Effective merge count:', {
      selectedNodesSize: selectedNodes.size,
      selectedMessageId,
      hasSelectedMessage: !!selectedMessageId,
      isSelectedMessageInNodes: selectedNodes.has(selectedMessageId || ''),
      finalCount: count
    });
    return count;
  }, [selectedNodes, selectedMessageId]);

  const canMerge = useCallback(() => {
    return getEffectiveMergeCount() >= 2 && !!activeConversation && !isLoading;
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

    // Merge template state
    mergeTemplate,
    setMergeTemplate,

    // Streaming state
    streamingContent,

    // Operations
    sendMessage,
    performIntelligentMerge,
    performCustomMerge,

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