

# Adicionar busca e filtros na lista de Clientes (CRM)

## Problema

A lista de clientes não tem busca nem filtros. Com muitos clientes cadastrados, fica difícil encontrar um específico. Além disso, os campos "cidade" e "nicho/segmento" não existem no banco de dados.

## Solução

### 1. Migração de banco de dados

Adicionar duas novas colunas à tabela `briefing_requests`:
- `city` (text, nullable)
- `niche` (text, nullable)

### 2. UI de busca e filtros (lista de clientes)

Adicionar acima do grid de cards:
- **Input de busca** por nome (business_name, contact_name) com ícone de Search
- **Select de cidade** populado dinamicamente a partir das cidades cadastradas
- **Select de nicho/segmento** populado dinamicamente a partir dos nichos cadastrados
- Botão para limpar filtros

Filtragem client-side no array `clientGroups` usando `useMemo`.

### 3. Formulário de criação de cliente

Adicionar campos "Cidade" e "Nicho/Segmento" no dialog de "Novo Cliente" e incluí-los no insert do Supabase.

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Adicionar colunas `city` e `niche` em `briefing_requests` |
| `src/pages/CRM.tsx` | Estado de filtros, inputs de busca/filtro, lógica de filtragem, campos no form de criação |
| `src/integrations/supabase/types.ts` | Atualizado automaticamente após migração |

## Detalhes técnicos

- Filtro por nome: `toLowerCase().includes(searchTerm)` no `business_name` e `contact_name`
- Filtros de cidade/nicho: comparação exata com valor do Select
- Listas de opções dos Selects: extraídas com `Set` dos valores únicos presentes nos dados
- Interface `BriefingRequest` atualizada com `city` e `niche`

