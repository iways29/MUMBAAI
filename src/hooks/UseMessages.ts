import { useState, useCallback, useMemo } from 'react';
import { Message } from '../types/conversation';

export const useMessages = (conversationMessages: Message[]) => {
  const [selectedMessageId, setSelectedMessageId] = useState('msg-4');
  const [selectedNodes, setSelectedNodes] = useState(new Set<string>());

  // Get all messages in flat array (recursive function from your code)
  const getAllMessages = useCallback((messages: Message[]): Message[] => {
    const result: Message[] = [];
    
    const traverse = (msgs: Message[]) => {
      msgs.forEach(msg => {
        result.push(msg);
        if (msg.children && msg.children.length > 0) {
          traverse(msg.children);
        }
      });
    };
    
    traverse(messages);
    return result;
  }, []);

  // Get all messages as flat array
  const allMessages = useMemo(() => {
    return getAllMessages(conversationMessages);
  }, [conversationMessages, getAllMessages]);

  // Get current selected message
  const getCurrentMessage = useCallback(() => {
    return allMessages.find(msg => msg.id === selectedMessageId);
  }, [allMessages, selectedMessageId]);

  // Get message thread (path from root to selected message)
  const getMessageThread = useCallback((targetId: string, messages: Message[]): Message[] => {
    const thread: Message[] = [];
    
    const findPath = (msgs: Message[], path: Message[]): boolean => {
      for (const msg of msgs) {
        const currentPath = [...path, msg];
        if (msg.id === targetId) {
          thread.push(...currentPath);
          return true;
        }
        if (msg.children && msg.children.length > 0) {
          if (findPath(msg.children, currentPath)) {
            return true;
          }
        }
      }
      return false;
    };
    
    findPath(messages, []);
    return thread;
  }, []);

  // Get current message thread
  const messageThread = useMemo(() => {
    return getMessageThread(selectedMessageId, conversationMessages);
  }, [selectedMessageId, conversationMessages, getMessageThread]);

  // Find message by ID
  const findMessageById = useCallback((id: string, messages: Message[] = conversationMessages): Message | null => {
    for (const msg of messages) {
      if (msg.id === id) return msg;
      if (msg.children && msg.children.length > 0) {
        const found = findMessageById(id, msg.children);
        if (found) return found;
      }
    }
    return null;
  }, [conversationMessages]);

  // Add message to conversation
  const addMessage = useCallback((newMessage: Omit<Message, 'id' | 'timestamp'>, parentId?: string) => {
    const message: Message = {
      ...newMessage,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    if (!parentId) {
      // Add as root message
      return [...conversationMessages, message];
    } else {
      // Add as child to specific parent
      const addToParent = (messages: Message[]): Message[] => {
        return messages.map(msg => {
          if (msg.id === parentId) {
            return {
              ...msg,
              children: [...msg.children, message]
            };
          }
          if (msg.children && msg.children.length > 0) {
            return {
              ...msg,
              children: addToParent(msg.children)
            };
          }
          return msg;
        });
      };
      return addToParent(conversationMessages);
    }
  }, [conversationMessages]);

  // Toggle message collapse state
  const toggleMessageCollapse = useCallback((messageId: string) => {
    const toggleInMessages = (messages: Message[]): Message[] => {
      return messages.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, collapsed: !msg.collapsed };
        }
        if (msg.children && msg.children.length > 0) {
          return {
            ...msg,
            children: toggleInMessages(msg.children)
          };
        }
        return msg;
      });
    };
    return toggleInMessages(conversationMessages);
  }, [conversationMessages]);

  // Node selection management
  const toggleNodeSelection = useCallback((nodeId: string, isMultiSelect: boolean = false) => {
    setSelectedNodes(prev => {
      const newSelection = new Set(prev);
      
      if (!isMultiSelect) {
        newSelection.clear();
      }
      
      if (newSelection.has(nodeId)) {
        newSelection.delete(nodeId);
      } else {
        newSelection.add(nodeId);
      }
      
      return newSelection;
    });
  }, []);

  // Clear node selection
  const clearNodeSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  // Get effective merge count (from your original code)
  const getEffectiveMergeCount = useCallback(() => {
    return selectedNodes.size;
  }, [selectedNodes]);

  return {
    // State
    selectedMessageId,
    selectedNodes,
    allMessages,
    messageThread,
    
    // Computed values
    currentMessage: getCurrentMessage(),
    effectiveMergeCount: getEffectiveMergeCount(),
    
    // Actions
    setSelectedMessageId,
    setSelectedNodes,
    toggleNodeSelection,
    clearNodeSelection,
    findMessageById,
    addMessage,
    toggleMessageCollapse,
    getAllMessages,
    getMessageThread,
  };
};