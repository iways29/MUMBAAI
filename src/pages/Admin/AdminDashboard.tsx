import React, { useState, useEffect } from 'react'
import {
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
  GitBranch,
  GitMerge,
  Activity,
  Calendar,
  BarChart3
} from 'lucide-react'
import { DatabaseService } from '../../services/databaseService.ts'

interface OverviewStats {
  total_users: number
  total_conversations: number
  total_messages: number
  total_tokens: number
}

interface DailyActiveUser {
  date: string
  active_users: number
}

interface UserGrowth {
  week: string
  new_users: number
  cumulative_users: number
}

interface LLMUsage {
  model: string
  provider: string
  message_count: number
  token_count: number
  percentage: number
}

interface ConversationStats {
  avg_messages_per_conversation: number
  avg_tokens_per_conversation: number
  total_splits: number
  total_merges: number
}

interface ActivityStats {
  avg_days_active: number
  users_active_today: number
  users_active_this_week: number
}

interface BranchStats {
  total_conversations: number
  conversations_with_splits: number
  conversations_with_merges: number
  avg_splits_per_conversation: number
  avg_merges_per_conversation: number
}

interface UserUsage {
  user_id: string
  email: string
  display_name: string | null
  joined_at: string
  last_active: string | null
  conversation_count: number
  total_tokens: number
  message_count: number
  days_active: number
}

