// src/services/databaseService.ts
import { supabase } from '../lib/supabase.ts';
import { Conversation, Message } from '../types/conversation';

export interface DatabaseConversation {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseMessage {
  id: string;
  conversation_id: string;
  parent_id: string | null;
  content: string;
  type: 'user' | 'assistant';
  timestamp: string;
  collapsed: boolean;
  merged_from: string[] | null;
  is_merge_root: boolean;
  position_x: number | null;
  position_y: number | null;
  created_at: string;
}

export interface NodePosition {
  message_id: string;
  x: number;
  y: number;
}

export class DatabaseService {
  // CONVERSATIONS

  static async loadConversations(): Promise<Conversation[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Load messages for each conversation
      const conversationsWithMessages = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await this.loadMessagesForConversation(conv.id);
          return {
            id: conv.id,
            name: conv.name,
            messages
          };
        })
      );

      return conversationsWithMessages;
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  static async createConversation(name: string): Promise<string | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.user.id,
          name: name.trim()
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }

  static async renameConversation(id: string, name: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ name: name.trim() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error renaming conversation:', error);
      return false;
    }
  }

  static async deleteConversation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  }

  // MESSAGES

  static async loadMessagesForConversation(conversationId: string): Promise<Message[]> {
    try {
      const { data: dbMessages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) throw error;

      // Convert database messages to nested structure
      return this.buildMessageTree(dbMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  }

  static async saveMessage(
    conversationId: string,
    parentId: string | null,
    message: Message
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          id: message.id,
          conversation_id: conversationId,
          parent_id: parentId,
          content: message.content,
          type: message.type,
          timestamp: message.timestamp,
          collapsed: message.collapsed,
          merged_from: message.mergedFrom || null,
          is_merge_root: message.isMergeRoot || false
        });

      if (error) throw error;

      // Update conversation's updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return true;
    } catch (error) {
      console.error('Error saving message:', error);
      return false;
    }
  }

  // NODE POSITIONS

  static async loadNodePositions(conversationId: string): Promise<Record<string, { x: number; y: number }>> {
    try {
      // Check authentication first
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        return {};
      }

      const { data, error } = await supabase
        .from('node_positions')
        .select('message_id, x, y')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.user.id);  // Filter by user_id

      if (error) {
        throw error;
      }

      const positions: Record<string, { x: number; y: number }> = {};
      data.forEach(pos => {
        positions[pos.message_id] = { x: pos.x, y: pos.y };
      });

      return positions;
    } catch (error) {
      return {};
    }
  }

  static async saveNodePosition(
    conversationId: string,
    messageId: string,
    x: number,
    y: number
  ): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('node_positions')
        .upsert({
          user_id: user.user.id,
          conversation_id: conversationId,
          message_id: messageId,
          x,
          y
        }, {
          onConflict: 'user_id,conversation_id,message_id'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving node position:', error);
      return false;
    }
  }

  static async saveNodePositions(
    conversationId: string,
    positions: Record<string, { x: number; y: number }>
  ): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const upsertData = Object.entries(positions).map(([messageId, pos]) => ({
        user_id: user.user.id,
        conversation_id: conversationId,
        message_id: messageId,
        x: pos.x,
        y: pos.y
      }));


      const { error } = await supabase
        .from('node_positions')
        .upsert(upsertData, {
          onConflict: 'user_id,conversation_id,message_id'
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // HELPER METHODS

  private static buildMessageTree(dbMessages: DatabaseMessage[]): Message[] {
    const messageMap = new Map<string, Message>();
    const rootMessages: Message[] = [];

    // First pass: create all message objects
    dbMessages.forEach(dbMsg => {
      const message: Message = {
        id: dbMsg.id,
        type: dbMsg.type,
        content: dbMsg.content,
        timestamp: dbMsg.timestamp,
        collapsed: dbMsg.collapsed,
        children: [],
        mergedFrom: dbMsg.merged_from || undefined,
        isMergeRoot: dbMsg.is_merge_root
      };
      messageMap.set(dbMsg.id, message);
    });

    // Second pass: build the tree structure
    dbMessages.forEach(dbMsg => {
      const message = messageMap.get(dbMsg.id)!;

      if (dbMsg.parent_id) {
        const parent = messageMap.get(dbMsg.parent_id);
        if (parent) {
          parent.children.push(message);
        }
      } else {
        rootMessages.push(message);
      }
    });

    return rootMessages;
  }

  // BATCH OPERATIONS

  static async syncConversationToDatabase(conversation: Conversation): Promise<boolean> {
    try {
      // This is useful for migrating existing in-memory conversations to the database
      const conversationId = await this.createConversation(conversation.name);
      if (!conversationId) return false;

      // Save all messages
      const allMessages = this.flattenMessages(conversation.messages);

      for (const messageWithParent of allMessages) {
        await this.saveMessage(conversationId, messageWithParent.parentId, messageWithParent.message);
      }

      return true;
    } catch (error) {
      console.error('Error syncing conversation to database:', error);
      return false;
    }
  }

  private static flattenMessages(
    messages: Message[],
    parentId: string | null = null
  ): Array<{ message: Message; parentId: string | null }> {
    let result: Array<{ message: Message; parentId: string | null }> = [];

    messages.forEach(message => {
      result.push({ message, parentId });

      if (message.children && message.children.length > 0) {
        result = result.concat(this.flattenMessages(message.children, message.id));
      }
    });

    return result;
  }

  // REALTIME SUBSCRIPTIONS (Optional)

  static subscribeToConversationChanges(
    conversationId: string,
    onMessagesUpdate: (messages: Message[]) => void
  ) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async () => {
          // Reload messages when changes occur
          const messages = await this.loadMessagesForConversation(conversationId);
          onMessagesUpdate(messages);
        }
      )
      .subscribe();
  }
}