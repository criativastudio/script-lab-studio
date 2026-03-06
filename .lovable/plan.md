

# Dedicated Hook Generator

## Overview

Create a new edge function `generate-hooks` and a UI component (dialog) accessible from the ScriptViewer and ContentIdeasTab that generates 10 hook variations using different psychological triggers, with the client's strategic context injected.

## Changes

### 1. New Edge Function: `supabase/functions/generate-hooks/index.ts`

- Accepts: `context_id`, `topic`, `platform`, `audience`, `tone`, `content_type`
- Loads strategic context from `client_strategic_contexts` (Layer 1)
- Queries `client_content_memory` for previous hooks to avoid repetition
- Uses structured tool-calling to return an array of 10 hooks, each with: `hook` (text), `trigger_type` (one of: curiosity, controversial, authority, problem, fear, statistic, myth_breaking, question, story, bold_statement), `why_it_works` (explanation)
- Uses `google/gemini-3-flash-preview` via Lovable AI Gateway

### 2. Register in `supabase/config.toml`

Add `[functions.generate-hooks]` with `verify_jwt = false`.

### 3. New UI Component: `src/components/crm/HookGenerator.tsx`

A dialog component with:
- **Inputs**: Topic (pre-filled from idea/script title), Platform select, Content type select. Audience and tone auto-loaded from strategic context.
- **Generate button** → calls the edge function
- **Results**: Grid/list of 10 hook cards, each showing hook text, trigger type badge, and "why it works" explanation
- **"Generate New Hooks" button** to regenerate without closing
- **Copy button** on each hook card

### 4. Integration Points

**`src/components/ScriptViewer.tsx`**: Add a "Gerar Ganchos" button in the hook section that opens the HookGenerator dialog, pre-filled with the script's topic.

**`src/components/crm/ContentIdeasTab.tsx`**: Add a "Ganchos" action button on each idea card that opens HookGenerator pre-filled with the idea title.

**`src/pages/CRM.tsx`**: Pass `strategicContext` down to components that need it for the hook generator.

## Files

| File | Change |
|---|---|
| `supabase/functions/generate-hooks/index.ts` | New edge function |
| `supabase/config.toml` | Register new function |
| `src/components/crm/HookGenerator.tsx` | New dialog component |
| `src/components/ScriptViewer.tsx` | Add "Gerar Ganchos" button |
| `src/components/crm/ContentIdeasTab.tsx` | Add hook generator trigger per idea |
| `src/pages/CRM.tsx` | Pass strategicContext to child components |

