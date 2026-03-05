

# Progressive Smart Briefing — Implementation Plan

## Overview

Add a client registration + shareable briefing form workflow inside the existing CRM and Dashboard. Platform users register clients with video quantity, get a unique link, clients fill a guided form, and the system auto-generates strategic briefings + scripts via AI.

## Database Changes

### New table: `briefing_requests`

Stores the client registration, shareable token, form answers, and generated strategic content.

```sql
CREATE TABLE public.briefing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  -- Client info (set by platform user)
  business_name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_whatsapp text,
  project_name text NOT NULL,
  video_quantity integer NOT NULL DEFAULT 3,
  -- Form answers (set by client via public form)
  form_answers jsonb,
  -- AI-generated strategic content
  persona text,
  positioning text,
  tone_of_voice text,
  content_strategy text,
  -- Status: pending → submitted → processing → completed
  status text NOT NULL DEFAULT 'pending',
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.briefing_requests ENABLE ROW LEVEL SECURITY;

-- Platform user can CRUD own rows
CREATE POLICY "Users can view own" ON public.briefing_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own" ON public.briefing_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own" ON public.briefing_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own" ON public.briefing_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

-- Public read by token (for the client form — anon role)
CREATE POLICY "Anon can read by token" ON public.briefing_requests FOR SELECT TO anon
  USING (true);
CREATE POLICY "Anon can update by token" ON public.briefing_requests FOR UPDATE TO anon
  USING (true);
```

Note: The anon policies are needed so the public briefing form can read the request by token and submit answers. The edge function uses service role for final processing.

## New Edge Function: `process-briefing`

Receives `{ token }`, reads the `briefing_requests` row, sends form answers to Lovable AI Gateway with tool calling to extract:
- persona, positioning, tone_of_voice, content_strategy
- N scripts (matching `video_quantity`) each with: title, objective, hook, scene_structure, narration, visual_direction, call_to_action

Then:
1. Creates a `project` linked to the user
2. Creates a `briefing` linked to the project
3. Creates N `scripts` linked to the project
4. Updates `briefing_requests` with strategic data and status = completed

## New Public Page: `src/pages/ClientBriefingForm.tsx`

Route: `/briefing/:token` (NOT inside ProtectedRoute — public access)

A progressive, guided form with 5 questions:
1. About the business (textarea + helper chips)
2. Typical customer (textarea + helper chips)
3. Problem solved (textarea + helper chips)
4. Business objective (multi-select chips)
5. Content references (multi-select chips)

Each question shows example hints and clickable helper options that auto-fill or append to the text. Steps are shown one at a time (wizard-style) for a guided experience.

On submit: saves `form_answers` as JSON to `briefing_requests`, sets status to `submitted`, then calls `process-briefing` edge function.

## CRM Integration

Add a "Novo Cliente + Briefing" dialog in `src/pages/CRM.tsx` with fields:
- business_name, contact_name, email, whatsapp, project_name, video_quantity (select: 1, 3, 5, 10, 15)

On create: inserts into `briefing_requests` table, gets back the `token`, displays the shareable link with a copy button.

Add a "Clientes & Briefings" tab or section showing all `briefing_requests` with status badges and link to view results.

## Dashboard Integration

Add a "Briefings Recentes" section in Dashboard showing recent `briefing_requests` with status. When status = completed, user can expand to see generated persona, positioning, scripts, and export PDF.

## App.tsx Changes

Add route: `<Route path="/briefing/:token" element={<ClientBriefingForm />} />` (no ProtectedRoute wrapper)

## Files to Create/Modify

| File | Action |
|------|--------|
| Migration SQL | Create `briefing_requests` table |
| `supabase/functions/process-briefing/index.ts` | New edge function |
| `supabase/config.toml` | Add function config |
| `src/pages/ClientBriefingForm.tsx` | New public form page |
| `src/pages/CRM.tsx` | Add client registration dialog + briefing requests list |
| `src/pages/Dashboard.tsx` | Add briefing requests section |
| `src/App.tsx` | Add public route |

