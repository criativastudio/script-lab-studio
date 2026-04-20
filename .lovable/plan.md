

# Remover "Gerador de Conteúdo" do Dashboard

## Mudança

Em `src/pages/Dashboard.tsx`:

- Remover o import `import { ContentGenerator } from "@/components/dashboard/ContentGenerator";`
- Remover a renderização `<ContentGenerator />` do JSX (aparece logo após os stat cards, em torno da linha ~140).

O widget de geração de conteúdo deixa de aparecer no Dashboard tanto para admins quanto para usuários comuns. O componente `ContentGenerator.tsx` continua existindo no codebase (não é deletado), apenas deixa de ser renderizado.

## Arquivo modificado

| Arquivo | Mudança |
|---|---|
| `src/pages/Dashboard.tsx` | Remover import e uso de `<ContentGenerator />` |

## O que NÃO muda

- Stat cards, listas de Projetos/Roteiros/Ideias/Briefings/Relatórios recentes continuam iguais
- Componente `ContentGenerator.tsx` permanece no projeto (caso queira reutilizar depois)
- Demais módulos e rotas

