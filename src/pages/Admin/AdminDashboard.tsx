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
  BarChart3,
  Mail,
  Flag,
  Bot
} from 'lucide-react'
import { DatabaseService } from '../../services/databaseService.ts'
import { supabase } from '../../lib/supabase.ts'
import { ReactComponent as AnthropicIcon } from '../../assets/anthropic.svg'
import { ReactComponent as OpenAIIcon } from '../../assets/openai.svg'
import { ReactComponent as GoogleIcon } from '../../assets/google-gemini.svg'

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

interface WaitlistStats {
  total_signups: number
  signups_today: number
  signups_this_week: number
  unique_companies: number
  solving_yes: number
  solving_no: number
  solving_maybe: number
}

interface WaitlistByProblemValidation {
  response: string
  count: number
  percentage: number
}

const ProviderIcon: React.FC<{ provider: string; size?: number }> = ({ provider, size = 13 }) => {
  if (provider === 'anthropic') return <AnthropicIcon width={size} height={size} className="text-bone" />
  if (provider === 'openai') return <OpenAIIcon width={size} height={size} className="text-bone" />
  if (provider === 'google') return <GoogleIcon width={size} height={size} className="text-bone" />
  return <Bot size={size} className="text-bone" />
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

  // Waitlist state
  const [waitlistEnabled, setWaitlistEnabled] = useState(false)
  const [waitlistStats, setWaitlistStats] = useState<WaitlistStats | null>(null)
  const [waitlistByProblemValidation, setWaitlistByProblemValidation] = useState<WaitlistByProblemValidation[]>([])
  const [togglingWaitlist, setTogglingWaitlist] = useState(false)

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
          userUsageData,
          waitlistConfigData,
          waitlistStatsData,
          waitlistProblemValidationData
        ] = await Promise.all([
          DatabaseService.getAdminOverviewStats(),
          DatabaseService.getDailyActiveUsers(14),
          DatabaseService.getUserGrowth(8),
          DatabaseService.getLLMUsageStats(),
          DatabaseService.getConversationStats(),
          DatabaseService.getAvgDaysActive(),
          DatabaseService.getBranchStats(),
          DatabaseService.getUserUsageStats(10),
          DatabaseService.getAppConfig('waitlist_enabled'),
          DatabaseService.getWaitlistStats(),
          DatabaseService.getWaitlistByProblemValidation()
        ])

        setOverview(overviewData)
        setDailyActiveUsers(dauData)
        setUserGrowth(growthData)
        setLLMUsage(llmData)
        setConversationStats(convData)
        setActivityStats(activityData)
        setBranchStats(branchData)
        setUserUsage(userUsageData)
        setWaitlistEnabled(waitlistConfigData?.enabled || false)
        setWaitlistStats(waitlistStatsData)
        setWaitlistByProblemValidation(waitlistProblemValidationData)
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

  const toggleWaitlistMode = async () => {
    setTogglingWaitlist(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        console.error('User not authenticated:', userError)
        alert('You must be logged in to toggle waitlist mode')
        return
      }

      const newValue = { enabled: !waitlistEnabled }

      const success = await DatabaseService.updateAppConfig(
        'waitlist_enabled',
        newValue,
        user?.id
      )

      if (success) {
        setWaitlistEnabled(!waitlistEnabled)
      } else {
        console.error('Failed to toggle waitlist mode - updateAppConfig returned false')
        alert('Failed to toggle waitlist mode. Check console for details.')
      }
    } catch (error) {
      console.error('Error toggling waitlist:', error)
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTogglingWaitlist(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-[28px] font-extralight text-bone tracking-display">Analytics</h1>
          <p className="text-smoke text-[14px] mt-1">Loading analytics…</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-panel border border-hairline rounded-node p-6 animate-pulse">
              <div className="h-8 w-16 bg-panel-2 rounded mb-2"></div>
              <div className="h-4 w-24 bg-panel-2 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 max-w-[1200px]">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-extralight text-bone tracking-display">Analytics</h1>
        <p className="text-smoke text-[14px] mt-1">
          Platform usage and performance metrics
        </p>
      </div>

      {/* Waitlist Mode Toggle & Metrics */}
      <div className="bg-panel border border-hairline rounded-node overflow-hidden">
        <div className="p-6 border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full border border-hairline flex items-center justify-center">
              <Flag size={16} className="text-plum" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-bone flex items-center gap-2">
                Waitlist Mode
                <span className={`text-[10px] px-2 py-0.5 rounded-pill border font-semibold uppercase tracking-kicker ${
                  waitlistEnabled
                    ? 'border-plum text-plum'
                    : 'border-hairline text-smoke'
                }`}>
                  {waitlistEnabled ? 'Active' : 'Disabled'}
                </span>
              </h2>
              <p className="text-[13px] text-smoke mt-0.5">
                {waitlistEnabled
                  ? 'Landing page shows waitlist signup form instead of auth'
                  : 'Users can sign in and access the full app'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleWaitlistMode}
            disabled={togglingWaitlist}
            className={`relative inline-flex h-7 w-12 items-center rounded-pill border transition-colors duration-fast ${
              waitlistEnabled ? 'bg-plum border-plum' : 'border-hairline-strong'
            } ${togglingWaitlist ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Toggle waitlist mode"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-bone transition-transform duration-fast ${
                waitlistEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {waitlistStats && waitlistStats.total_signups > 0 && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <MiniStat icon={Mail} label="Total" value={waitlistStats.total_signups} sub="Signups" />
              <MiniStat icon={TrendingUp} label="Today" value={waitlistStats.signups_today} sub="New signups" />
              <MiniStat icon={Calendar} label="This week" value={waitlistStats.signups_this_week} sub="Signups" />
              <MiniStat icon={Users} label="Companies" value={waitlistStats.unique_companies} sub="Unique orgs" />
            </div>

            {waitlistByProblemValidation.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold uppercase tracking-kicker text-smoke mb-3 flex items-center gap-2">
                  <BarChart3 size={13} />
                  "Are we solving a real problem?"
                </h3>
                <div className="space-y-2">
                  {waitlistByProblemValidation.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-20 text-[13px] text-ash flex-shrink-0 capitalize">
                        {item.response}
                      </div>
                      <div className="flex-1 h-5 rounded-pill overflow-hidden" style={{ background: 'var(--color-hairline)' }}>
                        <div
                          className={`h-full ${item.response === 'yes' ? 'bg-plum' : 'bg-panel-2'} flex items-center justify-end px-2 transition-all duration-med`}
                          style={{ width: `${Math.max(item.percentage, 4)}%` }}
                        >
                          <span className="text-[11px] font-semibold text-bone">{item.count}</span>
                        </div>
                      </div>
                      <div className="w-10 text-[12px] text-smoke text-right flex-shrink-0">
                        {item.percentage}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={overview?.total_users || 0}
          subtitle={`${activityStats?.users_active_today || 0} active today`}
          icon={Users}
        />
        <StatCard
          title="Conversations"
          value={overview?.total_conversations || 0}
          subtitle={`${conversationStats?.avg_messages_per_conversation?.toFixed(1) || 0} avg nodes`}
          icon={MessageSquare}
        />
        <StatCard
          title="Total Tokens"
          value={formatNumber(overview?.total_tokens || 0)}
          subtitle={`${formatNumber(conversationStats?.avg_tokens_per_conversation || 0)} avg/convo`}
          icon={Zap}
        />
        <StatCard
          title="Avg Days Active"
          value={activityStats?.avg_days_active?.toFixed(1) || '0'}
          subtitle={`${activityStats?.users_active_this_week || 0} active this week`}
          icon={Calendar}
        />
      </div>

      {/* DAU Chart + User Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Active Users */}
        <div className="bg-panel border border-hairline rounded-node p-6">
          <div className="flex items-center gap-2 mb-5">
            <Activity size={15} className="text-plum" />
            <h2 className="text-[13px] font-semibold uppercase tracking-kicker text-smoke">Daily Active Users</h2>
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
                      className="flex-1 bg-plum hover:bg-plum-hover rounded-t transition-colors duration-fast"
                      style={{ height: `${Math.max(height, 4)}%`, opacity: 0.5 + (height / 200) }}
                      title={`${formatDate(day.date)}: ${day.active_users} users`}
                    />
                  )
                })}
              </div>
              <div className="flex justify-between text-[11px] text-smoke">
                <span>{dailyActiveUsers.length > 0 && formatDate(dailyActiveUsers[0].date)}</span>
                <span>Last 14 days</span>
                <span>{dailyActiveUsers.length > 0 && formatDate(dailyActiveUsers[dailyActiveUsers.length - 1].date)}</span>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-smoke text-[13px]">
              No activity data yet
            </div>
          )}
        </div>

        {/* User Growth */}
        <div className="bg-panel border border-hairline rounded-node p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={15} className="text-plum" />
            <h2 className="text-[13px] font-semibold uppercase tracking-kicker text-smoke">User Growth (Weekly)</h2>
          </div>
          {userGrowth.length > 0 ? (
            <div className="space-y-3">
              {userGrowth.slice(-6).map((week, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[11px] text-smoke w-14">{formatDate(week.week)}</span>
                  <div className="flex-1 h-2 rounded-pill overflow-hidden" style={{ background: 'var(--color-hairline)' }}>
                    <div
                      className="bg-plum h-full rounded-pill transition-all duration-med"
                      style={{
                        width: `${(week.cumulative_users / Math.max(...userGrowth.map(w => w.cumulative_users), 1)) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-[13px] font-medium text-bone w-10 text-right">
                    {week.cumulative_users}
                  </span>
                  {week.new_users > 0 && (
                    <span className="text-[11px] text-ash w-9">+{week.new_users}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-smoke text-[13px]">
              No growth data yet
            </div>
          )}
        </div>
      </div>

      {/* LLM Usage + Branch Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LLM Usage Distribution — providers distinguished by icon, not color */}
        <div className="bg-panel border border-hairline rounded-node p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={15} className="text-plum" />
            <h2 className="text-[13px] font-semibold uppercase tracking-kicker text-smoke">LLM Usage Distribution</h2>
          </div>
          {llmUsage.length > 0 ? (
            <div className="space-y-3">
              {llmUsage.slice(0, 6).map((model, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="flex items-center gap-2 text-ash font-medium">
                      <span className="w-5 h-5 rounded-full border border-hairline flex items-center justify-center shrink-0">
                        <ProviderIcon provider={model.provider} size={10} />
                      </span>
                      {model.model}
                    </span>
                    <span className="text-smoke">{model.percentage}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-pill overflow-hidden" style={{ background: 'var(--color-hairline)' }}>
                      <div
                        className="bg-plum h-full rounded-pill transition-all duration-med"
                        style={{ width: `${model.percentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-smoke w-16 text-right">
                      {formatNumber(model.token_count)} tok
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-smoke text-[13px]">
              No usage data yet
            </div>
          )}
        </div>

        {/* Branch & Merge Stats */}
        <div className="bg-panel border border-hairline rounded-node p-6">
          <div className="flex items-center gap-2 mb-5">
            <GitBranch size={15} className="text-plum" />
            <h2 className="text-[13px] font-semibold uppercase tracking-kicker text-smoke">Splits & Merges</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-hairline rounded-node p-4">
              <div className="flex items-center gap-2 mb-2 text-smoke">
                <GitBranch size={13} />
                <span className="text-[12px]">Total Splits</span>
              </div>
              <div className="text-[24px] font-extralight text-bone tracking-display">
                {conversationStats?.total_splits || 0}
              </div>
              <div className="text-[11px] text-smoke mt-1">
                ~{branchStats?.avg_splits_per_conversation?.toFixed(1) || 0} per convo
              </div>
            </div>
            <div className="border border-hairline rounded-node p-4">
              <div className="flex items-center gap-2 mb-2 text-smoke">
                <GitMerge size={13} />
                <span className="text-[12px]">Total Merges</span>
              </div>
              <div className="text-[24px] font-extralight text-bone tracking-display">
                {conversationStats?.total_merges || 0}
              </div>
              <div className="text-[11px] text-smoke mt-1">
                ~{branchStats?.avg_merges_per_conversation?.toFixed(1) || 0} per convo
              </div>
            </div>
            <div className="border border-hairline rounded-node p-4">
              <div className="text-[12px] text-smoke mb-2">Convos with Splits</div>
              <div className="text-[24px] font-extralight text-bone tracking-display">
                {branchStats?.conversations_with_splits || 0}
              </div>
              <div className="text-[11px] text-smoke mt-1">
                {branchStats?.total_conversations ?
                  `${((branchStats.conversations_with_splits / branchStats.total_conversations) * 100).toFixed(0)}%`
                  : '0%'} of total
              </div>
            </div>
            <div className="border border-hairline rounded-node p-4">
              <div className="text-[12px] text-smoke mb-2">Convos with Merges</div>
              <div className="text-[24px] font-extralight text-bone tracking-display">
                {branchStats?.conversations_with_merges || 0}
              </div>
              <div className="text-[11px] text-smoke mt-1">
                {branchStats?.total_conversations ?
                  `${((branchStats.conversations_with_merges / branchStats.total_conversations) * 100).toFixed(0)}%`
                  : '0%'} of total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Users by Token Usage */}
      <div className="bg-panel border border-hairline rounded-node p-6">
        <div className="flex items-center gap-2 mb-5">
          <Users size={15} className="text-plum" />
          <h2 className="text-[13px] font-semibold uppercase tracking-kicker text-smoke">Top Users by Token Usage</h2>
        </div>
        {userUsage.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[12px] text-smoke border-b border-hairline">
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium text-right">Conversations</th>
                  <th className="pb-3 font-medium text-right">Messages</th>
                  <th className="pb-3 font-medium text-right">Tokens</th>
                  <th className="pb-3 font-medium text-right">Days Active</th>
                  <th className="pb-3 font-medium text-right">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {userUsage.map((user) => (
                  <tr key={user.user_id} className="border-b border-hairline hover:bg-panel-2 transition-colors duration-fast">
                    <td className="py-3">
                      <div className="text-[13px] font-medium text-bone">
                        {user.display_name || user.email.split('@')[0]}
                      </div>
                      <div className="text-[11px] text-smoke">{user.email}</div>
                    </td>
                    <td className="py-3 text-right text-[13px] text-ash">{user.conversation_count}</td>
                    <td className="py-3 text-right text-[13px] text-ash">{user.message_count}</td>
                    <td className="py-3 text-right text-[13px] font-medium text-bone">
                      {formatNumber(user.total_tokens)}
                    </td>
                    <td className="py-3 text-right text-[13px] text-ash">{user.days_active}</td>
                    <td className="py-3 text-right text-[12px] text-smoke">
                      {user.last_active ? formatDate(user.last_active) : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-smoke text-[13px]">
            No user data yet
          </div>
        )}
      </div>
    </div>
  )
}

// Small labeled stat used inside the waitlist card
const MiniStat: React.FC<{
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  value: number
  sub: string
}> = ({ icon: Icon, label, value, sub }) => (
  <div className="border border-hairline rounded-node p-4">
    <div className="flex items-center gap-2 text-smoke mb-1">
      <Icon size={13} />
      <span className="text-[11px] font-semibold uppercase tracking-kicker">{label}</span>
    </div>
    <div className="text-[24px] font-extralight text-bone tracking-display">{value}</div>
    <div className="text-[11px] text-smoke mt-0.5">{sub}</div>
  </div>
)

// Stat Card Component
interface StatCardProps {
  title: string
  value: number | string
  subtitle: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon }) => (
  <div className="bg-panel border border-hairline hover:border-hairline-strong rounded-node p-6 transition-colors duration-fast">
    <div className="flex items-center gap-2 text-smoke mb-4">
      <Icon size={14} />
      <span className="text-[11px] font-semibold uppercase tracking-kicker">{title}</span>
    </div>
    <div className="text-[32px] font-extralight text-bone tracking-display mb-1 leading-none">{value}</div>
    <div className="text-[12px] text-smoke mt-2">{subtitle}</div>
  </div>
)

export default AdminDashboard
