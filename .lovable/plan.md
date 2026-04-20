

# Remover itens do menu lateral da Dashboard

## Mudança

Remover os seguintes itens do menu lateral (`navItems` em `DashboardLayout.tsx`) para **todos os usuários** (admin e produtores):

- Gerador IA
- Análise Estratégica
- Carrossel
- Distribuição

## Arquivo modificado

| Arquivo | Mudança |
|---|---|
| `src/components/DashboardLayout.tsx` | Remover 4 objetos do array `navItems` (linhas ~35-38 aproximadamente) |

## O que NÃO muda

- As rotas continuam existindo (acessíveis diretamente por URL se necessário)
- Demais itens do menu (Dashboard, Clientes, Análises, Admin, etc.)
- Funcionalidade dos módulos removidos do menu

