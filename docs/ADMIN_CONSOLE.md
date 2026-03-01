# MUMBAAI Admin Console

## Overview

The Admin Console allows users with admin privileges to manage critical application configurations without code changes. Changes made here are stored in the database and applied in real-time.

---

## Access

- **URL:** `/admin`
- **Required Role:** `is_admin = true` in `user_profiles` table
- **Current Admin:** `e206308d-7f0c-4e0d-9db5-231ee398487c`

---

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard | Overview with stats and quick actions |
| `/admin/prompts` | Prompts | Manage system prompts, merge templates, fallbacks |
| `/admin/models` | Models | Enable/disable LLM models, set default |
| `/admin/users` | Users | View users, grant/revoke admin access |

---

## Components

### `useAdmin` Hook
Location: `src/hooks/useAdmin.ts`

Checks if the current user has admin privileges by querying `user_profiles.is_admin`.

```typescript
const { isAdmin, loading, user } = useAdmin()
```

### `AdminLayout`
Location: `src/pages/Admin/AdminLayout.tsx`

Main layout with sidebar navigation. Wraps all admin pages and handles:
- Admin access check (redirects non-admins)
- Sidebar navigation
- Back to app link

### Admin Pages
Location: `src/pages/Admin/`

- `AdminDashboard.tsx` - Stats overview
- `AdminPrompts.tsx` - Prompt management with inline editing
- `AdminModels.tsx` - Model toggle and default selection
- `AdminUsers.tsx` - User list with admin toggle

---

## Database Schema

### Tables

#### `app_prompts`
Stores all LLM prompts used by the application.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `key` | text | Unique identifier (e.g., `merge_smart`, `context_first_message`) |
| `category` | text | Group: `merge_template`, `context`, `system`, `fallback` |
| `name` | text | Display name in admin UI |
| `content` | text | The actual prompt text |
| `description` | text | Explains what this prompt does |
| `is_active` | boolean | Enable/disable this prompt |
| `variables` | text[] | Variables used (e.g., `['userInput', 'contextMessages']`) |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |
| `updated_by` | uuid | User who last edited |

**Categories:**
- `merge_template` - Templates for merging conversation branches
- `context` - Context prompts for conversation setup
- `system` - System-level instructions
- `fallback` - Error and fallback messages

#### `app_models`
Stores LLM model configurations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `provider` | text | Provider: `anthropic`, `openai`, `google` |
| `model_id` | text | API model ID (e.g., `claude-sonnet-4-20250514`) |
| `display_name` | text | UI display name (e.g., `Claude Sonnet 4`) |
| `is_enabled` | boolean | Show in model selector |
| `is_default` | boolean | Default selection (only one should be true) |
| `sort_order` | integer | Display order in selector |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Providers:**
- `anthropic` - Claude models
- `openai` - GPT models
- `google` - Gemini models

---

## Prompts Reference

### Merge Templates
Used when users merge conversation branches.

| Key | Name | Purpose |
|-----|------|---------|
| `merge_smart` | Smart Merge | Synthesize branches into unified response |
| `merge_compare` | Compare & Contrast | Highlight similarities and differences |
| `merge_extract` | Extract Key Points | Pull out main insights as bullet points |
| `merge_resolve` | Resolve Conflicts | Find common ground between viewpoints |

### Context Prompts
Establish MUMBAAI identity for LLM conversations.

| Key | Name | Purpose |
|-----|------|---------|
| `context_first_message` | First Message Context | Full platform context for first message |
| `context_ongoing` | Ongoing Context | Abbreviated context for subsequent messages |

### System Prompts

| Key | Name | Purpose |
|-----|------|---------|
| `merge_synthesis_suffix` | Merge Synthesis | Instruction appended after merge template |

### Fallback Messages

| Key | Name | Purpose |
|-----|------|---------|
| `error_generic` | Generic Error | Shown when API fails |
| `fallback_merge` | Merge Fallback | Short fallback when merge fails |
| `fallback_merge_detailed` | Detailed Merge Fallback | Extended fallback with structure |

---

## Variables in Prompts

Prompts can contain variables that are replaced at runtime:

| Variable | Description | Used In |
|----------|-------------|---------|
| `${userInput}` | User's message | Context prompts |
| `${contextMessages}` | Conversation history | Ongoing context |
| `${selectedMessages}` | Messages from selected branches | Merge prompts |
| `${messageCount}` | Number of branches being merged | Fallback merge |

---

## RLS Policies

| Table | Admin | Regular Users |
|-------|-------|---------------|
| `app_prompts` | Full CRUD | SELECT only |
| `app_models` | Full CRUD | SELECT only |

---

## Changelog

### v0.3.0 (Database Integration)
- Created `configService.ts` for fetching prompts and models from database
- Updated `LLMSelector` to load models dynamically from database
- Updated `api.ts` to fetch prompts from database
- Added caching with 5-minute TTL for performance
- Added fallback prompts for offline/error scenarios
- Models now show loading state while fetching
- Full CRUD operations in AdminModels page (add, edit, delete)

### v0.2.0 (Admin Console UI)
- Added React Router for proper URL-based navigation
- Created `useAdmin` hook for admin access checks
- Created `AdminLayout` with sidebar navigation
- Created `AdminDashboard` with stats overview
- Created `AdminPrompts` with inline editing
- Created `AdminModels` with enable/disable and default selection
- Created `AdminUsers` with admin role management
- Updated app routing structure

### v0.1.0 (Initial Setup)
- Created `app_prompts` table
- Created `app_models` table
- Migrated existing hardcoded prompts
- Migrated existing hardcoded models
