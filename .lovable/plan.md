

# Novo Projeto: gerar conteúdo direto do briefing existente

## Comportamento atual vs novo

**Hoje:** Criar Projeto → cria `briefing_requests` com `status="pending"` → mostra link → cliente precisa preencher de novo → só então gera conteúdo.

**Novo:** Criar Projeto → reusa briefing original do cliente + seleções (Tipo/Estilo/Quantidade) → chama `process-briefing` imediatamente → retorna projeto + roteiros/carrosséis prontos. Sem link, sem nova etapa.

## Fluxo

1. Usuário abre Novo Projeto e preenche: nome, quantidade de vídeos, **Tipo** (Roteiro/Carrossel), **Estilo**, objetivo de campanha, etapa do funil, frequência.
2. Sistema valida que o cliente tem **pelo menos um briefing original respondido** (linha em `briefing_requests` com `form_answers` ou `persona` preenchidos). Se não tiver, bloqueia com toast: "Este cliente ainda não preencheu o briefing inicial."
3. Sistema cria nova linha em `briefing_requests` já com:
   - `status = "submitted"` (não `pending`)
   - `form_answers` = mescla das respostas originais + `content_type` + `content_style` + objetivos do dialog
   - `persona`, `positioning`, `tone_of_voice`, `content_strategy`, `niche`, `city`, dados de contato copiados do briefing original
4. Sistema chama imediatamente `supabase.functions.invoke("process-briefing", { token })` — que já lê `form_answers` e gera projeto + briefing + roteiros (ou slides, se Carrossel).
5. Botão mostra loader. Ao terminar: toast de sucesso, dialog fecha, lista de projetos atualiza.
6. **Nenhum link é exibido em momento algum.**

## Garantia de consistência

- A função `process-briefing` já injeta `content_type` / `content_style` no prompt (lógica recém-implementada).
- Como copiamos `persona`, `tone_of_voice`, `positioning`, `niche` do briefing original e o frontend não muda esses campos, todos os projetos futuros do mesmo cliente compartilham o mesmo contexto estratégico — apenas Tipo/Estilo/Quantidade variam por projeto.
- Caso o `client_strategic_contexts` daquele cliente exista (criado pelo primeiro briefing), `process-briefing` o atualizará no final do fluxo, mantendo um único registro de verdade por cliente.

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/pages/CRM.tsx` | Reescrever `handleCreateProject`: validar briefing original → inserir nova linha com `status="submitted"` + dados estratégicos copiados + `form_answers` mesclado → invocar `process-briefing` → fechar dialog. Remover uso de `newProjectLink`/`setNewProjectLink`. |
| `src/components/crm/ProjectsTab.tsx` | Remover bloco do link copiável e props `newProjectLink`/`setNewProjectLink`. Adicionar nota "O briefing original do cliente será reutilizado automaticamente." Botão "Criar Projeto" exibe loader durante geração. |

## O que NÃO muda

- Schema do banco, RLS, edge functions (`process-briefing`, `generate-script`, `generate-carousel` continuam idênticos).
- Lógica Conecta-Entretém-Vende, Tipo/Estilo, Fidelidade ao Nicho.
- Fluxo de **cadastro de cliente novo** — esse continua gerando o link inicial (é o único momento em que o cliente preenche o briefing).
- Qualquer outro módulo (Ideias, Carrosséis avulsos, CRM, Dashboard).

## Erros tratados

- Briefing original ausente → toast vermelho, dialog permanece aberto.
- Falha em `process-briefing` → toast vermelho com mensagem; a linha criada permanece para o usuário tentar "Gerar com Agente" depois.

