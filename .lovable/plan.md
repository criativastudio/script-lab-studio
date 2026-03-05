

# Fix Light Mode + PDF Export

## Problem

1. **Light mode**: The hero section uses a hardcoded dark background (`bg-[hsl(220_25%_4%)]`), hardcoded white text colors, hardcoded dark borders, and the final CTA section also has hardcoded dark colors. These don't adapt to light mode.

2. **PDF export**: The `@media print` styles in `index.css` already force white backgrounds for the `#pdf-print-container`, but the StrategicAnalysis page prints the entire page (not a dedicated container), so it inherits dark mode colors. Also, no explicit `color-scheme` or theme override is applied during print.

## Changes

### 1. `src/pages/LandingPage.tsx` — Make Hero + Final CTA theme-aware

**Hero section (line 150):**
- Replace `bg-[hsl(220_25%_4%)]` with `bg-background` (or a dark/light aware class like `dark:bg-[hsl(220_25%_4%)] bg-[hsl(210_20%_98%)]`)
- Replace hardcoded `text-white` with `text-foreground`
- Replace hardcoded `text-[hsl(215_16%_56%)]` with `text-muted-foreground`
- Replace hardcoded `text-[hsl(215_16%_46%)]` with `text-muted-foreground`
- Replace hardcoded `text-[hsl(210_20%_80%)]` with `text-muted-foreground`
- Replace hardcoded border colors on secondary CTA button with `border-border`
- Replace hardcoded `text-[hsl(215_16%_36%)]` trust icons with `text-muted-foreground`

**Final CTA section (line 525):**
- Replace `bg-[hsl(220_25%_6%)]` with `bg-card dark:bg-[hsl(220_25%_6%)]`
- Replace `border-[hsl(220_20%_14%)]` with `border-border`
- Replace `text-white` with `text-foreground`
- Replace hardcoded `text-[hsl(215_16%_56%)]` with `text-muted-foreground`
- Replace hardcoded outline button colors with `border-border text-foreground`

### 2. `src/components/landing/HeroAnimation.tsx` — Theme-aware skeleton

- Replace `from-white/[0.04]` with `from-foreground/[0.04]`
- These are subtle decorative elements, mostly fine, but the glass reflection should adapt

### 3. `src/components/landing/FeatureTabs.tsx` — Glass surface shine

- Replace `from-white/[0.03]` with `from-foreground/[0.03]` (line 126)
- Replace `via-white/[0.08]` in SocialProof with `via-foreground/[0.08]`

### 4. `src/components/landing/SocialProof.tsx` — Top edge shine

- Replace `via-white/[0.08]` with `via-foreground/[0.08]`

### 5. `src/index.css` — Glass card light mode fix

- Update `.glass-card` to use theme-aware rgba values:
  - Light mode: use slightly darker backgrounds instead of `rgba(255,255,255,0.04)`
  - Add: `.glass-card { @apply bg-card/50 dark:bg-white/[0.04]; }`
- Update `.glass-surface` similarly

### 6. `src/index.css` — PDF print styles: force light theme

Add to the existing `@media print` block:
```css
@media print {
  :root {
    --background: 210 20% 98%;
    --foreground: 220 25% 10%;
    --card: 0 0% 100%;
    --card-foreground: 220 25% 10%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
  }
  
  body {
    background: white !important;
    color: #1a1a2e !important;
  }
}
```

This forces all CSS variable-based colors to their light-mode values when printing, regardless of the active theme.

### 7. `src/pages/StrategicAnalysis.tsx` — Use dedicated print container

Wrap the report output in a `#pdf-print-container` div for print, matching the CRM pattern, so the existing print CSS applies. Or simply ensure the `@media print` variable overrides (from change #6) cover this page too — which they will.

## Files Modified

| File | Change |
|------|--------|
| `src/pages/LandingPage.tsx` | Replace hardcoded dark colors with theme-aware classes |
| `src/components/landing/HeroAnimation.tsx` | Replace `white/` with `foreground/` for subtle overlays |
| `src/components/landing/SocialProof.tsx` | Replace `white/` with `foreground/` |
| `src/components/landing/FeatureTabs.tsx` | Replace `white/` with `foreground/` |
| `src/index.css` | Fix glass-card/glass-surface for light mode; force light CSS vars in `@media print` |

