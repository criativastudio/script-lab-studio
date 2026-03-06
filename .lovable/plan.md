

# Fix Section 3: 3D Product Scroll

## Problems
1. The 3D card (ContainerScroll) overlaps the headline/description due to `-mt-12` on the Card and shared `translateY` motion
2. HeroAnimation shows generic skeleton UI instead of the real briefing→script flow
3. Scroll effect (rotateX 20→0) is subtle; container height is very tall making progress slow

## Changes

### 1. Fix overlap: `src/components/ui/container-scroll-animation.tsx`
- Add more spacing between Header and Card (increase gap/padding)
- Change Card's `-mt-12` to `mt-8` so it doesn't overlap the title
- Ensure Header has `relative z-20` so it stays above the card

### 2. Replace HeroAnimation with real flow: `src/components/landing/HeroAnimation.tsx`
Rewrite to show the actual platform workflow as an animated sequence:
- **Step 1**: Briefing form appears (4 questions with typing animation filling in business context)
- **Step 2**: AI processing indicator (loading spinner/pulse with "Gerando estratégia...")
- **Step 3**: Generated script output with scene cards appearing one by one (Gancho, Problema, Desenvolvimento, Autoridade, CTA)

Each step auto-transitions after a few seconds, creating a continuous loop that demonstrates the real product flow: Briefing → AI Analysis → Script Output.

### 3. Enhance scroll effect: `src/components/ui/container-scroll-animation.tsx`
- Increase initial rotation from 20 to 35 degrees for more dramatic tilt
- Reduce container height from `h-[60rem] md:h-[80rem]` to `h-[40rem] md:h-[55rem]` so the scroll resolves faster
- Add `offset: ["start end", "end start"]` to useScroll for better trigger range

### 4. Minor adjustment in `src/pages/LandingPage.tsx`
- Remove the extra wrapping `perspective` style on section 3 (already handled by ContainerScroll internally)

## Files

| File | Change |
|---|---|
| `src/components/ui/container-scroll-animation.tsx` | Fix overlap spacing, enhance scroll rotation |
| `src/components/landing/HeroAnimation.tsx` | Rewrite with real briefing→script flow animation |
| `src/pages/LandingPage.tsx` | Remove redundant perspective wrapper on section 3 |

