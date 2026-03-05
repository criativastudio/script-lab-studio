

# AI Logic System — Enhanced Script Generation Pipeline

## What Changes

The `generate-script` edge function needs significant prompt engineering improvements and the addition of project context (Layer 2) which is currently missing. Content diversity is partially implemented in `generate-ideas` but absent from script generation. No new tables are needed — we query existing `scripts` table for memory.

## Changes

### 1. `supabase/functions/generate-script/index.ts` — Major Rewrite of Enhanced Mode

**Add Project Context (Layer 2):** Currently the enhanced mode only loads strategic context + idea. It must also load the project via `idea.project_id` or a passed `project_id` to inject campaign_objective, funnel_stage, content_style, publishing_frequency.

**Content Diversity/Memory:** Before generating, query `scripts` table for this client's context to get previously generated titles. Inject them into the prompt as "topics to avoid repeating."

**Tone Adaptation:** Expand the system prompt with explicit tone rules per communication_style value (educational, authority, casual, influencer, storytelling, direct_sales). Each style gets specific writing instructions.

**Multi-Step Pipeline in Prompt:** Restructure the system prompt to enforce the 5-step generation pipeline:
1. Strategic angle derivation
2. Hook options (generate 2-3, pick best)
3. Strategic briefing section
4. Full speaking script
5. CTA aligned with funnel stage
6. Recording style suggestion

**Structured Output:** Use tool calling (like `generate-ideas` does) to get a structured JSON response with separated sections (hook, briefing, structure, script, cta, recording_style) instead of free-form text.

### 2. `src/pages/CRM.tsx` — Pass project_id to script generation

Update `handleGenerateScriptsFromIdeas` to pass `project_id` alongside `context_id` and `idea_id`, so the edge function can load project context.

### 3. `src/components/crm/ContentIdeasTab.tsx` — No changes needed

Already functional for selection and generation triggers.

## Files Modified

| File | Change |
|---|---|
| `supabase/functions/generate-script/index.ts` | Add project context loading, content memory query, tone adaptation rules, structured tool output, multi-step pipeline prompt |
| `src/pages/CRM.tsx` | Pass project_id in handleGenerateScriptsFromIdeas |

## Backward Compatibility

Legacy mode (direct briefing/target_audience/platform/video_duration) remains untouched. Enhanced mode is extended, not replaced.

