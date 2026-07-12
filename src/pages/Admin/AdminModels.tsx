import React, { useState, useEffect } from 'react'
import {
  Bot,
  Check,
  X,
  Star,
  Plus,
  Pencil,
  Trash2,
  Save,
  RotateCcw
} from 'lucide-react'
import { supabase } from '../../lib/supabase.ts'

interface Model {
  id: string
  provider: string
  model_id: string
  display_name: string
  is_enabled: boolean
  is_default: boolean
  sort_order: number
  updated_at: string
}

interface ModelFormData {
  provider: string
  model_id: string
  display_name: string
  is_enabled: boolean
  is_default: boolean
  sort_order: number
}

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)', color: 'bg-plum' },
  { value: 'openai', label: 'OpenAI (GPT)', color: 'bg-plum' },
  { value: 'google', label: 'Google (Gemini)', color: 'bg-plum' },
]

const providerColors: Record<string, { bg: string; text: string; icon: string }> = {
  anthropic: { bg: 'bg-plum-soft', text: 'text-plum', icon: 'bg-plum' },
  openai: { bg: 'bg-plum-soft', text: 'text-plum', icon: 'bg-plum' },
  google: { bg: 'bg-panel-2', text: 'text-ash', icon: 'bg-plum' },
}

const emptyFormData: ModelFormData = {
  provider: 'anthropic',
  model_id: '',
  display_name: '',
  is_enabled: true,
  is_default: false,
  sort_order: 0,
}

