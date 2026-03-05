

# Phase 1: Strategic Context + Content Ideas + Enhanced Projects

## Overview

Implement the core new flow: **Client → Strategic Context → Projects → Content Ideas → Scripts**, keeping all existing functionality intact. This phase covers items 1, 2, 3, 4, 7, and 8 from the request. Calendar (5) and AI Memory (6) will be Phase 2.

---

## Database Changes

### New table: `client_strategic_contexts`

One row per client (business_name group). Stores permanent brand information.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | Owner |
| business_name | text NOT NULL | Links to briefing_requests group |
| business_niche | text | |
| products_services | text | |
| target_audience | text | |
| customer_persona | text | |
| tone_of_voice | text | |
| market_positioning | text | |
| pain_points | text | |
| differentiators | text | |
| marketing_objectives | text | |
| main_platforms | text[] | Array of platforms |
| communication_style | text | educational, authority, casual, etc. |
| is_completed | boolean DEFAULT false | Whether form was filled |
| created_at / updated_at | timestamptz | |

RLS: Users can CRUD own rows (by user_id). Admins can manage all.

### New table: `content_ideas`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid NOT NULL | |
| project_id | uuid | FK to projects |
| context_id | uuid | FK to client_strategic_contexts |
| title | text NOT NULL | The idea topic |
| description | text | |
| status | text DEFAULT 'pending' | pending, selected, used, discarded |
| created_at | timestamptz | |

RLS: Users can CRUD own rows. Admins can manage all.

### Alter `projects` table

Add new columns for enhanced project structure:

| Column | Type |
|--------|------|
| campaign_objective | text |
| funnel_stage | text | top, middle, bottom |
| content_style | text |
| publishing_frequency | text |
| video_count | integer |
| context_id | uuid | FK to client_strategic_contexts |

---

## Edge Functions

### `generate-ideas` (NEW)

Receives: `context_id`, `project_id`, `count` (default 10)

Loads the strategic context + project info, calls AI to generate content ideas. Returns array of idea objects. Inserts into `content_ideas` table.

### `generate-script` (UPDATED)

Updated to accept optional `context_id` and `idea_id`. When provided, loads strategic context and idea to enrich the prompt with brand voice, persona, positioning, etc. Falls back to current behavior when not provided (backward compatible).

### `process-briefing` (UPDATED)

After processing the client form, also populate/create the `client_strategic_contexts` row from the form answers (mapping about_business → products_services, typical_customer → customer_persona, etc.).

---

## UI Changes

### Client Detail View (CRM.tsx)

Replace the flat project list with a **tabbed layout**:

```text
┌─────────────────────────────────────────────┐
│ [← Back]  Client Name                      │
│ Contact info bar                            │
├─────────────────────────────────────────────┤
│ [Contexto Estratégico] [Projetos] [Ideias]  │
├─────────────────────────────────────────────┤
│                                             │
│  Tab content area                           │
│                                             │
└─────────────────────────────────────────────┘
```

**Tab 1 - Contexto Estratégico**: Shows/edits all strategic context fields. Badge showing "Preenchido" or "Pendente". Link to send form to client if not completed.

**Tab 2 - Projetos**: Current project list (collapsible cards) with enhanced fields (funnel stage, campaign objective, content style). "Novo Projeto" dialog updated with new fields.

**Tab 3 - Ideias de Conteúdo**: 
- "Gerar Ideias" button that calls `generate-ideas`
- List of ideas with checkboxes to select, inline edit, delete, add custom
- "Gerar Roteiros" button that generates scripts from selected ideas

### Client Briefing Form (ClientBriefingForm.tsx)

Add more questions to map to strategic context fields:
- Communication style (multi-select chips)
- Main platforms (multi-select chips)
- Pain points (textarea)
- Differentiators (textarea)

These get saved to `form_answers` and `process-briefing` maps them to `client_strategic_contexts`.

### New Project Dialog

Add fields: Campaign objective, Funnel stage (select: Top/Middle/Bottom), Content style, Publishing frequency, Number of videos. Context is auto-inherited from the client.

### Script Generation (within project)

Updated to pull strategic context automatically. Each script generated from a selected content idea includes: Hook, Strategic briefing, Video structure, Speaking script, CTA, Suggested recording style.

Batch generation options: 1, 3, 5, 10, 15 scripts.

---

## Compatibility

- All existing routes, tables, and flows remain intact
- `briefing_requests` table untouched structurally
- Current briefing link system works as before
- `process-briefing` edge function extended (not replaced)
- Old scripts/briefings remain accessible

---

## Files to Create/Modify

| File | Action |
|------|--------|
| SQL migration | CREATE `client_strategic_contexts`, `content_ideas`; ALTER `projects` |
| `supabase/functions/generate-ideas/index.ts` | New edge function |
| `supabase/functions/generate-script/index.ts` | Extend with context support |
| `supabase/functions/process-briefing/index.ts` | Map answers → strategic context |
| `src/pages/CRM.tsx` | Tabbed client detail, ideas UI, enhanced project creation |
| `src/pages/ClientBriefingForm.tsx` | Additional questions for context |
| `src/integrations/supabase/types.ts` | Auto-updated after migration |
| `supabase/config.toml` | Add generate-ideas function |

