

# Replace Problem Section with GlowingEffect Grid Cards

## Summary

Replace the current "Problema" section's simple glass-card grid with the Aceternity UI `GlowingEffect` component — interactive glowing border cards that follow the mouse cursor, matching the reference screenshot's modern dark aesthetic.

## Changes

### 1. Install `motion` dependency
Required by the `GlowingEffect` component for the `animate` function.

### 2. New file: `src/components/ui/glowing-effect.tsx`
Adapted from the provided code (remove `"use client"` directive). Uses `motion/react`'s `animate` for smooth angle transitions on mouse proximity.

### 3. Update `src/pages/LandingPage.tsx` — Problem section (lines 217-245)
Replace the current `grid gap-6 sm:grid-cols-2 lg:grid-cols-4` of simple glass-cards with a styled grid using `GlowingEffect` wrapper per card:
- Each card gets a relative container with `<GlowingEffect>` as an overlay child
- Card content (icon, title, description) stays the same but with updated styling to match the reference: centered icon on top, bold title, muted description
- Grid layout: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` with proper gap and dark card backgrounds (`bg-neutral-950 border-neutral-800`)

### 4. No other sections affected
Only the "Problema" section is being replaced.

## Files

| File | Change |
|------|--------|
| `src/components/ui/glowing-effect.tsx` | New — GlowingEffect component |
| `src/pages/LandingPage.tsx` | Problem section cards use GlowingEffect |

