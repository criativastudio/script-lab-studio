

# Adicionar Tabela de Usuários ao Painel Admin

## Resumo

Adicionar uma seção "Usuários" no Admin com tabela mostrando nome, email, telefone, data de cadastro, plano ativo e uso mensal (briefings/roteiros), com campo de busca por nome, email ou telefone.

## Dados disponíveis

- **`profiles`**: `user_id`, `full_name`, `created_at`
- **`users`**: `email`, `whatsapp`, `plano_ativo`, `created_at`
- **`subscriptions`**: `user_id`, `plan`, `status`
- **`briefing_requests`**: contagem mensal por `user_id`
- **`scripts`**: contagem mensal por `user_id`

O plano será buscado de `subscriptions` (ativo) com fallback para `users.plano_ativo`. O uso do plano será exibido como "X/Y briefings" e "X/Y roteiros" do mês atual vs limites do plano (`PLAN_CONFIGS`).

## Alterações

### `src/pages/Admin.tsx`

1. Adicionar estado: `userList`, `searchTerm`
2. No `fetchData`, buscar `profiles` (full_name, user_id, created_at) e `users` (email, whatsapp, plano_ativo, created_at) e `subscriptions` (user_id, plan, status=active)
3. Para uso mensal: buscar contagem de `briefing_requests` e `scripts` por user_id no mês atual via queries agregadas
4. Montar lista combinada de usuários com: nome, email, telefone, data cadastro, plano, uso
5. Adicionar campo `Input` de busca que filtra por nome, email ou telefone (client-side)
6. Renderizar nova `Card` "Usuários" com `Table` contendo colunas: Nome, Email, Telefone, Cadastro, Plano, Uso (briefings/roteiros como badges ou texto compacto)
7. Mover a tabela de usuários acima da tabela de assinaturas

### Detalhes de implementação

- Buscar todos os profiles e users em paralelo, fazer join client-side por `user_id`
- Para uso mensal: fazer 2 queries com contagem agrupada (briefing_requests e scripts do mês atual, filtradas por `created_at >= monthStart`)
- Como não há group by no SDK, buscar todos os registros do mês e agrupar client-side, ou fazer uma query por todos e contar via `reduce`
- Limites do plano via `PLAN_CONFIGS` importado ou duplicado inline
- Busca case-insensitive no campo de input

| Arquivo | Alteração |
|---|---|
| `src/pages/Admin.tsx` | Nova seção de tabela de usuários com busca e uso do plano |

