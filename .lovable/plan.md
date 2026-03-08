

# Gerador de Conteúdo — Unified Content Generator on Dashboard

## Overview
Replace `QuickScriptCreator` with a new `ContentGenerator` component that unifies script and carousel generation. Users select a registered client, choose content type, generate, view results in a modal, and content is auto-saved to the client's history.

## Flow
```text
Select Client → Choose Content Type → Generate → Modal with Results → Auto-save to scripts table
```

## Implementation

### 1. New Component: `src/components/dashboard/ContentGenerator.tsx`

Replaces `QuickScriptCreator.tsx`. Collapsible card titled "Gerador de Conteúdo".

**Form fields:**
- **Cliente** — Select populated from `client_strategic_contexts` (user's registered clients). On select, loads and displays badges (niche, tone, persona).
- **Tipo de Conteúdo** — Select: Roteiro, Briefing, Briefing + Roteiro, Carrossel
- **Palavras-chave / Tema** — Optional textarea
- **Gerar Conteúdo** — RainbowButton

**Generation logic by type:**
- **Roteiro / Briefing / Briefing + Roteiro** → calls `manual-generate` edge function with client's strategic context data (niche, audience, persona, etc.) pre-filled from the selected client
- **Carrossel** → calls `generate-carousel` edge function in "script" mode

**Results Modal (`Dialog`):**
- Opens automatically after generation
- Displays structured content sections based on type
- **Baixar em PDF** button (uses window.print on a hidden container, light-mode forced)
- Content is **auto-saved** to `scripts` table on generation with metadata: title includes client name + content type + date

**Client History section** — Below the generator, shows recent generated content for the selected client (from `scripts` table filtered by title pattern), each with "Abrir" and "Baixar PDF" buttons.

### 2. Update `src/pages/Dashboard.tsx`

Replace `<QuickScriptCreator />` import/render with `<ContentGenerator />`.

### 3. Update `supabase/functions/manual-generate/index.ts`

Add support for receiving strategic context fields directly (`business_niche`, `target_audience`, `customer_persona`, `tone_of_voice`, `market_positioning`, `communication_style`, `products_services`, `pain_points`, `differentiators`, `marketing_objectives`) so the dashboard component can pass the client's full context without requiring a separate DB fetch in the edge function. Falls back to current behavior if these aren't provided.

### 4. Files

| File | Change |
|---|---|
| `src/components/dashboard/ContentGenerator.tsx` | New unified generator component (replaces QuickScriptCreator) |
| `src/components/dashboard/QuickScriptCreator.tsx` | Deleted (replaced) |
| `src/pages/Dashboard.tsx` | Import ContentGenerator instead of QuickScriptCreator |
| `supabase/functions/manual-generate/index.ts` | Accept strategic context fields for richer generation |

