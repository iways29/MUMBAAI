import { Conversation } from '../types/conversation';

class StorageService {
  private storageKey = 'flowchat_conversations';

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  }

  loadConversations(): Conversation[] {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
    return [];
  }

  exportConversation(conversation: Conversation): string {
    return JSON.stringify(conversation, null, 2);
  }

  exportAllConversations(conversations: Conversation[]): string {
    return JSON.stringify(conversations, null, 2);
  }

  clearStorage(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();