

# AI Strategic Brief Builder

## Overview

Replace the 9-question form with 4 strategic questions. Add a new edge function `suggest-briefing` that generates adaptive AI suggestions after Question 1. Update the `process-briefing` edge function prompt to extract the full strategic context from only 4 answers. No changes to the downstream workflow (project creation, briefing, scripts, strategic context).

## Changes

### 1. New Edge Function: `supabase/functions/suggest-briefing/index.ts`

Called after the user completes Question 1 (business context). Sends the business description to the AI and returns contextual suggestions for Questions 2-4 (audience chips, desired outcome chips, brand voice chips). Uses `google/gemini-3-flash-preview` with tool-calling to return structured suggestions.

### 2. Register in `supabase/config.toml`

Add `[functions.suggest-briefing]` with `verify_jwt = false`.

### 3. Rewrite `src/pages/ClientBriefingForm.tsx`

Replace the 9-question `QUESTIONS` array with 4 questions:

| # | Key | Title | Type |
|---|---|---|---|
| 1 | `business_context` | Contexto do Negócio | textarea + static chips |
| 2 | `ideal_audience` | Público Ideal | textarea + dynamic AI chips |
| 3 | `desired_outcome` | Resultado Desejado | multi-select + dynamic AI chips |
| 4 | `brand_voice` | Voz da Marca | multi-select + dynamic AI chips |

New behavior:
- After Q1 is answered and the user clicks "Next", call `suggest-briefing` to get dynamic chip suggestions for Q2-Q4.
- Show a brief loading state while suggestions load.
- Default/fallback chips remain if AI call fails.
- Form title changes to "AI Strategic Brief Builder".

### 4. Update `supabase/functions/process-briefing/index.ts`

Update only the `userPrompt` to reference the new 4 answer keys and enhance the system prompt to instruct the AI to infer the full strategic context (niche, persona, pain points, motivations, positioning, tone, content strategy, video categories, funnel stages) from the condensed answers. Also update the `contextData` mapping to use the new keys.

The tool-calling schema and all downstream logic (project creation, briefing insert, scripts insert, strategic context upsert) remain unchanged.

## Files

| File | Change |
|---|---|
| `supabase/functions/suggest-briefing/index.ts` | New -- AI suggestions for adaptive chips |
| `supabase/config.toml` | Register suggest-briefing |
| `src/pages/ClientBriefingForm.tsx` | Rewrite with 4 questions + adaptive AI suggestions |
| `supabase/functions/process-briefing/index.ts` | Update prompt and answer key mapping only |

