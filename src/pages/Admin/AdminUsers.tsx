import React, { useState, useEffect } from 'react'
import {
  Users,
  Shield,
  ShieldOff,
  Mail,
  Calendar,
  Settings,
  Zap,
  GitMerge,
  Ban,
  Search
} from 'lucide-react'
import { supabase } from '../../lib/supabase.ts'
import UserLimitsModal from '../../components/Admin/UserLimitsModal.tsx'

interface Tier {
  id: string
  name: string
  display_name: string
  color: string
  daily_token_limit: number | null
  monthly_token_limit: number | null
  daily_merge_limit: number | null
}

interface UserLimits {
  tier_id: string | null
  is_suspended: boolean
  daily_token_limit_override: number | null
  daily_merge_limit_override: number | null
}

interface UserUsage {
  tokens_used: number
  merges_performed: number
}

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  is_admin: boolean
  created_at: string
  user_limits?: UserLimits | null
  usage?: UserUsage
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      // Fetch tiers
      const { data: tiersData } = await supabase
        .from('user_tiers')
        .select('id, name, display_name, color, daily_token_limit, monthly_token_limit, daily_merge_limit')
        .order('sort_order')
      setTiers(tiersData ?? [])

      // Fetch users with their limits
      const { data: usersData, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_limits (
            tier_id,
            is_suspended,
            daily_token_limit_override,
            daily_merge_limit_override
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch today's usage for all users
      const today = new Date().toISOString().split('T')[0]
      const { data: usageData } = await supabase
        .from('user_usage_daily')
        .select('user_id, tokens_used, merges_performed')
        .eq('date', today)

      // Map usage to users
      const usageMap = new Map(usageData?.map(u => [u.user_id, u]) ?? [])

      const usersWithData = usersData?.map(user => ({
        ...user,
        user_limits: user.user_limits?.[0] ?? null,
        usage: usageMap.get(user.id) ?? { tokens_used: 0, merges_performed: 0 }
      })) ?? []

      setUsers(usersWithData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const toggleAdmin = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_admin: !currentState })
        .eq('id', id)

      if (error) throw error

      setUsers(users.map(u =>
        u.id === id ? { ...u, is_admin: !currentState } : u
      ))
    } catch (error) {
      console.error('Error toggling admin:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTierForUser = (user: UserProfile): Tier | null => {
    const tierId = user.user_limits?.tier_id
    if (!tierId) {
      // Find default tier
      return tiers.find(t => t.name === 'free') ?? null
    }
    return tiers.find(t => t.id === tierId) ?? null
  }

  const getEffectiveLimit = (user: UserProfile, type: 'token' | 'merge'): number | null => {
    const tier = getTierForUser(user)
    if (type === 'token') {
      return user.user_limits?.daily_token_limit_override ?? tier?.daily_token_limit ?? null
    }
    return user.user_limits?.daily_merge_limit_override ?? tier?.daily_merge_limit ?? null
  }

  const formatLimit = (current: number, limit: number | null): string => {
    if (limit === null) return `${current.toLocaleString()}`
    return `${current.toLocaleString()} / ${limit.toLocaleString()}`
  }

  const getUsagePercent = (current: number, limit: number | null): number => {
    if (limit === null || limit === 0) return 0
    return Math.min((current / limit) * 100, 100)
  }

  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      user.email.toLowerCase().includes(query) ||
      (user.display_name?.toLowerCase().includes(query) ?? false)
    )
  })

  const selectedUser = users.find(u => u.id === selectedUserId)

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-stone-200 rounded"></div>
          <div className="h-4 w-64 bg-stone-200 rounded"></div>
          <div className="space-y-3 mt-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-stone-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const adminCount = users.filter(u => u.is_admin).length
  const suspendedCount = users.filter(u => u.user_limits?.is_suspended).length
  const totalCount = users.length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800">Users</h1>
        </div>
        <p className="text-stone-600">
          {totalCount} users total, {adminCount} admin{adminCount !== 1 ? 's' : ''}
          {suspendedCount > 0 && (
            <span className="text-red-500 ml-2">
              ({suspendedCount} suspended)
            </span>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search users by email or name..."
            className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811]/20 focus:border-[#FF8811]"
          />
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-semibold text-stone-600">User</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-stone-600">Tier</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-stone-600">Today's Usage</th>
              <th className="text-left px-6 py-4 text-sm font-semibold text-stone-600">Role</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-stone-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filteredUsers.map((user) => {
              const tier = getTierForUser(user)
              const tokenLimit = getEffectiveLimit(user, 'token')
              const mergeLimit = getEffectiveLimit(user, 'merge')
              const tokenPercent = getUsagePercent(user.usage?.tokens_used ?? 0, tokenLimit)
              const mergePercent = getUsagePercent(user.usage?.merges_performed ?? 0, mergeLimit)

              return (
                <tr key={user.id} className={`hover:bg-stone-50 ${user.user_limits?.is_suspended ? 'bg-red-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.user_limits?.is_suspended ? 'bg-red-200' : 'bg-stone-200'
                      }`}>
                        {user.user_limits?.is_suspended ? (
                          <Ban className="w-5 h-5 text-red-500" />
                        ) : (
                          <span className="text-stone-600 font-medium">
                            {user.email[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-stone-800 flex items-center gap-2">
                          {user.display_name || 'No name'}
                          {user.user_limits?.is_suspended && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                              Suspended
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-stone-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {tier ? (
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${tier.color}20`,
                          color: tier.color
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tier.color }}
                        />
                        {tier.display_name}
                      </span>
                    ) : (
                      <span className="text-stone-400 text-sm">No tier</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_admin ? (
                      <span className="text-sm text-stone-400 italic">Unlimited</span>
                    ) : (
                      <div className="space-y-2 min-w-[180px]">
                        {/* Token Usage */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-stone-500 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Tokens
                            </span>
                            <span className="text-stone-600">
                              {formatLimit(user.usage?.tokens_used ?? 0, tokenLimit)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                tokenPercent >= 90 ? 'bg-red-500' :
                                tokenPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${tokenPercent}%` }}
                            />
                          </div>
                        </div>
                        {/* Merge Usage */}
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-stone-500 flex items-center gap-1">
                              <GitMerge className="w-3 h-3" />
                              Merges
                            </span>
                            <span className="text-stone-600">
                              {formatLimit(user.usage?.merges_performed ?? 0, mergeLimit)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                mergePercent >= 90 ? 'bg-red-500' :
                                mergePercent >= 70 ? 'bg-yellow-500' : 'bg-purple-500'
                              }`}
                              style={{ width: `${mergePercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_admin ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-100 text-stone-600 rounded-full text-sm font-medium">
                        User
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedUserId(user.id)}
                        className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Configure limits"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleAdmin(user.id, user.is_admin)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          user.is_admin
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                      >
                        {user.is_admin ? (
                          <span className="flex items-center gap-1">
                            <ShieldOff className="w-4 h-4" />
                            Remove Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Shield className="w-4 h-4" />
                            Make Admin
                          </span>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Warning */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <p className="text-sm text-yellow-700">
          <strong>Note:</strong> Admins are exempt from all usage limits. Click the <Settings className="w-3 h-3 inline" /> icon to configure user tiers, limits, and suspension status.
        </p>
      </div>

      {/* User Limits Modal */}
      {selectedUser && (
        <UserLimitsModal
          isOpen={!!selectedUserId}
          onClose={() => setSelectedUserId(null)}
          userId={selectedUser.id}
          userEmail={selectedUser.email}
          userName={selectedUser.display_name}
          isAdmin={selectedUser.is_admin}
          onSave={() => {
            fetchData()
            setSelectedUserId(null)
          }}
        />
      )}
    </div>
  )
}

export default AdminUsers
