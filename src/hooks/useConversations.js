// src/hooks/useConversations.js
import { useState, useCallback } from 'react';

const useConversations = () => {
  const [conversations, setConversations] = useState([
    {
      id: 'conv-1',
      name: 'Project X',
      messages: [
        {
          id: 'msg-1',
          type: 'user',
          content: 'Hello, I need help with my project.',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          collapsed: false,
          children: [
            {
              id: 'msg-2',
              type: 'assistant',
              content: 'I\'d be happy to help! What kind of project are you working on?',
              timestamp: new Date(Date.now() - 240000).toISOString(),
              collapsed: false,
              children: [
                {
                  id: 'msg-3',
                  type: 'user',
                  content: 'It\'s a web application for task management with real-time collaboration features.',
                  timestamp: new Date(Date.now() - 180000).toISOString(),
                  collapsed: false,
                  children: [
                    {
                      id: 'msg-4',
                      type: 'assistant',
                      content: 'Great! Task management apps are very useful. What features do you want to include? Real-time collaboration is exciting - are you thinking about WebSocket integration?',
                      timestamp: new Date(Date.now() - 120000).toISOString(),
                      collapsed: false,
                      children: []
                    }
                  ]
                },
                {
                  id: 'msg-5',
                  type: 'user',
                  content: 'Actually, it\'s a mobile app instead. I want to focus on React Native.',
                  timestamp: new Date(Date.now() - 150000).toISOString(),
                  collapsed: false,
                  children: [
                    {
                      id: 'msg-6',
                      type: 'assistant',
                      content: 'Mobile apps are exciting! React Native is a great choice. Are you thinking iOS, Android, or cross-platform? What\'s your experience level with React Native?',
                      timestamp: new Date(Date.now() - 60000).toISOString(),
                      collapsed: false,
                      children: []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]);

  const [activeConversation, setActiveConversation] = useState('conv-1');
  const [selectedMessageId, setSelectedMessageId] = useState('msg-4');

  // Helper function to find a message by ID
  const findMessage = useCallback((messages, messageId) => {
    for (const message of messages) {
      if (message.id === messageId) {
        return message;
      }
      const found = findMessage(message.children || [], messageId);
      if (found) return found;
    }
    return null;
  }, []);

  // Add a new message to a conversation
  const addMessage = useCallback((conversationId, parentMessageId, newMessage) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id !== conversationId) return conv;

      if (!parentMessageId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage]
        };
      }

      const addToMessages = (messages) => {
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
  }, []);

  // Create a new conversation
  const createNewConversation = useCallback(() => {
    const newConv = {
      id: `conv-${Date.now()}`,
      name: `New Conversation ${conversations.length + 1}`,
      messages: []
    };
    setConversations(prev => [...prev, newConv]);
    setActiveConversation(newConv.id);
    setSelectedMessageId(null);
  }, [conversations.length]);

  // Rename a conversation
  const renameConversation = useCallback((conversationId, newName) => {
    setConversations(prev => prev.map(conv => 
      conv.id === conversationId ? { ...conv, name: newName } : conv
    ));
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback((conversationId) => {
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== conversationId);
      // If we deleted the active conversation, switch to the first available one
      if (conversationId === activeConversation && filtered.length > 0) {
        setActiveConversation(filtered[0].id);
        setSelectedMessageId(null);
      }
      return filtered;
    });
  }, [activeConversation]);

  // Get the current conversation
  const currentConversation = conversations.find(c => c.id === activeConversation);

  // Get message thread (path from root to selected message)
  const getMessageThread = useCallback(() => {
    const conversation = conversations.find(c => c.id === activeConversation);
    if (!conversation || !selectedMessageId) return [];

    const getPath = (messages, targetId, path = []) => {
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

    // Handle merged nodes
    const selectedMessage = findMessage(conversation.messages, selectedMessageId);
    if (selectedMessage && selectedMessage.isMergeRoot) {
      return [selectedMessage];
    }

    const mergeRootIndex = fullPath.findIndex(msg => msg.isMergeRoot);
    if (mergeRootIndex !== -1) {
      return fullPath.slice(mergeRootIndex);
    }

    return fullPath;
  }, [conversations, activeConversation, selectedMessageId, findMessage]);

  // Get current selected message
  const getCurrentMessage = useCallback(() => {
    if (!selectedMessageId) return null;
    return findMessage(currentConversation?.messages || [], selectedMessageId);
  }, [selectedMessageId, currentConversation, findMessage]);

  // Get all messages (flattened)
  const getAllMessages = useCallback((messages) => {
    let allMessages = [];
    const traverse = (msgs) => {
      msgs.forEach(msg => {
        allMessages.push(msg);
        if (msg.children) traverse(msg.children);
      });
    };
    traverse(messages);
    return allMessages;
  }, []);

  // Send a message
  const sendMessage = useCallback(async (inputText, setInputText, setIsLoading) => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      content: inputText,
      timestamp: new Date().toISOString(),
      collapsed: false,
      children: []
    };

    addMessage(activeConversation, selectedMessageId, userMessage);
    setSelectedMessageId(userMessage.id);

    const userInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      const thread = getMessageThread();
      const contextMessages = thread.map(msg =>
        `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n');

      const contextPrompt = `Here is our conversation history:\n\n${contextMessages}\n\nHuman: ${userInput}\n\nPlease respond naturally, taking into account the full conversation context above.`;

      // API call would go here
      // For now, simulate with timeout
      await new Promise(resolve => setTimeout(resolve, 1000));

      const assistantMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: 'This is a simulated response. In a real app, this would come from your AI API.',
        timestamp: new Date().toISOString(),
        collapsed: false,
        children: []
      };

      addMessage(activeConversation, userMessage.id, assistantMessage);
      setSelectedMessageId(assistantMessage.id);

    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        collapsed: false,
        children: []
      };

      addMessage(activeConversation, userMessage.id, errorMessage);
      setSelectedMessageId(errorMessage.id);
    } finally {
      setIsLoading(false);
    }
  }, [activeConversation, selectedMessageId, addMessage, getMessageThread]);

  return {
    // State
    conversations,
    activeConversation,
    selectedMessageId,
    currentConversation,
    
    // Setters
    setActiveConversation,
    setSelectedMessageId,
    
    // Actions
    addMessage,
    createNewConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
    
    // Computed values
    getMessageThread,
    getCurrentMessage,
    getAllMessages,
    findMessage
  };
};

export default useConversations;