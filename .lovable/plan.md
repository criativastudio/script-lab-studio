

# Kanban não aparece no site publicado

## Diagnóstico

Verifiquei o código e está tudo correto:

- `src/pages/AdminDiagnostic.tsx` já tem o kanban completo (4 colunas: Frio, Morno, Quente, Contatado) com `DndContext` e drag-and-drop
- `@dnd-kit/core`, `@dnd-kit/sortable` e `@dnd-kit/utilities` estão no `package.json`
- A tabela `diagnostic_leads` no banco já tem as colunas `pipeline_stage`, `contacted_at`, `stage_updated_at`
- A rota `/admin/diagnostico` está registrada em `App.tsx` (admin-only)
- No **preview** (que você está vendo agora) tudo funciona

## Causa

No Lovable, **mudanças de frontend não vão automaticamente para o site publicado**. O preview (`id-preview--*.lovable.app`) sempre mostra a versão mais recente, mas o site publicado (`scriptlabstudio.lovable.app`) continua na versão da última publicação.

O kanban, drag-and-drop, colunas coloridas, fix de segurança do realtime, novos campos do formulário CRM — tudo isso está **só no preview**. O site publicado ainda roda a versão anterior, que não tinha o kanban.

Mudanças de **backend** (edge functions, migrations do banco) já foram para produção automaticamente — por isso a coluna `pipeline_stage` existe no banco. Só o **bundle JS do frontend** está defasado.

## Solução

Não há nada para corrigir no código. Você precisa **republicar o site**:

1. Clique no botão **Publish** no canto superior direito do editor
2. Clique em **Update** no diálogo que abrir
3. Aguarde ~30s o build terminar
4. Acesse `https://scriptlabstudio.lovable.app/admin/diagnostico` (precisa estar logado como admin) — o kanban aparecerá

## Verificação após publicar

- A página deve abrir com o toggle Kanban / Tabela no topo
- Por padrão a visão **Kanban** é exibida com 4 colunas coloridas
- Leads existentes sem `pipeline_stage` definido entram automaticamente na coluna **Lead Frio** (default no banco é `cold`)
- Arrastar um card entre colunas atualiza o estágio no Supabase em tempo real

## Se mesmo após publicar continuar não aparecendo

Apenas nesse caso, abra o site publicado, faça **Ctrl+Shift+R** (hard refresh) para invalidar o cache do navegador. Se ainda assim falhar, abra o console (F12) na aba publicada e me envie o erro — aí investigo.

