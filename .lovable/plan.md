

# Botão "Excluir Projeto" nos cards de Projetos

## Comportamento

Cada card de projeto em CRM > Projetos ganha um botão **"Excluir Projeto"** (ícone lixeira + texto, variante destrutiva) na linha de ações já existente (junto de "PDF", "Gerar com Agente", "Criar Manual + IA").

Ao clicar:
1. Abre `AlertDialog` de confirmação: *"Excluir projeto «Nome»? Esta ação é permanente e removerá também todos os briefings e roteiros vinculados. Não pode ser desfeita."*
2. Botões **Cancelar** / **Excluir permanentemente** (destrutivo).
3. Ao confirmar:
   - Deleta `briefings` onde `project_id = projeto.id`
   - Deleta `scripts` onde `project_id = projeto.id`
   - Se `projeto.project_id` (FK para `projects`) existir, deleta a linha em `projects`
   - Deleta a linha em `briefing_requests` (`id = projeto.id`)
   - Toast de sucesso, atualiza lista (`fetchClients()` e remove dos `projectBriefings`/`projectScripts`/`openProjects` locais).
4. Em caso de erro, toast vermelho com a mensagem; nada é alterado na UI.

## Garantias

- Apenas o projeto clicado é afetado. Outros projetos do mesmo cliente, contexto estratégico, ideias e carrosséis permanecem intactos (esses estão vinculados a `business_name`, não ao `project_id`).
- RLS já permite DELETE em `briefing_requests`, `briefings`, `scripts` e `projects` para o `user_id` dono — sem mudança de policy.
- Sem migration de banco.

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/crm/ProjectsTab.tsx` | Adicionar botão "Excluir Projeto" no bloco de ações do card + `AlertDialog` de confirmação. Receber nova prop `deleteProject(project)`. |
| `src/pages/CRM.tsx` | Implementar `handleDeleteProject(project)`: deleta briefings → scripts → projects → briefing_requests; atualiza estados locais; toasts. Passar como prop ao `ProjectsTab`. |

## O que NÃO muda

- Schema do banco, RLS, edge functions.
- Demais módulos (Clientes, Ideias, Carrosséis, Contexto Estratégico).
- Botão "Desativar/Excluir Cliente" no header do cliente (continua igual).

