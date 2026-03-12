

# Ajustar Prompt do Gerador de Carrosséis — Headlines Curtas + Conectores

## Problema

O prompt atual da edge function `generate-carousel` pede "texto curto e direto" nos slides S2-S5 mas não impõe limite de palavras nem estrutura headline + conector. O resultado são parágrafos explicativos em vez de frases de impacto.

## Alteração

### `supabase/functions/generate-carousel/index.ts`

**1. System prompt (linhas 84-100)** — Substituir regras de texto por:

```
- Cada slide tem APENAS: uma HEADLINE/HOOK forte (máx 6-8 palavras) + um TEXTO CONECTOR curto (máx 4-6 palavras).
- PROIBIDO parágrafos, explicações ou frases longas.
- Headline = frase de impacto que gera curiosidade ou quebra de crença.
- Conector = frase curta que liga ao próximo slide.
```

**2. User prompt do modo script (linhas 139-150)** — Substituir estrutura por:

```
ESTRUTURA OBRIGATÓRIA (6 slides):
S1 – HOOK: Gancho que interrompe o scroll. Máx 8 palavras.
S2 – PROBLEMA: Dor específica do público. Máx 8 palavras headline + 6 palavras conector.
S3 – SOLUÇÃO: Promessa clara. Máx 8 palavras headline + 6 palavras conector.
S4 – PROVA: Resultado ou dado concreto. Máx 8 palavras headline + 6 palavras conector.
S5 – MÉTODO: Passo simples e direto. Máx 8 palavras headline + 6 palavras conector.
S6 – CTA: Chamada para ação direta. Máx 8 palavras headline + 6 palavras conector.

Para cada slide gere: headline (máx 8 palavras), conector (máx 6 palavras), sugestão visual e alt text.
```

**3. Tool schema (linhas 160-172)** — Adicionar campo `headline` e renomear `text` para `connector`:

```typescript
properties: {
  slide_number: { type: "number" },
  slide_label: { type: "string" },
  headline: { type: "string", description: "Frase de impacto do slide (máx 8 palavras)" },
  connector: { type: "string", description: "Texto conector curto (máx 6 palavras)" },
  visual_suggestion: { type: "string" },
  alt_text: { type: "string" },
},
required: ["slide_number", "slide_label", "headline", "connector", "visual_suggestion", "alt_text"],
```

Remove `art_text` (redundante com headline).

### `src/pages/CarouselGenerator.tsx`

Atualizar a interface `SlideData` e a renderização dos slides para usar `headline` + `connector` em vez de `text` + `art_text`. Exibir headline em destaque e conector em fonte menor abaixo.

### `src/components/dashboard/ContentGenerator.tsx`

Atualizar `renderCarouselResult` e `buildScriptText` para usar os novos campos `headline` e `connector`.

### Redeploy

A edge function precisa ser redeployada após a alteração.

## Arquivos

| Arquivo | Alteração |
|---|---|
| `supabase/functions/generate-carousel/index.ts` | Prompt + schema: headlines curtas, conectores, estrutura S1-S6 |
| `src/pages/CarouselGenerator.tsx` | Interface + render com headline/connector |
| `src/components/dashboard/ContentGenerator.tsx` | Render + PDF com headline/connector |

