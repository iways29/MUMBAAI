// Token Service for storing token usage in Supabase
// Note: This service is called from the client side after receiving a response
// to store token usage data in the database

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (uses same credentials as frontend)
const supabaseUrl = process.env.SUPABASE_URL || 'https://wsefpprvwjxtiwbmfaiq.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

let supabase = null;

const getSupabase = () => {
  if (!supabase && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
};

export const TokenService = {
  /**
   * Store token usage for a message
   * @param {Object} params - Token usage parameters
   * @param {string} params.userId - User ID
   * @param {string} params.conversationId - Conversation ID
   * @param {string} params.messageId - Message ID
   * @param {number} params.promptTokens - Number of prompt tokens
   * @param {number} params.completionTokens - Number of completion tokens
   * @param {string} params.model - Model name
   * @param {string} params.provider - Provider name (openai, anthropic, google)
   */
  async storeTokenUsage({
    userId,
    conversationId,
    messageId,
    promptTokens,
    completionTokens,
    model,
    provider
  }) {
    const client = getSupabase();
    if (!client) {
      console.warn('Supabase not configured, skipping token storage');
      return null;
    }

    try {
      const { data, error } = await client
        .from('token_usage')
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          message_id: messageId,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          model,
          provider
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing token usage:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Token storage error:', err);
      return null;
    }
  },

  /**
   * Update user activity summary
   * @param {Object} params - Activity parameters
   */
  async updateUserActivity({
    userId,
    messagesSent = 0,
    conversationsCreated = 0,
    branchesCreated = 0,
    mergesPerformed = 0,
    tokensUsed = 0,
    model = null
  }) {
    const client = getSupabase();
    if (!client) {
      console.warn('Supabase not configured, skipping activity update');
      return null;
    }

    try {
      // Call the stored function to update activity
      const { data, error } = await client.rpc('update_user_activity', {
        p_user_id: userId,
        p_messages_sent: messagesSent,
        p_conversations_created: conversationsCreated,
        p_branches_created: branchesCreated,
        p_merges_performed: mergesPerformed,
        p_tokens_used: tokensUsed,
        p_model: model
      });

      if (error) {
        console.error('Error updating user activity:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Activity update error:', err);
      return null;
    }
  }
};

export default TokenService;
