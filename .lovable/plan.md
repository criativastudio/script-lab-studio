

# Filtro de planos no Admin + reordenar menu lateral

## 1. Filtro de planos na página Admin

Em `src/pages/Admin.tsx`, adicionar acima da tabela "Usuários" (dentro do `CardHeader`, ao lado da busca) um grupo de **chips/botões de filtro** por plano:

- **Todos** (default)
- **Starter**
- **Creator Pro**
- **Scale Studio**

Comportamento:
- Novo state `planFilter: "all" | "starter" | "creator_pro" | "scale_studio"` (default `"all"`).
- `filteredUsers` passa a aplicar **dois filtros combinados**: termo de busca (já existe) **+** plano selecionado (`u.plan === planFilter` quando ≠ "all"). Inclui aliases legados: `basic` conta como `starter`, `premium` conta como `creator_pro`.
- Cada chip exibe ao lado o **contador** de usuários daquele plano (ex.: "Starter (12)") calculado a partir de `userList`.
- Tabela passa a ser **ordenada** por plano (Scale Studio → Creator Pro → Starter) e, dentro de cada plano, por `created_at` desc — assim os usuários ficam organizados visualmente mesmo no filtro "Todos".

UI: usar `Button` variant `default` para o ativo e `outline` para os demais, em um `flex flex-wrap gap-2` logo abaixo do título do card (acima do `Input` de busca em mobile, ao lado em desktop).

## 2. Reordenar menu lateral

Em `src/components/DashboardLayout.tsx`, reorganizar de forma que a ordem final renderizada seja:

1. Dashboard
2. Clientes
3. Análises
4. **Diagnóstico CRM** (antepenúltimo) — admin only
5. **Personalizar PDF** (penúltimo) — Scale Studio only
6. **Admin** (último) — admin only

Mudanças:
- `navItems` mantém apenas: Dashboard, Clientes, Análises.
- `adminItems` é dividido em dois: `diagnosticItem = [{ href: "/admin/diagnostico", label: "Diagnóstico CRM", icon: ClipboardCheck }]` e `adminItem = [{ href: "/admin", label: "Admin", icon: Shield }]`.
- `scaleItems` continua sendo Personalizar PDF.
- Nova montagem de `allItems`:
  ```ts
  const allItems = [
    ...navItems,
    ...(isAdmin ? diagnosticItem : []),
    ...scaleItems,
    ...(isAdmin ? adminItem : []),
  ];
  ```

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/Admin.tsx` | State `planFilter`, chips de filtro com contadores, ordenação por plano na tabela |
| `src/components/DashboardLayout.tsx` | Separar `adminItems` em dois e reordenar `allItems` |

## O que NÃO muda

- Lógica de fetch, edge functions, schema do banco
- Tabela de assinaturas, stat cards, busca por nome/email/telefone
- Demais rotas e permissões

