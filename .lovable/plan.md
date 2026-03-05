

# UI/UX Flow Redesign — CRM Page

## Overview

Redesign the CRM page with a modern SaaS aesthetic: break the monolithic 1400-line CRM.tsx into focused components, improve card design with rounded-xl corners and soft shadows, add step-based visual flow indicators, enhance client/project/idea cards with quick actions, and add a basic content calendar view.

All existing logic and handlers stay intact — this is a visual and structural reorganization.

## Architecture: Component Extraction

The current CRM.tsx contains everything in one file. We'll extract into dedicated components:

| New Component | Purpose |
|---|---|
| `src/components/crm/ClientListView.tsx` | Client grid with search/filters, enhanced cards showing niche, project count, last script date, quick action buttons |
| `src/components/crm/ClientDetailView.tsx` | Header + tabbed layout container for selected client |
| `src/components/crm/StrategicContextTab.tsx` | Strategic context display/edit form |
| `src/components/crm/ProjectsTab.tsx` | Project cards with enhanced fields, collapsible briefings/scripts |
| `src/components/crm/ContentIdeasTab.tsx` | Ideas grid with generate/select/edit/delete, responsive card layout |
| `src/components/crm/ContentCalendarTab.tsx` | **New** — Weekly calendar view organizing ideas into weeks |
| `src/components/crm/StepIndicator.tsx` | **New** — Visual step flow bar (Clients → Context → Projects → Ideas → Scripts → Export) |

`CRM.tsx` becomes the orchestrator: holds state, passes handlers as props.

## Design Changes

### 1. Step Flow Indicator (new component)
A horizontal step bar at the top of the client detail view showing the 6 steps. The active step highlights based on which tab is selected. Uses numbered circles connected by lines.

```text
①─────②─────③─────④─────⑤─────⑥
Client  Context  Projects  Ideas  Scripts  Export
```

### 2. Client Cards (list view)
- `rounded-2xl` with `shadow-sm hover:shadow-md`
- Show: business niche badge, active project count, last script date
- Quick action buttons on hover: "Ver Contexto", "Projetos", "Gerar Ideias"
- More whitespace, larger avatar

### 3. Project Cards (projects tab)
- Grid layout instead of collapsible list
- Each card shows: name, platform badge, video count, funnel stage badge, status
- Quick buttons: "Gerar Ideias", "Criar Roteiros", "Ver Calendário"

### 4. Content Idea Cards (ideas tab)
- Switch from list to responsive grid (2-3 columns)
- Each card: title, description, platform badge, funnel stage, hook preview
- Actions: Generate Script, Edit, Delete
- Selected state with primary border glow

### 5. Script Viewer Enhancement
- Keep existing ScriptViewer dialog
- Add section headers with icons for Hook, Briefing, Structure, Script, CTA
- Add action buttons: "Regenerar Hook", "Melhorar Roteiro", "Mudar Tom", "Exportar"

### 6. Content Calendar Tab (new)
- New 4th tab: "Calendário"
- Groups ideas by week (Week 1, Week 2, etc.)
- Simple card-based weekly layout (not full calendar widget)
- Auto-distributes selected ideas across weeks based on publishing frequency

### 7. Global Design Tokens
- Cards: `rounded-2xl shadow-sm border-border/50`
- Transitions: `transition-all duration-200`
- More `p-6` padding, `gap-4` spacing
- Muted icon accents using `text-primary/60`

## Files Modified

| File | Change |
|---|---|
| `src/components/crm/StepIndicator.tsx` | New — visual step flow component |
| `src/components/crm/ClientListView.tsx` | New — extracted & redesigned client grid |
| `src/components/crm/ClientDetailView.tsx` | New — extracted detail container with tabs |
| `src/components/crm/StrategicContextTab.tsx` | New — extracted context tab |
| `src/components/crm/ProjectsTab.tsx` | New — extracted & redesigned projects tab |
| `src/components/crm/ContentIdeasTab.tsx` | New — extracted & redesigned ideas tab with grid cards |
| `src/components/crm/ContentCalendarTab.tsx` | New — weekly calendar view |
| `src/pages/CRM.tsx` | Refactored to orchestrator, imports sub-components |

## Compatibility
- All existing handlers, state, and Supabase calls remain identical
- No database changes
- No route changes
- PDF printing still works
- All dialogs (edit, manual create, script viewer) preserved

