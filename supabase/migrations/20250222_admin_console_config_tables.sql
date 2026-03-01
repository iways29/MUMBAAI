-- =====================================================
-- ADMIN CONSOLE CONFIG TABLES MIGRATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. CREATE app_prompts TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.app_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL CHECK (category IN ('merge_template', 'context', 'system', 'fallback')),
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    variables TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES public.user_profiles(id)
);

-- Add index for faster lookups by key
CREATE INDEX IF NOT EXISTS idx_app_prompts_key ON public.app_prompts(key);
CREATE INDEX IF NOT EXISTS idx_app_prompts_category ON public.app_prompts(category);

-- Add comment for documentation
COMMENT ON TABLE public.app_prompts IS 'Stores all LLM prompts used by the application. Managed via Admin Console.';

-- =====================================================
-- 2. CREATE app_models TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.app_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'google')),
    model_id TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_models_provider ON public.app_models(provider);
CREATE INDEX IF NOT EXISTS idx_app_models_enabled ON public.app_models(is_enabled);

-- Add comment for documentation
COMMENT ON TABLE public.app_models IS 'Stores LLM model configurations. Managed via Admin Console.';

-- =====================================================
-- 3. ENABLE RLS
-- =====================================================

ALTER TABLE public.app_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_models ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. RLS POLICIES FOR app_prompts
-- =====================================================

-- Admins can do everything
CREATE POLICY "Admins can manage prompts"
ON public.app_prompts
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Regular users can only read active prompts
CREATE POLICY "Users can read active prompts"
ON public.app_prompts
FOR SELECT
TO authenticated
USING (is_active = true);

-- =====================================================
-- 5. RLS POLICIES FOR app_models
-- =====================================================

-- Admins can do everything
CREATE POLICY "Admins can manage models"
ON public.app_models
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Regular users can only read enabled models
CREATE POLICY "Users can read enabled models"
ON public.app_models
FOR SELECT
TO authenticated
USING (is_enabled = true);

-- =====================================================
-- 6. AUTO-UPDATE updated_at TRIGGER
-- =====================================================

-- Create function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for app_prompts
DROP TRIGGER IF EXISTS update_app_prompts_updated_at ON public.app_prompts;
CREATE TRIGGER update_app_prompts_updated_at
    BEFORE UPDATE ON public.app_prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for app_models
DROP TRIGGER IF EXISTS update_app_models_updated_at ON public.app_models;
CREATE TRIGGER update_app_models_updated_at
    BEFORE UPDATE ON public.app_models
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 7. SEED INITIAL PROMPTS DATA
-- =====================================================

INSERT INTO public.app_prompts (key, category, name, content, description, variables) VALUES

-- Merge Templates
('merge_smart', 'merge_template', 'Smart Merge',
'Please analyze and synthesize these different conversation branches into a unified response that captures the key insights from each path:',
'Synthesizes multiple conversation branches into a unified, coherent response.',
ARRAY['selectedMessages']),

('merge_compare', 'merge_template', 'Compare & Contrast',
'Compare and contrast these different approaches, highlighting key similarities and differences while providing a balanced analysis:',
'Compares different conversation branches, highlighting similarities and differences.',
ARRAY['selectedMessages']),

('merge_extract', 'merge_template', 'Extract Key Points',
'Extract the key insights and main points from these conversations in a clear, organized format with bullet points or numbered lists:',
'Extracts and organizes main points from conversation branches.',
ARRAY['selectedMessages']),

('merge_resolve', 'merge_template', 'Resolve Conflicts',
'These conversations show different viewpoints. Find common ground and resolve any conflicts while addressing the core concerns from each perspective:',
'Finds common ground between differing viewpoints in conversation branches.',
ARRAY['selectedMessages']),

-- Context Prompts
('context_first_message', 'context', 'First Message Context',
'Context: You are responding within MUMBAAI, a branching conversation platform that allows users to explore multiple conversation paths and compare responses from different AI models. Users can branch conversations at any point to explore different directions, then merge insights from multiple branches. This enables more thorough exploration of topics and better decision-making.

Your role: Maintain your authentic identity and capabilities while being helpful in this branching conversation context. Users may compare your responses with other AI models, so showcase your unique strengths and perspective.',
'Full platform context sent with the first message in any conversation.',
ARRAY['userInput']),

('context_ongoing', 'context', 'Ongoing Conversation Context',
'Context: You are in MUMBAAI, a branching conversation platform where users explore multiple conversation paths and compare different AI models. This conversation may be branched or merged with others.',
'Abbreviated context for messages after the first one. Includes conversation history.',
ARRAY['userInput', 'contextMessages']),

-- System Prompts
('merge_synthesis_suffix', 'system', 'Merge Synthesis Suffix',
'Create a comprehensive response that merges the best elements from these different directions while maintaining coherence and adding new insights where appropriate.',
'Appended after merge template to guide final synthesis.',
ARRAY[]::TEXT[]),

-- Fallback Messages
('error_generic', 'fallback', 'Generic Error',
'Sorry, I encountered an error. Please try again.',
'Shown when API call fails.',
ARRAY[]::TEXT[]),

('fallback_merge', 'fallback', 'Merge Fallback',
'I''ve combined insights from multiple conversation paths. While I couldn''t generate a full synthesis due to a technical issue, these different perspectives offer valuable viewpoints on the topic.',
'Short fallback when merge operation fails.',
ARRAY['messageCount']),

('fallback_merge_detailed', 'fallback', 'Detailed Merge Fallback',
'I''ve synthesized insights from different conversation paths to provide a comprehensive perspective:

**Key Themes Identified:**
- Multiple approaches to the same core challenge
- Complementary perspectives that build on each other
- Common goals with different implementation strategies

**Integrated Recommendations:**
Based on combining these viewpoints, I suggest an approach that:
1. Takes the strongest elements from each path
2. Addresses the trade-offs between different options
3. Provides a balanced solution that considers multiple factors

**Next Steps:**
The merged perspective suggests focusing on the overlapping areas where these different approaches align, while also considering the unique benefits each individual path offers.

*Note: This is a fallback response generated when the AI service is unavailable.*',
'Extended fallback with structured content when AI service is unavailable.',
ARRAY['messageCount']);

-- =====================================================
-- 8. SEED INITIAL MODELS DATA
-- =====================================================

INSERT INTO public.app_models (provider, model_id, display_name, is_enabled, is_default, sort_order) VALUES

-- Anthropic Models
('anthropic', 'claude-sonnet-4-20250514', 'Claude Sonnet 4', true, true, 1),
('anthropic', 'claude-opus-4-20250514', 'Claude Opus 4', false, false, 2),
('anthropic', 'claude-opus-4-1-20250805', 'Claude Opus 4.1', false, false, 3),

-- OpenAI Models
('openai', 'gpt-5-mini', 'GPT-5 Mini', true, false, 10),
('openai', 'gpt-4.1-mini', 'GPT-4.1 Mini', true, false, 11),
('openai', 'gpt-4o-mini', 'GPT-4o Mini', true, false, 12),
('openai', 'gpt-5', 'GPT-5', false, false, 13),
('openai', 'gpt-4.1', 'GPT-4.1', false, false, 14),
('openai', 'gpt-4o', 'GPT-4o', false, false, 15),

-- Google Models
('google', 'gemini-2.5-flash', 'Gemini 2.5 Flash', false, false, 20),
('google', 'gemini-1.5-flash', 'Gemini 1.5 Flash', false, false, 21);

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables were created
-- SELECT * FROM public.app_prompts;
-- SELECT * FROM public.app_models;