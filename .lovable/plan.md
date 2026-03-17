

# Alterar Plano de Usuários pelo Admin

## Resumo

Adicionar um botão "Alterar Plano" em cada linha da tabela de usuários no Admin. Ao clicar, abre um dialog com select de plano (Starter, Creator Pro, Scale Studio). Ao confirmar, atualiza `users.plano_ativo` e faz upsert em `subscriptions` (desativa antigas, cria nova ativa).

## Alterações

### `src/components/admin/ChangePlanDialog.tsx` (novo)

Componente dialog que recebe `user_id`, `email`, `currentPlan` e `onPlanChanged` callback:
- Select com 3 opções: `starter`, `creator_pro`, `scale_studio`
- Ao confirmar: atualiza `users.plano_ativo` e `users.status_assinatura`, desativa subscriptions antigas do user, insere nova subscription ativa
- Toast de sucesso/erro
- Botão trigger compacto (ícone de edição) na coluna Plano

### `src/pages/Admin.tsx`

- Importar `ChangePlanDialog`
- Na coluna "Plano", ao lado do Badge, renderizar o botão de alteração
- Passar `fetchData` como callback para recarregar dados após mudança

## Fluxo de dados

1. Admin clica no ícone de edição ao lado do plano
2. Dialog abre com select pré-selecionado no plano atual
3. Admin seleciona novo plano e confirma
4. Client-side executa:
   - `UPDATE users SET plano_ativo = X, status_assinatura = 'active' WHERE id = user_id`
   - `UPDATE subscriptions SET status = 'inactive' WHERE user_id = X AND status = 'active'`
   - `INSERT INTO subscriptions (user_id, plan, status) VALUES (user_id, X, 'active')`
5. Recarrega tabela

As RLS policies já permitem que admins façam todas essas operações (`has_role(auth.uid(), 'admin')`).

| Arquivo | Alteração |
|---|---|
| `src/components/admin/ChangePlanDialog.tsx` | Novo componente dialog para alterar plano |
| `src/pages/Admin.tsx` | Integrar botão de alterar plano na tabela |

