import { supabase } from '../lib/supabase.ts';

// Types for admin metrics
export interface DailyActiveUsers {
  date: string;
  activeUsers: number;
}

export interface UserGrowthData {
  week: string;
  newUsers: number;
  totalUsers: number;
  growthRate: number;
}

export interface ModelUsageData {
  model: string;
  provider: string;
  count: number;
  percentage: number;
  totalTokens: number;
}

export interface ChatsPerUserData {
  userId: string;
  email: string;
  conversationCount: number;
  totalMessages: number;
  avgMessagesPerChat: number;
}

export interface TokenUsageData {
  avgTokensPerConversation: number;
  totalTokens: number;
  totalConversations: number;
}

export interface BranchData {
  totalSplits: number;
  totalMerges: number;
  avgSplitsPerConversation: number;
  avgMergesPerConversation: number;
}

export interface UserTokenUsage {
  userId: string;
  email: string;
  totalTokens: number;
  messageCount: number;
  avgTokensPerMessage: number;
}

export interface UserActivityData {
  userId: string;
  email: string;
  daysActive: number;
  firstActivity: string;
  lastActivity: string;
}

export interface AdminOverviewMetrics {
  totalUsers: number;
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalTokensUsed: number;
  avgDaysActive: number;
}

// Helper to get date ranges
const getDateRange = (days: number): { start: Date; end: Date } => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { start, end };
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const AdminService = {
  // ============================================
  // OVERVIEW METRICS
  // ============================================

  async getOverviewMetrics(): Promise<AdminOverviewMetrics> {
    const today = formatDate(new Date());
    const weekAgo = formatDate(getDateRange(7).start);
    const monthAgo = formatDate(getDateRange(30).start);

    // Get total users count
    const { count: totalUsers } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    // Get DAU (today's active users)
    const { data: dauData } = await supabase
      .from('user_activity_summary')
      .select('user_id')
      .eq('activity_date', today);

    // Get WAU (weekly active users)
    const { data: wauData } = await supabase
      .from('user_activity_summary')
      .select('user_id')
      .gte('activity_date', weekAgo);

    // Get MAU (monthly active users)
    const { data: mauData } = await supabase
      .from('user_activity_summary')
      .select('user_id')
      .gte('activity_date', monthAgo);

    // Get total conversations
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    // Get total messages
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });

    // Get total tokens
    const { data: tokenData } = await supabase
      .from('token_usage')
      .select('total_tokens');

    const totalTokensUsed = tokenData?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0;

    // Get average days active
    const { data: activityData } = await supabase
      .from('user_activity_summary')
      .select('user_id, activity_date');

    const userDaysMap = new Map<string, Set<string>>();
    activityData?.forEach(row => {
      if (!userDaysMap.has(row.user_id)) {
        userDaysMap.set(row.user_id, new Set());
      }
      userDaysMap.get(row.user_id)?.add(row.activity_date);
    });

    const daysActiveArray = Array.from(userDaysMap.values()).map(dates => dates.size);
    const avgDaysActive = daysActiveArray.length > 0
      ? daysActiveArray.reduce((a, b) => a + b, 0) / daysActiveArray.length
      : 0;

    return {
      totalUsers: totalUsers || 0,
      dailyActiveUsers: new Set(dauData?.map(d => d.user_id)).size,
      weeklyActiveUsers: new Set(wauData?.map(d => d.user_id)).size,
      monthlyActiveUsers: new Set(mauData?.map(d => d.user_id)).size,
      totalConversations: totalConversations || 0,
      totalMessages: totalMessages || 0,
      totalTokensUsed,
      avgDaysActive: Math.round(avgDaysActive * 10) / 10,
    };
  },

  // ============================================
  // DAILY ACTIVE USERS
  // ============================================

  async getDailyActiveUsers(days: number = 30): Promise<DailyActiveUsers[]> {
    const { start } = getDateRange(days);

    const { data, error } = await supabase
      .from('user_activity_summary')
      .select('activity_date, user_id')
      .gte('activity_date', formatDate(start))
      .order('activity_date', { ascending: true });

    if (error) {
      console.error('Error fetching DAU:', error);
      return [];
    }

    // Group by date and count unique users
    const dateMap = new Map<string, Set<string>>();
    data?.forEach(row => {
      if (!dateMap.has(row.activity_date)) {
        dateMap.set(row.activity_date, new Set());
      }
      dateMap.get(row.activity_date)?.add(row.user_id);
    });

    return Array.from(dateMap.entries()).map(([date, users]) => ({
      date,
      activeUsers: users.size,
    }));
  },

  // ============================================
  // USER GROWTH TRENDS
  // ============================================

  async getUserGrowthTrends(weeks: number = 8): Promise<UserGrowthData[]> {
    const results: UserGrowthData[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 7);

      // Get users created in this week
      const { count: newUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart.toISOString())
        .lt('created_at', weekEnd.toISOString());

      // Get total users up to this week
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .lt('created_at', weekEnd.toISOString());

      const prevTotal = results.length > 0 ? results[results.length - 1].totalUsers : 0;
      const growthRate = prevTotal > 0 ? ((totalUsers || 0) - prevTotal) / prevTotal * 100 : 0;

      results.push({
        week: formatDate(weekStart),
        newUsers: newUsers || 0,
        totalUsers: totalUsers || 0,
        growthRate: Math.round(growthRate * 10) / 10,
      });
    }

    return results;
  },

  // ============================================
  // LLM USAGE PERCENTAGE
  // ============================================

  async getLLMUsagePercentage(): Promise<ModelUsageData[]> {
    const { data, error } = await supabase
      .from('token_usage')
      .select('model, provider, total_tokens');

    if (error) {
      console.error('Error fetching LLM usage:', error);
      return [];
    }

    // Group by model
    const modelMap = new Map<string, { provider: string; count: number; tokens: number }>();
    data?.forEach(row => {
      const key = row.model;
      if (!modelMap.has(key)) {
        modelMap.set(key, { provider: row.provider, count: 0, tokens: 0 });
      }
      const entry = modelMap.get(key)!;
      entry.count += 1;
      entry.tokens += row.total_tokens || 0;
    });

    const totalCount = Array.from(modelMap.values()).reduce((sum, v) => sum + v.count, 0);

    return Array.from(modelMap.entries())
      .map(([model, data]) => ({
        model,
        provider: data.provider,
        count: data.count,
        percentage: totalCount > 0 ? Math.round(data.count / totalCount * 1000) / 10 : 0,
        totalTokens: data.tokens,
      }))
      .sort((a, b) => b.count - a.count);
  },

  // ============================================
  // CHATS PER USER
  // ============================================

  async getChatsPerUser(): Promise<ChatsPerUserData[]> {
    // Get all conversations grouped by user
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('user_id, id');

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    // Group by user
    const userMap = new Map<string, string[]>();
    conversations?.forEach(row => {
      if (!userMap.has(row.user_id)) {
        userMap.set(row.user_id, []);
      }
      userMap.get(row.user_id)?.push(row.id);
    });

    // Get message counts per conversation
    const results: ChatsPerUserData[] = [];
    for (const [userId, convIds] of userMap.entries()) {
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', convIds);

      results.push({
        userId,
        email: '', // Would need to fetch from auth.users
        conversationCount: convIds.length,
        totalMessages: totalMessages || 0,
        avgMessagesPerChat: convIds.length > 0 ? Math.round((totalMessages || 0) / convIds.length) : 0,
      });
    }

    return results.sort((a, b) => b.conversationCount - a.conversationCount);
  },

  // ============================================
  // TOKENS PER CONVERSATION
  // ============================================

  async getTokensPerConversation(): Promise<TokenUsageData> {
    const { data, error } = await supabase
      .from('token_usage')
      .select('conversation_id, total_tokens');

    if (error) {
      console.error('Error fetching token usage:', error);
      return { avgTokensPerConversation: 0, totalTokens: 0, totalConversations: 0 };
    }

    // Group by conversation
    const convMap = new Map<string, number>();
    let totalTokens = 0;
    data?.forEach(row => {
      const tokens = row.total_tokens || 0;
      totalTokens += tokens;
      convMap.set(row.conversation_id, (convMap.get(row.conversation_id) || 0) + tokens);
    });

    const totalConversations = convMap.size;
    const avgTokensPerConversation = totalConversations > 0
      ? Math.round(totalTokens / totalConversations)
      : 0;

    return { avgTokensPerConversation, totalTokens, totalConversations };
  },

  // ============================================
  // SPLITS AND COMBINES PER CONVERSATION
  // ============================================

  async getSplitsAndCombines(): Promise<BranchData> {
    const { data, error } = await supabase
      .from('user_activity_summary')
      .select('branches_created, merges_performed');

    if (error) {
      console.error('Error fetching branch data:', error);
      return { totalSplits: 0, totalMerges: 0, avgSplitsPerConversation: 0, avgMergesPerConversation: 0 };
    }

    const totalSplits = data?.reduce((sum, row) => sum + (row.branches_created || 0), 0) || 0;
    const totalMerges = data?.reduce((sum, row) => sum + (row.merges_performed || 0), 0) || 0;

    // Get total conversations for averages
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    const convCount = totalConversations || 1;

    return {
      totalSplits,
      totalMerges,
      avgSplitsPerConversation: Math.round(totalSplits / convCount * 10) / 10,
      avgMergesPerConversation: Math.round(totalMerges / convCount * 10) / 10,
    };
  },

  // ============================================
  // TOKEN USAGE PER USER
  // ============================================

  async getTokenUsagePerUser(): Promise<UserTokenUsage[]> {
    const { data, error } = await supabase
      .from('token_usage')
      .select('user_id, total_tokens');

    if (error) {
      console.error('Error fetching user token usage:', error);
      return [];
    }

    // Group by user
    const userMap = new Map<string, { tokens: number; count: number }>();
    data?.forEach(row => {
      if (!userMap.has(row.user_id)) {
        userMap.set(row.user_id, { tokens: 0, count: 0 });
      }
      const entry = userMap.get(row.user_id)!;
      entry.tokens += row.total_tokens || 0;
      entry.count += 1;
    });

    return Array.from(userMap.entries())
      .map(([userId, data]) => ({
        userId,
        email: '', // Would need to fetch from auth.users
        totalTokens: data.tokens,
        messageCount: data.count,
        avgTokensPerMessage: data.count > 0 ? Math.round(data.tokens / data.count) : 0,
      }))
      .sort((a, b) => b.totalTokens - a.totalTokens);
  },

  // ============================================
  // AVERAGE DAYS ACTIVE
  // ============================================

  async getAverageDaysActive(): Promise<number> {
    const { data, error } = await supabase
      .from('user_activity_summary')
      .select('user_id, activity_date');

    if (error) {
      console.error('Error fetching activity data:', error);
      return 0;
    }

    // Group by user and count unique days
    const userDaysMap = new Map<string, Set<string>>();
    data?.forEach(row => {
      if (!userDaysMap.has(row.user_id)) {
        userDaysMap.set(row.user_id, new Set());
      }
      userDaysMap.get(row.user_id)?.add(row.activity_date);
    });

    const daysActiveArray = Array.from(userDaysMap.values()).map(dates => dates.size);
    if (daysActiveArray.length === 0) return 0;

    const avg = daysActiveArray.reduce((a, b) => a + b, 0) / daysActiveArray.length;
    return Math.round(avg * 10) / 10;
  },

  // ============================================
  // USER ACTIVITY DETAILS
  // ============================================

  async getUserActivityDetails(): Promise<UserActivityData[]> {
    const { data, error } = await supabase
      .from('user_activity_summary')
      .select('user_id, activity_date, first_activity_at, last_activity_at')
      .order('activity_date', { ascending: true });

    if (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }

    // Group by user
    const userMap = new Map<string, { dates: Set<string>; first: string; last: string }>();
    data?.forEach(row => {
      if (!userMap.has(row.user_id)) {
        userMap.set(row.user_id, {
          dates: new Set(),
          first: row.first_activity_at || row.activity_date,
          last: row.last_activity_at || row.activity_date,
        });
      }
      const entry = userMap.get(row.user_id)!;
      entry.dates.add(row.activity_date);
      if (row.first_activity_at && row.first_activity_at < entry.first) {
        entry.first = row.first_activity_at;
      }
      if (row.last_activity_at && row.last_activity_at > entry.last) {
        entry.last = row.last_activity_at;
      }
    });

    return Array.from(userMap.entries())
      .map(([userId, data]) => ({
        userId,
        email: '',
        daysActive: data.dates.size,
        firstActivity: data.first,
        lastActivity: data.last,
      }))
      .sort((a, b) => b.daysActive - a.daysActive);
  },
};

export default AdminService;
