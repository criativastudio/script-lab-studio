create table public.interface_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  primary_color text not null default '#cbacef',
  accent_color text not null default '#f5cea5',
  background_color text not null default '#121213',
  font_family text not null default 'Inter',
  font_size_base int not null default 14,
  border_radius int not null default 8,
  density text not null default 'comfortable',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.interface_settings enable row level security;

create policy "Users view own interface settings" on public.interface_settings
  for select using (auth.uid() = user_id or has_role(auth.uid(), 'admin'::app_role));
create policy "Users insert own interface settings" on public.interface_settings
  for insert with check (auth.uid() = user_id);
create policy "Users update own interface settings" on public.interface_settings
  for update using (auth.uid() = user_id or has_role(auth.uid(), 'admin'::app_role));
create policy "Users delete own interface settings" on public.interface_settings
  for delete using (auth.uid() = user_id or has_role(auth.uid(), 'admin'::app_role));

create trigger update_interface_settings_updated_at
  before update on public.interface_settings
  for each row execute function public.update_updated_at_column();

create table public.form_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  field_bg_color text not null default '#1a1a1c',
  field_border_color text not null default '#2a2a2d',
  label_color text not null default '#cbacef',
  input_radius int not null default 8,
  show_field_icons boolean not null default true,
  compact_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.form_settings enable row level security;

create policy "Users view own form settings" on public.form_settings
  for select using (auth.uid() = user_id or has_role(auth.uid(), 'admin'::app_role));
create policy "Users insert own form settings" on public.form_settings
  for insert with check (auth.uid() = user_id);
create policy "Users update own form settings" on public.form_settings
  for update using (auth.uid() = user_id or has_role(auth.uid(), 'admin'::app_role));
create policy "Users delete own form settings" on public.form_settings
  for delete using (auth.uid() = user_id or has_role(auth.uid(), 'admin'::app_role));

create trigger update_form_settings_updated_at
  before update on public.form_settings
  for each row execute function public.update_updated_at_column();