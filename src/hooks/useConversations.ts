// src/hooks/useConversations.ts
import { useState, useCallback, useEffect } from 'react';
import { Conversation, Message } from '../types/conversation';
import { MessageHelpers } from '../utils/messageHelpers.ts';
import { DatabaseService } from '../services/databaseService.ts';
import { useAuth } from './useAuth.ts';

export const useConversations = (initialConversations: Conversation[] = []) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversation, setActiveConversationId] = useState<string>(
    initialConversations.length > 0 ? initialConversations[0].id : ''
  );
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadConversationsFromDatabase = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const dbConversations = await DatabaseService.loadConversations();
      setConversations(dbConversations);
      
      if (dbConversations.length > 0 && !activeConversation) {
        setActiveConversationId(dbConversations[0].id);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user, activeConversation]);

  // Load conversations from database when user logs in
  useEffect(() => {
    if (user && conversations.length === 0) {
      loadConversationsFromDatabase();
    }
  }, [user, conversations.length, loadConversationsFromDatabase]);

  const getCurrentConversation = useCallback((): Conversation | null => {
    return conversations.find(c => c.id === activeConversation) || null;
  }, [conversations, activeConversation]);

  const createNewConversation = useCallback(async () => {
    const tempName = `New Chat ${conversations.length + 1}`;
    
    if (user) {
      // Create in database
      setSyncing(true);
      try {
        const newConvId = await DatabaseService.createConversation(tempName);
        if (newConvId) {
          const newConv: Conversation = {
            id: newConvId,
            name: tempName,
            messages: []
          };
          setConversations(prev => [newConv, ...prev]);
          setActiveConversationId(newConvId);
          return newConvId;
        }
      } catch (error) {
        console.error('Failed to create conversation in database:', error);
      } finally {
        setSyncing(false);
      }
    }
    
    // Fallback: create locally (for offline or failed database operations)
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      name: tempName,
      messages: []
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    return newConv.id;
  }, [conversations.length, user]);

  const setActiveConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const renameConversation = useCallback(async (id: string, name: string) => {
    const trimmedName = name.trim();
    
    // Update locally first for immediate UI feedback
    setConversations(prev => prev.map(conv => 
      conv.id === id ? { ...conv, name: trimmedName } : conv
    ));

    // Update in database if user is logged in
    if (user) {
      try {
        await DatabaseService.renameConversation(id, trimmedName);
      } catch (error) {
        console.error('Failed to rename conversation in database:', error);
        // Optionally revert the local change if database update fails
      }
    }
  }, [user]);

  const deleteConversation = useCallback(async (id: string) => {
    // Update locally first
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

    // Delete from database if user is logged in
    if (user) {
      try {
        await DatabaseService.deleteConversation(id);
      } catch (error) {
        console.error('Failed to delete conversation from database:', error);
      }
    }
  }, [activeConversation, user]);

  const addMessage = useCallback(async (
    conversationId: string, 
    parentMessageId: string | null, 
    newMessage: Message
  ) => {
    // Update locally first for immediate UI feedback
    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv;

      if (!parentMessageId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage]
        };
      }

      const addToMessages = (messages: Message[]): Message[] => {
        return messages.map(msg => {
          if (msg.id === parentMessageId) {
            return {
              ...msg,
              children: [...(msg.children || []), newMessage]
            };
          }
          return {
            ...msg,
            children: addToMessages(msg.children || [])
          };
        });
      };

      return {
        ...conv,
        messages: addToMessages(conv.messages)
      };
    }));

    // Save to database if user is logged in
    if (user) {
      try {
        await DatabaseService.saveMessage(conversationId, parentMessageId, newMessage);
      } catch (error) {
        console.error('Failed to save message to database:', error);
        // Message is already in local state, so we continue gracefully
      }
    }
  }, [user]);

  const findMessage = useCallback((messageId: string): Message | null => {
    const currentConv = getCurrentConversation();
    if (!currentConv) return null;
    return MessageHelpers.findMessage(currentConv.messages, messageId);
  }, [getCurrentConversation]);

  const getMessageThread = useCallback((selectedMessageId: string): Message[] => {
    const conversation = getCurrentConversation();
    if (!conversation) return [];

    if (!selectedMessageId) return [];

    const getPath = (messages: Message[], targetId: string, path: Message[] = []): Message[] | null => {
      for (const msg of messages) {
        const newPath = [...path, msg];
        if (msg.id === targetId) {
          return newPath;
        }
        const found = getPath(msg.children || [], targetId, newPath);
        if (found) return found;
      }
      return null;
    };

    const fullPath = getPath(conversation.messages, selectedMessageId) || [];

    const selectedMessage = MessageHelpers.findMessage(conversation.messages, selectedMessageId);
    if (selectedMessage && selectedMessage.isMergeRoot) {
      return [selectedMessage];
    }

    const mergeRootIndex = fullPath.findIndex(msg => msg.isMergeRoot);
    if (mergeRootIndex !== -1) {
      return fullPath.slice(mergeRootIndex);
    }

    return fullPath;
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

  // Set entire conversation list (useful for initial load)
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

  // Sync existing local conversations to database (useful for migration)
  const syncToDatabase = useCallback(async () => {
    if (!user || conversations.length === 0) return;

    setSyncing(true);
    try {
      for (const conversation of conversations) {
        await DatabaseService.syncConversationToDatabase(conversation);
      }
      // Reload from database to get proper IDs
      await loadConversationsFromDatabase();
    } catch (error) {
      console.error('Failed to sync conversations to database:', error);
    } finally {
      setSyncing(false);
    }
  }, [user, conversations, loadConversationsFromDatabase]);

  return {
    // State
    conversations,
    activeConversation,
    currentConversation: getCurrentConversation(),
    loading,
    syncing,
    
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
    
    // Database operations
    loadConversationsFromDatabase,
    syncToDatabase,
    
    // Bulk operations
    setConversationsData,
    clearAllConversations
  };
};