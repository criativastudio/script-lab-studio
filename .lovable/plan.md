

# Editar nome da empresa em Clientes

## Objetivo

Permitir renomear o `business_name` de um cliente diretamente no CRM. Como o nome é a chave de agrupamento (não há tabela `clients` separada para esses registros — o agrupamento é feito por `business_name` em `briefing_requests`), a edição precisa atualizar **todos** os registros relacionados em cascata.

## Onde editar

- **`src/components/crm/ClientDetailView.tsx`** — adicionar botão "Editar nome" no header do cliente (ao lado dos botões de PDF/ativar/excluir) que abre um `Dialog` com input simples.
- **`src/pages/CRM.tsx`** — adicionar handler `handleRenameClient(oldName, newName)` que:
  1. Valida que `newName` não está vazio nem duplicado em outros grupos.
  2. Atualiza em paralelo:
     - `briefing_requests` → `business_name` onde `business_name = oldName` AND `user_id = auth.uid()`
     - `client_strategic_contexts` → `business_name` onde `business_name = oldName`
     - `strategic_reports` → `business_name` onde `business_name = oldName`
  3. Atualiza `selectedGroup.business_name` no estado local e refaz `fetchClients()`.
  4. Mostra toast de sucesso/erro.

## Tabelas afetadas (apenas data updates, sem migration)

| Tabela | Coluna | Ação |
|---|---|---|
| `briefing_requests` | `business_name` | UPDATE em cascata |
| `client_strategic_contexts` | `business_name` | UPDATE em cascata |
| `strategic_reports` | `business_name` | UPDATE em cascata |

RLS já permite `UPDATE` para o owner via `user_id = auth.uid()`, então não precisa criar nada novo.

## UI

Botão `Edit2` (lucide) no header do `ClientDetailView`, abrindo:

```
┌─ Renomear empresa ─────────┐
│ Nome atual: Acme Ltda      │
│ Novo nome: [_____________] │
│         [Cancelar] [Salvar]│
└────────────────────────────┘
```

## O que NÃO muda

- Nenhuma migration de schema.
- `ideas`, `content_ideas`, `scripts`, `briefings` não têm coluna `business_name` — são ligadas via `project_id`/`user_id`, então herdam automaticamente.
- Lista de clientes (`ClientListView`) continua intacta — basta o `fetchClients()` final para reagrupar.

