

# Preservar contexto e cliente após excluir o último projeto

## Problema

Hoje a lista de clientes em `/crm` é montada **apenas** a partir da tabela `briefing_requests` (cada projeto = 1 linha). Quando o usuário exclui o último projeto de um cliente, a linha some — e como o agrupamento (`clientGroups`) deriva dessa tabela, o **card do cliente desaparece** da listagem, mesmo que `client_strategic_contexts` continue salvo no banco. Resultado: o usuário acha que perdeu o contexto.

O contexto na verdade **continua no banco** — só fica órfão e invisível.

## Solução

Tratar `client_strategic_contexts` como a fonte canônica de "existência de cliente" e **fundir** essa lista com `briefing_requests` na montagem dos grupos. Cliente sem nenhum projeto vira um grupo "vazio" que ainda aparece no CRM, mantendo o contexto acessível e permitindo criar novos projetos.

## Mudanças

### 1. `src/pages/CRM.tsx`

**a) Buscar contextos junto com clientes (`fetchClients`)**
- Buscar em paralelo `briefing_requests` **e** `client_strategic_contexts` do usuário.
- Guardar contextos em novo state `allContexts: StrategicContext[]`.

**b) Reescrever `clientGroups` (useMemo)**
- Agrupar `briefing_requests` por `business_name` (como hoje).
- Para cada `client_strategic_contexts.business_name` que **não** tiver projetos, criar um grupo "vazio":
  ```ts
  { business_name, contact_name: null, contact_email: null, contact_whatsapp: null, projects: [] }
  ```
- Resultado: clientes com 0 projetos continuam visíveis na grade.

**c) Ajustar `isGroupInactive`**
- Hoje: `every(p => p.is_active === false)`. Em grupo vazio (`projects.length === 0`), `every` retorna `true` → marcaria como inativo.
- Corrigir: `projects.length > 0 && projects.every(p => p.is_active === false)`. Grupo vazio é considerado **ativo**.

**d) `handleDeleteProject` — não tocar no contexto**
- Já não toca em `client_strategic_contexts` (correto). Apenas garantir que após `fetchClients()` o `selectedBusinessName` permaneça válido (o grupo vazio continua existindo). Nenhuma mudança extra necessária além do refetch.

**e) `handleDeleteClient` — manter exclusão do contexto**
- Continua apagando `client_strategic_contexts` (este é o botão "Excluir cliente" inteiro, ação destrutiva intencional). Sem mudança.

### 2. `src/components/crm/ClientListView.tsx`

**a) Card de cliente com 0 projetos**
- Mostrar badge **"Sem projetos"** (variant outline) no lugar da contagem `projects.length` quando vazio.
- Remover/esconder "último roteiro em…" se não houver projetos.
- Manter clicável: ao abrir o cliente, usuário cai direto na aba **Projetos** com botão "Novo Projeto" disponível, e a aba **Contexto** mostra o contexto preservado.

### 3. `src/components/crm/ProjectsTab.tsx`

**a) Estado vazio melhorado**
- Quando `projects.length === 0`, exibir empty state amigável: ícone + texto "Nenhum projeto ainda — o contexto estratégico do cliente foi preservado" + CTA grande "Criar Primeiro Projeto" (abre o diálogo Novo Projeto que já existe).

### 4. (Opcional) Alerta no diálogo de excluir projeto

No `AlertDialogDescription` em `ProjectsTab.tsx` ao excluir o último projeto, adicionar texto: "O contexto estratégico do cliente será preservado." — texto condicional baseado em `selectedGroup.projects.length === 1`.

## O que NÃO muda

- Schema do banco (sem migration)
- Tabela `client_strategic_contexts` (segue intacta após exclusão de projetos)
- Botão "Excluir cliente" (continua apagando contexto + projetos — ação destrutiva intencional)
- RLS, edge functions, `handleRenameProject`, `handleToggleActive`
- Outras abas (Ideias, Calendário, Carrosséis) — funcionam normalmente sobre o contexto preservado

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/CRM.tsx` | `fetchClients` busca contextos; `clientGroups` funde projetos + contextos órfãos; `isGroupInactive` trata grupo vazio |
| `src/components/crm/ClientListView.tsx` | Badge "Sem projetos" e ajuste de UI quando `projects.length === 0` |
| `src/components/crm/ProjectsTab.tsx` | Empty state com CTA "Criar Primeiro Projeto" + texto preservativo no diálogo de exclusão |

