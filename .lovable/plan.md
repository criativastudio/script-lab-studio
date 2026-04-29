## Causa raiz do bug

Investiguei o fluxo "Gerar Roteiro / Carrossel" (`ContentGenerator.tsx` → `manual-generate` / `generate-carousel`) e identifiquei **três causas convergentes**:

### 1. Edge Functions falhando no deploy (mesmo bug do `generate-hooks`)
9 funções ainda importam `https://deno.land/std@0.168.0/http/server.ts`, que está causando `SUPABASE_CODEGEN_ERROR` por timeout de bundling (10s). Entre elas estão **as duas funções chamadas pelo botão "Gerar"**:
- `manual-generate` (roteiro/briefing)
- `generate-script`
- E mais 7: `generate-ideas`, `generate-diagnostic`, `strategic-analysis`, `score-script`, `process-briefing`, `suggest-briefing`, `retry-pending-briefings`.

Quando a função falha em deploy, `supabase.functions.invoke` retorna erro não-JSON. O `catch` lê `err.message` (pode ser `undefined`), o toast não aparece direito e o usuário fica olhando o spinner "Gerando..." → percepção de **travamento**.

### 2. Sem `ErrorBoundary` global → tela preta
Não existe nenhum `ErrorBoundary` no projeto (`rg ErrorBoundary src/` retorna vazio). Qualquer erro de renderização derruba a árvore React inteira mostrando tela preta até o refresh.

### 3. Renderização do score sem proteção
Em `ContentGenerator.tsx` linha 607:
```tsx
{result.score.total.toFixed(1)}/10
```
Se a edge function retorna `score` parcial (por ex. retry de otimização sem `total`), `total` fica `undefined` e `.toFixed` lança `TypeError` → tela preta. Mesma fragilidade em `SCRIPT_CATEGORY_META[result.category]?.label` quando categoria vem com valor desconhecido.

---

## Plano de correção

### A) Migrar todas as edge functions para `Deno.serve` nativo
Remover o import `serve from deno.land/std@0.168.0/http/server.ts` em **9 funções** e trocar `serve(handler)` → `Deno.serve(handler)`. Resolve o `SUPABASE_CODEGEN_ERROR` em massa e garante que `manual-generate` / `generate-script` voltem a deployar.

Arquivos:
- `supabase/functions/manual-generate/index.ts`
- `supabase/functions/generate-script/index.ts`
- `supabase/functions/generate-ideas/index.ts`
- `supabase/functions/generate-diagnostic/index.ts`
- `supabase/functions/strategic-analysis/index.ts`
- `supabase/functions/score-script/index.ts`
- `supabase/functions/process-briefing/index.ts`
- `supabase/functions/suggest-briefing/index.ts`
- `supabase/functions/retry-pending-briefings/index.ts`

### B) Criar `ErrorBoundary` global
Novo arquivo `src/components/ErrorBoundary.tsx`:
- Captura erros de render filhos.
- Mostra fallback com botão "Tentar novamente" (reset do state) e "Recarregar página".
- Loga `error` + `componentStack` no console.

Envolver o `<Routes>` em `App.tsx` com o `ErrorBoundary`. Isso elimina definitivamente a "tela preta" — qualquer crash futuro mostra tela amigável com retry.

### C) Renderização defensiva no `ContentGenerator.tsx`
- Score: usar `Number(result.score?.total ?? 0).toFixed(1)` e só renderizar o bloco se `typeof result.score?.total === "number"`.
- Categoria: fallback de label `SCRIPT_CATEGORY_META[result.category as ScriptCategory]?.label ?? result.category ?? "—"`.
- Validation: `Object.entries(result.validation ?? {})`.

### D) Tratamento de erro robusto no `handleGenerate`
- Timeout client-side de 90s no `supabase.functions.invoke` via `Promise.race` — se exceder, mostra toast "A geração demorou demais, tente novamente" e libera o spinner.
- Normalizar mensagem de erro: `const msg = err?.message || err?.error || "Falha desconhecida ao gerar conteúdo. Tente novamente."`.
- Garantir `setLoading(false)` em `finally` (já existe — manter).
- Adicionar `try/catch` ao redor do `supabase.from("scripts").insert` que ocorre depois — se o insert falhar, não derrubar o resultado nem travar a UI; apenas avisar via toast secundário.

### E) Pequenas blindagens em `ScriptGenerator.tsx`
- `data?.error || error?.message || "Erro desconhecido"` no toast (já é parecido — apenas garantir ordem segura).
- Loading state liberado em `finally`.

---

## Resultado esperado

- Botões "Gerar Roteiro" e "Gerar Carrossel" voltam a funcionar em todos os planos (free e pagos), porque as edge functions deixam de falhar no deploy.
- Mesmo que a IA retorne payload inesperado, o componente não trava nem mostra tela preta — exibe o que veio e ignora campos faltantes.
- Qualquer erro de render futuro é capturado pelo `ErrorBoundary` com opção de retry sem refresh.
- Click → loading visível → resposta ou erro tratado dentro de no máximo 90s.

## Diagrama do fluxo corrigido

```text
[Usuário clica Gerar]
        │
        ▼
[handleGenerate] ──▶ valida limites
        │
        ▼
[invoke edge fn] ──── Promise.race(timeout 90s)
        │
   ┌────┴────┐
   ▼         ▼
[sucesso]  [erro/timeout]
   │           │
   ▼           ▼
[setResult] [toast amigável + setLoading(false)]
   │
   ▼
[Render no Dialog]
   │ (qualquer crash aqui)
   ▼
[ErrorBoundary fallback] ──▶ [Retry] ou [Recarregar]
```
