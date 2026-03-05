

# Add Dark Mode Toggle

## Summary

Add a Sun/Moon toggle button in the sidebar to switch between light and dark themes. The project already has full `.dark` CSS variables defined in `index.css` and uses `next-themes` (already installed). Just need to wire it up.

## Changes

### 1. `src/App.tsx`
- Wrap the app with `ThemeProvider` from `next-themes` (attribute: `class`, default: `light`, storage key)

### 2. `src/components/DashboardLayout.tsx`
- Import `useTheme` from `next-themes` and `Sun`/`Moon` icons from `lucide-react`
- Add a toggle button in the sidebar footer (above the sign-out button) that switches between light and dark mode

Two files, minimal changes.

