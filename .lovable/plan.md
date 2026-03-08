

# Carousel Generator — Strategic Instagram Carousel Agent

## Overview

Add a full "Gerador de Carrossel" feature that creates strategic Instagram carousel ideas and complete scripts (S1–S10) using the client's strategic context from `client_strategic_contexts`. Two modes: **Ideas** (bulk headline + angle generation) and **Full Script** (10-slide carousel with visuals, alt text, caption, cover variations, and A/B openings).

## Architecture

```text
┌─────────────────────┐
│  CarouselGenerator   │  New page at /carrossel
│  (src/pages/)        │
│                      │
│  ┌─ Client Select ─┐ │
│  │ Loads strategic  │ │
│  │ context auto     │ │
│  └──────────────────┘ │
│  ┌─ Mode Toggle ───┐ │
│  │ Ideas │ Roteiro  │ │
│  └──────────────────┘ │
│  ┌─ Topic Input ───┐ │
│  │ Keywords/theme   │ │
│  └──────────────────┘ │
│         │ invoke      │
│         ▼             │
│  generate-carousel    │  New edge function
│  (reads context,      │
│   builds prompt,      │
│   returns structured) │
└─────────────────────┘
```

## Implementation

### 1. New Edge Function: `supabase/functions/generate-carousel/index.ts`

- Accepts: `user_id`, `business_name`, `mode` ("ideas" | "script"), `topic` (optional keywords), `idea_count` (for ideas mode), `idea_title` (for script mode — which idea to expand)
- Fetches `client_strategic_contexts` by `user_id` + `business_name` to get nicho, persona, tom de voz, posicionamento, objetivos, produtos, estilo de comunicação
- Runs usage guards (`runGuards` from `_shared/usage-guard.ts`)
- Builds the full system prompt from the user's detailed agent instructions (anti-generic audit, carousel structure S1–S10, copy rules, deliverables)
- Uses tool calling with structured output schema:
  - **Ideas mode**: returns array of `{ headline, angle, funnel_stage, pain_or_desire, explanation }`
  - **Script mode**: returns `{ slides: [{ slide_number, text, visual_suggestion, art_text, alt_text }], caption, alternative_covers: string[], ab_openings: string[] }`
- Logs usage and caches

### 2. Config: `supabase/config.toml`

Add `[functions.generate-carousel]` with `verify_jwt = false`.

### 3. New Page: `src/pages/CarouselGenerator.tsx`

- `DashboardLayout` wrapper
- **Client selector**: dropdown populated from user's `client_strategic_contexts` (business names). On select, loads full context and displays a summary badge strip (nicho, persona snippet, tom de voz)
- **Mode tabs**: "Ideias de Carrossel" | "Roteiro Completo"
- **Ideas mode**:
  - Quantity selector (3, 5, 10)
  - Optional topic/keywords textarea
  - "Gerar Ideias" button
  - Results: cards with headline, angle, funnel badge, pain/desire, explanation
- **Script mode**:
  - Topic/title input (can paste from a generated idea)
  - "Gerar Roteiro" button
  - Results: 10 slide cards (S1–S10) each showing text, visual suggestion, art text, alt text. Plus caption card, 3 alternative covers, 2 A/B openings
  - "Salvar" button persists to `scripts` table
- Plan limits enforced via `usePlanLimits`

### 4. Routing & Navigation

- Add route `/carrossel` in `App.tsx`
- Add nav item "Carrossel" in `DashboardLayout.tsx` sidebar

## Files Modified

| File | Change |
|---|---|
| `supabase/functions/generate-carousel/index.ts` | New edge function with strategic context integration and structured carousel output |
| `supabase/config.toml` | Add `[functions.generate-carousel]` entry |
| `src/pages/CarouselGenerator.tsx` | New page with client selector, mode tabs, generation UI, and structured results display |
| `src/App.tsx` | Add `/carrossel` route |
| `src/components/DashboardLayout.tsx` | Add "Carrossel" nav item |

