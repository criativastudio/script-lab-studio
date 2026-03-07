

# Show AI Demo Inside the 3D Animation (Session 3)

## Current Behavior
When a user clicks a chip in AIInputDemo (session 2), the demo steps appear inline within that same section. The 3D ContainerScroll (session 3) always shows the default HeroAnimation cycling through briefing → processing → script.

## New Behavior
When a chip is clicked and the arrow pressed in AIInputDemo, instead of showing the demo inline, the page scrolls down to session 3 and the HeroAnimation inside the 3D container renders the selected chip's demo content (Persona, Posicionamento, Tom de Voz, Funil, Briefing, Roteiro).

## Implementation

### 1. Lift state to `LandingPage.tsx`
- Add `selectedDemoChip` state in `LandingPage`
- Pass a callback `onChipSelected(chip: string)` to `AIInputDemo`
- Pass `selectedDemoChip` to `HeroAnimation`

### 2. Update `AIInputDemo.tsx`
- Remove the inline demo view (`showDemo` state and the entire demo-view branch)
- On arrow click: call `onChipSelected(typed)` and scroll to section 3 (`#produto-3d`)
- Keep the chip click + typing behavior as-is

### 3. Update `HeroAnimation.tsx`
- Accept optional `selectedChip?: string` prop
- When `selectedChip` is set, skip the default cycling animation and instead show the animated step cards (Formulário, Persona, Posicionamento, Tom de Voz, Funil, Briefing, Roteiro) using the same `demoDataMap` and `StepCard` pattern from AIInputDemo
- When `selectedChip` is empty/null, keep the existing default animation
- Move `demoDataMap`, `getDemoData`, and `StepCard` to HeroAnimation (or a shared file)

### 4. Add scroll target
- Add `id="produto-3d"` to the section 3 wrapper in `LandingPage.tsx`

## Files Modified

| File | Change |
|---|---|
| `src/pages/LandingPage.tsx` | Add `selectedDemoChip` state, pass props, add section id |
| `src/components/landing/AIInputDemo.tsx` | Remove inline demo view, accept `onChipSelected` prop, scroll to section 3 on click |
| `src/components/landing/HeroAnimation.tsx` | Accept `selectedChip` prop, render demo steps when set, keep default animation otherwise |

