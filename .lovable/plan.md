

# AIInputDemo: Animated Briefing Flow on Arrow Click

## What Changes

When a user clicks a chip (e.g., "Reels para Instagram") in the AIInputDemo section and presses the arrow button, the component transitions from the input view to an animated "session 3" that simulates the full briefing-to-script pipeline for the chosen theme.

## Session 3 Flow (Animated Steps)

The arrow button triggers a state change (`showDemo = true`). The input UI fades out and is replaced by an animated sequence showing:

1. **Header**: The chosen theme displayed prominently (e.g., "Reels para Instagram")
2. **Step-by-step animated cards** that appear sequentially (staggered 0.8s each):
   - **Formulário do Cliente** — simulated form fields (nicho, público, objetivo) with auto-fill animation
   - **Persona** — generated persona card (e.g., "Mulher, 28-40, empreendedora digital")
   - **Posicionamento** — market positioning text
   - **Tom de Voz** — tone badges (e.g., "Educativo", "Próximo", "Autoridade")
   - **Funil de Conteúdo** — funnel stage chips (Topo → Meio → Fundo)
   - **Briefing Gerado** — summary card with key briefing fields
   - **Roteiro Pronto** — final script preview with scene structure (Gancho, Desenvolvimento, CTA)

Each card uses `motion.div` with `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}` and staggered delays.

3. **Back button** to return to the input view

## Implementation

### File: `src/components/landing/AIInputDemo.tsx`

- Add state: `showDemo` (boolean), `selectedChip` (string)
- Arrow button `onClick`: set `selectedChip = typed`, `showDemo = true`
- Use `AnimatePresence` to swap between input view and demo view
- Demo view: a vertical timeline of 7 cards with mock data per chip
- Each card has an icon, title, and simulated content
- "Voltar" button resets state

### Mock Data (per chip)

Define a `demoData` object keyed by chip name with pre-written content for each of the 7 steps. For chips not in the map, use a generic default.

### File: `src/pages/LandingPage.tsx`

No changes needed — `AIInputDemo` is self-contained.

## Files

| File | Change |
|---|---|
| `src/components/landing/AIInputDemo.tsx` | Add demo state, AnimatePresence transition, animated step cards with mock briefing/script data |

