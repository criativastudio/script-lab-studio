

# Padronização de Paleta de Cores (#cbacef e #f5cea5)

## Overview
Replace all blue/green/violet accent colors with the two-color palette: **#cbacef** (lavender) and **#f5cea5** (peach/cream). Headlines alternate between these colors, buttons use them exclusively.

## Color Conversion to HSL
- `#cbacef` → approximately `268 64% 81%`
- `#f5cea5` → approximately `30 82% 80%`

## Changes

### 1. `src/index.css` — Update CSS variables

Replace hero accent and primary colors in both `:root` and `.dark`:
- `--primary`: change from blue (`217 91% 60%`) to lavender (`268 64% 81%`)
- `--primary-foreground`: keep white or use dark text for contrast on light bg → `260 20% 15%`
- `--hero-blue` → `268 64% 81%` (lavender)
- `--hero-pink` → `30 82% 80%` (peach)
- `--hero-violet` → `268 64% 81%` (lavender, same)
- `--accent`: change from green (`142 71% 45%`) to peach (`30 82% 80%`)
- `--accent-foreground`: dark text `30 20% 15%`
- `--ring`: match primary lavender

Update `.text-gradient-primary` to gradient between `#cbacef` and `#f5cea5`:
```css
background: linear-gradient(135deg, #cbacef 0%, #f5cea5 100%);
```

### 2. `src/pages/LandingPage.tsx` — Button colors

- Hero primary CTA button (line 199): replace `bg-primary` glow with lavender-based shadow
- Hero badge (line 162): update `border-[hsl(var(--hero-blue)/0.3)]` and `bg-[hsl(var(--hero-blue)/0.08)]` — these already use CSS vars, so updating vars handles it
- Plan check icons (line 497): `text-primary` will auto-update
- All `Button` components use `bg-primary` via the variant system, so updating CSS vars covers them

### 3. `src/components/landing/SocialProof.tsx` — Stats gradient

Uses `text-gradient-primary` class — auto-handled by CSS var change.

### 4. `src/components/landing/AIInputDemo.tsx` & `FeatureTabs.tsx`

Uses `text-gradient-primary` and `bg-primary` — auto-handled.

### 5. `tailwind.config.ts` — No changes needed

Colors reference CSS vars which we're updating.

## Summary of Files Modified

| File | Change |
|------|--------|
| `src/index.css` | Update `--primary`, `--accent`, `--hero-*`, `--ring` vars + gradient class |
| `src/pages/LandingPage.tsx` | Minor: update any remaining hardcoded blue/green hex references |

Most changes are centralized in CSS variables — the component code already uses semantic tokens.

