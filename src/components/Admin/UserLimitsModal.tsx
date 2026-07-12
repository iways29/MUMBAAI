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
      <div className="bg-panel rounded-node w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-hairline">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-bone">Configure Limits</h2>
              <p className="text-ash text-sm mt-1">
                {userName || userEmail}
                {isAdmin && (
                  <span className="ml-2 px-2 py-0.5 bg-plum-soft text-plum text-xs rounded-full">
                    Admin (exempt from limits)
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-panel-2 rounded-[8px] transition-colors"
            >
              <X className="w-5 h-5 text-smoke" />
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
                className={`flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-plum text-white'
                    : 'bg-panel-2 text-ash hover:bg-panel-2'
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plum"></div>
            </div>
          ) : (
            <>
              {/* Tier Tab */}
              {activeTab === 'tier' && (
                <div className="space-y-4">
                  <p className="text-sm text-ash mb-4">
                    Select a tier for this user. Tier limits apply unless overridden.
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {tiers.map(tier => (
                      <button
                        key={tier.id}
                        onClick={() => setLimits({ ...limits, tier_id: tier.id })}
                        className={`p-4 rounded-node border text-left transition-all ${
                          limits.tier_id === tier.id
                            ? 'border-plum bg-panel-2'
                            : 'border-hairline hover:border-hairline-strong'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tier.color }}
                          />
                          <span className="font-semibold text-bone">{tier.display_name}</span>
                          {tier.is_default && (
                            <span className="px-2 py-0.5 bg-panel-2 text-ash text-xs rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-smoke">
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
                  <div className="mt-6 p-4 bg-panel-2 rounded-node">
                    <h3 className="font-semibold text-bone mb-3">Today's Usage</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-[24px] font-extralight text-bone tracking-display">
                          {usage.tokens_used.toLocaleString()}
                        </div>
                        <div className="text-xs text-smoke">Tokens Used</div>
                        {selectedTier && (
                          <div className="text-xs text-smoke mt-1">
                            / {formatLimit(getEffectiveLimit(limits.daily_token_limit_override, selectedTier.daily_token_limit))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-[24px] font-extralight text-bone tracking-display">
                          {usage.merges_performed}
                        </div>
                        <div className="text-xs text-smoke">Merges</div>
                        {selectedTier && (
                          <div className="text-xs text-smoke mt-1">
                            / {formatLimit(getEffectiveLimit(limits.daily_merge_limit_override, selectedTier.daily_merge_limit))}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-[24px] font-extralight text-bone tracking-display">
                          {usage.requests_count}
                        </div>
                        <div className="text-xs text-smoke">Requests</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Overrides Tab */}
              {activeTab === 'overrides' && (
                <div className="space-y-6">
                  <p className="text-sm text-ash mb-4">
                    Override specific limits for this user. Leave empty to use tier defaults.
                  </p>

                  {/* Token Limits */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-bone flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber" />
                      Token Limits
                    </h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-ash mb-1">Daily Token Limit</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={limits.daily_token_limit_override ?? ''}
                            onChange={e => setLimits({
                              ...limits,
                              daily_token_limit_override: e.target.value ? parseInt(e.target.value) : null
                            })}
                            placeholder={selectedTier ? formatLimit(selectedTier.daily_token_limit) : 'Unlimited'}
                            className="flex-1 px-3 py-2 bg-void text-bone placeholder:text-smoke border border-hairline rounded-[8px] focus:outline-none focus:border-plum"
                          />
                          <button
                            onClick={() => setLimits({ ...limits, daily_token_limit_override: null })}
                            className="p-2 text-smoke hover:text-bone"
                            title="Reset to tier default"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-ash mb-1">Monthly Token Limit</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={limits.monthly_token_limit_override ?? ''}
                            onChange={e => setLimits({
                              ...limits,
                              monthly_token_limit_override: e.target.value ? parseInt(e.target.value) : null
                            })}
                            placeholder={selectedTier ? formatLimit(selectedTier.monthly_token_limit) : 'Unlimited'}
                            className="flex-1 px-3 py-2 bg-void text-bone placeholder:text-smoke border border-hairline rounded-[8px] focus:outline-none focus:border-plum"
                          />
                          <button
                            onClick={() => setLimits({ ...limits, monthly_token_limit_override: null })}
                            className="p-2 text-smoke hover:text-bone"
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
                    <h3 className="font-semibold text-bone flex items-center gap-2">
                      <GitMerge className="w-4 h-4 text-plum" />
                      Merge Limit
                    </h3>

                    <div>
                      <label className="block text-sm text-ash mb-1">Daily Merge Limit</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={limits.daily_merge_limit_override ?? ''}
                          onChange={e => setLimits({
                            ...limits,
                            daily_merge_limit_override: e.target.value ? parseInt(e.target.value) : null
                          })}
                          placeholder={selectedTier ? formatLimit(selectedTier.daily_merge_limit) : 'Unlimited'}
                          className="flex-1 px-3 py-2 bg-void text-bone placeholder:text-smoke border border-hairline rounded-[8px] focus:outline-none focus:border-plum"
                        />
                        <button
                          onClick={() => setLimits({ ...limits, daily_merge_limit_override: null })}
                          className="p-2 text-smoke hover:text-bone"
                          title="Reset to tier default"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rate Limit */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-bone flex items-center gap-2">
                      <Clock className="w-4 h-4 text-ash" />
                      Rate Limit
                    </h3>

                    <div>
                      <label className="block text-sm text-ash mb-1">Requests per Minute</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={limits.requests_per_minute_override ?? ''}
                          onChange={e => setLimits({
                            ...limits,
                            requests_per_minute_override: e.target.value ? parseInt(e.target.value) : null
                          })}
                          placeholder={selectedTier ? String(selectedTier.requests_per_minute) : '20'}
                          className="flex-1 px-3 py-2 bg-void text-bone placeholder:text-smoke border border-hairline rounded-[8px] focus:outline-none focus:border-plum"
                        />
                        <button
                          onClick={() => setLimits({ ...limits, requests_per_minute_override: null })}
                          className="p-2 text-smoke hover:text-bone"
                          title="Reset to tier default"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Model Access */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-bone flex items-center gap-2">
                      <Bot className="w-4 h-4 text-plum" />
                      Model Access Override
                    </h3>
                    <p className="text-xs text-smoke">
                      Leave empty to use tier's model restrictions. Select specific models to override.
                    </p>

                    <div className="flex items-center gap-4 mb-2">
                      <button
                        onClick={() => setLimits({ ...limits, allowed_model_ids_override: null })}
                        className={`px-3 py-1 rounded-[8px] text-sm ${
                          limits.allowed_model_ids_override === null
                            ? 'bg-panel-2 text-ash'
                            : 'bg-panel-2 text-ash'
                        }`}
                      >
                        <Infinity className="w-3 h-3 inline mr-1" />
                        Use Tier Default
                      </button>
                      <button
                        onClick={() => setLimits({ ...limits, allowed_model_ids_override: [] })}
                        className={`px-3 py-1 rounded-[8px] text-sm ${
                          limits.allowed_model_ids_override !== null
                            ? 'bg-panel-2 text-ash'
                            : 'bg-panel-2 text-ash'
                        }`}
                      >
                        Custom Selection
                      </button>
                    </div>

                    {limits.allowed_model_ids_override !== null && (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-panel-2 rounded-[8px]">
                        {models.map(model => (
                          <label
                            key={model.id}
                            className="flex items-center gap-2 p-2 rounded-[8px] hover:bg-panel cursor-pointer"
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
                              className="rounded border-hairline text-plum focus:ring-0"
                            />
                            <span className="text-sm text-ash">{model.display_name}</span>
                            <span className="text-xs text-smoke">({model.provider})</span>
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
                  <div className={`p-4 rounded-node ${limits.is_suspended ? 'bg-panel-2 border border-danger' : 'bg-panel-2'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Ban className={`w-5 h-5 ${limits.is_suspended ? 'text-danger' : 'text-smoke'}`} />
                        <div>
                          <h3 className="font-semibold text-bone">Account Suspension</h3>
                          <p className="text-sm text-smoke">
                            {limits.is_suspended ? 'This user is currently suspended' : 'Suspend user access'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setLimits({ ...limits, is_suspended: !limits.is_suspended })}
                        className={`px-4 py-2 rounded-[8px] font-medium transition-colors ${
                          limits.is_suspended
                            ? 'bg-plum text-white hover:bg-plum-hover'
                            : 'bg-transparent border border-danger text-white hover:bg-[rgba(240,89,78,0.12)]'
                        }`}
                      >
                        {limits.is_suspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>

                    {limits.is_suspended && (
                      <div>
                        <label className="block text-sm text-ash mb-1">Suspension Reason</label>
                        <textarea
                          value={limits.suspension_reason ?? ''}
                          onChange={e => setLimits({ ...limits, suspension_reason: e.target.value || null })}
                          placeholder="Optional: Enter reason for suspension"
                          className="w-full px-3 py-2 text-bone placeholder:text-smoke border border-danger rounded-[8px] focus:outline-none focus:border-danger bg-panel"
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-panel-2 rounded-node border border-hairline">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber">What happens when suspended?</h4>
                        <ul className="text-sm text-amber mt-2 space-y-1">
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
        <div className="p-6 border-t border-hairline flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-ash hover:bg-panel-2 rounded-[8px] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2 bg-plum text-white rounded-[8px] hover:bg-plum-hover transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border border-white border-t-transparent"></div>
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