const AdminModels: React.FC = () => {
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingModel, setEditingModel] = useState<Model | null>(null)
  const [formData, setFormData] = useState<ModelFormData>(emptyFormData)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchModels = async () => {
    try {
      const { data, error } = await supabase
        .from('app_models')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      setModels(data ?? [])
    } catch (error) {
      console.error('Error fetching models:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const openAddModal = () => {
    // Calculate next sort_order
    const maxSortOrder = Math.max(...models.map(m => m.sort_order), 0)
    setFormData({ ...emptyFormData, sort_order: maxSortOrder + 1 })
    setEditingModel(null)
    setShowModal(true)
  }

  const openEditModal = (model: Model) => {
    setFormData({
      provider: model.provider,
      model_id: model.model_id,
      display_name: model.display_name,
      is_enabled: model.is_enabled,
      is_default: model.is_default,
      sort_order: model.sort_order,
    })
    setEditingModel(model)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingModel(null)
    setFormData(emptyFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // If setting as default, unset other defaults first
      if (formData.is_default) {
        await supabase
          .from('app_models')
          .update({ is_default: false })
          .neq('id', editingModel?.id ?? '')
      }

      if (editingModel) {
        // Update existing model
        const { error } = await supabase
          .from('app_models')
          .update({
            provider: formData.provider,
            model_id: formData.model_id,
            display_name: formData.display_name,
            is_enabled: formData.is_enabled,
            is_default: formData.is_default,
            sort_order: formData.sort_order,
          })
          .eq('id', editingModel.id)

        if (error) throw error
      } else {
        // Create new model
        const { error } = await supabase
          .from('app_models')
          .insert({
            provider: formData.provider,
            model_id: formData.model_id,
            display_name: formData.display_name,
            is_enabled: formData.is_enabled,
            is_default: formData.is_default,
            sort_order: formData.sort_order,
          })

        if (error) throw error
      }

      await fetchModels()
      closeModal()
    } catch (error) {
      console.error('Error saving model:', error)
      alert('Error saving model. Check if model_id already exists.')
    } finally {
      setSaving(false)
    }
  }

  const deleteModel = async (id: string) => {
    try {
      const model = models.find(m => m.id === id)
      if (model?.is_default) {
        alert("Can't delete the default model. Set another model as default first.")
        return
      }

      const { error } = await supabase
        .from('app_models')
        .delete()
        .eq('id', id)

      if (error) throw error

      setModels(models.filter(m => m.id !== id))
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting model:', error)
    }
  }

  const toggleEnabled = async (id: string, currentState: boolean) => {
    const model = models.find(m => m.id === id)
    if (model?.is_default && currentState) {
      alert("Can't disable the default model.")
      return
    }

    try {
      const { error } = await supabase
        .from('app_models')
        .update({ is_enabled: !currentState })
        .eq('id', id)

      if (error) throw error

      setModels(models.map(m =>
        m.id === id ? { ...m, is_enabled: !currentState } : m
      ))
    } catch (error) {
      console.error('Error toggling model:', error)
    }
  }

  const setDefault = async (id: string) => {
    try {
      // Unset all defaults
      await supabase
        .from('app_models')
        .update({ is_default: false })
        .neq('id', id)

      // Set new default and enable it
      const { error } = await supabase
        .from('app_models')
        .update({ is_default: true, is_enabled: true })
        .eq('id', id)

      if (error) throw error

      setModels(models.map(m => ({
        ...m,
        is_default: m.id === id,
        is_enabled: m.id === id ? true : m.is_enabled
      })))
    } catch (error) {
      console.error('Error setting default:', error)
    }
  }

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {} as Record<string, Model[]>)

  const providerLabels: Record<string, string> = {
    anthropic: 'Anthropic (Claude)',
    openai: 'OpenAI (GPT)',
    google: 'Google (Gemini)',
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-panel-2 rounded"></div>
          <div className="h-4 w-64 bg-panel-2 rounded"></div>
          <div className="space-y-3 mt-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-panel-2 rounded-node"></div>
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
            <div className="w-10 h-10 bg-plum rounded-node flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-[28px] font-extralight text-bone tracking-display">Models</h1>
          </div>
          <p className="text-ash">
            Configure which LLM models are available in the app
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-plum text-white rounded-node hover:bg-plum-hover transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Model
        </button>
      </div>

      {/* Legend */}
      <div className="mb-6 flex items-center gap-6 text-sm text-ash">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-plum"></div>
          <span>Enabled (shown to users)</span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber fill-[var(--color-amber)]" />
          <span>Default model</span>
        </div>
      </div>

      {/* Models by Provider */}
      <div className="space-y-8">
        {Object.entries(groupedModels).map(([provider, providerModels]) => (
          <div key={provider}>
            <h2 className="text-lg font-semibold text-ash mb-4 flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${providerColors[provider]?.icon || 'bg-panel-2'}`}></div>
              {providerLabels[provider] || provider}
              <span className="text-sm font-normal text-smoke">
                ({providerModels.length} model{providerModels.length !== 1 ? 's' : ''})
              </span>
            </h2>
            <div className="space-y-2">
              {providerModels.map((model) => (
                <div
                  key={model.id}
                  className={`bg-panel rounded-node border p-4 flex items-center justify-between transition-all ${
                    model.is_enabled
                      ? 'border-hairline'
                      : 'border-hairline opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 rounded-[8px] text-xs font-mono ${providerColors[provider]?.bg || 'bg-panel-2'} ${providerColors[provider]?.text || 'text-ash'}`}>
                      {model.model_id}
                    </div>
                    <div className="font-medium text-bone">
                      {model.display_name}
                    </div>
                    {model.is_default && (
                      <Star className="w-4 h-4 text-amber fill-[var(--color-amber)]" />
                    )}
                    <span className="text-xs text-smoke">
                      Order: {model.sort_order}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Set as Default */}
                    {!model.is_default && (
                      <button
                        onClick={() => setDefault(model.id)}
                        className="px-3 py-1 text-sm text-smoke hover:text-amber hover:bg-panel-2 rounded-[8px] transition-colors"
                        title="Set as default"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}

                    {/* Enable/Disable Toggle */}
                    <button
                      onClick={() => toggleEnabled(model.id, model.is_enabled)}
                      className={`px-3 py-1 rounded-[8px] text-sm font-medium flex items-center gap-1 transition-colors ${
                        model.is_enabled
                          ? 'bg-plum-soft text-plum hover:bg-plum-soft'
                          : 'bg-panel-2 text-smoke hover:bg-panel-2'
                      }`}
                    >
                      {model.is_enabled ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => openEditModal(model)}
                      className="p-2 text-smoke hover:text-bone hover:bg-panel-2 rounded-[8px] transition-colors"
                      title="Edit model"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    {deleteConfirm === model.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => deleteModel(model.id)}
                          className="px-2 py-1 bg-transparent border border-danger text-white rounded text-xs hover:bg-[rgba(240,89,78,0.12)]"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 bg-panel-2 text-ash rounded text-xs hover:bg-panel-2"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(model.id)}
                        className="p-2 text-smoke hover:text-danger hover:bg-[rgba(240,89,78,0.08)] rounded-[8px] transition-colors"
                        title="Delete model"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {models.length === 0 && (
          <div className="text-center py-12 bg-panel rounded-node border border-hairline">
            <Bot className="w-12 h-12 text-smoke mx-auto mb-4" />
            <p className="text-smoke">No models configured yet.</p>
            <button
              onClick={openAddModal}
              className="mt-4 px-4 py-2 bg-plum text-white rounded-node hover:bg-plum-hover transition-colors"
            >
              Add Your First Model
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-8 p-4 bg-panel-2 rounded-node border border-hairline">
        <p className="text-sm text-ash">
          <strong>Note:</strong> Changes take effect immediately. Enabled models appear in the model selector.
          The default model is pre-selected for new conversations.
        </p>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-panel rounded-node w-full max-w-lg mx-4">
            <div className="p-6 border-b border-hairline">
              <h2 className="text-[17px] font-semibold text-bone">
                {editingModel ? 'Edit Model' : 'Add New Model'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Provider */}
              <div>
                <label className="block text-sm font-medium text-ash mb-2">
                  Provider
                </label>
                <select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  className="w-full px-4 py-2 border border-hairline rounded-node focus:outline-none focus:border-plum"
                >
                  {PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model ID */}
              <div>
                <label className="block text-sm font-medium text-ash mb-2">
                  Model ID
                  <span className="text-smoke font-normal ml-1">(API identifier)</span>
                </label>
                <input
                  type="text"
                  value={formData.model_id}
                  onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                  placeholder="e.g., claude-3-opus-20240229"
                  className="w-full px-4 py-2 border border-hairline rounded-node focus:outline-none focus:border-plum font-mono text-sm"
                  required
                />
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-ash mb-2">
                  Display Name
                  <span className="text-smoke font-normal ml-1">(shown to users)</span>
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="e.g., Claude 3 Opus"
                  className="w-full px-4 py-2 border border-hairline rounded-node focus:outline-none focus:border-plum"
                  required
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-ash mb-2">
                  Sort Order
                  <span className="text-smoke font-normal ml-1">(lower = higher in list)</span>
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-hairline rounded-node focus:outline-none focus:border-plum"
                />
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-hairline text-plum focus:ring-0"
                  />
                  <span className="text-sm text-ash">Enabled</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked, is_enabled: e.target.checked ? true : formData.is_enabled })}
                    className="w-4 h-4 rounded border-hairline text-plum focus:ring-0"
                  />
                  <span className="text-sm text-ash">Default</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-plum text-white rounded-node hover:bg-plum-hover transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : editingModel ? 'Save Changes' : 'Add Model'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-panel-2 text-ash rounded-node hover:bg-panel-2 transition-colors flex items-center gap-2"
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

export default AdminModels
