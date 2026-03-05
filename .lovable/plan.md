

# Replace Headlines with Blauer Nue Light + Reduce Size by 40%

## Overview
Copy all uploaded font files to `public/fonts/`, switch headlines from Blauer Nue Medium to **Blauer Nue Light**, and reduce all headline sizes by ~40%.

## Changes

### 1. Copy Font Files to `public/fonts/`
Copy all 4 uploaded `.otf` files:
- `Blauer-Nue-Light-iF6626350c6db36.otf` → `public/fonts/BlauerNue-Light.otf`
- `Blauer-Nue-Medium-iF6626350c78103.otf` → `public/fonts/BlauerNue-Medium.otf`
- `Blauer-Nue-Regular-iF6626350c83fdf.otf` → `public/fonts/BlauerNue-Regular.otf`
- `Blauer-Nue-Thin-iF6626350c96c3e.otf` → `public/fonts/BlauerNue-Thin.otf`

### 2. `src/index.css` — Update `@font-face` to Light `.otf`
Replace the existing `@font-face` block to point to the Light variant:
```css
@font-face {
  font-family: 'Blauer Nue';
  src: url('/fonts/BlauerNue-Light.otf') format('opentype');
  font-weight: 300;
  font-style: normal;
  font-display: swap;
}
```

### 3. Reduce headline sizes by ~40% across all files

Current → New sizes (40% reduction):

| Current | New |
|---------|-----|
| `text-7xl` (4.5rem) | `text-4xl` (2.25rem) |
| `lg:text-7xl` | `lg:text-5xl` |
| `md:text-6xl` | `md:text-4xl` |
| `sm:text-5xl` | `sm:text-3xl` |
| `md:text-5xl` | `md:text-3xl` |
| `text-4xl` | `text-2xl` |
| `text-3xl` | `text-xl` |

**Files affected:**
- `src/pages/LandingPage.tsx` — all `h2` headings + hero `h1`
- `src/components/landing/SocialProof.tsx` — h2
- `src/components/landing/AIInputDemo.tsx` — h2
- `src/components/landing/FeatureTabs.tsx` — h2
- `src/components/ui/hero-section-dark.tsx` — h1

Also change `font-bold` to `font-light` on headlines to match the Light weight.

