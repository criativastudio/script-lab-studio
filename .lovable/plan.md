## Diagnóstico

Os logs do Edge Function confirmam o erro real:

```
finish_reason: "error"
native_finish_reason: "MALFORMED_FUNCTION_CALL"
usage: { prompt_tokens: 0, completion_tokens: 0 }
```

**3 chamadas seguidas** ao `process-briefing` falharam com **0 tokens consumidos** — o `google/gemini-2.5-flash` está rejeitando o tool schema antes mesmo de gerar resposta. Isso explica o "Edge Function returned non-2xx" e a tela travada.

### Duas funções com problemas distintos

| Função | Quando usado | Problema |
|---|---|---|
| `process-briefing` | Cliente envia formulário público | `gemini-2.5-flash` retorna MALFORMED em 100% — schema com array de 7 campos obrigatórios é complexo demais |
| `manual-generate` | Botão "Criar Projeto" no card do cliente | Usa `gemini-3-flash-preview` (modelo experimental instável) **e** tem `additionalProperties: false` (proibido em function calling do Gemini) |

## Plano de correção

### 1. `supabase/functions/manual-generate/index.ts`
- **Trocar modelo**: `google/gemini-3-flash-preview` → `google/gemini-2.5-pro` (mais confiável para function calling complexo)
- **Remover `additionalProperties: false`** do schema (linhas 185 e 190) — comprovadamente causa MALFORMED_FUNCTION_CALL no Gemini
- **Adicionar fallback automático para OpenAI** quando o Lovable Gateway retornar erro estrutural (já temos `OPENAI_API_KEY` configurada)
- **Adicionar `recordGatewayError`** para rastrear no painel Admin

### 2. `supabase/functions/process-briefing/index.ts`
- **Trocar modelo**: `google/gemini-2.5-flash` → `google/gemini-2.5-pro` (resolve MALFORMED em schemas complexos)
- **Adicionar fallback OpenAI** com mesmo schema quando o Gateway falhar 2× seguidas
- **Reduzir prompt**: o systemPrompt tem ~3000 chars, vou consolidar regras críticas mantendo qualidade
- **Aumentar `max_tokens`** para 12000 (Pro suporta mais)

### 3. Helper compartilhado de fallback (`supabase/functions/_shared/ai-fallback.ts` — novo)
- Função `callAIWithFallback(messages, tools, options)` que:
  1. Tenta Lovable Gateway (Gemini 2.5 Pro)
  2. Se falhar com MALFORMED ou 5xx → tenta OpenAI (`gpt-4o-mini` com mesmas tools)
  3. Registra erro de cada tentativa via `recordGatewayError`
- Reusa em `process-briefing`, `manual-generate`, `generate-script`, `generate-carousel`

### 4. UX no `src/pages/CRM.tsx`
- O botão "Criar Projeto" mostra erro mas **não permite retry direto**. Adicionar:
  - Mensagem clara: "Geração em andamento... isso pode levar até 60s"
  - Botão "Tentar novamente" no toast de erro (que invoca `manual-generate` de novo)
  - Não fechar o modal até confirmar sucesso ou falha definitiva

### 5. Reprocessar briefings travados
Os briefings recentes "Criativa Studio - Maio 2026" e "Vonixx" continuam em `submitted` sem persona/project. Após o fix, disparar manualmente o `process-briefing` para destravar.

## Arquivos afetados

- `supabase/functions/manual-generate/index.ts` — trocar modelo, remover `additionalProperties`, fallback
- `supabase/functions/process-briefing/index.ts` — trocar modelo, fallback, prompt mais enxuto
- `supabase/functions/_shared/ai-fallback.ts` — **NOVO** helper compartilhado
- `src/pages/CRM.tsx` — UX de retry no botão "Criar Projeto"

## Por que isso resolve

1. **`gemini-2.5-pro`** lida bem com function calling complexo (testado pelo Lovable Gateway docs)
2. **Remoção de `additionalProperties`** elimina a causa #1 documentada de MALFORMED_FUNCTION_CALL no Gemini
3. **Fallback OpenAI** garante que mesmo se o Gateway falhar, o usuário recebe conteúdo
4. **UX melhorada** evita o "tela preta" — usuário sempre sabe o que está acontecendo
5. **Sem mudanças de schema** no banco — toda infra (RLS, tabelas, retry) já existe

Aprove para eu implementar.