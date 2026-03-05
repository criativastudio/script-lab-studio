

# Professional Script Formatting System

## Summary

Create a `ScriptViewer` component that transforms raw script text into a visually structured, professional production brief. Integrate it into the CRM's expanded project view — when a user clicks a script, it opens in a dialog with the full formatted layout.

## Approach

The AI-generated scripts already contain structured text (titles, hooks, scenes, narration, CTA sections). The component will parse this text by detecting section headers and render each part in a professionally styled card layout with icons, two-column scene/dialogue layout, and clean typography.

## New Component: `src/components/ScriptViewer.tsx`

A dialog-based viewer that receives a `Script` object and the parent `Project` data, then renders:

1. **Header Card** — Script title, client name, objective, platform, estimated duration (parsed or from project data). Uses `Clapperboard`, `User`, `Target`, `Monitor`, `Clock` icons.

2. **Strategic Overview** — Short paragraph about the marketing intention (parsed from script text or first paragraph). Icon: `Lightbulb`.

3. **Hook Section** — Highlighted opening line in an accent-bordered card. Icon: `Zap`.

4. **Script Body** — Two-column grid layout:
   - Left: Scene descriptions / camera direction (muted background)
   - Right: Dialogue / narration
   - Parsed by detecting patterns like `[CENA]`, `CENA:`, `Narração:`, `Texto:` etc. from the AI output.
   - Icon: `Film`.

5. **Emotional Triggers** — Badges listing persuasion triggers (authority, curiosity, urgency, transformation). Icon: `Heart`.

6. **Visual Suggestions** — Bullet list of recommended shots/B-roll. Icon: `Camera`.

7. **Editing & Rhythm** — Pacing, cuts, transitions, music suggestions. Icon: `Music`.

**Parsing logic**: The component will split the script text by known section markers (case-insensitive regex for "GANCHO", "HOOK", "CENA", "SCENE", "VISUAL", "EDIÇÃO", "CTA", "GATILHO", "TRIGGER", etc.) and map each to the appropriate section. Unrecognized content goes into the Script Body.

## CRM Integration (`src/pages/CRM.tsx`)

- Add state: `viewingScript: Script | null`
- In the scripts list (lines 447-457), make each script card clickable — opens the `ScriptViewer` dialog
- Add an "eye" icon button next to the delete button
- Import and render `<ScriptViewer>` at the bottom of the component

## Files

| File | Action |
|------|--------|
| `src/components/ScriptViewer.tsx` | **Create** — Full professional script viewer component with parsing + formatted layout |
| `src/pages/CRM.tsx` | **Modify** — Add script click handler, import ScriptViewer, render dialog |

