

# Ativar acesso total para criativastudiobr@gmail.com

## Estado atual

- **User ID**: `4e52decb-5c7f-4591-a415-d7b42b0dcda3`
- **Role admin**: Já existe
- **Tabela `users`**: Sem registro (precisa criar)
- **Tabela `subscriptions`**: Sem registro (precisa criar)
- **Profile**: Existe, mas sem `full_name`

## Ações necessárias

1. **Inserir registro na tabela `users`** com `email`, `plano_ativo = 'scale_studio'`, `status_assinatura = 'active'`
2. **Inserir assinatura na tabela `subscriptions`** com `plan = 'scale_studio'`, `status = 'active'`
3. **Atualizar profile** com `full_name = 'Criativa Studio'`

Nenhuma alteração de schema é necessária — apenas inserção/atualização de dados via SQL.

