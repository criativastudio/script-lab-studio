

# AI Script Generator

## Summary

Create an edge function `generate-script` that uses Lovable AI (LOVABLE_API_KEY is already available) to generate marketing video scripts. Add a new standalone page accessible from the sidebar, and also integrate a "Generate with AI" button inside the CRM project detail scripts tab.

## Architecture

```text
Browser (form) → supabase.functions.invoke("generate-script", { body }) → Edge Function → Lovable AI Gateway → response → save to scripts table → display
```

## 1. Edge Function: `supabase/functions/generate-script/index.ts`

- Accepts: `{ briefing, target_audience, platform, video_duration, project_id, user_id }`
- Builds a system prompt optimized for marketing video scriptwriting
- Calls Lovable AI Gateway (non-streaming, using `google/gemini-3-flash-preview`)
- Returns the generated script text
- Validates inputs server-side

## 2. Update `supabase/config.toml`

Add the function config with `verify_jwt = false` (validate auth in code).

## 3. New Page: `src/pages/ScriptGenerator.tsx`

Standalone AI script generator page with:
- Form fields: Briefing (textarea), Target Audience (input), Platform (select), Video Duration (select: 15s, 30s, 60s, 3min, 5min+)
- Optional: project selector dropdown to link the script to an existing project
- "Gerar Roteiro" button with loading state
- Output area showing the generated script with markdown rendering
- "Salvar Roteiro" button that inserts into `scripts` table with `user_id`, `project_id` (if selected), `title` (auto-generated from briefing), and `script` content

## 4. Update `src/App.tsx`

Add route `/gerador` for the new page.

## 5. Update `src/components/DashboardLayout.tsx`

Add "Gerador IA" nav item with Sparkles icon, between Projetos and Análises.

## 6. CRM Integration

Add a "Gerar com IA" button in the Scripts tab of the expanded project detail. When clicked, opens a dialog pre-filled with the project's briefing data, calls the same edge function, and auto-saves the result linked to that project.

## Files

1. `supabase/functions/generate-script/index.ts` -- new edge function
2. `supabase/config.toml` -- add function entry
3. `src/pages/ScriptGenerator.tsx` -- new page
4. `src/App.tsx` -- add route
5. `src/components/DashboardLayout.tsx` -- add nav item
6. `src/pages/CRM.tsx` -- add AI generate button in scripts tab