const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [dailyActiveUsers, setDailyActiveUsers] = useState<DailyActiveUser[]>([])
  const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([])
  const [llmUsage, setLLMUsage] = useState<LLMUsage[]>([])
  const [conversationStats, setConversationStats] = useState<ConversationStats | null>(null)
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null)
  const [branchStats, setBranchStats] = useState<BranchStats | null>(null)
  const [userUsage, setUserUsage] = useState<UserUsage[]>([])

  useEffect(() => {
    const fetchAllStats = async () => {
      try {
        const [
          overviewData,
          dauData,
          growthData,
          llmData,
          convData,
          activityData,
          branchData,
          userUsageData
        ] = await Promise.all([
          DatabaseService.getAdminOverviewStats(),
          DatabaseService.getDailyActiveUsers(14),
          DatabaseService.getUserGrowth(8),
          DatabaseService.getLLMUsageStats(),
          DatabaseService.getConversationStats(),
          DatabaseService.getAvgDaysActive(),
          DatabaseService.getBranchStats(),
          DatabaseService.getUserUsageStats(10)
        ])

        setOverview(overviewData)
        setDailyActiveUsers(dauData)
        setUserGrowth(growthData)
        setLLMUsage(llmData)
        setConversationStats(convData)
        setActivityStats(activityData)
        setBranchStats(branchData)
        setUserUsage(userUsageData)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAllStats()
  }, [])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num?.toString() || '0'
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getProviderColor = (provider: string): string => {
    switch (provider) {
      case 'anthropic': return 'bg-orange-500'
      case 'openai': return 'bg-green-500'
      case 'google': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-800">Analytics Dashboard</h1>
          <p className="text-stone-600 mt-1">Loading analytics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
              <div className="h-12 w-12 bg-stone-200 rounded-xl mb-4"></div>
              <div className="h-8 w-16 bg-stone-200 rounded mb-2"></div>
              <div className="h-4 w-24 bg-stone-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-stone-800">Analytics Dashboard</h1>
        <p className="text-stone-600 mt-1">
          Platform usage and performance metrics
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={overview?.total_users || 0}
          subtitle={`${activityStats?.users_active_today || 0} active today`}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title="Conversations"
          value={overview?.total_conversations || 0}
          subtitle={`${conversationStats?.avg_messages_per_conversation?.toFixed(1) || 0} avg nodes`}
          icon={MessageSquare}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Tokens"
          value={formatNumber(overview?.total_tokens || 0)}
          subtitle={`${formatNumber(conversationStats?.avg_tokens_per_conversation || 0)} avg/convo`}
          icon={Zap}
          color="bg-amber-500"
        />
        <StatCard
          title="Avg Days Active"
          value={activityStats?.avg_days_active?.toFixed(1) || '0'}
          subtitle={`${activityStats?.users_active_this_week || 0} active this week`}
          icon={Calendar}
          color="bg-green-500"
        />
      </div>

      {/* DAU Chart + User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Active Users */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-stone-800">Daily Active Users</h2>
          </div>
          {dailyActiveUsers.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-32">
                {dailyActiveUsers.slice(-14).map((day, i) => {
                  const maxUsers = Math.max(...dailyActiveUsers.map(d => d.active_users), 1)
                  const height = (day.active_users / maxUsers) * 100
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${formatDate(day.date)}: ${day.active_users} users`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-xs text-stone-400">
                <span>{dailyActiveUsers.length > 0 && formatDate(dailyActiveUsers[0].date)}</span>
                <span>Last 14 days</span>
                <span>{dailyActiveUsers.length > 0 && formatDate(dailyActiveUsers[dailyActiveUsers.length - 1].date)}</span>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-stone-400">
              No activity data yet
            </div>
          )}
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-stone-800">User Growth (Weekly)</h2>
          </div>
          {userGrowth.length > 0 ? (
            <div className="space-y-3">
              {userGrowth.slice(-6).map((week, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-stone-500 w-16">{formatDate(week.week)}</span>
                  <div className="flex-1 bg-stone-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-green-500 h-full rounded-full transition-all"
                      style={{
                        width: `${(week.cumulative_users / Math.max(...userGrowth.map(w => w.cumulative_users), 1)) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-stone-700 w-12 text-right">
                    {week.cumulative_users}
                  </span>
                  {week.new_users > 0 && (
                    <span className="text-xs text-green-600 w-10">+{week.new_users}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-stone-400">
              No growth data yet
            </div>
          )}
        </div>
      </div>

      {/* LLM Usage + Branch Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LLM Usage Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-semibold text-stone-800">LLM Usage Distribution</h2>
          </div>
          {llmUsage.length > 0 ? (
            <div className="space-y-3">
              {llmUsage.slice(0, 6).map((model, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-700 font-medium">{model.model}</span>
                    <span className="text-stone-500">{model.percentage}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`${getProviderColor(model.provider)} h-full rounded-full transition-all`}
                        style={{ width: `${model.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-400 w-16 text-right">
                      {formatNumber(model.token_count)} tok
                    </span>
                  </div>
                </div>
              ))}
              <div className="flex gap-4 mt-4 pt-4 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-stone-500">Anthropic</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-stone-500">OpenAI</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-stone-500">Google</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-stone-400">
              No usage data yet
            </div>
          )}
        </div>

        {/* Branch & Merge Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-stone-800">Splits & Merges</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-stone-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <GitBranch className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-stone-600">Total Splits</span>
              </div>
              <div className="text-2xl font-bold text-stone-800">
                {conversationStats?.total_splits || 0}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                ~{branchStats?.avg_splits_per_conversation?.toFixed(1) || 0} per convo
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <GitMerge className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-stone-600">Total Merges</span>
              </div>
              <div className="text-2xl font-bold text-stone-800">
                {conversationStats?.total_merges || 0}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                ~{branchStats?.avg_merges_per_conversation?.toFixed(1) || 0} per convo
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl p-4">
              <div className="text-sm text-stone-600 mb-2">Convos with Splits</div>
              <div className="text-2xl font-bold text-stone-800">
                {branchStats?.conversations_with_splits || 0}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                {branchStats?.total_conversations ?
                  `${((branchStats.conversations_with_splits / branchStats.total_conversations) * 100).toFixed(0)}%`
                  : '0%'} of total
              </div>
            </div>
            <div className="bg-stone-50 rounded-xl p-4">
              <div className="text-sm text-stone-600 mb-2">Convos with Merges</div>
              <div className="text-2xl font-bold text-stone-800">
                {branchStats?.conversations_with_merges || 0}
              </div>
              <div className="text-xs text-stone-500 mt-1">
                {branchStats?.total_conversations ?
                  `${((branchStats.conversations_with_merges / branchStats.total_conversations) * 100).toFixed(0)}%`
                  : '0%'} of total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Users by Token Usage */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-stone-800">Top Users by Token Usage</h2>
        </div>
        {userUsage.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-stone-500 border-b border-stone-100">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium text-right">Conversations</th>
                  <th className="pb-3 font-medium text-right">Messages</th>
                  <th className="pb-3 font-medium text-right">Tokens</th>
                  <th className="pb-3 font-medium text-right">Days Active</th>
                  <th className="pb-3 font-medium text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {userUsage.map((user, i) => (
                  <tr key={user.user_id} className="border-b border-stone-50 hover:bg-stone-50">
                    <td className="py-3">
                      <div className="font-medium text-stone-800">
                        {user.display_name || user.email.split('@')[0]}
                      </div>
                      <div className="text-xs text-stone-500">{user.email}</div>
                    </td>
                    <td className="py-3 text-right text-stone-700">{user.conversation_count}</td>
                    <td className="py-3 text-right text-stone-700">{user.message_count}</td>
                    <td className="py-3 text-right font-medium text-stone-800">
                      {formatNumber(user.total_tokens)}
                    </td>
                    <td className="py-3 text-right text-stone-700">{user.days_active}</td>
                    <td className="py-3 text-right text-stone-500 text-sm">
                      {user.last_active ? formatDate(user.last_active) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-stone-400">
            No user data yet
          </div>
        )}
      </div>
    </div>
  )
}

// Stat Card Component
interface StatCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="text-3xl font-bold text-stone-800 mb-1">{value}</div>
    <div className="text-sm text-stone-500">{subtitle}</div>
    <div className="text-xs text-stone-400 mt-2">{title}</div>
  </div>
)

export default AdminDashboard
