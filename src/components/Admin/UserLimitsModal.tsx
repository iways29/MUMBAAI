import React, { useState, useEffect } from 'react'
import {
  X,
  Layers,
  Zap,
  GitMerge,
  Clock,
  Bot,
  Ban,
  Save,
  RotateCcw,
  Infinity,
  AlertTriangle
} from 'lucide-react'
import { supabase } from '../../lib/supabase.ts'

interface Tier {
  id: string
  name: string
  display_name: string
  daily_token_limit: number | null
  monthly_token_limit: number | null
  daily_merge_limit: number | null
  requests_per_minute: number
  allowed_model_ids: string[] | null
  color: string
}

interface UserLimits {
  id?: string
  user_id: string
  tier_id: string | null
  daily_token_limit_override: number | null
  monthly_token_limit_override: number | null
  daily_merge_limit_override: number | null
  requests_per_minute_override: number | null
  allowed_model_ids_override: string[] | null
  is_suspended: boolean
  suspension_reason: string | null
}

interface UserUsage {
  tokens_used: number
  merges_performed: number
  requests_count: number
}

interface Model {
  id: string
  model_id: string
  display_name: string
  provider: string
  is_enabled: boolean
}

interface UserLimitsModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  userEmail: string
  userName: string | null
  isAdmin: boolean
  onSave: () => void
}

