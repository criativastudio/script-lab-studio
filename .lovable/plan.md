

# Kanban de Leads no Diagnóstico CRM

Transformar a tabela atual de `/admin/diagnostico` em um board kanban com 4 colunas e drag-and-drop, mantendo a tabela como visualização alternativa opcional.

## 1. Schema (migration)

Tabela `diagnostic_leads` hoje não tem campo de status do pipeline e não permite `UPDATE`. Mudanças:

```sql
-- Nova coluna para o estágio do kanban
ALTER TABLE public.diagnostic_leads
  ADD COLUMN pipeline_stage text NOT NULL DEFAULT 'cold';
-- Valores: 'cold' | 'warm' | 'hot' | 'contacted'

-- Trigger updated_at opcional + nova coluna para registrar contato
ALTER TABLE public.diagnostic_leads
  ADD COLUMN contacted_at timestamptz,
  ADD COLUMN stage_updated_at timestamptz DEFAULT now();

-- Política UPDATE para admins (hoje só existe SELECT/DELETE/INSERT)
CREATE POLICY "Admins update diagnostic leads"
  ON public.diagnostic_leads FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));
```

Backfill: leads existentes ficam em `cold` por padrão.

## 2. Componente Kanban (`src/pages/AdminDiagnostic.tsx`)

### Layout

- Toggle no topo: **Kanban** (default) / **Tabela** (mantém UI atual intacta).
- Filtros existentes (busca + tipo) continuam aplicáveis às duas views.
- Stats cards permanecem inalterados.

### Board

Grid horizontal com 4 colunas (scroll vertical interno por coluna, scroll horizontal no mobile):

```
┌─ Lead Frio ──┐ ┌─ Lead Morno ─┐ ┌─ Lead Quente ┐ ┌─ Contatado ─┐
│ contagem  N  │ │ contagem  N  │ │ contagem  N  │ │ contagem N  │
│ ┌──────────┐ │ │              │ │              │ │             │
│ │ card     │ │ │              │ │              │ │             │
│ └──────────┘ │ │              │ │              │ │             │
└──────────────┘ └──────────────┘ └──────────────┘ └─────────────┘
```

Cada coluna tem cor de borda/header semântica (cold=azul, warm=âmbar, hot=vermelho/peach, contacted=verde) usando tokens do design system (sem cores hardcoded fora do tema).

### Card de lead (informações essenciais)

- Nome + badge do tipo de diagnóstico
- Empresa · Cidade
- Score (badge `X/10` colorida por faixa)
- Data relativa ("há 2 dias")
- Telefone/email com botões de ação rápida (📞 wa.me, ✉️ mailto)
- Click no card → abre o `Dialog` existente com respostas + resultado IA
- Botão `…` no canto: marcar como contatado, excluir

### Drag & drop

Usar `@dnd-kit/core` + `@dnd-kit/sortable` (leve, performático, acessível, já é o padrão moderno do ecossistema React). Adicionar como dependência.

- `DndContext` envolvendo as 4 `SortableContext` (uma por coluna).
- `onDragEnd`: optimistic update no estado local + `supabase.update({ pipeline_stage, stage_updated_at, contacted_at? })`.
- Se mover para "Contatado", preencher `contacted_at = now()` automaticamente.
- Em caso de erro do Supabase: rollback do estado + toast destrutivo.

### Realtime

Subscrever canal Supabase realtime na tabela `diagnostic_leads` (eventos INSERT/UPDATE/DELETE) → atualizar estado local automaticamente. Garante que se outro admin mover um card, o board sincroniza sem refresh.

### Performance

- Memoizar agrupamento por estágio com `useMemo`.
- `pointer-events: none` durante drag para evitar reflows desnecessários.
- Animações via CSS transforms (`@dnd-kit` já faz por padrão).

## 3. Fallback Tabela

Manter toda a UI atual de tabela acessível via toggle, com nova coluna **Estágio** (Select inline para mudar sem drag). Reaproveita o mesmo update.

## Arquivos

| Arquivo | Mudança |
|---|---|
| Migration SQL | Nova — adiciona `pipeline_stage`, `contacted_at`, `stage_updated_at`, política UPDATE para admins |
| `src/pages/AdminDiagnostic.tsx` | Refatorar — adicionar toggle, board kanban, drag-and-drop, realtime sync; manter tabela como alternativa |
| `src/components/admin/LeadKanbanCard.tsx` | **NOVO** — card visual do lead (memoizado) |
| `src/components/admin/LeadKanbanColumn.tsx` | **NOVO** — coluna droppable com header colorido + contagem |
| `package.json` | Adicionar `@dnd-kit/core` e `@dnd-kit/sortable` |

## O que NÃO muda

- Diagnostic quiz público (`/diagnostico`) — captação continua igual
- Edge function `generate-diagnostic` — não mexe
- RLS de SELECT/INSERT/DELETE existentes
- Stats, filtros, dialog de visualização detalhada do lead
- Acesso continua restrito a `isAdmin`

