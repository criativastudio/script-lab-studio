

# Gerador de Carrossel — Foco em Alcance para Não Seguidores

## Overview

Atualizar o gerador de carrossel existente para usar uma estrutura simplificada de 6 slides (S1 Hook, S2-S5 Desenvolvimento, S6 CTA) otimizada para descoberta, e adicionar exportação PDF premium estilo agência com capa, cards separados por slide e design minimalista.

## Changes

### 1. Edge Function: `supabase/functions/generate-carousel/index.ts`

Update the "script" mode prompt and tool schema:
- Change from 10 slides (S1-S10) to 6 slides (S1 Hook, S2-S5 Desenvolvimento, S6 CTA)
- Update prompt rules: focus on discovery (non-followers), curiosity, utility, belief-breaking
- Short text per slide, simple direct language
- Remove `alternative_covers` and `ab_openings` from schema (simplify)
- Keep caption generation

### 2. Frontend: `src/pages/CarouselGenerator.tsx`

Update the script tab results rendering:
- Display 6 slide cards with clear visual labels (S1-Hook, S2-S5 Desenvolvimento, S6-CTA)
- Add premium PDF export with `window.open` + styled HTML:
  - **Cover page**: title, theme, date, client name
  - **Slide cards**: each in a bordered card with soft radius, clear hierarchy
  - Modern minimalist layout, generous spacing, premium feel
- Remove references to `alternative_covers` and `ab_openings`

### 3. Dashboard ContentGenerator: `src/components/dashboard/ContentGenerator.tsx`

Update carousel rendering in the results modal to match the new 6-slide structure and add the same premium PDF export.

## Files

| File | Change |
|---|---|
| `supabase/functions/generate-carousel/index.ts` | Update script mode to 6-slide structure focused on non-follower reach |
| `src/pages/CarouselGenerator.tsx` | Update UI for 6 slides + premium PDF export |
| `src/components/dashboard/ContentGenerator.tsx` | Update carousel modal rendering + PDF for 6 slides |

