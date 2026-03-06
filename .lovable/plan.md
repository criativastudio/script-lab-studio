

# Fix: Dark Mode Button Text Color

## Problem

The `RainbowButton` component uses `dark:text-primary-foreground` for dark mode text. The CSS variable `--primary-foreground` is set to `260 20% 15%` (a very dark color) in both light and dark modes. Combined with the dark button background (`#121213`), the text becomes nearly invisible.

## Solution

Change `dark:text-primary-foreground` to `dark:text-foreground` in `src/components/ui/rainbow-button.tsx` (line 15). This will use the light foreground color (`210 20% 95%`) in dark mode, making text visible against the dark button background.

## File Changed

| File | Change |
|---|---|
| `src/components/ui/rainbow-button.tsx` | Replace `dark:text-primary-foreground` with `dark:text-foreground` on line 15 |

