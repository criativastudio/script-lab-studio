

# Audit Results & Implementation Plan

## Current State vs Required Architecture

| Step | Required | Status |
|------|----------|--------|
| 1. Strategic Briefing Form | Form with business_name, target_audience, objectives, positioning, capacity, references | **MISSING** — no such form exists. The ScriptGenerator page has a simpler form for video scripts, not strategic analysis. |
| 2. Backend Endpoint | Edge function for strategic analysis with AI | **MISSING** — `generate-script` exists but generates video scripts, not structured strategic analysis. |
| 3. Structured JSON Response | AI returns persona, positioning, tone_of_voice, content_funnel, script_ideas | **MISSING** — current AI returns free-text scripts. |
| 4. Database Storage | `strategic_reports` table | **MISSING** — table does not exist. |
| 5. PDF Generation | Auto-generate branded PDF report | **MISSING** — no PDF generation anywhere. |
| 6. Delivery System | Email PDF + private download link + dashboard storage | **MISSING** — no email sending, no file storage bucket. |
| 7. Dashboard Integration | "Strategic Reports" section in Dashboard | **MISSING** — Dashboard shows projects/scripts/ideas only. |
| 8. End-to-end flow | All steps connected | **MISSING** — none of the 8 steps exist as described. |

## Implementation Plan

### 1. Database: Create `strategic_reports` table

```sql
CREATE TABLE public.strategic_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_name text NOT NULL,
  target_audience text,
  objectives text,
  brand_positioning text,
  production_capacity text,
  content_references text,
  persona text,
  positioning text,
  tone_of_voice text,
  content_funnel text,
  script_ideas jsonb,
  pdf_url text,
  status text DEFAULT 'processing',
  created_at timestamptz DEFAULT now()
);
```

RLS: users CRUD own rows, admins see all.

### 2. Storage Bucket

Create a `strategic-reports` storage bucket for PDF files with RLS so users can read their own files.

### 3. Edge Function: `strategic-analysis`

New edge function that:
- Receives form data (business_name, target_audience, objectives, brand_positioning, production_capacity, content_references)
- Uses Lovable AI Gateway with tool calling to extract structured JSON (persona, positioning, tone_of_voice, content_funnel, script_ideas)
- Saves the structured response to `strategic_reports` table
- Generates a PDF using HTML-to-PDF rendering (via a simple HTML template converted with Deno)
- Uploads PDF to `strategic-reports` storage bucket
- Updates the report row with the `pdf_url`
- Returns the report data + pdf_url

Note on email delivery: Lovable only supports auth emails natively. For automatic report email delivery, we would need a third-party service (e.g., Resend). For now, the system will store the report in the dashboard with a download link. We can add email delivery later if the user sets up a transactional email service.

### 4. Dashboard: Add "Strategic Reports" section

Update `src/pages/Dashboard.tsx` to include:
- A "Análise Estratégica" nav card/button linking to the form
- A "Relatórios Estratégicos" section listing past reports with download links

### 5. Strategic Analysis Form Page

Reuse the existing ScriptGenerator page route (`/gerador`) or add a new section inside Dashboard. Since the instructions say "create a page inside the Dashboard called Strategic Analysis," we'll add it as a sub-view within Dashboard accessible via a tab or button. Alternatively, we can repurpose the ScriptGenerator page to have two tabs: "Gerador de Roteiros" and "Análise Estratégica."

**Decision**: Add a new route `/analise-estrategica` and nav item "Análise Estratégica" in the sidebar. This keeps existing pages intact and adds the new feature cleanly.

### 6. Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/migrations/` | New migration: create `strategic_reports` table + storage bucket + RLS |
| `supabase/functions/strategic-analysis/index.ts` | New edge function |
| `supabase/config.toml` | Add function config |
| `src/pages/StrategicAnalysis.tsx` | New page with form + results display + PDF download |
| `src/pages/Dashboard.tsx` | Add "Strategic Reports" section showing past reports |
| `src/App.tsx` | Add `/analise-estrategica` route |
| `src/components/DashboardLayout.tsx` | Add nav item |

### 7. PDF Generation Approach

Since we're in a Deno edge function environment, we'll generate the PDF by:
- Building an HTML document with the report data and branding
- Using `jsPDF` or returning the HTML as a downloadable file
- Realistically: generate a styled HTML report, convert it to a blob, and store it in Supabase Storage. The "PDF" will be a well-formatted HTML document that can be printed to PDF from the browser, OR we use a lightweight Deno-compatible PDF library.

**Practical approach**: Generate the report as structured data, store in DB, and provide a client-side "Export to PDF" button using browser `window.print()` with a print-optimized layout. This avoids complex server-side PDF generation and works reliably.

### 8. Email Delivery

Lovable does not support transactional emails natively. The report will be stored in the dashboard with a download link. If the user wants automatic email delivery, they'll need to integrate a third-party email service like Resend.

## Summary of What Gets Built

1. New Supabase table `strategic_reports` with RLS
2. Storage bucket `strategic-reports` for PDF files  
3. New edge function `strategic-analysis` that processes form data through AI and returns structured JSON
4. New page `StrategicAnalysis.tsx` with the full form and results display
5. Client-side PDF export functionality
6. Dashboard updated with "Strategic Reports" history section
7. New sidebar nav item and route

