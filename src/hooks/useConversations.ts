import { useState, useCallback } from 'react';
import { Conversation, Message } from '../types/conversation.ts';
import { MessageHelpers } from '../utils/messageHelpers.ts';

export const useConversations = (initialConversations: Conversation[] = []) => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversation, setActiveConversationId] = useState<string>(
    initialConversations.length > 0 ? initialConversations[0].id : ''
  );

  const getCurrentConversation = useCallback((): Conversation | null => {
    return conversations.find(c => c.id === activeConversation) || null;
  }, [conversations, activeConversation]);

  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      name: `New Chat ${conversations.length + 1}`,
      messages: []
    };
    setConversations(prev => [...prev, newConv]);
    setActiveConversationId(newConv.id);
    return newConv.id;
  }, [conversations.length]);

  const setActiveConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const renameConversation = useCallback((id: string, name: string) => {
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, name: name.trim() } : conv
    ));
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== id);
      // If we deleted the active conversation, switch to another one
      if (id === activeConversation && filtered.length > 0) {
        setActiveConversationId(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveConversationId('');
      }
      return filtered;
    });
  }, [activeConversation]);

  const addMessage = useCallback((
    conversationId: string, 
    parentMessageId: string | null, 
    newMessage: Message
  ) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv;
      return MessageHelpers.addMessageToConversation(conv, parentMessageId, newMessage);
    }));
  }, []);

  const findMessage = useCallback((messageId: string): Message | null => {
    const currentConv = getCurrentConversation();
    if (!currentConv) return null;
    return MessageHelpers.findMessage(currentConv.messages, messageId);
  }, [getCurrentConversation]);

  const getMessageThread = useCallback((selectedMessageId: string): Message[] => {
    const currentConv = getCurrentConversation();
    if (!currentConv || !selectedMessageId) return [];
    return MessageHelpers.getConversationThread(currentConv, selectedMessageId);
  }, [getCurrentConversation]);

  const getAllMessages = useCallback((): Message[] => {
    const currentConv = getCurrentConversation();
    if (!currentConv) return [];
    return MessageHelpers.getAllMessages(currentConv.messages);
  }, [getCurrentConversation]);

  const getConversationStats = useCallback(() => {
    const currentConv = getCurrentConversation();
    if (!currentConv) return null;
    return MessageHelpers.getMessageStats(currentConv.messages);
  }, [getCurrentConversation]);

  // Set entire conversation list
  const setConversationsData = useCallback((newConversations: Conversation[]) => {
    setConversations(newConversations);
    if (newConversations.length > 0 && !activeConversation) {
      setActiveConversationId(newConversations[0].id);
    }
  }, [activeConversation]);

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setActiveConversationId('');
  }, []);

  return {
    // State
    conversations,
    activeConversation,
    currentConversation: getCurrentConversation(),
    
    // Basic operations
    createNewConversation,
    setActiveConversation,
    renameConversation,
    deleteConversation,
    
    // Message operations
    addMessage,
    findMessage,
    getMessageThread,
    getAllMessages,
    getConversationStats,
    
    // Bulk operations
    setConversationsData,
    clearAllConversations
  };
};