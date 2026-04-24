# Refatoração do Formulário de Briefing do Cliente

## Problemas atuais
1. **Perguntas 3 e 4** (`desired_outcome`, `brand_voice`) são `type: "multi"` — só chips, sem texto livre obrigatório.
2. **Sugestões poluídas**: o `suggest-briefing` injeta respostas anteriores no prompt, gerando ruído.
3. **Persistência falha**: salva só no submit final → fechar a aba perde tudo.
4. **Faltam perguntas estratégicas**: dores, diferencial, objetivo, tipo de conteúdo.

## Mudanças

### 1. `src/pages/ClientBriefingForm.tsx`

**7 perguntas híbridas** (todas com chips IA + textarea obrigatório):

| # | Chave | Pergunta |
|---|---|---|
| 1 | `business_context` | Conte sobre seu negócio |
| 2 | `ideal_audience` | Quem é seu público-alvo ideal? |
| 3 | `pain_points` | **NOVA** — Principais dores do seu cliente? |
| 4 | `differentiators` | **NOVA** — Diferencial da sua empresa? |
| 5 | `marketing_objective` | **NOVA** — Objetivo principal (vendas / autoridade / engajamento)? |
| 6 | `content_type` | **NOVA** — Tipo de conteúdo desejado? |
| 7 | `brand_voice` | Como sua marca deve soar? |

**Padrão único de UI**:
- Chips no topo (clicar **adiciona** texto ao textarea, não substitui).
- `<Textarea>` sempre visível e obrigatório (mín. 10 caracteres p/ avançar).
- Indicador "Salvando…" / "Salvo".

**Auto-save incremental**:
- Persiste em `briefing_requests.form_answers` a cada "Avançar".
- Debounce 1.5s enquanto o usuário digita.
- Toast de erro com retry se falhar.

### 2. `supabase/functions/suggest-briefing/index.ts`

- **Remove** bloco `previous_answers` do prompt.
- Usa **somente** o nicho cadastrado (busca em `client_strategic_contexts.business_niche` via `briefing_requests.user_id`) + `business_context` da pergunta 1.
- Aceita novo parâmetro `question_key` (`audience` | `pain_points` | `differentiators` | `objective` | `content_type` | `voice`).
- Retorna **6-8 chips curtos** (2-5 palavras) específicos da pergunta, 100% aderentes ao nicho.
- System prompt: "Gere sugestões EXCLUSIVAMENTE para o nicho `{business_niche}`. Proibido genérico."

### 3. `supabase/functions/process-briefing/index.ts`

Mapear novos campos do `form_answers` para `client_strategic_contexts`:
- `pain_points` → `pain_points`
- `differentiators` → `differentiators`
- `marketing_objective` → `marketing_objectives`
- `content_type` → entra no prompt p/ gerar `content_strategy`

## O que NÃO muda
- StepIndicator, layout, estrutura de navegação.
- Token público, RLS, schema de `briefing_requests`.
- Disparo do `process-briefing` em background no submit.

## Resultado
1. ✅ Todas as perguntas com textarea obrigatório.
2. ✅ Sugestões 100% aderentes ao nicho.
3. ✅ Zero perda de dados.
4. ✅ Briefing mais completo → melhores roteiros e carrosséis.
