

# Supabase Integration: Projects, Briefings, Scripts, Ideas

## Current State

The database tables and RLS policies are already in place. The pages have basic Supabase queries for listing/counting. What's **missing** is the full CRUD workflow:

- **CRM page**: Lists projects but has no way to view/manage briefings or scripts within a project
- **No briefing creation** UI linked to a project
- **No script creation** UI linked to a briefing/project
- **No ideas creation** UI anywhere
- Foreign keys `briefings.project_id -> projects.id` and `scripts.project_id -> projects.id` need to be added to the actual DB (they exist in types but not in the schema)

## Plan

### 1. Database Migration: Add foreign keys

Add foreign key constraints so briefings and scripts are properly linked to projects:
- `briefings.project_id` references `projects.id` (ON DELETE CASCADE)
- `scripts.project_id` references `projects.id` (ON DELETE CASCADE)

### 2. Expand CRM page with project detail panel

When a user clicks a project row, show an expandable section or detail panel containing:
- **Briefings tab**: List briefings for that project + "Add Briefing" form (goal, target_audience, content_style)
- **Scripts tab**: List scripts for that project + "Add Script" form (title, script text)
- **Ideas tab**: List ideas for that project + "Add Idea" form (idea text)

Each insert sets `user_id = auth.uid()` and `project_id` to the selected project.

### 3. Update Dashboard with quick-add actions

Add a small "Nova Ideia" quick-add input on the Dashboard so users can capture ideas without navigating away.

### 4. Files Modified

- `src/pages/CRM.tsx` -- Add expandable project detail with briefings/scripts/ideas CRUD
- `supabase/migrations/` -- Add foreign key constraints
- `src/pages/Dashboard.tsx` -- Minor: add quick-add idea input

