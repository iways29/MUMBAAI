import { useState, useCallback, useEffect } from 'react';
import { Conversation, Message } from '../types/conversation';
import { storageService } from '../services/storageService';

export const useConversations = () => {
  // Load initial conversations from storage or use default
  const getInitialConversations = (): Conversation[] => {
    const saved = storageService.loadConversations();
    if (saved.length > 0) {
      return saved;
    }
    
    // Default conversation if no saved data
    return [
      {
        id: 'conv-1',
        name: 'Project Planning Discussion',
        messages: [
          {
            id: 'msg-1',
            type: 'user',
            content: 'I need help planning my new project. Can you guide me through the initial steps?',
            timestamp: new Date(Date.now() - 300000).toISOString(),
            collapsed: false,
            children: [
              {
                id: 'msg-2',
                type: 'assistant',
                content: 'I\'d be happy to help you plan your project! Let\'s start with understanding what you\'re building. What kind of project are you working on?',
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
    ];
  };

  const [conversations, setConversations] = useState<Conversation[]>(getInitialConversations);
  const [activeConversation, setActiveConversation] = useState('conv-1');
  const [isRenamingConversation, setIsRenamingConversation] = useState(false);
  const [tempConversationName, setTempConversationName] = useState('');

  // Auto-save conversations when they change
  useEffect(() => {
    storageService.saveConversations(conversations);
  }, [conversations]);

  // Get current conversation
  const currentConversation = conversations.find(c => c.id === activeConversation);

  // Create new conversation
  const createNewConversation = useCallback(() => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      name: `New Conversation ${conversations.length + 1}`,
      messages: []
    };
    setConversations(prev => [...prev, newConv]);
    setActiveConversation(newConv.id);
  }, [conversations.length]);

  // Update conversation name
  const updateConversationName = useCallback((id: string, name: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id ? { ...conv, name } : conv
      )
    );
  }, []);

  // Delete conversation
  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== id);
      if (activeConversation === id && filtered.length > 0) {
        setActiveConversation(filtered[0].id);
      }
      return filtered;
    });
  }, [activeConversation]);

  // Start renaming
  const startRenaming = useCallback(() => {
    if (currentConversation) {
      setTempConversationName(currentConversation.name);
      setIsRenamingConversation(true);
    }
  }, [currentConversation]);

  // Finish renaming
  const finishRenaming = useCallback(() => {
    if (currentConversation && tempConversationName.trim()) {
      updateConversationName(currentConversation.id, tempConversationName.trim());
    }
    setIsRenamingConversation(false);
    setTempConversationName('');
  }, [currentConversation, tempConversationName, updateConversationName]);

  // Cancel renaming
  const cancelRenaming = useCallback(() => {
    setIsRenamingConversation(false);
    setTempConversationName('');
  }, []);

  // Export functionality
  const exportConversation = useCallback((conversationId?: string) => {
    const convToExport = conversationId 
      ? conversations.find(c => c.id === conversationId)
      : currentConversation;
    
    if (convToExport) {
      return storageService.exportConversation(convToExport);
    }
    return '';
  }, [conversations, currentConversation]);

  const exportAllConversations = useCallback(() => {
    return storageService.exportAllConversations(conversations);
  }, [conversations]);

  const clearAllData = useCallback(() => {
    storageService.clearStorage();
    setConversations(getInitialConversations());
    setActiveConversation('conv-1');
  }, []);

  return {
    // State
    conversations,
    activeConversation,
    currentConversation,
    isRenamingConversation,
    tempConversationName,
    
    // Actions
    setActiveConversation,
    createNewConversation,
    updateConversationName,
    deleteConversation,
    startRenaming,
    finishRenaming,
    cancelRenaming,
    setTempConversationName,
    
    // Export and storage
    exportConversation,
    exportAllConversations,
    clearAllData,
    
    // Direct state setters (for complex operations)
    setConversations
  };
};