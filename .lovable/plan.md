# Adicionar acesso ao Diagnostic Quiz na dashboard do usuario

## Problema

O quiz funnel está implementado em `/diagnostico` mas não há nenhum link na landing page, dashboard ou sidebar para acessá-lo. O usuário só chega digitando a URL.

## Solução

### 1. Sidebar no Dashboard (`src/components/DashboardLayout.tsx`)

- Adicionar item "Diagnóstico" no menu lateral da área logada, com ícone `Target` ou `Sparkles`

## Arquivos modificados


| Arquivo                              | Alteração                                       |
| ------------------------------------ | ----------------------------------------------- |
| &nbsp;                               | &nbsp;                                          |
| `src/components/DashboardLayout.tsx` | Adicionar item de menu "Diagnóstico" na sidebar |
