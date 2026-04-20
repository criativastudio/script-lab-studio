

# Reestruturar "Admin" → "Configurações" com submenus em cards

## 1. Renomear menu lateral

Em `src/components/DashboardLayout.tsx`:
- `adminItem` passa de `{ label: "Admin", icon: Shield }` para `{ label: "Configurações", icon: Settings, href: "/configuracoes" }`.
- **Remover** `scaleItems` (Personalizar PDF) do menu lateral — passa a viver dentro de Configurações.
- Ordem final do menu: Dashboard → Clientes → Análises → Diagnóstico CRM (admin) → **Configurações** (admin).

## 2. Nova página hub `/configuracoes`

Criar `src/pages/Configuracoes.tsx` — landing visual com 4 cards (grid `md:grid-cols-2 lg:grid-cols-3`, hover elevado, ícone grande no topo, título, descrição curta, badge de plano quando aplicável):

| Card | Ícone | Rota |
|---|---|---|
| **Gerenciar Usuários & Planos** | `Users` | `/configuracoes/usuarios` |
| **Ajustes da Interface** | `Palette` | `/configuracoes/interface` |
| **Personalização de Formulários** | `FormInput` | `/configuracoes/formularios` |
| **Personalização de PDFs** | `FileText` | `/configuracoes/pdf` (badge "Scale Studio" se não tiver acesso, redireciona) |

Header: breadcrumb "Configurações" + subtítulo "Gerencie sua conta, aparência e exportações". Layout com `DashboardLayout`.

## 3. Roteamento

Em `src/App.tsx`, adicionar rotas (todas `adminOnly` exceto PDF que mantém regra atual):

```
/configuracoes                  → Configuracoes (hub)
/configuracoes/usuarios         → Admin (página existente, conteúdo intacto)
/configuracoes/interface        → InterfaceSettings (nova, placeholder funcional)
/configuracoes/formularios      → FormSettings (nova, placeholder funcional)
/configuracoes/pdf              → PdfSettings (página existente reaproveitada)
```

Manter `/admin` e `/pdf-settings` como **redirects** (`<Navigate to="/configuracoes/usuarios" replace />` e `/configuracoes/pdf`) para não quebrar links salvos.

## 4. Novas páginas (Interface + Formulários)

Ambas seguem o mesmo padrão visual de `PdfSettings.tsx` (coluna esquerda com cards de ajuste, coluna direita com preview sticky), salvando em duas novas tabelas Supabase:

### `interface_settings` (1 linha por user)
- `primary_color`, `accent_color`, `background_color` (hex)
- `font_family` (Inter / Helvetica / Georgia / System)
- `font_size_base` (12-18px)
- `border_radius` (0-16px)
- `density` ("compact" | "comfortable" | "spacious")

### `form_settings` (1 linha por user)
- `field_bg_color`, `field_border_color`, `label_color`
- `input_radius` (0-16px)
- `show_field_icons` (bool)
- `compact_mode` (bool)

Hooks `useInterfaceSettings` e `useFormSettings` espelhando `usePdfSettings` (load + `updateSettings` + valores default). Preview ao vivo dentro da própria página. **Aplicação global da interface fica como next step** (este plano cria a infraestrutura + UI de configuração; aplicar tokens no `index.css` em runtime é fora do escopo aqui para não quebrar layout existente — fica anotado no card como "Preview da aparência abaixo").

## 5. Migração SQL

```sql
create table public.interface_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  primary_color text default '#cbacef',
  accent_color text default '#f5cea5',
  background_color text default '#121213',
  font_family text default 'Inter',
  font_size_base int default 14,
  border_radius int default 8,
  density text default 'comfortable',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.interface_settings enable row level security;
create policy "users manage own interface settings" on public.interface_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.form_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  field_bg_color text default '#1a1a1c',
  field_border_color text default '#2a2a2d',
  label_color text default '#cbacef',
  input_radius int default 8,
  show_field_icons boolean default true,
  compact_mode boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.form_settings enable row level security;
create policy "users manage own form settings" on public.form_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## Arquivos modificados / criados

| Arquivo | Mudança |
|---|---|
| `src/components/DashboardLayout.tsx` | Renomear item para "Configurações" (`Settings` icon, `/configuracoes`); remover `scaleItems` do menu |
| `src/App.tsx` | Adicionar 5 rotas + 2 redirects (`/admin`, `/pdf-settings`) |
| `src/pages/Configuracoes.tsx` | **NOVO** — hub com 4 cards |
| `src/pages/InterfaceSettings.tsx` | **NOVO** — ajustes de interface + preview |
| `src/pages/FormSettings.tsx` | **NOVO** — ajustes de formulários + preview |
| `src/hooks/useInterfaceSettings.ts` | **NOVO** |
| `src/hooks/useFormSettings.ts` | **NOVO** |
| Migration SQL | **NOVA** — tabelas + RLS |

## O que NÃO muda

- Página Admin (gestão de usuários/assinaturas/filtros) — mesma UI, só muda a rota onde é exibida
- Página PdfSettings — reaproveitada em `/configuracoes/pdf`
- `/admin` e `/pdf-settings` continuam acessíveis (redirects)
- Edge functions, schema atual de `pdf_settings`, permissões existentes

