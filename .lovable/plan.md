

# Adaptive AI Agent — Client Learning System

## Overview

Enhance the AI's memory and learning capabilities by creating a structured knowledge base per client that tracks generated content categories, hooks, angles, and client preferences. This data feeds back into both `generate-ideas` and `generate-script` prompts to improve quality over time.

## Database Changes

### New table: `client_content_memory`

Stores structured metadata about every generated script, enabling the AI to learn patterns.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid NOT NULL | Owner |
| context_id | uuid NOT NULL | FK to client_strategic_contexts |
| script_id | uuid | FK to scripts |
| idea_id | uuid | FK to content_ideas |
| topic | text | The topic/title generated |
| hook | text | The hook text used |
| content_category | text | educational, authority, story, case_study, tips, myth_breaking, behind_scenes |
| angle | text | The strategic angle used |
| was_selected | boolean DEFAULT false | Whether client chose/used this script |
| created_at | timestamptz DEFAULT now() | |

RLS: Users can CRUD own rows (by user_id). Admins can manage all.

### Alter `content_ideas` table

Add column: `content_category text` — so ideas are also categorized.

## Edge Function Changes

### 1. `generate-script/index.ts` — Enhanced Memory + Save Structured Data

**Before generation (prompt enrichment):**
- Query `client_content_memory` for this context_id (last 100 entries)
- Build memory blocks:
  - **Topic memory**: List of previous topics (already exists, but now richer)
  - **Hook memory**: List of previous hooks to avoid repetition and evolve
  - **Category distribution**: Count of each category used → inject as "balance these categories, you've done X educational, Y authority, Z storytelling — prioritize underrepresented categories"
  - **Preference signal**: Count of `was_selected = true` by category → "Client prefers: storytelling (8 selected), authority (5 selected) — weight new generations toward preferred styles"

**After generation (save memory):**
- After successful script generation, insert a row into `client_content_memory` with the hook, topic, category, and angle extracted from the structured response
- Add `content_category` to the tool schema so the AI returns it

**Prompt additions:**
- Add content category instruction: "Classify this script into one category: educational, authority, story, case_study, tips, myth_breaking, behind_scenes"
- Add category balancing rule based on distribution data
- Add preference adaptation rule based on selection patterns

### 2. `generate-ideas/index.ts` — Category-Aware Idea Generation

**Enhanced memory query:**
- Query `client_content_memory` for category distribution and preference signals
- Inject category balancing into the idea generation prompt
- Add `content_category` to the idea tool schema output
- Save category on each generated idea in `content_ideas`

**Prompt additions:**
- "Distribute ideas across these categories: educational, authority, story, case_study, tips, myth_breaking, behind_scenes"
- "Prioritize categories the client has shown preference for: [list]"
- "Under-represented categories that need more content: [list]"

### 3. `src/pages/CRM.tsx` — Mark Scripts as Selected

When a user views/selects/exports a script, update `client_content_memory.was_selected = true` for that script_id. This feeds the preference learning loop.

## Content Categories

Fixed set used across the system:
- `educational` — Teaching/explaining concepts
- `authority` — Expert positioning, data-driven
- `story` — Storytelling narratives
- `case_study` — Client results, before/after
- `tips` — Quick actionable tips
- `myth_breaking` — Debunking misconceptions
- `behind_scenes` — Behind the scenes, process

## Files Modified

| File | Change |
|---|---|
| SQL migration | CREATE `client_content_memory`, ALTER `content_ideas` add `content_category` |
| `supabase/functions/generate-script/index.ts` | Add memory query, category distribution, preference signals, save to memory after generation, add `content_category` to tool schema |
| `supabase/functions/generate-ideas/index.ts` | Add category distribution, preference signals, return `content_category` per idea, save category |
| `src/pages/CRM.tsx` | Save memory entry after script generation, mark scripts as selected |

## Backward Compatibility

- Existing scripts without memory entries continue to work
- Memory builds progressively — first generations have no history, quality improves over time
- No changes to legacy script generation mode

