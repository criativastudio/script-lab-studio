

# Camada Estratégica de Roteiro Publicitário

## Objetivo

Adicionar uma camada complementar ao prompt da edge function `generate-script` para que os roteiros gerados sigam a estrutura visual de blocos (CENA 1 – HOOK até CENA 6 – CTA), com controle de duração, variação de tom, inserção estratégica do produto e direção de cena. A lógica atual (3 camadas de contexto, memory blocks, tone instructions, schema da function call) é **preservada integralmente**.

## Onde alterar

Apenas **`supabase/functions/generate-script/index.ts`**. Nenhum outro arquivo é tocado — schema do banco, UI, hooks, fluxo de geração e cache continuam idênticos.

## O que muda no prompt

### 1. Novo bloco `ADVERTISING_STRUCTURE_GUIDE` (constante no topo do arquivo)

Texto compacto (aprox. 60 linhas, ~700 tokens) injetado no `systemPrompt` **após** as instruções de tom existentes, contendo:

- **Estrutura visual obrigatória em 6 cenas** com formato fixo:
  ```
  [CENA N – NOME]
  • Objetivo: ...
  • Visual: ...
  • Fala: ...
  • Intenção: ...
  ```
- **Regras de duração** (15s / 30s / 60s / 90s) com mapeamento de quantas cenas usar e onde cortar.
- **Variação de tom** (Cômico / Profissional / Sério) — mapeada a partir do `communication_style` já existente no contexto estratégico, sem campo novo.
- **Inserção estratégica do produto** (solução, piada ou gatilho — nunca forçado).
- **Direção de cena** (enquadramento, movimento, expressão) como sugestão obrigatória dentro de "Visual".

### 2. Lógica de duração

A função já recebe `video_duration` no body. Acrescentar um helper local `getDurationProfile(duration)` que retorna instrução curta como:
- `"15 segundos"` → "Use apenas CENA 1 (Hook) + CENA 4 (Punchline) + CENA 5 (Produto). Máximo impacto."
- `"30 segundos"` → "Estrutura completa resumida. Ritmo rápido. Falas curtas."
- `"60 segundos"` → "6 cenas completas. Contexto + payoff."
- `"90 segundos" / "3 minutos" / "5+ minutos"` → "Narrativa estendida. Maior construção emocional."

Esse perfil é injetado no `userPrompt` próximo ao `target_audience`.

### 3. Aplicação condicional

O guia de estrutura publicitária é injetado **somente quando**:
- `content_type` for `roteiro` (ou ausente — default), OU
- a `platform` for de vídeo curto (Reels, TikTok, Shorts).

Para `content_type === "carrossel"` ou outros formatos não-vídeo, **nada muda** — o prompt segue exatamente como hoje. Isso evita poluir geradores que não são publicitários.

### 4. Schema da function call

O schema `generate_strategic_script` permanece idêntico (campos `script`, `hook`, `scenes`, etc.). A IA já produz texto estruturado em `script` — o novo guia apenas instrui o **formato visual** desse texto, não muda o JSON de saída. `ScriptViewer.tsx` continua parseando normalmente porque o regex de cenas (`sectionPatterns`) já reconhece "CENA N".

## Detalhes técnicos

| Item | Decisão |
|---|---|
| Tokens adicionais | ~700 tokens fixos, só quando aplicável |
| Cache | `hashPrompt` continua válido — prompts diferentes geram hashes diferentes naturalmente |
| Modo legacy (linha 406+) | Recebe versão **simplificada** do guia (sem camadas de contexto), pois é fallback |
| Compatibilidade reversa | Roteiros antigos no banco não são afetados; só novas gerações usam a estrutura |
| `communication_style` | Reaproveitado para escolher tom (Cômico/Profissional/Sério) — sem nova coluna |

## O que NÃO muda

- UI do `ScriptGenerator.tsx`, `ContentGenerator.tsx`, `CRM.tsx`
- Tabela `scripts`, `client_strategic_contexts`, `briefing_requests`
- `ScriptViewer` (parser já compatível com `[CENA N – NOME]`)
- Sistema de Viral Score, Hook Generator, Carousel Generator
- Auth, RLS, usage guards, plan limits

## Resultado esperado

Roteiros gerados pelo agente passam a vir com blocos visuais limpos no formato:

```
[CENA 1 – HOOK]
• Visual: close no rosto da personagem em choque
• Fala: "Ninguém te contou isso ainda."
• Intenção: curiosidade imediata

[CENA 2 – SITUAÇÃO]
...
```

Pronto para leitura rápida em set de gravação, com retenção, humor e CTA já embutidos conforme duração e tom escolhidos.

