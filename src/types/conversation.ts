export interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: string;
    collapsed: boolean;
    children: Message[];
    mergedFrom?: string[];
    isMergeRoot?: boolean;
    model?: string;
  }
  
  export interface Conversation {
    id: string;
    name: string;
    messages: Message[];
  }
  
  export interface ConversationState {
    conversations: Conversation[];
    activeConversation: string;
    selectedMessageId: string;
    selectedNodes: Set<string>;
    inputText: string;
    isLoading: boolean;
  }
  
  export interface MessageOperations {
    sendMessage: () => Promise<void>;
    addMessage: (conversationId: string, parentMessageId: string | null, newMessage: Message) => void;
    findMessage: (messages: Message[], messageId: string) => Message | null;
    getMessageThread: () => Message[];
    performIntelligentMerge: () => Promise<void>;
  }
  
  export interface ConversationOperations {
    createNewConversation: () => void;
    setActiveConversation: (id: string) => void;
    renameConversation: (id: string, name: string) => void;
    deleteConversation: (id: string) => void;
  }