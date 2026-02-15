import { Message, Conversation } from '../types/conversation.ts';

export const MessageHelpers = {
  // Find a message by ID in a nested message tree
  findMessage(messages: Message[], messageId: string): Message | null {
    for (const message of messages) {
      if (message.id === messageId) {
        return message;
      }
      const found = this.findMessage(message.children || [], messageId);
      if (found) return found;
    }
    return null;
  },

  // Get all messages in a flat array
  getAllMessages(messages: Message[]): Message[] {
    let allMessages: Message[] = [];
    const traverse = (msgs: Message[]) => {
      msgs.forEach(msg => {
        allMessages.push(msg);
        if (msg.children) traverse(msg.children);
      });
    };
    traverse(messages);
    return allMessages;
  },

  // Add a message to a conversation
  addMessageToConversation(
    conversation: Conversation, 
    parentMessageId: string | null, 
    newMessage: Message
  ): Conversation {
    if (!parentMessageId) {
      return {
        ...conversation,
        messages: [...conversation.messages, newMessage]
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
      ...conversation,
      messages: addToMessages(conversation.messages)
    };
  },

  // Get the path from root to a specific message
  getMessagePath(messages: Message[], targetId: string, path: Message[] = []): Message[] | null {
    for (const msg of messages) {
      const newPath = [...path, msg];
      if (msg.id === targetId) {
        return newPath;
      }
      const found = this.getMessagePath(msg.children || [], targetId, newPath);
      if (found) return found;
    }
    return null;
  },

  // Get conversation thread up to a specific message
  getConversationThread(conversation: Conversation, selectedMessageId: string): Message[] {
    if (!selectedMessageId) return [];

    const fullPath = this.getMessagePath(conversation.messages, selectedMessageId) || [];
    const selectedMessage = this.findMessage(conversation.messages, selectedMessageId);
    
    if (selectedMessage && selectedMessage.isMergeRoot) {
      return [selectedMessage];
    }

    const mergeRootIndex = fullPath.findIndex(msg => msg.isMergeRoot);
    if (mergeRootIndex !== -1) {
      return fullPath.slice(mergeRootIndex);
    }

    return fullPath;
  },

  // Create a new message
  createMessage(
    type: 'user' | 'assistant',
    content: string,
    options: {
      mergedFrom?: string[];
      isMergeRoot?: boolean;
      model?: string;
    } = {}
  ): Message {
    return {
      id: `msg-${Date.now()}`,
      type,
      content,
      timestamp: new Date().toISOString(),
      collapsed: false,
      children: [],
      ...options
    };
  },

  // Format timestamp for display
  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  // Truncate text for display
  truncateText(text: string, maxLength: number = 120): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Check if message is a merged node
  isMergedMessage(message: Message): boolean {
    return !!(message.mergedFrom && message.mergedFrom.length > 0);
  },

  // Get message statistics
  getMessageStats(messages: Message[]) {
    const allMessages = this.getAllMessages(messages);
    return {
      total: allMessages.length,
      userMessages: allMessages.filter(m => m.type === 'user').length,
      assistantMessages: allMessages.filter(m => m.type === 'assistant').length,
      mergedMessages: allMessages.filter(m => this.isMergedMessage(m)).length,
      branches: allMessages.filter(m => m.children && m.children.length > 1).length
    };
  }
};