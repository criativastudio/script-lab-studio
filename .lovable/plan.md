

# Viral Score System

## Overview

Create a new edge function `score-script` that uses AI to analyze a script and return a structured viral score (0-100) with 7 criteria breakdowns, strengths, and improvements. Display the score in the ScriptViewer with a color-coded progress bar and action buttons.

## Changes

### 1. New Edge Function: `supabase/functions/score-script/index.ts`

- Accepts: `script_text`, `context_id` (optional), `platform` (optional)
- Loads strategic context if `context_id` provided (for audience relevance and platform optimization scoring)
- Uses structured tool-calling to return:
  - `total_score` (0-100)
  - `criteria`: object with 7 scores: `hook_strength` (0-20), `message_clarity` (0-15), `audience_relevance` (0-15), `storytelling_structure` (0-15), `emotional_trigger` (0-15), `cta_strength` (0-10), `platform_optimization` (0-10)
  - `strengths`: string[] (2-4 items)
  - `improvements`: string[] (2-4 items)
- Model: `google/gemini-3-flash-preview`

### 2. Register in `supabase/config.toml`

Add `[functions.score-script]` with `verify_jwt = false`.

### 3. Update `src/components/ScriptViewer.tsx`

Add a **Viral Score** section card below the header card:
- "Analisar Score" button triggers the edge function call
- Once scored, display:
  - Total score with color-coded Progress bar (green >= 70, yellow >= 40, red < 40)
  - 7 criteria bars with individual scores
  - Strengths as green badges
  - Improvements as yellow badges
- Action buttons: "Melhorar Roteiro", "Regenerar Gancho", "Otimizar para Plataforma" (these open the HookGenerator or are placeholders for future features)

### 4. Update `src/pages/CRM.tsx`

Pass `context_id` and `platform` to ScriptViewer so the score function can use strategic context.

## Files

| File | Change |
|---|---|
| `supabase/functions/score-script/index.ts` | New edge function |
| `supabase/config.toml` | Register new function |
| `src/components/ScriptViewer.tsx` | Add viral score UI with progress bars, strengths/improvements, action buttons |
| `src/pages/CRM.tsx` | Pass context_id to ScriptViewer (already passes strategicContextId — verify it flows correctly) |

