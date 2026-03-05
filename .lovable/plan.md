

# Collapsible Project Blocks, Multi-Project Clients, and PDF/UI Improvements

## Summary

Refactor the CRM client detail view to group briefing_requests by `business_name` as "clients" with multiple projects. Each project appears as a collapsible block. Add ability to create new projects for existing clients. Modernize PDF output and overall UI.

## Data Architecture

Currently each `briefing_request` = one client+project. To support multiple projects per client:
- **List view**: Group `briefing_requests` by `business_name` — show one card per unique business, with project count
- **Detail view**: Show all `briefing_requests` for that business as collapsible project blocks
- **New project**: Pre-fills business_name, contact info from existing client, creates a new `briefing_request`

## Changes

### 1. `src/pages/CRM.tsx` — Major refactor

**List View**:
- Group clients array by `business_name` into a `Map<string, BriefingRequest[]>`
- Each card shows: business name, contact info (from first record), total project count, latest status
- Click opens detail view with all projects for that business

**Detail View**:
- Header shows client info (business_name, contact from first record)
- "Adicionar Novo Projeto" button — opens dialog pre-filled with client info (business_name, contact), user just enters project_name + video_quantity
- "Download PDF Completo" downloads all projects' data
- Each project = a `Collapsible` block (from existing `@radix-ui/react-collapsible`):
  - Trigger: project name, status badge, date, video count
  - Content: strategic data (persona, positioning, strategy), briefings list, scripts list — each with edit/view/download/delete buttons
- Generate with Agent available per-project

**PDF (no-form instant download)**:
- Per-project PDF: downloads that project's briefing + scripts
- Full client PDF: all projects concatenated with page breaks

### 2. `src/index.css` — PDF styling overhaul

Modernize print styles:
- Switch to sans-serif font (`Inter`, `Helvetica Neue`, system-ui)
- Add cover page with large business name, project name, date, status
- Improve section cards with left accent borders
- Two-column metadata layout
- Script cards with numbered headers, proper spacing
- Better page break handling
- Subtle color accents instead of heavy borders

### 3. UI/UX improvements (in CRM.tsx)

- Client cards: subtle gradient hover, better spacing, project count badge
- Collapsible triggers: clean row with chevron animation
- Briefing/script item cards: improved typography, icon consistency
- Strategic sections (persona, positioning, etc.): render as styled cards with icons instead of raw text
- Better empty states

## Files Modified

| File | Change |
|------|--------|
| `src/pages/CRM.tsx` | Group by business, collapsible project blocks, new project dialog, improved cards/UI |
| `src/index.css` | Modern PDF print styles with sans-serif, cover page, accent borders |

No database changes needed.

