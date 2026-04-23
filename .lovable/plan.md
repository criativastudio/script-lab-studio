

# Garantir entrega do contexto estratégico em escala

## Diagnóstico

Investiguei o fluxo completo (`ClientBriefingForm.tsx` → `process-briefing/index.ts`) e o banco. Encontrei **4 falhas reais** que fazem o contexto se perder silenciosamente quando vários clientes preenchem o formulário ao mesmo tempo:

### Falha 1 — Erro silencioso no front
Em `ClientBriefingForm.tsx` (linhas 211–220), quando `process-briefing` falha, o código apenas faz `console.error` e mostra **"Obrigado!"** ao cliente. O briefing fica em `status: 'submitted'` para sempre, sem contexto, sem projeto, sem scripts. Ex.: registro `Criativa Studio` (23/04) está exatamente nesse estado.

### Falha 2 — Função não dispara reprocessamento
Se o cliente recarrega a página depois de submeter, `setSubmitted(true)` impede nova tentativa. Não existe rota de retry.

### Falha 3 — Timeout do AI Gateway derruba a request
`process-briefing` chama o AI Gateway de forma síncrona (pode levar 30–60s). Se o cliente fechar a aba ou a conexão cair, a Edge Function continua, mas o front nunca recebe a resposta — e como o cache só é salvo no caminho de sucesso após o AI responder, em escala o usuário fica sem feedback.

### Falha 4 — Falta criação parcial em caso de falha do AI
Se a chamada ao AI falhar (429/402/500), o código reverte status para `submitted` mas **não cria** `client_strategic_contexts` mínimo com as respostas brutas. O contexto preenchido pelo cliente literalmente se perde.

## Correções

### A. `supabase/functions/process-briefing/index.ts`

1. **Salvar contexto bruto ANTES de chamar IA**: assim que a função recebe o token e valida, fazer `upsert` em `client_strategic_contexts` com os dados brutos de `form_answers` (business_context → products_services, ideal_audience → target_audience, desired_outcome → marketing_objectives, brand_voice → communication_style). `is_completed: false`. Isso garante que **mesmo se o AI falhar**, o contexto preenchido pelo cliente está salvo.

2. **Atualizar contexto APÓS sucesso do AI** com persona, positioning, tone_of_voice e marcar `is_completed: true` (o upsert atual no fim da função vira um `update`).

3. **Idempotência**: detectar `status === 'processing'` no início e permitir retomada se o registro estiver "preso" há mais de 2 minutos (evita travar se o usuário reenviar).

### B. `src/pages/ClientBriefingForm.tsx`

1. **Tratar erro de `process-briefing` como falha visível**: se `fnErr` ocorrer, mostrar mensagem "Recebemos seu briefing, mas a análise estratégica está em fila. Você pode fechar esta página." em vez de "Obrigado" enganoso. Manter `status: 'submitted'` (o reprocessador pega depois).

2. **Aumentar timeout / não bloquear UI**: chamar `process-briefing` em modo "fire-and-forget" (sem `await`) e mostrar tela de sucesso imediatamente. A função roda no servidor independentemente do cliente ter fechado a aba.

3. **Permitir reabrir formulário enviado se status ≠ completed**: se o cliente abrir o link e o status for `submitted` mas faltam campos (`persona is null`), oferecer botão "Reprocessar análise" que invoca `process-briefing` novamente.

### C. Nova Edge Function `retry-pending-briefings`

Função leve invocável manualmente (ou via cron futuro) que:
- Busca `briefing_requests` com `status IN ('submitted','processing')` e `persona IS NULL` há mais de 5 minutos.
- Reinvoca `process-briefing` para cada um.
- Retorna lista do que foi reprocessado.

Botão "Reprocessar briefings pendentes" no painel CRM (visível só para o owner/admin) chama essa função.

### D. Fix imediato dos registros já órfãos

Migration única (apenas dados, sem schema): para cada `briefing_requests` com `form_answers` preenchido mas sem `client_strategic_contexts` correspondente, criar o contexto bruto com os campos disponíveis e `is_completed: false`. O usuário verá o contexto no CRM e pode "Editar" ou clicar em "Reprocessar" para gerar persona/positioning via IA.

## O que NÃO muda

- Schema do banco (`client_strategic_contexts`, `briefing_requests`).
- UI do formulário do cliente (só mensagens de erro).
- Geração de scripts, hooks, carousels.
- RLS, auth, planos.

## Resultado esperado

1. **Contexto sempre chega**: mesmo se IA falhar/timeout, as respostas do cliente já estão em `client_strategic_contexts` com `is_completed: false`.
2. **Visibilidade de falha**: front mostra mensagem real em vez de "Obrigado" falso.
3. **Recuperação**: botão de reprocessar resolve casos travados sem precisar pedir o cliente para preencher de novo.
4. **Escala**: fire-and-forget no front + idempotência no backend evita perdas em alto volume.

