

# Landing Page Visual Redesign — Premium SaaS Style

## Summary

Redesign the existing landing page to match the futuristic SaaS video reference: split hero layout (text left, 3D element right), stronger gradients/glow effects, grid background pattern, more dramatic visual hierarchy, enhanced glass-morphism cards, and smoother micro-animations. The uploaded image (`baixados.jfif`) will be analyzed for additional style cues.

## Key Visual Changes

### 1. Hero Section — Split Layout
**Current**: Centered text + animation below.
**New**: Two-column layout on desktop — headline/subheadline/CTA on the **left**, HeroAnimation on the **right**. Mobile stacks vertically. Add a mesh/grid background pattern with glow orbs, and subtle gradient lines.

### 2. Enhanced HeroAnimation
**Current**: Small rotating 3D card with basic skeleton lines.
**New**: Larger, more detailed holographic dashboard mockup with:
- Animated typing effect on "script lines"
- Glowing border pulse animation
- Multiple layered floating panels at different depths
- More particles with varied sizes
- Stronger glow/shadow effects

### 3. Background & Atmosphere
- Add CSS grid/dot pattern overlay across the entire page
- Multiple radial gradient glow orbs (primary blue + accent purple) positioned at different sections
- Subtle noise texture via CSS
- Gradient divider lines between sections

### 4. Cards & Sections — Glass-morphism Upgrade
- Problem cards: stronger `bg-white/[0.03]` dark glass, glowing border on hover with color transition
- Solution steps: connected by animated gradient line instead of plain border
- Benefits: icon containers with glow ring effect
- Pricing cards: frosted glass with stronger depth, highlighted card gets animated border gradient

### 5. Typography & Spacing
- Hero headline: `text-5xl md:text-7xl` with gradient text effect on key words
- Section headings: add gradient underline accent
- More vertical spacing between sections (`py-24 md:py-32`)
- Badge pills with glow effect

### 6. New CSS Animations (tailwind.config.ts + index.css)
- `shimmer`: moving gradient highlight for borders
- `typing-cursor`: blinking cursor for hero sub-element
- `gradient-shift`: slow-moving background gradient
- `border-glow`: pulsing border glow on cards

## Files Modified

| File | Change |
|------|--------|
| `src/pages/LandingPage.tsx` | Split hero layout, enhanced glass cards, gradient text, grid bg, more spacing |
| `src/components/landing/HeroAnimation.tsx` | Larger, more detailed holographic panels, typing effect, stronger glow |
| `tailwind.config.ts` | New keyframes: shimmer, gradient-shift, border-glow |
| `src/index.css` | Grid pattern utility, gradient text class, noise overlay |

No new dependencies. Pure CSS/Tailwind enhancements.

