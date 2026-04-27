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
  model: string | null;
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
          is_merge_root: message.isMergeRoot || false,
          model: message.model || null
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

  static async updateMessageContent(messageId: string, content: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating message content:', error);
      return false;
    }
  }

  // NODE POSITIONS

  static async loadNodePositions(conversationId: string): Promise<Record<string, { x: number; y: number }>> {
    try {
      const { data, error } = await supabase
        .from('node_positions')
        .select('message_id, x, y')
        .eq('conversation_id', conversationId);

      if (error) throw error;

      const positions: Record<string, { x: number; y: number }> = {};
      data.forEach(pos => {
        positions[pos.message_id] = { x: pos.x, y: pos.y };
      });

      return positions;
    } catch (error) {
      console.error('Error loading node positions:', error);
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

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving node positions:', error);
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
        isMergeRoot: dbMsg.is_merge_root,
        model: dbMsg.model || undefined
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

  // TOKEN USAGE TRACKING

  static async saveTokenUsage(
    conversationId: string,
    messageId: string,
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    },
    model: string,
    provider: string
  ): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        console.warn('No authenticated user, skipping token usage tracking');
        return false;
      }

      const { error } = await supabase
        .from('token_usage')
        .insert({
          user_id: user.user.id,
          conversation_id: conversationId,
          message_id: messageId,
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          // total_tokens is a generated column - calculated automatically
          model: model,
          provider: provider
        });

      if (error) {
        console.error('Error saving token usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving token usage:', error);
      return false;
    }
  }

  // PRO INTEREST TRACKING

  static async trackProInterestEvent(
    eventType: 'button_click' | 'modal_open' | 'confirmed_interest' | 'dismissed',
    metadata?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('pro_interest_events')
        .insert({
          user_id: user.user?.id || null,
          event_type: eventType,
          metadata: metadata || {},
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking pro interest event:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error tracking pro interest event:', error);
      return false;
    }
  }

  // ADMIN ANALYTICS

  static async getAdminOverviewStats(): Promise<{
    total_users: number;
    total_conversations: number;
    total_messages: number;
    total_tokens: number;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('get_admin_overview_stats');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      return null;
    }
  }

  static async getDailyActiveUsers(daysBack: number = 30): Promise<Array<{
    date: string;
    active_users: number;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_daily_active_users', { days_back: daysBack });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching DAU:', error);
      return [];
    }
  }

  static async getUserGrowth(weeksBack: number = 12): Promise<Array<{
    week: string;
    new_users: number;
    cumulative_users: number;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_user_growth', { weeks_back: weeksBack });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user growth:', error);
      return [];
    }
  }

  static async getLLMUsageStats(): Promise<Array<{
    model: string;
    provider: string;
    message_count: number;
    token_count: number;
    percentage: number;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_llm_usage_stats');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching LLM usage:', error);
      return [];
    }
  }

  static async getConversationStats(): Promise<{
    avg_messages_per_conversation: number;
    avg_tokens_per_conversation: number;
    total_splits: number;
    total_merges: number;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('get_conversation_stats');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching conversation stats:', error);
      return null;
    }
  }

  static async getUserUsageStats(limitCount: number = 20): Promise<Array<{
    user_id: string;
    email: string;
    display_name: string | null;
    joined_at: string;
    last_active: string | null;
    conversation_count: number;
    total_tokens: number;
    message_count: number;
    days_active: number;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_user_usage_stats', { limit_count: limitCount });
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user usage stats:', error);
      return [];
    }
  }

  static async getAvgDaysActive(): Promise<{
    avg_days_active: number;
    users_active_today: number;
    users_active_this_week: number;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('get_avg_days_active');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching avg days active:', error);
      return null;
    }
  }

  static async getBranchStats(): Promise<{
    total_conversations: number;
    conversations_with_splits: number;
    conversations_with_merges: number;
    avg_splits_per_conversation: number;
    avg_merges_per_conversation: number;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('get_branch_stats');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching branch stats:', error);
      return null;
    }
  }

  // USER LIMITS & USAGE

  static async checkUserCanProceed(actionType: 'chat' | 'merge'): Promise<{
    allowed: boolean;
    reason?: string;
    limits?: {
      daily_token_limit: number | null;
      monthly_token_limit: number | null;
      daily_merge_limit: number | null;
      requests_per_minute: number;
    };
    usage?: {
      tokens_today: number;
      tokens_this_month: number;
      merges_today: number;
    };
  }> {
    try {
      const { data, error } = await supabase.rpc('check_user_can_proceed', {
        p_action_type: actionType
      });

      if (error) {
        console.error('Error checking user limits:', error);
        // Default to allowed if we can't check (fail open for UX, but log the error)
        return { allowed: true };
      }

      return data;
    } catch (error) {
      console.error('Error checking user limits:', error);
      return { allowed: true };
    }
  }

  static async incrementUserUsage(
    tokensUsed: number,
    isMerge: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('increment_user_usage', {
        p_tokens_used: tokensUsed,
        p_is_merge: isMerge
      });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  static async getEffectiveUserLimits(): Promise<{
    tier_name: string;
    tier_display_name: string;
    tier_color: string;
    daily_token_limit: number | null;
    monthly_token_limit: number | null;
    daily_merge_limit: number | null;
    requests_per_minute: number;
    allowed_model_ids: string[] | null;
    is_suspended: boolean;
    suspension_reason: string | null;
    is_admin: boolean;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('get_effective_user_limits');

      if (error) {
        console.error('Error getting effective limits:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting effective limits:', error);
      return null;
    }
  }

  static async getUserDailyUsage(): Promise<{
    tokens_used: number;
    merges_performed: number;
    requests_count: number;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_user_daily_usage');

      if (error) {
        console.error('Error getting daily usage:', error);
        return { tokens_used: 0, merges_performed: 0, requests_count: 0 };
      }

      return data || { tokens_used: 0, merges_performed: 0, requests_count: 0 };
    } catch (error) {
      console.error('Error getting daily usage:', error);
      return { tokens_used: 0, merges_performed: 0, requests_count: 0 };
    }
  }
}