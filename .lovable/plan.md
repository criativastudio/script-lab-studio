## Objetivo
Limitar a geração de conteúdos a no máximo **12** tanto no "Adicionar Cliente" quanto no "Novo Projeto".

## Mudanças

### 1. `src/lib/editorial-lines.ts`
Reduzir as opções do select removendo 14, 16, 18 e 20:
```ts
export const VIDEO_QUANTITIES = ["1","2","4","6","8","10","12"] as const;
```

### 2. `src/pages/CRM.tsx`
Garantir clamp no `maxVideos` passado para `ClientListView` e para o dialog de Novo Projeto, cobrindo planos com limite alto (ex.: Scale Studio = 9999):
```ts
maxVideos={Math.min(limits.scriptsPerBriefing, 12)}
```

### 3. `supabase/functions/process-briefing/index.ts`
Salvaguarda no backend para nunca processar mais de 12, mesmo se vier valor maior do banco:
```ts
const videoCount = Math.min(br.video_quantity || 3, 12);
```
(usar `videoCount` no prompt em vez de `br.video_quantity`)

## Resultado
- UI mostra no máximo opção "12" nos dois fluxos.
- Backend nunca gera mais que 12, evitando timeouts.
- Sem quebra de dados existentes (clientes antigos com 14–20 continuam salvos, mas o processamento limita a 12).