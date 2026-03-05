

# Desativar/Excluir Clientes + Mostrar Funil nos Cards e PDFs

## 1. Migração de banco de dados

Adicionar coluna `is_active` (boolean, default true) na tabela `briefing_requests` para permitir desativação de clientes sem perder dados.

## 2. Desativar e Excluir cliente

Na view de detalhe do cliente (header com info de contato), adicionar dois botões:

- **Desativar**: Marca todos os `briefing_requests` daquele `business_name` como `is_active = false`. O cliente some da lista principal mas pode ser reativado.
- **Excluir**: Dialog de confirmação (AlertDialog) que deleta todos os `briefing_requests`, `briefings` e `scripts` associados.

Na lista de clientes, filtrar por `is_active = true` por padrão, com um toggle/switch "Mostrar inativos" para ver todos.

Cards de clientes inativos terão opacidade reduzida e badge "Inativo".

## 3. Mostrar tipo de funil nos cards e PDFs

O campo `content_strategy` já existe e contém a estratégia de funil. Mudanças:

- **Cards da lista**: Adicionar uma linha com ícone de funil e texto truncado do `content_strategy` (se existir em algum projeto do grupo).
- **Card de detalhe do projeto**: Já exibe via `StrategicCard` — sem mudança necessária.
- **PDF**: Já exibe `content_strategy` como "Estratégia de Conteúdo" (linha 708). Renomear label para "Funil de Conteúdo" para ficar mais claro.

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Adicionar `is_active` boolean default true em `briefing_requests` |
| `src/pages/CRM.tsx` | Botões desativar/excluir, filtro de inativos, funil nos cards, label do PDF |

