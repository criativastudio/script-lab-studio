create table public.diagnostic_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  diagnostic_type text not null,
  name text not null,
  phone text not null,
  email text not null,
  business_name text not null,
  city text not null,
  answers jsonb not null default '{}'::jsonb,
  result jsonb,
  score numeric
);

alter table public.diagnostic_leads enable row level security;

create policy "Anyone can insert diagnostic leads"
  on public.diagnostic_leads
  for insert
  to anon, authenticated
  with check (true);

create policy "Admins view diagnostic leads"
  on public.diagnostic_leads
  for select
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create policy "Admins delete diagnostic leads"
  on public.diagnostic_leads
  for delete
  to authenticated
  using (has_role(auth.uid(), 'admin'::app_role));

create index idx_diagnostic_leads_created_at on public.diagnostic_leads (created_at desc);
create index idx_diagnostic_leads_type on public.diagnostic_leads (diagnostic_type);