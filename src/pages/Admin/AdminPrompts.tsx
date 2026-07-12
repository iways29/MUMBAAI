import React, { useState, useEffect } from 'react'
import {
  MessageSquareText,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw
} from 'lucide-react'
import { supabase } from '../../lib/supabase.ts'

interface Prompt {
  id: string
  key: string
  category: string
  name: string
  content: string
  description: string | null
  is_active: boolean
  variables: string[]
  updated_at: string
}

const categoryColors: Record<string, string> = {
  merge_template: 'bg-panel-2 text-ash',
  context: 'bg-plum-soft text-plum',
  system: 'bg-plum-soft text-plum',
  fallback: 'bg-panel-2 text-ash',
}

const AdminPrompts: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('app_prompts')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setPrompts(data ?? [])
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [])

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('app_prompts')
        .update({ is_active: !currentState })
        .eq('id', id)

      if (error) throw error

      setPrompts(prompts.map(p =>
        p.id === id ? { ...p, is_active: !currentState } : p
      ))
    } catch (error) {
      console.error('Error toggling prompt:', error)
    }
  }

  const startEditing = (prompt: Prompt) => {
    setEditingId(prompt.id)
    setEditContent(prompt.content)
    setExpandedId(prompt.id)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditContent('')
  }

  const saveContent = async (id: string) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('app_prompts')
        .update({ content: editContent })
        .eq('id', id)

      if (error) throw error

      setPrompts(prompts.map(p =>
        p.id === id ? { ...p, content: editContent } : p
      ))
      setEditingId(null)
      setEditContent('')
    } catch (error) {
      console.error('Error saving prompt:', error)
    } finally {
      setSaving(false)
    }
  }

  const groupedPrompts = prompts.reduce((acc, prompt) => {
    if (!acc[prompt.category]) {
      acc[prompt.category] = []
    }
    acc[prompt.category].push(prompt)
    return acc
  }, {} as Record<string, Prompt[]>)

  const categoryLabels: Record<string, string> = {
    merge_template: 'Merge Templates',
    context: 'Context Prompts',
    system: 'System Prompts',
    fallback: 'Fallback Messages',
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-panel-2 rounded"></div>
          <div className="h-4 w-64 bg-panel-2 rounded"></div>
          <div className="space-y-3 mt-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-panel-2 rounded-node"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-plum rounded-node flex items-center justify-center">
            <MessageSquareText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-[28px] font-extralight text-bone tracking-display">Prompts</h1>
        </div>
        <p className="text-ash">
          Manage system prompts, merge templates, and fallback messages
        </p>
      </div>

      {/* Prompts by Category */}
      <div className="space-y-8">
        {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
          <div key={category}>
            <h2 className="text-lg font-semibold text-ash mb-4">
              {categoryLabels[category] || category}
            </h2>
            <div className="space-y-3">
              {categoryPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="bg-panel rounded-node border border-hairline overflow-hidden"
                >
                  {/* Header */}
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-panel-2"
                    onClick={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[prompt.category]}`}>
                        {prompt.key}
                      </span>
                      <div>
                        <div className="font-medium text-bone">{prompt.name}</div>
                        {prompt.description && (
                          <div className="text-sm text-smoke">{prompt.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Active Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleActive(prompt.id, prompt.is_active)
                        }}
                        className={`px-3 py-1 rounded-[8px] text-sm font-medium flex items-center gap-1 transition-colors ${
                          prompt.is_active
                            ? 'bg-plum-soft text-plum hover:bg-plum-soft'
                            : 'bg-panel-2 text-smoke hover:bg-panel-2'
                        }`}
                      >
                        {prompt.is_active ? (
                          <>
                            <Check className="w-4 h-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Inactive
                          </>
                        )}
                      </button>
                      {/* Expand/Collapse */}
                      {expandedId === prompt.id ? (
                        <ChevronUp className="w-5 h-5 text-smoke" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-smoke" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedId === prompt.id && (
                    <div className="border-t border-hairline p-4 bg-panel-2">
                      {/* Variables */}
                      {prompt.variables && prompt.variables.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-medium text-smoke mb-2">VARIABLES</div>
                          <div className="flex flex-wrap gap-2">
                            {prompt.variables.map((v) => (
                              <code key={v} className="px-2 py-1 bg-panel-2 rounded text-xs text-ash">
                                ${'{'}
                                {v}
                                {'}'}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="text-xs font-medium text-smoke mb-2">CONTENT</div>
                      {editingId === prompt.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full h-48 p-3 bg-panel text-bone placeholder:text-smoke border border-hairline rounded-[8px] text-sm font-mono focus:outline-none focus:border-plum"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveContent(prompt.id)}
                              disabled={saving}
                              className="px-4 py-2 bg-plum text-white rounded-[8px] hover:bg-plum-hover transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-4 py-2 bg-panel-2 text-ash rounded-[8px] hover:bg-panel-2 transition-colors flex items-center gap-2"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <pre className="p-3 bg-panel border border-hairline rounded-[8px] text-sm whitespace-pre-wrap font-mono text-ash">
                            {prompt.content}
                          </pre>
                          <button
                            onClick={() => startEditing(prompt)}
                            className="mt-3 px-4 py-2 bg-panel-2 text-ash rounded-[8px] hover:bg-panel-2 transition-colors text-sm"
                          >
                            Edit Content
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPrompts
