

# Renomear projetos existentes em Clientes/Projetos

## Mudança

Adicionar opção de renomear o `project_name` em cada card de projeto dentro da aba "Projetos" do detalhe do cliente.

## UX

No header do card de projeto (`ProjectsTab.tsx`), ao lado do `Badge` de status, adicionar um pequeno botão `Edit2` (ghost, h-7 w-7). Clicar abre um `Dialog` com:

- Campo `Input` pré-preenchido com o nome atual
- Botões **Cancelar** e **Salvar**
- Validação: nome não pode ficar vazio; trim aplicado

O botão fica dentro do `CollapsibleTrigger`, então usar `e.stopPropagation()` no `onClick` para não abrir/fechar o card ao clicar em editar.

Ao salvar:
- `UPDATE briefing_requests SET project_name = ... WHERE id = project.id`
- Toast de sucesso "Projeto renomeado"
- Recarregar a lista de clientes (`fetchClients()`) para refletir o novo nome em todos os lugares (header do card, AlertDialog de exclusão, PDFs futuros)

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/CRM.tsx` | Nova função `handleRenameProject(projectId: string, newName: string): Promise<void>` passada como prop para `ProjectsTab` |
| `src/components/crm/ProjectsTab.tsx` | Novo botão de editar no header do card + `Dialog` controlado por state local `renamingProject` e `renameValue`; nova prop `handleRenameProject` |

## O que NÃO muda

- Schema do banco (campo `project_name` já existe em `briefing_requests`)
- RLS (policy de UPDATE para owner/admin já existe)
- Briefings, scripts, contexto estratégico, ideias vinculadas

