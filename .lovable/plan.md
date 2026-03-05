

# Professional PDF Export for Client Projects

## Summary

Add a "Download Project PDF" button inside the expanded project detail view in the CRM. When clicked, it opens a dialog where the user can customize header fields (agency name/logo, status), then generates a clean PDF using browser `window.print()` with a print-optimized hidden div.

## Approach

Client-side PDF generation using a print-optimized HTML layout rendered in a hidden container, then triggered via `window.print()`. No new pages, no new dependencies — pure browser printing with `@media print` CSS.

## Changes

### 1. `src/pages/CRM.tsx`

**Add a "Download Project PDF" button** in the expanded project detail area (next to the tabs at line ~332). When clicked:
- Opens a Dialog with editable fields: Agency Name, Agency Logo URL, Client Name (pre-filled from project), Business Name, Project Name (pre-filled), Project Date, Project Status (select: Em análise, Em edição, Aprovado, Rejeitado)
- Fetches the `briefing_requests` row linked to this project (if any) to get persona, positioning, tone_of_voice, content_strategy
- Fetches all scripts for this project
- On "Gerar PDF", renders a hidden print-optimized div and calls `window.print()`

**New state**: `pdfDialogOpen`, `pdfConfig` (agency_name, agency_logo, client_name, business_name, project_name, project_date, project_status), `pdfData` (briefing, persona, positioning, scripts)

**PDF HTML structure** (rendered in a hidden div with `print:block` CSS):
1. Cover/Header: Agency logo + name, client name, business name, project name, date, status badge
2. Strategic Briefing section (from briefings table)
3. Customer Persona (from briefing_requests.persona)
4. Brand Positioning (from briefing_requests.positioning)
5. Content Strategy (from briefing_requests.content_strategy)
6. Video Scripts — each script rendered with title, and full script content parsed into sections

### 2. `src/index.css`

Add `@media print` styles:
- Hide everything except the PDF container
- Clean typography, page breaks between scripts
- Professional formatting with borders, spacing

### Files Modified

| File | Change |
|------|--------|
| `src/pages/CRM.tsx` | Add PDF export dialog + button in expanded project view, hidden print container |
| `src/index.css` | Add `@media print` styles for professional PDF output |

