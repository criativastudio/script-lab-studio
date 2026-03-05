

# Full Responsive Design Update

## Summary

The platform currently has a fixed 264px sidebar with no mobile adaptation. All pages use desktop-only layouts. This plan adds a mobile-friendly off-canvas sidebar with hamburger menu, and adjusts all page layouts for small screens.

## Changes

### 1. `src/components/DashboardLayout.tsx` — Mobile sidebar

- Add `useState` for `mobileMenuOpen`
- Use `useIsMobile()` hook (already exists in `src/hooks/use-mobile.tsx`)
- **Desktop**: Keep current fixed sidebar as-is
- **Mobile**: Hide sidebar, show top bar with hamburger (`Menu` icon) + app title. Sidebar renders inside a `Sheet` (side="left") that opens on hamburger click
- Main content: remove fixed padding, use `p-4 md:p-6`
- Sidebar links close the sheet on click (mobile)

### 2. `src/pages/Dashboard.tsx` — Responsive grids

- Stat cards: already `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — verify and keep
- Recent items sections: stack on mobile, side-by-side on desktop
- Reduce heading sizes on mobile

### 3. `src/pages/CRM.tsx` — Responsive client grid + detail view

- Client grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Detail view: stack header info vertically on mobile
- Dialog content: full-width on mobile (`max-w-full sm:max-w-lg`)
- Action buttons: wrap and stack on small screens
- Collapsible project blocks: full-width, smaller padding on mobile

### 4. `src/pages/Metrics.tsx` — Responsive grids

- Already uses responsive grids — verify spacing/padding

### 5. `src/pages/ScriptGenerator.tsx` — Stack layout on mobile

- Two-card layout: stack vertically on mobile (`grid-cols-1 lg:grid-cols-2`)

### 6. `src/pages/StrategicAnalysis.tsx` — Responsive form + results

- Stack cards vertically on mobile
- Full-width buttons

### 7. `src/pages/WhatsApp.tsx` — Responsive cards

- Stack cards vertically, full-width inputs

### 8. `src/pages/Admin.tsx` — Responsive table + stats

- Stat cards: responsive grid
- Table: horizontal scroll wrapper on mobile

### 9. `src/pages/Auth.tsx` — Already responsive (max-w-md + px-4)

No changes needed.

## Files Modified

| File | Change |
|------|--------|
| `src/components/DashboardLayout.tsx` | Mobile hamburger + Sheet sidebar, responsive main padding |
| `src/pages/Dashboard.tsx` | Responsive text sizes, verify grid classes |
| `src/pages/CRM.tsx` | Responsive grids, stacked mobile layout, dialog sizing |
| `src/pages/Metrics.tsx` | Minor spacing tweaks |
| `src/pages/ScriptGenerator.tsx` | Stack cards on mobile |
| `src/pages/StrategicAnalysis.tsx` | Stack layout on mobile |
| `src/pages/WhatsApp.tsx` | Stack cards on mobile |
| `src/pages/Admin.tsx` | Responsive table scroll, grid |