const UserLimitsModal: React.FC<UserLimitsModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  isAdmin,
  onSave
}) => {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [limits, setLimits] = useState<UserLimits>({
    user_id: userId,
    tier_id: null,
    daily_token_limit_override: null,
    monthly_token_limit_override: null,
    daily_merge_limit_override: null,
    requests_per_minute_override: null,
    allowed_model_ids_override: null,
    is_suspended: false,
    suspension_reason: null
  })
  const [usage, setUsage] = useState<UserUsage>({ tokens_used: 0, merges_performed: 0, requests_count: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'tier' | 'overrides' | 'suspend'>('tier')

  // Fetch tiers, models, and user limits
  useEffect(() => {
    if (!isOpen) return

    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch tiers
        const { data: tiersData } = await supabase
          .from('user_tiers')
          .select('*')
          .order('sort_order')
        setTiers(tiersData ?? [])

        // Fetch models
        const { data: modelsData } = await supabase
          .from('llm_models')
          .select('*')
          .eq('is_enabled', true)
          .order('provider', { ascending: true })
        setModels(modelsData ?? [])

        // Fetch user limits
        const { data: limitsData } = await supabase
          .from('user_limits')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (limitsData) {
          setLimits(limitsData)
        } else {
          // Get default tier
          const defaultTier = tiersData?.find(t => t.is_default)
          setLimits({
            user_id: userId,
            tier_id: defaultTier?.id ?? null,
            daily_token_limit_override: null,
            monthly_token_limit_override: null,
            daily_merge_limit_override: null,
            requests_per_minute_override: null,
            allowed_model_ids_override: null,
            is_suspended: false,
            suspension_reason: null
          })
        }

        // Fetch today's usage
        const { data: usageData } = await supabase
          .from('user_usage_daily')
          .select('tokens_used, merges_performed, requests_count')
          .eq('user_id', userId)
          .eq('date', new Date().toISOString().split('T')[0])
          .single()

        if (usageData) {
          setUsage(usageData)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, userId])

  const handleSave = async () => {
    setSaving(true)
    try {
      // Upsert user limits
      const { error } = await supabase
        .from('user_limits')
        .upsert({
          ...limits,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving limits:', error)
    } finally {
      setSaving(false)
    }
  }

  const selectedTier = tiers.find(t => t.id === limits.tier_id)

  const getEffectiveLimit = (override: number | null, tierLimit: number | null | undefined) => {
    if (override !== null) return override
    return tierLimit ?? null
  }

  const formatLimit = (limit: number | null) => {
    if (limit === null) return 'Unlimited'
    return limit.toLocaleString()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-stone-800">Configure Limits</h2>
              <p className="text-stone-600 text-sm mt-1">
                {userName || userEmail}
                {isAdmin && (
                  <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                    Admin (exempt from limits)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {[
              { id: 'tier', label: 'Tier', icon: Layers },
              { id: 'overrides', label: 'Overrides', icon: Zap },
              { id: 'suspend', label: 'Suspend', icon: Ban }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#FF8811] text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF8811]"></div>
            </div>
          ) : (
            <>
              {/* Tier Tab */}
              {activeTab === 'tier' && (
                <div className="space-y-4">
                  <p className="text-sm text-stone-600 mb-4">
                    Select a tier for this user. Tier limits apply unless overridden.
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {tiers.map(tier => (
                      <button
                        key={tier.id}
                        onClick={() => setLimits({ ...limits, tier_id: tier.id })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          limits.tier_id === tier.id
                            ? 'border-[#FF8811] bg-orange-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tier.color }}
                          />
                          <span className="font-semibold text-stone-800">{tier.display_name}</span>
                          {tier.is_default && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-stone-500">
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {formatLimit(tier.daily_token_limit)}/day
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {formatLimit(tier.monthly_token_limit)}/mo
                          </div>
                          <div className="flex items-center gap-1">
                            <GitMerge className="w-3 h-3" />
                            {formatLimit(tier.daily_merge_limit)} merges
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {tier.requests_per_minute} req/min
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Today's Usage */}
                  <div className="mt-6 p-4 bg-stone-50 rounded-xl">
                    <h3 className="font-semibold text-stone-800 mb-3">Today's Usage</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-stone-800">
                          {usage.tokens_used.toLocaleString()}
                        </div>
                        <div className="text-xs text-stone-500">Tokens Used</div>
                        {selectedTier && (
                          <div className="text-xs text-stone-400 mt-1">
                            / {formatLimit(getEffectiveLimit(limits.daily_token_limit_override, selectedTier.daily_token_limit))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-stone-800">
                          {usage.merges_performed}
                        </div>
                        <div className="text-xs text-stone-500">Merges</div>
                        {selectedTier && (
                          <div className="text-xs text-stone-400 mt-1">
                            / {formatLimit(getEffectiveLimit(limits.daily_merge_limit_override, selectedTier.daily_merge_limit))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-stone-800">
                          {usage.requests_count}
                        </div>
                        <div className="text-xs text-stone-500">Requests</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Overrides Tab */}
              {activeTab === 'overrides' && (
                <div className="space-y-6">
                  <p className="text-sm text-stone-600 mb-4">
                    Override specific limits for this user. Leave empty to use tier defaults.
                  </p>

                  {/* Token Limits */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      Token Limits
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-stone-600 mb-1">Daily Token Limit</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={limits.daily_token_limit_override ?? ''}
                            onChange={e => setLimits({
                              ...limits,
                              daily_token_limit_override: e.target.value ? parseInt(e.target.value) : null
                            })}
                            placeholder={selectedTier ? formatLimit(selectedTier.daily_token_limit) : 'Unlimited'}
                            className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8811]/20"
                          />
                          <button
                            onClick={() => setLimits({ ...limits, daily_token_limit_override: null })}
                            className="p-2 text-stone-400 hover:text-stone-600"
                            title="Reset to tier default"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-stone-600 mb-1">Monthly Token Limit</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={limits.monthly_token_limit_override ?? ''}
                            onChange={e => setLimits({
                              ...limits,
                              monthly_token_limit_override: e.target.value ? parseInt(e.target.value) : null
                            })}
                            placeholder={selectedTier ? formatLimit(selectedTier.monthly_token_limit) : 'Unlimited'}
                            className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8811]/20"
                          />
                          <button
                            onClick={() => setLimits({ ...limits, monthly_token_limit_override: null })}
                            className="p-2 text-stone-400 hover:text-stone-600"
                            title="Reset to tier default"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Merge Limit */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                      <GitMerge className="w-4 h-4 text-purple-500" />
                      Merge Limit
                    </h3>

                    <div>
                      <label className="block text-sm text-stone-600 mb-1">Daily Merge Limit</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={limits.daily_merge_limit_override ?? ''}
                          onChange={e => setLimits({
                            ...limits,
                            daily_merge_limit_override: e.target.value ? parseInt(e.target.value) : null
                          })}
                          placeholder={selectedTier ? formatLimit(selectedTier.daily_merge_limit) : 'Unlimited'}
                          className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8811]/20"
                        />
                        <button
                          onClick={() => setLimits({ ...limits, daily_merge_limit_override: null })}
                          className="p-2 text-stone-400 hover:text-stone-600"
                          title="Reset to tier default"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rate Limit */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      Rate Limit
                    </h3>

                    <div>
                      <label className="block text-sm text-stone-600 mb-1">Requests per Minute</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={limits.requests_per_minute_override ?? ''}
                          onChange={e => setLimits({
                            ...limits,
                            requests_per_minute_override: e.target.value ? parseInt(e.target.value) : null
                          })}
                          placeholder={selectedTier ? String(selectedTier.requests_per_minute) : '20'}
                          className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8811]/20"
                        />
                        <button
                          onClick={() => setLimits({ ...limits, requests_per_minute_override: null })}
                          className="p-2 text-stone-400 hover:text-stone-600"
                          title="Reset to tier default"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Model Access */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-stone-800 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-green-500" />
                      Model Access Override
                    </h3>
                    <p className="text-xs text-stone-500">
                      Leave empty to use tier's model restrictions. Select specific models to override.
                    </p>

                    <div className="flex items-center gap-4 mb-2">
                      <button
                        onClick={() => setLimits({ ...limits, allowed_model_ids_override: null })}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          limits.allowed_model_ids_override === null
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <Infinity className="w-3 h-3 inline mr-1" />
                        Use Tier Default
                      </button>
                      <button
                        onClick={() => setLimits({ ...limits, allowed_model_ids_override: [] })}
                        className={`px-3 py-1 rounded-lg text-sm ${
                          limits.allowed_model_ids_override !== null
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        Custom Selection
                      </button>
                    </div>

                    {limits.allowed_model_ids_override !== null && (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-stone-50 rounded-lg">
                        {models.map(model => (
                          <label
                            key={model.id}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={limits.allowed_model_ids_override?.includes(model.model_id) ?? false}
                              onChange={e => {
                                const current = limits.allowed_model_ids_override ?? []
                                if (e.target.checked) {
                                  setLimits({ ...limits, allowed_model_ids_override: [...current, model.model_id] })
                                } else {
                                  setLimits({
                                    ...limits,
                                    allowed_model_ids_override: current.filter(id => id !== model.model_id)
                                  })
                                }
                              }}
                              className="rounded border-stone-300 text-[#FF8811] focus:ring-[#FF8811]"
                            />
                            <span className="text-sm text-stone-700">{model.display_name}</span>
                            <span className="text-xs text-stone-400">({model.provider})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Suspend Tab */}
              {activeTab === 'suspend' && (
                <div className="space-y-6">
                  <div className={`p-4 rounded-xl ${limits.is_suspended ? 'bg-red-50 border border-red-200' : 'bg-stone-50'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Ban className={`w-5 h-5 ${limits.is_suspended ? 'text-red-500' : 'text-stone-400'}`} />
                        <div>
                          <h3 className="font-semibold text-stone-800">Account Suspension</h3>
                          <p className="text-sm text-stone-500">
                            {limits.is_suspended ? 'This user is currently suspended' : 'Suspend user access'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setLimits({ ...limits, is_suspended: !limits.is_suspended })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          limits.is_suspended
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {limits.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>

                    {limits.is_suspended && (
                      <div>
                        <label className="block text-sm text-stone-600 mb-1">Suspension Reason</label>
                        <textarea
                          value={limits.suspension_reason ?? ''}
                          onChange={e => setLimits({ ...limits, suspension_reason: e.target.value || null })}
                          placeholder="Optional: Enter reason for suspension"
                          className="w-full px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">What happens when suspended?</h4>
                        <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                          <li>• User cannot send new messages</li>
                          <li>• User cannot perform merges</li>
                          <li>• User can still view existing conversations</li>
                          <li>• User will see a suspension notice</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-stone-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2 bg-[#FF8811] text-white rounded-lg hover:bg-[#e67a0f] transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default UserLimitsModal
