import React, { useState, useEffect } from 'react'
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Save,
  RotateCcw,
  Check,
  Star,
  Infinity,
  Zap,
  GitMerge,
  Clock,
  Bot
} from 'lucide-react'
import { supabase } from '../../lib/supabase.ts'

interface Tier {
  id: string
  name: string
  display_name: string
  description: string | null
  daily_token_limit: number | null
  monthly_token_limit: number | null
  daily_merge_limit: number | null
  requests_per_minute: number
  allowed_model_ids: string[] | null
  color: string
  sort_order: number
  is_default: boolean
  created_at: string
}

interface Model {
  id: string
  model_id: string
  display_name: string
  provider: string
  is_enabled: boolean
}

interface TierFormData {
  name: string
  display_name: string
  description: string
  daily_token_limit: number | null
  monthly_token_limit: number | null
  daily_merge_limit: number | null
  requests_per_minute: number
  allowed_model_ids: string[]
  color: string
  sort_order: number
  is_default: boolean
}

const COLORS = [
  { value: '#6b7280', label: 'Gray' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#10b981', label: 'Emerald' },
  { value: '#3b82f6', label: 'Blue' },
  { value: '#ef4444', label: 'Red' },
  { value: '#ec4899', label: 'Pink' },
]

const emptyFormData: TierFormData = {
  name: '',
  display_name: '',
  description: '',
  daily_token_limit: null,
  monthly_token_limit: null,
  daily_merge_limit: null,
  requests_per_minute: 20,
  allowed_model_ids: [],
  color: '#6b7280',
  sort_order: 0,
  is_default: false,
}

const formatLimit = (limit: number | null): string => {
  if (limit === null) return 'Unlimited'
  if (limit >= 1000000) return `${(limit / 1000000).toFixed(1)}M`
  if (limit >= 1000) return `${(limit / 1000).toFixed(0)}K`
  return limit.toString()
}

const AdminTiers: React.FC = () => {
  const [tiers, setTiers] = useState<Tier[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTier, setEditingTier] = useState<Tier | null>(null)
  const [formData, setFormData] = useState<TierFormData>(emptyFormData)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [unlimitedFields, setUnlimitedFields] = useState({
    daily_token_limit: true,
    monthly_token_limit: true,
    daily_merge_limit: true,
  })

  const fetchData = async () => {
    try {
      const [tiersRes, modelsRes] = await Promise.all([
        supabase.from('user_tiers').select('*').order('sort_order', { ascending: true }),
        supabase.from('app_models').select('id, model_id, display_name, provider, is_enabled').eq('is_enabled', true)
      ])

      if (tiersRes.error) throw tiersRes.error
      if (modelsRes.error) throw modelsRes.error

      setTiers(tiersRes.data ?? [])
      setModels(modelsRes.data ?? [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const openAddModal = () => {
    const maxSortOrder = Math.max(...tiers.map(t => t.sort_order), 0)
    setFormData({ ...emptyFormData, sort_order: maxSortOrder + 1 })
    setUnlimitedFields({
      daily_token_limit: true,
      monthly_token_limit: true,
      daily_merge_limit: true,
    })
    setEditingTier(null)
    setShowModal(true)
  }

  const openEditModal = (tier: Tier) => {
    setFormData({
      name: tier.name,
      display_name: tier.display_name,
      description: tier.description || '',
      daily_token_limit: tier.daily_token_limit,
      monthly_token_limit: tier.monthly_token_limit,
      daily_merge_limit: tier.daily_merge_limit,
      requests_per_minute: tier.requests_per_minute,
      allowed_model_ids: tier.allowed_model_ids || [],
      color: tier.color,
      sort_order: tier.sort_order,
      is_default: tier.is_default,
    })
    setUnlimitedFields({
      daily_token_limit: tier.daily_token_limit === null,
      monthly_token_limit: tier.monthly_token_limit === null,
      daily_merge_limit: tier.daily_merge_limit === null,
    })
    setEditingTier(tier)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTier(null)
    setFormData(emptyFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // If setting as default, unset other defaults first
      if (formData.is_default) {
        await supabase
          .from('user_tiers')
          .update({ is_default: false })
          .neq('id', editingTier?.id ?? '')
      }

      const tierData = {
        name: formData.name.toLowerCase().replace(/\s+/g, '_'),
        display_name: formData.display_name,
        description: formData.description || null,
        daily_token_limit: unlimitedFields.daily_token_limit ? null : formData.daily_token_limit,
        monthly_token_limit: unlimitedFields.monthly_token_limit ? null : formData.monthly_token_limit,
        daily_merge_limit: unlimitedFields.daily_merge_limit ? null : formData.daily_merge_limit,
        requests_per_minute: formData.requests_per_minute,
        allowed_model_ids: formData.allowed_model_ids.length > 0 ? formData.allowed_model_ids : null,
        color: formData.color,
        sort_order: formData.sort_order,
        is_default: formData.is_default,
      }

      if (editingTier) {
        const { error } = await supabase
          .from('user_tiers')
          .update(tierData)
          .eq('id', editingTier.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('user_tiers')
          .insert(tierData)

        if (error) throw error
      }

      await fetchData()
      closeModal()
    } catch (error) {
      console.error('Error saving tier:', error)
      alert('Error saving tier. Check if name already exists.')
    } finally {
      setSaving(false)
    }
  }

  const deleteTier = async (id: string) => {
    try {
      const tier = tiers.find(t => t.id === id)
      if (tier?.is_default) {
        alert("Can't delete the default tier. Set another tier as default first.")
        return
      }

      // Check if any users are on this tier
      const { count } = await supabase
        .from('user_limits')
        .select('*', { count: 'exact', head: true })
        .eq('tier_id', id)

      if (count && count > 0) {
        alert(`Can't delete this tier. ${count} user(s) are assigned to it. Reassign them first.`)
        return
      }

      const { error } = await supabase
        .from('user_tiers')
        .delete()
        .eq('id', id)

      if (error) throw error

      setTiers(tiers.filter(t => t.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting tier:', error)
    }
  }

  const setDefault = async (id: string) => {
    try {
      // Unset all defaults
      await supabase
        .from('user_tiers')
        .update({ is_default: false })
        .neq('id', id)

      // Set new default
      const { error } = await supabase
        .from('user_tiers')
        .update({ is_default: true })
        .eq('id', id)

      if (error) throw error

      setTiers(tiers.map(t => ({
        ...t,
        is_default: t.id === id,
      })))
    } catch (error) {
      console.error('Error setting default:', error)
    }
  }

  const toggleModelSelection = (modelId: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_model_ids: prev.allowed_model_ids.includes(modelId)
        ? prev.allowed_model_ids.filter(id => id !== modelId)
        : [...prev.allowed_model_ids, modelId]
    }))
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-stone-200 rounded"></div>
          <div className="h-4 w-64 bg-stone-200 rounded"></div>
          <div className="space-y-3 mt-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-stone-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-500 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-stone-800">User Tiers</h1>
          </div>
          <p className="text-stone-600">
            Configure user tiers with limits for tokens, merges, rate limiting, and model access
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-[#FF8811] text-white rounded-xl hover:bg-[#e67a0f] transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Tier
        </button>
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center gap-6 text-sm text-stone-600">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span>Default tier for new users</span>
        </div>
        <div className="flex items-center gap-2">
          <Infinity className="w-4 h-4 text-stone-400" />
          <span>Unlimited</span>
        </div>
      </div>

      {/* Tiers List */}
      <div className="space-y-4">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="bg-white rounded-xl border border-stone-200 shadow-sm p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {/* Color Badge */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: tier.color }}
                >
                  {tier.display_name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-stone-800">
                      {tier.display_name}
                    </h3>
                    {tier.is_default && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                    <span className="text-xs text-stone-400 font-mono bg-stone-100 px-2 py-0.5 rounded">
                      {tier.name}
                    </span>
                  </div>
                  {tier.description && (
                    <p className="text-sm text-stone-500 mb-3">{tier.description}</p>
                  )}

                  {/* Limits Grid */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-stone-500">Daily:</span>
                      <span className="font-medium">{formatLimit(tier.daily_token_limit)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="text-stone-500">Monthly:</span>
                      <span className="font-medium">{formatLimit(tier.monthly_token_limit)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <GitMerge className="w-4 h-4 text-purple-500" />
                      <span className="text-stone-500">Merges/day:</span>
                      <span className="font-medium">{formatLimit(tier.daily_merge_limit)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Clock className="w-4 h-4 text-green-500" />
                      <span className="text-stone-500">Rate:</span>
                      <span className="font-medium">{tier.requests_per_minute}/min</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-600">
                      <Bot className="w-4 h-4 text-stone-500" />
                      <span className="text-stone-500">Models:</span>
                      <span className="font-medium">
                        {tier.allowed_model_ids ? `${tier.allowed_model_ids.length} selected` : 'All'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!tier.is_default && (
                  <button
                    onClick={() => setDefault(tier.id)}
                    className="px-3 py-1 text-sm text-stone-500 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="Set as default"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => openEditModal(tier)}
                  className="p-2 text-stone-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit tier"
                >
                  <Pencil className="w-4 h-4" />
                </button>

                {deleteConfirm === tier.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteTier(tier.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 bg-stone-200 text-stone-700 rounded text-xs hover:bg-stone-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(tier.id)}
                    className="p-2 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete tier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {tiers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
            <Layers className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No tiers configured yet.</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-[#FF8811] text-white rounded-xl hover:bg-[#e67a0f] transition-colors"
            >
              Create Your First Tier
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Changes to tiers take effect immediately for all users on that tier.
          Admins are exempt from all limits.
        </p>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-stone-200">
              <h2 className="text-xl font-bold text-stone-800">
                {editingTier ? 'Edit Tier' : 'Create New Tier'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="e.g., Pro"
                    className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          formData.color === color.value ? 'ring-2 ring-offset-2 ring-stone-400' : ''
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Description <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Best for power users"
                  className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811] focus:border-transparent"
                />
              </div>

              {/* Token Limits */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Token Limits
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">
                      Daily Token Limit
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={unlimitedFields.daily_token_limit ? '' : (formData.daily_token_limit || '')}
                        onChange={(e) => setFormData({ ...formData, daily_token_limit: e.target.value ? parseInt(e.target.value) : null })}
                        disabled={unlimitedFields.daily_token_limit}
                        placeholder="e.g., 10000"
                        className="flex-1 px-4 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811] focus:border-transparent disabled:bg-stone-100 disabled:text-stone-400"
                      />
                      <label className="flex items-center gap-1.5 text-sm text-stone-600 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={unlimitedFields.daily_token_limit}
                          onChange={(e) => {
                            setUnlimitedFields({ ...unlimitedFields, daily_token_limit: e.target.checked })
                            if (e.target.checked) setFormData({ ...formData, daily_token_limit: null })
                          }}
                          className="w-4 h-4 rounded border-stone-300 text-[#FF8811] focus:ring-[#FF8811]"
                        />
                        <Infinity className="w-4 h-4" />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">
                      Monthly Token Limit
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={unlimitedFields.monthly_token_limit ? '' : (formData.monthly_token_limit || '')}
                        onChange={(e) => setFormData({ ...formData, monthly_token_limit: e.target.value ? parseInt(e.target.value) : null })}
                        disabled={unlimitedFields.monthly_token_limit}
                        placeholder="e.g., 100000"
                        className="flex-1 px-4 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811] focus:border-transparent disabled:bg-stone-100 disabled:text-stone-400"
                      />
                      <label className="flex items-center gap-1.5 text-sm text-stone-600 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={unlimitedFields.monthly_token_limit}
                          onChange={(e) => {
                            setUnlimitedFields({ ...unlimitedFields, monthly_token_limit: e.target.checked })
                            if (e.target.checked) setFormData({ ...formData, monthly_token_limit: null })
                          }}
                          className="w-4 h-4 rounded border-stone-300 text-[#FF8811] focus:ring-[#FF8811]"
                        />
                        <Infinity className="w-4 h-4" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Merge & Rate Limits */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  <GitMerge className="w-4 h-4 text-purple-500" />
                  Merge & Rate Limits
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">
                      Daily Merge Limit
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={unlimitedFields.daily_merge_limit ? '' : (formData.daily_merge_limit || '')}
                        onChange={(e) => setFormData({ ...formData, daily_merge_limit: e.target.value ? parseInt(e.target.value) : null })}
                        disabled={unlimitedFields.daily_merge_limit}
                        placeholder="e.g., 5"
                        className="flex-1 px-4 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811] focus:border-transparent disabled:bg-stone-100 disabled:text-stone-400"
                      />
                      <label className="flex items-center gap-1.5 text-sm text-stone-600 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={unlimitedFields.daily_merge_limit}
                          onChange={(e) => {
                            setUnlimitedFields({ ...unlimitedFields, daily_merge_limit: e.target.checked })
                            if (e.target.checked) setFormData({ ...formData, daily_merge_limit: null })
                          }}
                          className="w-4 h-4 rounded border-stone-300 text-[#FF8811] focus:ring-[#FF8811]"
                        />
                        <Infinity className="w-4 h-4" />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-stone-600 mb-2">
                      Requests per Minute
                    </label>
                    <input
                      type="number"
                      value={formData.requests_per_minute}
                      onChange={(e) => setFormData({ ...formData, requests_per_minute: parseInt(e.target.value) || 20 })}
                      min={1}
                      className="w-full px-4 py-2 border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8811] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Model Access */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-stone-800 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-stone-500" />
                  Model Access
                  <span className="text-stone-400 font-normal text-xs">
                    (leave empty for all models)
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-stone-50 rounded-xl">
                  {models.map((model) => (
                    <label
                      key={model.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        formData.allowed_model_ids.includes(model.model_id)
                          ? 'bg-violet-100 text-violet-700'
                          : 'hover:bg-stone-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.allowed_model_ids.includes(model.model_id)}
                        onChange={() => toggleModelSelection(model.model_id)}
                        className="w-4 h-4 rounded border-stone-300 text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm">{model.display_name}</span>
                    </label>
                  ))}
                </div>
                {formData.allowed_model_ids.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, allowed_model_ids: [] })}
                    className="text-xs text-stone-500 hover:text-stone-700"
                  >
                    Clear selection (allow all models)
                  </button>
                )}
              </div>

              {/* Options */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="w-4 h-4 rounded border-stone-300 text-[#FF8811] focus:ring-[#FF8811]"
                  />
                  <span className="text-sm text-stone-700">Default tier for new users</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-stone-700">Sort Order:</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-20 px-3 py-1 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8811]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-stone-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#FF8811] text-white rounded-xl hover:bg-[#e67a0f] transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : editingTier ? 'Save Changes' : 'Create Tier'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-stone-200 text-stone-700 rounded-xl hover:bg-stone-300 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTiers
