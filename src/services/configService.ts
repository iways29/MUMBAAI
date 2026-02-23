import { supabase } from '../lib/supabase.ts'

// Types
export interface AppModel {
  id: string
  provider: string
  model_id: string
  display_name: string
  is_enabled: boolean
  is_default: boolean
  sort_order: number
}

export interface AppPrompt {
  id: string
  key: string
  category: string
  name: string
  content: string
  description: string | null
  is_active: boolean
  variables: string[]
}

// Cache
let modelsCache: AppModel[] | null = null
let promptsCache: Map<string, AppPrompt> | null = null
let modelsCacheTime: number = 0
let promptsCacheTime: number = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Clear cache (call this after admin updates)
export const clearConfigCache = () => {
  modelsCache = null
  promptsCache = null
  modelsCacheTime = 0
  promptsCacheTime = 0
}

// Fetch all enabled models (for general use)
export const getModels = async (): Promise<AppModel[]> => {
  const allModels = await getAllModels()
  return allModels.filter(m => m.is_enabled)
}

// Fetch ALL models including disabled (for LLMSelector to show all providers)
export const getAllModels = async (): Promise<AppModel[]> => {
  const now = Date.now()

  // Return cached if valid
  if (modelsCache && (now - modelsCacheTime) < CACHE_TTL) {
    return modelsCache
  }

  try {
    const { data, error } = await supabase
      .from('app_models')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching models:', error)
      return modelsCache || [] // Return stale cache if available
    }

    modelsCache = data || []
    modelsCacheTime = now
    return modelsCache
  } catch (err) {
    console.error('Error fetching models:', err)
    return modelsCache || []
  }
}

// Get default model
export const getDefaultModel = async (): Promise<AppModel | null> => {
  const models = await getModels()
  return models.find(m => m.is_default) || models[0] || null
}

// Get default model ID
export const getDefaultModelId = async (): Promise<string> => {
  const defaultModel = await getDefaultModel()
  return defaultModel?.model_id || 'claude-sonnet-4-20250514'
}

// Fetch all active prompts
export const getPrompts = async (): Promise<Map<string, AppPrompt>> => {
  const now = Date.now()

  // Return cached if valid
  if (promptsCache && (now - promptsCacheTime) < CACHE_TTL) {
    return promptsCache
  }

  try {
    const { data, error } = await supabase
      .from('app_prompts')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching prompts:', error)
      return promptsCache || new Map()
    }

    // Create map keyed by prompt key
    const promptMap = new Map<string, AppPrompt>()
    data?.forEach(prompt => {
      promptMap.set(prompt.key, prompt)
    })

    promptsCache = promptMap
    promptsCacheTime = now
    return promptsCache
  } catch (err) {
    console.error('Error fetching prompts:', err)
    return promptsCache || new Map()
  }
}

// Get a specific prompt by key
export const getPrompt = async (key: string): Promise<string> => {
  const prompts = await getPrompts()
  const prompt = prompts.get(key)

  if (!prompt) {
    console.warn(`Prompt not found: ${key}, using fallback`)
    return getFallbackPrompt(key)
  }

  return prompt.content
}

// Get prompt with variable replacement
export const getPromptWithVariables = async (
  key: string,
  variables: Record<string, string>
): Promise<string> => {
  let content = await getPrompt(key)

  // Replace variables
  Object.entries(variables).forEach(([varName, value]) => {
    content = content.replace(new RegExp(`\\$\\{${varName}\\}`, 'g'), value)
  })

  return content
}

// Fallback prompts (used if DB fetch fails)
const getFallbackPrompt = (key: string): string => {
  const fallbacks: Record<string, string> = {
    // Merge templates
    merge_smart: "Please analyze and synthesize these different conversation branches into a unified response that captures the key insights from each path:",
    merge_compare: "Compare and contrast these different approaches, highlighting key similarities and differences while providing a balanced analysis:",
    merge_extract: "Extract the key insights and main points from these conversations in a clear, organized format with bullet points or numbered lists:",
    merge_resolve: "These conversations show different viewpoints. Find common ground and resolve any conflicts while addressing the core concerns from each perspective:",

    // Context prompts
    context_first_message: `Context: You are responding within MUMBAAI, a branching conversation platform that allows users to explore multiple conversation paths and compare responses from different AI models. Users can branch conversations at any point to explore different directions, then merge insights from multiple branches. This enables more thorough exploration of topics and better decision-making.

Your role: Maintain your authentic identity and capabilities while being helpful in this branching conversation context. Users may compare your responses with other AI models, so showcase your unique strengths and perspective.`,

    context_ongoing: `Context: You are in MUMBAAI, a branching conversation platform where users explore multiple conversation paths and compare different AI models. This conversation may be branched or merged with others.`,

    // System
    merge_synthesis_suffix: "Create a comprehensive response that merges the best elements from these different directions while maintaining coherence and adding new insights where appropriate.",

    // Fallback messages
    error_generic: "Sorry, I encountered an error. Please try again.",
    fallback_merge: "I've combined insights from multiple conversation paths. While I couldn't generate a full synthesis due to a technical issue, these different perspectives offer valuable viewpoints on the topic.",
  }

  return fallbacks[key] || ''
}

// Group models by provider for UI
export const getModelsGroupedByProvider = async (): Promise<Map<string, AppModel[]>> => {
  const models = await getModels()
  const grouped = new Map<string, AppModel[]>()

  models.forEach(model => {
    const existing = grouped.get(model.provider) || []
    existing.push(model)
    grouped.set(model.provider, existing)
  })

  return grouped
}

// Provider display info
export const getProviderInfo = (provider: string): { label: string; color: string } => {
  const providers: Record<string, { label: string; color: string }> = {
    anthropic: { label: 'Anthropic', color: 'orange' },
    openai: { label: 'OpenAI', color: 'green' },
    google: { label: 'Google', color: 'blue' },
  }
  return providers[provider] || { label: provider, color: 'gray' }
}
