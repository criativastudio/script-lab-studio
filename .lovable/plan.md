## Diagnóstico da lentidão

A geração leva 2-3 min porque o `_shared/ai-fallback.ts` está usando `**google/gemini-2.5-pro**` como modelo primário com `max_tokens=12000`. O Pro é o modelo mais lento da família Gemini — foi escolhido na correção anterior para resolver `MALFORMED_FUNCTION_CALL`, mas é exagerado para esta tarefa.

Confirmado nos logs: o último `process-briefing` da Criativa Studio levou **~130s** (timestamp 1777135776 → 1777135907) só na chamada da IA, gerando 20 scripts.

Outros gargalos secundários:

- `process-briefing` é síncrono → o usuário fica bloqueado esperando o `await` no front.
- `manual-generate` também usa o mesmo Pro com 8000 tokens.
- Não há streaming nem feedback de progresso.

## Plano de otimização (sem perder qualidade)

### 1. Trocar modelo primário para `google/gemini-3-flash-preview`

- **Arquivo**: `supabase/functions/_shared/ai-fallback.ts`
- Substituir `google/gemini-2.5-pro` por `google/gemini-3-flash-preview` (3-5x mais rápido, mantém qualidade alta para tool calling estruturado).
- Manter fallback automático para `gemini-2.5-pro` (em caso de MALFORMED) e depois OpenAI `gpt-4o-mini` — ordem: Flash → Pro → OpenAI.
- Reduzir `maxTokens` padrão de 8000 → 4000 (suficiente para 3-5 roteiros; quem precisa de mais passa explícito).

### 2. Ajustar `process-briefing`

- Reduzir `maxTokens` de 12000 → 6000 (cada roteiro consome ~400 tokens; 6000 cobre 10+ roteiros confortavelmente).
- Adicionar instrução no system prompt: "Seja conciso e direto — evite repetições e explicações redundantes."

### 3. Ajustar `manual-generate`

- Mesma troca de modelo via `ai-fallback`.
- Reduzir `maxTokens` para 5000.

### 4. Feedback visual no front (UX)

- **Arquivo**: `src/pages/CRM.tsx` (handler `handleCreateProject` e `handleGenerateWithAgent`)
- Adicionar toast com progresso estimado ("Gerando conteúdo estratégico... isso leva ~30s").
- Mostrar skeleton/loader no card do projeto enquanto está em `processing`.

### 5. Recovery (opcional, se quiser velocidade extrema)

- Tornar `process-briefing` "fire-and-forget" no `ClientBriefingForm`: usuário vê tela de sucesso imediato, função roda em background, dashboard faz polling no `status`. **Não incluir nesta rodada** a menos que aprovado — muda a arquitetura.

### 6. Recovery (opcional, se quiser velocidade extrema)

- Tornar `process-briefing` "fire-and-forget" no `ClientBriefingForm`: usuário vê tela de sucesso imediato, função roda em background, dashboard faz polling no `status`. **Não incluir nesta rodada** a menos que aprovado — muda a arquitetura.

&nbsp;

## Resultado esperado

- Geração de briefing+roteiros: **130s → ~25-40s**
- Geração manual no CRM: **60-90s → ~15-25s**
- Sem perda de qualidade (Gemini 3 Flash Preview é o modelo recomendado padrão da Lovable AI).

## Arquivos a editar

- `supabase/functions/_shared/ai-fallback.ts`
- `supabase/functions/process-briefing/index.ts`
- `supabase/functions/manual-generate/index.ts`
- `src/pages/CRM.tsx` (toast/feedback)