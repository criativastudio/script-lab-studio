

# Manual Briefing & Script Creation with AI Completion

## Summary

Add a "Criar Manual + IA" button inside each project's collapsible block. Opens a dialog with manual input fields (objective, audience, platform, hook, duration, notes). On submit, sends data to a new edge function that uses AI to generate a full briefing + script, then saves both to the database under that project.

## Changes

### 1. New Edge Function: `supabase/functions/manual-generate/index.ts`

Accepts manual input fields, builds a prompt incorporating them, calls Lovable AI with tool calling to return structured output (briefing fields + script), returns the result.

Input: `{ objective, target_audience, platform, hook, duration, notes, video_quantity, project_id }`

Uses tool calling to extract: `{ goal, target_audience, content_style, scripts: [{ title, script }] }`

### 2. `supabase/config.toml`

Add `[functions.manual-generate]` with `verify_jwt = false`.

### 3. `src/pages/CRM.tsx`

**New state**: `manualCreateOpen` (project id or null), manual form fields state.

**New dialog**: "Criar Manual + IA" with fields:
- Objetivo do Cliente (textarea)
- Público-alvo (input)
- Plataforma (select: Instagram Reels, TikTok, YouTube Shorts, YouTube, Facebook, LinkedIn)
- Mensagem Principal / Gancho (textarea)
- Duração (select: 15s, 30s, 60s, 3min, 5min+)
- Notas estratégicas (textarea, optional)

**Submit handler**: Calls `manual-generate` edge function, creates briefing + scripts in Supabase, refreshes project details.

**UI placement**: New button "Criar Manual + IA" next to "Gerar com Agente" in each project's action bar, with a `Sparkles` icon.

### 4. Files

| File | Change |
|------|--------|
| `supabase/functions/manual-generate/index.ts` | New edge function |
| `supabase/config.toml` | Add function entry |
| `src/pages/CRM.tsx` | Add manual create dialog + handler |

No database changes needed — uses existing `briefings` and `scripts` tables.

