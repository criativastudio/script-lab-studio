

# Sugestões Contextuais Dinâmicas no Briefing

## Problema
Atualmente, a edge function `suggest-briefing` recebe apenas `business_context` (resposta da pergunta 1). As sugestões para as perguntas 2, 3 e 4 são geradas com base apenas nesse texto, ignorando respostas já dadas em etapas anteriores.

## Solução

### 1. Frontend (`src/pages/ClientBriefingForm.tsx`)
- Alterar `fetchAISuggestions` para enviar **todas as respostas acumuladas** até o momento, não apenas `business_context`.
- Chamar a função a cada transição de step (não só no step 0→1), passando o contexto completo das respostas anteriores. Gerar sugestões apenas para os steps restantes.
- Enviar um objeto `{ business_context, previous_answers, current_step }` para a edge function.

### 2. Edge Function (`supabase/functions/suggest-briefing/index.ts`)
- Aceitar `previous_answers` (objeto com as respostas já preenchidas) e `current_step` além de `business_context`.
- Reformular o prompt do sistema para instruir a IA a:
  - Analisar todas as respostas anteriores antes de gerar sugestões
  - Gerar chips contextuais e coerentes com o nicho informado
  - Priorizar perfis de público reais para o produto/serviço
  - Incluir sugestões relacionadas ao público local se houver info de região
  - Sugerir públicos que o cliente talvez não tenha considerado
  - Evitar sugestões genéricas
- Gerar apenas os chips necessários para os steps restantes (ex: se step=2, gerar apenas `outcome_chips` e `voice_chips`).
- O prompt do usuário incluirá um bloco estruturado com todas as respostas anteriores.

### 3. Lógica de chamada no frontend
- No `handleNext`, chamar `fetchAISuggestions` sempre que avançar de step (steps 0→1, 1→2, 2→3), passando as respostas acumuladas.
- Cada chamada atualiza os chips dos steps seguintes com base no contexto mais recente.
- Manter os chips default como fallback enquanto as sugestões carregam ou se a chamada falhar.

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/suggest-briefing/index.ts` | Aceitar `previous_answers` + `current_step`, prompt contextual melhorado |
| `src/pages/ClientBriefingForm.tsx` | Enviar respostas acumuladas a cada transição de step |

