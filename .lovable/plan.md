

# Replace Hero CTA with Rainbow Button

## Changes

### 1. Create `src/components/ui/rainbow-button.tsx`
Copy the provided RainbowButton component as-is.

### 2. `src/index.css` — Add rainbow color variables
Add to `:root`:
```css
--color-1: 0 100% 63%;
--color-2: 270 100% 63%;
--color-3: 210 100% 63%;
--color-4: 195 100% 63%;
--color-5: 90 100% 63%;
```

### 3. `tailwind.config.ts` — Add rainbow animation + colors
Extend with:
- Colors: `color-1` through `color-5` referencing CSS vars
- Animation: `rainbow: "rainbow var(--speed, 2s) infinite linear"`
- Keyframes: `rainbow` from `background-position: 0%` to `200%`

### 4. `src/pages/LandingPage.tsx` — Swap the hero CTA button
Replace the `<button>` at line 197-203 with:
```tsx
<RainbowButton onClick={() => navigate("/auth")}>
  Começar grátis agora
  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
</RainbowButton>
```
Add import for `RainbowButton`.

