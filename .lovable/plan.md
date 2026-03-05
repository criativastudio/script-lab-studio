

# Replace All Headlines with Blauer Nue Medium Font

## Overview
Replace the current headline font (DM Serif Display) with **Blauer Nue Medium** across all landing page headlines. Blauer Nue is not available on Google Fonts, so it needs to be self-hosted.

## Changes

### 1. Add Font Files
- Download/add `BlauerNue-Medium.woff2` and `BlauerNue-Medium.woff` to `public/fonts/`

### 2. `src/index.css` — Register `@font-face`
Add at the top (before `@tailwind`):
```css
@font-face {
  font-family: 'Blauer Nue';
  src: url('/fonts/BlauerNue-Medium.woff2') format('woff2'),
       url('/fonts/BlauerNue-Medium.woff') format('woff');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

### 3. `tailwind.config.ts` — Update `font-display`
Change the `display` font family from `DM Serif Display` to `Blauer Nue`:
```ts
display: ['"Blauer Nue"', 'sans-serif'],
```

### 4. `index.html` — Remove DM Serif Display Google Font import
Remove the Google Fonts link for `DM Serif Display` (keep Inter).

### Impact
All elements using `font-display` class (every `h1`/`h2` headline across LandingPage, FeatureTabs, SocialProof, AIInputDemo, hero-section-dark) will automatically use Blauer Nue Medium. No per-component changes needed.

**Note:** You'll need to provide or upload the Blauer Nue Medium font files (`.woff2`/`.woff`) since it's not a free Google Font.

