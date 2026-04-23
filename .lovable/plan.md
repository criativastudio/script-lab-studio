

# Controle manual de status + Cliente sem projetos sempre acessível

## Diagnóstico atual

1. **Cliente "fica inativo" sem projetos**: hoje `isGroupInactive` checa se `group.projects.every(p => p.is_active === false)`. Quando todos os projetos são apagados, o grupo só sobrevive porque o `client_strategic_contexts` (orphan context) é injetado em `clientGroups` — mas como `projects.length === 0`, o filtro `matchesActive` em `filteredGroups` (`group.projects.some(p => p.is_active !== false)`) retorna **false**, escondendo o cliente a menos que "Mostrar inativos" esteja ligado.

2. **Status atrelado a projetos**: `handleToggleActive` atualiza `is_active` em todos os `briefing_requests` do grupo. Sem projetos, não há onde gravar status.

3. **Cliente sem projetos abre normalmente** já (via `selectedGroup`), mas o `ProjectsTab` mostra empty state genérico. Falta atalho explícito para "gerar novo link" ou "recriar projeto com último contexto".

## Solução

### A. Persistir status no `client_strategic_contexts` (sem migration de schema)

Adicionar coluna `is_active boolean DEFAULT true` em `client_strategic_contexts` via migration. Esta tabela é a única que **sempre existe** para qualquer cliente (criada já no `process-briefing` antes mesmo da IA rodar). Vira a fonte de verdade do status.

| Estado | Onde lê | Onde grava |
|---|---|---|
| Status manual ATIVO/INATIVO | `client_strategic_contexts.is_active` | mesmo |
| `briefing_requests.is_active` | mantido para retrocompat (não mais usado para status do cliente) | continua existindo |

### B. Mudanças em `src/pages/CRM.tsx`

1. **Tipo `ClientGroup`**: adicionar campo `is_active: boolean` derivado do contexto.
2. **`fetchClients`**: trazer `is_active` no SELECT de `client_strategic_contexts` (já busca a tabela).
3. **`clientGroups` useMemo**: para cada grupo, casar com `allContexts` por `business_name` e setar `is_active` (default `true` se não houver contexto).
4. **`isGroupInactive`**: simplificar para `group.is_active === false`.
5. **`filteredGroups`**: trocar `matchesActive` para `showInactive || group.is_active !== false` — **sem depender de projetos**.
6. **`handleToggleActive`**: gravar em `client_strategic_contexts.is_active` via update por `user_id + business_name`. Se o contexto ainda não existe (cliente criado direto pelo "Adicionar Novo Cliente" sem briefing), fazer upsert com defaults.
7. **Remover** o `setSelectedBusinessName(null)` ao desativar — cliente inativo continua acessível.

### C. Empty state do `ProjectsTab` (cliente sem projetos)

Substituir o empty card atual por dois CTAs lado a lado:

```
┌──────────────────────────────────────────────────────┐
│  Este cliente ainda não tem projetos                 │
│                                                      │
│  ┌────────────────────┐   ┌────────────────────┐     │
│  │ 🔗 Gerar novo link │   │ ♻ Recriar projeto  │     │
│  │   de formulário    │   │ com último contexto│     │
│  └────────────────────┘   └────────────────────┘     │
└──────────────────────────────────────────────────────┘
```

- **"Gerar novo link"**: abre o mesmo `Dialog` do "Adicionar Novo Cliente" (em CRM.tsx) já com `business_name` pré-preenchido e travado. Reaproveita `handleCreateClient`.
- **"Recriar projeto com último contexto"**: só aparece se `strategicContext` existir. Abre o dialog "Novo Projeto" existente; ao submeter, `handleCreateProject` já reaproveita o `original.form_answers`. Quando não há `original` (sem nenhum briefing antigo), monta `mergedAnswers` a partir do `strategicContext` (`products_services`, `target_audience`, `communication_style`, etc.).

### D. UI de controle de status

1. **No card da lista (`ClientListView`)**: adicionar `Switch` pequeno no canto inferior do card mostrando "Ativo/Inativo" — clique propaga `stopPropagation` e chama `handleToggleActive(group)`. Substitui o botão atual no header de detalhes (que continua existindo).
2. **No `ClientDetailView`**: o botão "Reativar/Desativar" já existe — mantém. Apenas garante que o estado vem do novo campo.
3. **Badge "Inativo"** nos cards continua, mas agora reflete o status manual, não o derivado de projetos.

### E. Handler de delete de projeto

Em `handleDeleteProject` (linha 602): **remover qualquer lógica que afete `is_active`**. Já não há — só garantir que o cliente continua visível mesmo após deletar o último projeto (resolvido pelo item B5).

## Tabelas afetadas

| Tabela | Mudança | Tipo |
|---|---|---|
| `client_strategic_contexts` | `+ is_active boolean DEFAULT true NOT NULL` | Migration de schema |
| `briefing_requests.is_active` | sem mudança (legado preservado) | — |

RLS já cobre UPDATE para owner.

## O que NÃO muda

- Schema de `briefing_requests`, `projects`, `briefings`, `scripts`.
- `process-briefing` Edge Function (raw upsert continua igual; novo campo herda default `true`).
- Geração de scripts, PDFs, hooks, carrosséis.
- Auth, planos, limites.

## Resultado esperado

1. Excluir todos os projetos de um cliente **não** o esconde nem inativa.
2. Clicar num cliente sem projetos abre o detalhe com 2 CTAs claros (novo link / recriar projeto).
3. "Recriar projeto" usa o último `strategic_context` automaticamente — sem refazer briefing.
4. Switch ATIVO/INATIVO em cada card, controle 100% manual, persistente.
5. Cliente inativo: aparece com opacidade reduzida + badge, mas continua clicável e editável.

