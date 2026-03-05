

# Landing Page — ScriptLab Studio

## Summary

Create a full landing page at `/` (replacing the current redirect to `/dashboard`). The page will be a standalone, public-facing marketing page with futuristic dark aesthetic, glow effects, CSS-based 3D animated hero element, scroll animations, dark/light toggle, and all 8 sections specified. Authenticated users can still access `/dashboard` directly.

## Architecture

- **New file**: `src/pages/LandingPage.tsx` — single large component with all 8 sections
- **New file**: `src/components/landing/HeroAnimation.tsx` — CSS-based 3D holographic animation (rotating platform/panels with glow, no heavy 3D library needed — pure CSS transforms + keyframes)
- **Update**: `src/App.tsx` — change `/` route from `Navigate to /dashboard` to render `LandingPage`
- **Update**: `src/index.css` — add landing-specific keyframes and glow utilities
- **Update**: `tailwind.config.ts` — add custom keyframes for float, glow-pulse, rotate-3d animations

## Sections (all in LandingPage.tsx)

1. **Navbar** — fixed top bar with logo, nav links (Problema, Solução, Planos), dark/light toggle (Sun/Moon via `useTheme`), CTA button "Começar grátis" → `/auth`

2. **Hero** — full viewport, gradient background (deep blue/purple to black in dark mode), headline "Crie Briefings e Roteiros de Vídeo em Minutos", subheadline, CTA button, center 3D holographic animation (CSS perspective + rotating card panels with glow borders)

3. **Problema** — 4 cards with icons (Lightbulb, ThumbsDown, FileX, Target from lucide) showing pain points, glass-morphism card style

4. **Solução** — 3-step horizontal flow (numbered circles connected by lines), each step with icon + title + description

5. **Exemplo de Roteiro** — mock script card showing 5 scenes (Gancho → Problema → Desenvolvimento → Autoridade → CTA) in a vertical timeline with numbered badges

6. **Benefícios** — icon grid (Clock, Brain, TrendingUp, Award, Layers) with benefit titles and descriptions

7. **Planos** — 3 pricing cards (Starter Free, Creator Pro R$49, Scale Studio R$197), highlighted middle card with "Mais popular" badge, feature lists with check icons

8. **CTA Final** — dark gradient section, "Pare de gravar vídeos sem estratégia", CTA button

9. **Footer** — links, social icons, copyright

## Visual Design

- Dark mode by default for landing (force `dark` class on landing wrapper, with toggle to switch)
- Glow effects via `box-shadow` with blue/purple hues and CSS `backdrop-filter: blur`
- Glass-morphism cards: `bg-white/5 border border-white/10 backdrop-blur-xl`
- Scroll animations: Intersection Observer hook to add `animate-fade-in` class on scroll
- Hero 3D element: CSS `perspective` + `rotateY` + `rotateX` keyframe animation on a card stack representing the platform UI

## Files

| File | Change |
|------|--------|
| `src/pages/LandingPage.tsx` | New — full landing page |
| `src/components/landing/HeroAnimation.tsx` | New — CSS 3D holographic element |
| `src/App.tsx` | Route `/` → `LandingPage` instead of redirect |
| `src/index.css` | Add glow, glass, float keyframes |
| `tailwind.config.ts` | Add custom animation keyframes |

