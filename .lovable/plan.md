

# Adapt SaaS to Strategic Intelligence Platform for Audiovisual Production

## Summary

Transform the existing law-firm SaaS into an audiovisual production intelligence platform by rewriting all 5 existing pages and adding RLS to the `projects`, `briefings`, `scripts`, and `ideas` tables. No new pages created -- only content and branding changes.

## Database Changes (Migration)

The existing tables need schema updates and RLS policies:

### 1. `projects` table -- add columns
- `client_name text`
- `objective text`
- `platform text`
- `status text default 'active'`

### 2. `scripts` table -- add `user_id`
- `user_id uuid` (to link to auth user)
- `title text`

### 3. `ideas` table -- add `user_id`
- `user_id uuid`
- `status text default 'new'`

### 4. `briefings` table -- add `user_id`
- `user_id uuid`

### 5. RLS policies for all 4 tables
Each table gets:
- Users can CRUD their own rows (`auth.uid() = user_id`)
- Admins can see all (`has_role(auth.uid(), 'admin')`)

For `briefings`, `scripts` -- access via `project_id` join to projects where `user_id = auth.uid()`, OR direct `user_id` column.

## Page Rewrites

### Auth (`src/pages/Auth.tsx`)
- Rebrand: "ScriptLab Studio" with Film/Clapperboard icon
- Tagline: "Plataforma de Inteligencia Estrategica para Producao Audiovisual"
- Keep login-only (remove signup toggle since admin-provisioned)

### Dashboard (`src/pages/Dashboard.tsx`)
- Title: "Content Intelligence Dashboard"
- Cards: Total Projects, Scripts Generated, Ideas, Active Briefings
- Recent projects list (last 5 from `projects`)
- Recent scripts list (last 5 from `scripts`)
- Recent ideas (last 5 from `ideas`)

### CRM -> Projects Manager (`src/pages/CRM.tsx`)
- Title: "Gerenciador de Projetos"
- Table listing projects with columns: client_name, objective, platform, status, created_at
- Dialog to create new project (client_name, objective, platform)
- Click project to expand/view linked briefings and scripts
- Filter by status

### Metrics -> Content Performance Analytics (`src/pages/Metrics.tsx`)
- Title: "Analise de Desempenho de Conteudo"
- Cards: Scripts generated (count), Ideas created, Projects active, Briefings completed
- Breakdown by platform (from projects.platform)
- Activity timeline (recent items by date)

### WhatsApp -> Content Distribution Hub (`src/pages/WhatsApp.tsx`)
- Title: "Distribuicao de Conteudo"
- Keep WhatsApp connection functionality
- Add a section listing recent scripts/ideas that can be "sent" (copy to clipboard or share link)
- Maintain existing WhatsApp connection card

### Admin (`src/pages/Admin.tsx`)
- Keep user management (CreateUserDialog)
- Replace client/flow management with:
  - Platform analytics: total users, projects, scripts counts
  - Subscription management: list from `subscriptions` table
  - Keep user creation dialog

### DashboardLayout (`src/components/DashboardLayout.tsx`)
- Rebrand sidebar: "ScriptLab Studio" / "Producao Audiovisual"
- Update nav icons and labels:
  - Dashboard (LayoutDashboard)
  - Projetos (FolderOpen)
  - Analises (BarChart3)
  - Distribuicao (Send)
  - Admin (Shield)

## Files Modified

1. **Migration SQL** -- add columns + RLS to projects/briefings/scripts/ideas
2. `src/pages/Auth.tsx` -- rebrand
3. `src/pages/Dashboard.tsx` -- full rewrite to content intelligence
4. `src/pages/CRM.tsx` -- rewrite to projects manager
5. `src/pages/Metrics.tsx` -- rewrite to content analytics
6. `src/pages/WhatsApp.tsx` -- rewrite to distribution hub
7. `src/pages/Admin.tsx` -- adapt admin controls
8. `src/components/DashboardLayout.tsx` -- rebrand + new nav labels

## Technical Notes

- All queries use `supabase.from("table").select(...).eq("user_id", user.id)` for user-scoped data
- Admin views use unfiltered queries (RLS allows via `has_role`)
- The `useAuth` hook remains unchanged -- `user.id` is used directly instead of `clientId` for these new tables
- Existing multi-tenant tables (clients, leads, conversations, etc.) are untouched but hidden from nav

