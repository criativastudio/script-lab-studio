

# Quick Script Generator on Dashboard

## Overview
Add a collapsible "Criador Rápido de Roteiros" card to the Dashboard page that lets users fill in business details and generate a structured script (Briefing, Persona, Posicionamento, Tom de Voz, Funil) directly, with plan limit enforcement.

## Implementation

### 1. New Component: `src/components/dashboard/QuickScriptCreator.tsx`

A self-contained card component with:

**Form fields** (all using Select chips/dropdowns for guided input):
- **Nome da Empresa** — text Input
- **Formato** — Select: TikTok, Reels, Stories, Para Tráfego
- **Nicho** — Select: Fitness Saúde, Finanças, Tecnologia, Restaurantes, Educação, E-commerce, Loja de Roupas, Loja de Carros, Doceria, Cafeteria, Odontologia, Advocacia
- **Objetivo** — Select: Conquistar seguidores, Construir confiança, Impulsionar vendas, Impulsionar engajamento
- **Palavras-chave/ideias** — Textarea for free-text keywords and trends

**"Gerar Roteiro" button** — RainbowButton style, calls the existing `manual-generate` edge function with mapped fields (objective, target_audience derived from niche, platform from formato).

**Plan limit check** — Before generating, use `usePlanLimits` to check `getMonthlyScriptCount()` against `limits.scriptsPerMonth`. If exceeded, show the upgrade modal (same pattern as CRM).

**Output section** — Displays the structured result with labeled sections: Briefing, Persona, Posicionamento, Tom de Voz, Funil, and the full Roteiro. Includes a "Salvar" button to persist to the `scripts` table.

### 2. Update Edge Function: `supabase/functions/manual-generate/index.ts`

Update the system prompt to explicitly structure output with: Briefing, Persona, Posicionamento, Tom de Voz, Funil de Conteúdo, and Roteiro sections. Add `business_name` and `niche` as accepted input fields so the AI can use them for context. Update the tool schema to include `persona`, `positioning`, `tone_of_voice`, and `content_funnel` fields alongside the existing `goal`, `target_audience`, `content_style`, and `scripts`.

### 3. Update Dashboard: `src/pages/Dashboard.tsx`

Import and render `<QuickScriptCreator />` between the stat cards and the recent items grid. This keeps the dashboard as the primary workspace.

## Files Modified

| File | Change |
|---|---|
| `src/components/dashboard/QuickScriptCreator.tsx` | New component with form, plan limits, generation, and output display |
| `supabase/functions/manual-generate/index.ts` | Add niche/business_name inputs, structured output with Persona/Posicionamento/Tom/Funil |
| `src/pages/Dashboard.tsx` | Import and render QuickScriptCreator |

