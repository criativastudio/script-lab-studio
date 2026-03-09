

# Persistência de Carrosséis no CRM — Aba "Carrosséis" no Card do Cliente

## Overview

Adicionar uma aba "Carrosséis" no card do cliente (CRM) que lista todos os carrosséis gerados (já salvos na tabela `scripts` com título contendo "Carrossel"), permitindo visualizar, editar e exportar em PDF.

## Dados

Os carrosséis já são salvos na tabela `scripts` com título no formato `{business_name} — Carrossel — {data}`. A filtragem será feita via `ilike` no título.

## Arquivos

| Arquivo | Alteração |
|---|---|
| `src/components/crm/CarouselsTab.tsx` | **Novo** — Componente da aba com lista de carrosséis, modais de visualização/edição, e export PDF |
| `src/components/crm/ClientDetailView.tsx` | Adicionar aba "Carrosséis" no TabsList + TabsContent, receber `carouselsTab` nos children |
| `src/pages/CRM.tsx` | Fetch carrosséis do cliente selecionado, passar `carouselsTab` ao `ClientDetailView` |

## Detalhes

### CarouselsTab
- Recebe `carousels: Script[]` + callbacks para edit/delete/refresh
- Lista cada carrossel com título, data, botões: Visualizar, Editar, Baixar PDF
- Modal de visualização: renderiza o conteúdo markdown do carrossel
- Modal de edição: título + textarea do conteúdo, salva via `supabase.update`
- PDF: abre nova janela com HTML estilizado premium (mesmo padrão do ContentGenerator)

### ClientDetailView
- Novo child `carouselsTab` + prop `carouselsCount`
- Nova `TabsTrigger` com ícone `LayoutList` e badge com contagem

### CRM.tsx
- Estado `clientCarousels: Script[]`
- Fetch ao selecionar cliente: `scripts` filtrado por `ilike title '%Carrossel%'` e `ilike title '%{business_name}%'`
- Funções `handleEditCarousel`, `handleDeleteCarousel`

