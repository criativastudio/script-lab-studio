

# Refactor CRM into Client-Centric Management System

## Summary

Replace the current table-based Projects/Briefings UI with a modern card-based Clients system. The CRM page becomes a client card grid. Clicking a card navigates to a client detail view (same page, no new routes) showing briefings and scripts organized by date with edit and instant PDF download buttons, plus a "Generate with Agent" button.

## Architecture

The CRM page will have two views managed by state:
- **List view**: Client cards grid + "Add New Client" button
- **Detail view**: Full client dashboard when a card is clicked (back button to return)

Data source: `briefing_requests` table already stores clients (business_name, contact_name, etc.) and links to projects/scripts. Each briefing_request IS a client record.

## Changes

### 1. `src/components/DashboardLayout.tsx`
- Rename nav item: `"Projetos"` -> `"Clientes"`, keep same `/crm` route and `FolderOpen` icon (or switch to `Users`)

### 2. `src/pages/CRM.tsx` — Full refactor

**List View (default)**:
- Page title: "Clientes"
- "Adicionar Novo Cliente" button (reuses existing briefing request dialog)
- Responsive card grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)
- Each card: client avatar initial, business_name, project_name, status badge, video count, date
- Click card -> sets `selectedClient` state to show detail view

**Detail View (when client selected)**:
- Back button to return to list
- Header: client name, business, contact info, status badge
- "Generate with Agent" button — calls `process-briefing` edge function using stored client data to regenerate/create new briefings+scripts
- Two sections: Briefings and Scripts, sorted by date descending
- Each item card shows: title/goal, date, two action buttons:
  - **Edit** — opens inline edit dialog (briefing: goal/audience/style fields; script: title/content textarea)
  - **Download PDF** — instant PDF generation with NO extra form. Uses client data auto-filled (business_name, project_name from briefing_request) and calls `window.print()` directly
- The ScriptViewer dialog remains for viewing formatted scripts (eye icon)

**PDF (no-form download)**:
- When user clicks "Download PDF" on a script or briefing, auto-populate all PDF fields from the client record and trigger print immediately — no config dialog needed
- Keep the hidden print container but auto-fill from client data

**"Generate with Agent" button**:
- Uses stored `form_answers` from the `briefing_requests` record
- Calls `process-briefing` edge function with the client's token
- Shows loading state, then refreshes data on completion
- If no form_answers exist yet (client hasn't filled form), shows a toast message

### 3. Keep existing functionality
- `ScriptViewer` component stays
- Print CSS stays
- Briefing request creation dialog stays (now labeled "Adicionar Novo Cliente")
- All Supabase queries remain the same, just reorganized in the UI

## Files Modified

| File | Change |
|------|--------|
| `src/components/DashboardLayout.tsx` | Rename "Projetos" to "Clientes", change icon to Users |
| `src/pages/CRM.tsx` | Full UI refactor: card grid list + client detail view with edit/download/generate |

No database changes needed — all data already exists in `briefing_requests`, `projects`, `briefings`, `scripts` tables.

