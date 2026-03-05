

# Premium AI SaaS Landing Page Redesign

## Overview
Complete visual and structural overhaul of the landing page to achieve a cinematic, Apple/Stripe/Linear-quality design. Preserve the existing 3D ContainerScroll section while adding new premium sections and interactions.

## Page Structure (Top to Bottom)

1. **Cinematic Hero** — Pure black bg, large headline "Crie na Velocidade do Pensamento", abstract floating gradient orb with subtle animation, cursor-following glow effect, pill CTA with glow
2. **AI Interaction Demo** — Glassmorphism input with typewriter cycling through industries, suggestion chips below, holographic mesh gradient background transition
3. **3D Product Scroll** (existing ContainerScroll — preserved and visually enhanced)
4. **Interactive Features** — 2-column sticky layout: left has vertical feature tabs, right shows dynamic content per tab
5. **AI Workflow Steps** — Horizontal step cards with scroll-triggered reveals
6. **Problem Section** (existing GlowingEffect cards — restyled)
7. **Social Proof** — Testimonial cards with glass style
8. **Pricing** (existing — restyled)
9. **Final CTA** — Dark bg, glowing gradient, two buttons
10. **Footer** (existing — minor restyle)

## Technical Changes

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/landing/CursorGlow.tsx` | Mouse-following blurred light circle for hero |
| `src/components/landing/AIInputDemo.tsx` | Glassmorphism input with typewriter + suggestion chips |
| `src/components/landing/FeatureTabs.tsx` | Sticky left tabs + right content panel with animated transitions |
| `src/components/landing/SocialProof.tsx` | Testimonial cards with glass styling |
| `src/components/landing/FloatingOrb.tsx` | Abstract gradient orb with subtle motion animation |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/LandingPage.tsx` | Complete restructure with new sections, framer-motion `motion` wrappers, new color classes |
| `src/index.css` | New color tokens: hero uses `#000000` bg; light sections use holographic pastels (`#EAF4FF`, `#F4EEFF`, `#FCEBFF`); accent colors for electric blue, neon pink, soft violet |
| `src/components/ui/hero-section-dark.tsx` | Refactor to pure black cinematic style, remove RetroGrid, add gradient orb + cursor glow integration |
| `src/components/landing/HeroAnimation.tsx` | Keep for 3D scroll child — minor visual polish |
| `tailwind.config.ts` | Add new color utilities for holographic/pastel sections |

### Color System Update
- Hero: `bg-black` with electric blue (`#3B82F6`), neon pink (`#EC4899`), soft violet (`#8B5CF6`) accents
- Light sections: holographic mesh gradients using `#EAF4FF`, `#F4EEFF`, `#FCEBFF`
- `.text-gradient-primary` updated to electric blue → violet → pink flow
- All glow/shadow references updated to match new accent palette

### Motion Design (Framer Motion)
- `motion.div` wrappers with `whileInView` for scroll-triggered fade-in + slide-up
- Hero orb: continuous subtle floating animation
- Cursor glow: `onMouseMove` handler updating absolute position of blurred radial gradient
- Feature tabs: `AnimatePresence` + `motion.div` for content transitions
- Workflow steps: staggered `whileInView` entrance
- Hover states: `whileHover={{ scale: 1.02 }}` on cards

### Interactive Features Section
- Left column: sticky `position: sticky; top: 6rem` with 5 feature tabs (No-Code Builder, Dados em Tempo Real, IA Multimodal, Automação, Segurança)
- Right column: `AnimatePresence` switches between mockup content per active tab
- Mobile: tabs become horizontal scroll chips

### Social Proof Section
- 3-column grid of glass-styled testimonial cards
- Each card: avatar, name, role, quote
- Subtle hover lift animation

### Responsive Behavior
- Desktop: full cinematic layout with sticky features
- Tablet: compressed but hierarchy preserved
- Mobile: stacked sections, feature tabs → horizontal scroll chips, smaller orb

