

# Replace Hero with ContainerScroll Animation

## Summary

Replace the current split hero layout with the `ContainerScroll` component from Aceternity UI. The hero will show the title/subtitle at top, and the HeroAnimation dashboard mockup will be inside a scroll-driven 3D perspective card that rotates and scales as the user scrolls.

## Changes

### 1. Install `framer-motion` dependency

### 2. New file: `src/components/ui/container-scroll-animation.tsx`
- Adapted from the provided component code (remove `"use client"` directive, replace Next.js patterns with standard React)
- Uses `useScroll`, `useTransform`, `motion` from framer-motion
- Responsive: detects mobile for different scale dimensions

### 3. Update `src/pages/LandingPage.tsx` — Hero section
- Replace the current split two-column hero with `ContainerScroll`
- `titleComponent` receives the Badge + headline + subheadline + CTA buttons
- `children` receives the `HeroAnimation` component (the dashboard mockup)
- Keep glow orbs and gradient background around it
- Remove the `min-h-screen flex items-center` layout since ContainerScroll manages its own height

### 4. `src/components/landing/HeroAnimation.tsx` — Minor adjustment
- Remove the perspective wrapper and 3D rotation (ContainerScroll handles the 3D transform now)
- Keep the dashboard mockup content (window dots, stats, typing effect, panels) but flatten it into a static card visual that ContainerScroll will animate

## Files

| File | Change |
|------|--------|
| `src/components/ui/container-scroll-animation.tsx` | New — ContainerScroll component |
| `src/pages/LandingPage.tsx` | Hero section uses ContainerScroll |
| `src/components/landing/HeroAnimation.tsx` | Remove self-managed 3D rotation, become flat card content |

