# Geração estruturada de roteiros por categoria

Adicionar 3 categorias selecionáveis na geração de roteiros, cada uma com estrutura, regras de gancho/CTA/inserção de produto próprias, validação automática e score interno (0–10) com auto-otimização.

## 1. Nova taxonomia (front + back compartilhada)

Criar `src/lib/script-categories.ts` (e cópia em `supabase/functions/_shared/script-categories.ts`) com:

- `SCRIPT_CATEGORIES = ["trafego_pago", "engajamento_viral", "comercial_profissional"]`
- Labels PT-BR + descrição curta + ícone sugerido para a UI.
- `AUDIENCE_TEMPERATURE = ["frio", "morno", "quente"]` (usado só em Tráfego Pago).
- `FUNNEL_STAGES = ["topo", "meio", "fundo"]`.
- `VOICE_TONES = ["popular", "profissional", "premium"]`.

## 2. UI — Seleção da categoria antes de gerar

**`src/components/dashboard/ContentGenerator.tsx`** (modal "Gerador de Conteúdo")

Quando `contentType` for `roteiro` ou `briefing_roteiro`, exibir um novo bloco "Categoria do Roteiro" com 3 cards selecionáveis:

```text
[ Tráfego Pago ]   [ Engajamento / Viral ]   [ Comercial Profissional ]
   conversão            retenção                autoridade
```

Campos adicionais condicionais (todos opcionais — defaults inferidos do contexto estratégico do cliente quando vazios):

- Objetivo: `conversão | engajamento | posicionamento` (auto-preenchido pela categoria, editável).
- Etapa do funil: `topo | meio | fundo`.
- Tom de voz: `popular | profissional | premium`.
- Apenas para Tráfego Pago: Temperatura do público `frio | morno | quente`.

Esses valores entram no `body` da chamada para `manual-generate` / `generate-script` como:
`script_category`, `script_objective`, `funnel_stage`, `voice_tone`, `audience_temperature`.

**`src/pages/ScriptGenerator.tsx`** (gerador legado): adicionar o mesmo seletor de categoria + objetivo + funil + tom (sem temperatura como obrigatório).

**`src/pages/CRM.tsx`** (geração a partir de ideia/projeto): adicionar `script_category` ao payload — se já existir `funnel_stage` no projeto, usar como default.

## 3. Backend — `supabase/functions/generate-script/index.ts`

### 3.1 Aceitar novos campos no body
`script_category`, `script_objective`, `funnel_stage`, `voice_tone`, `audience_temperature`.

Default: se ausente, derivar de `project.funnel_stage` / contexto. Categoria default = `engajamento_viral`.

### 3.2 Builder de prompt por categoria

Criar `buildCategoryPrompt(category, { objective, funnel_stage, voice_tone, audience_temperature })` que retorna um bloco a ser injetado no `systemPrompt` (substitui/complementa o `ADVERTISING_STRUCTURE_GUIDE` quando aplicável):

- **TRÁFEGO PAGO** — estrutura: Gancho direto (dor/promessa) → Problema específico → Promessa → Prova → Oferta → CTA forte. Regras por temperatura: frio = dor + curiosidade; morno = benefício + prova; quente = urgência + CTA direto. Inserção de produto: direta. CTA: explícito.
- **ENGAJAMENTO / VIRALIZAÇÃO** — estrutura: Gancho curioso/polêmico → Quebra de expectativa → Loop aberto → Micro-recompensas → Final interativo/inesperado. Regras: priorizar retenção, criar lacunas de curiosidade, evitar venda direta, produto sutil. CTA: interação (comentar/salvar/compartilhar). Storytelling obrigatório.
- **COMERCIAL PROFISSIONAL** — estrutura: Abertura institucional → Apresentação da marca → Problema de mercado → Solução → Diferenciais → Fechamento autoridade + CTA leve. Inserção: estratégica. CTA: institucional. Linguagem refinada.

### 3.3 Regras globais injetadas
Bloco fixo `GLOBAL_RULES` com mapeamentos de gancho, tom de voz, storytelling, inserção de produto, CTA — conforme spec.

### 3.4 Tool calling expandido
Estender o tool `generate_strategic_script` com novos campos:

- `script_category` (enum)
- `audience_target` (objeto: `dor`, `desejo`, `nivel_consciencia`)
- `objective` (enum)
- `funnel_stage` (enum)
- `internal_score` (objeto): `clareza`, `impacto_gancho`, `retencao`, `conversao`, `total` (0–10 cada)
- `validation`: `gancho_forte_3s` (bool), `clareza_curiosidade_ok` (bool), `texto_curto_30s` (bool), `foco_resultado` (bool)
- Mantém `hook`, `strategic_briefing`, `video_structure`, `speaking_script`, `cta`, `recording_style`, `content_category`.

### 3.5 Auto-revisão (loop server-side)
Após 1ª geração:
- Se `internal_score.total < 8` (média) **ou** alguma flag de `validation` for `false`, fazer **1 segunda chamada** ao gateway pedindo "REWRITE_OPTIMIZE" — mesmo tool, recebendo o output anterior + score como contexto e instrução para corrigir os pontos fracos. Limite: 1 retry para conter custo.
- Anexar score final + flags na resposta JSON (`responseData.score`, `responseData.validation`).

### 3.6 Mesmo tratamento em `manual-generate`
`supabase/functions/manual-generate/index.ts` deve repassar os novos campos ao prompt interno (adaptar igual). Se não usar tool calling, adicionar instrução de auto-validação no system prompt.

## 4. Exibição do score na UI

Em `ContentGenerator.tsx` e no `ScriptViewer`, mostrar um pequeno card após geração:
- Badge da categoria.
- 4 barras (clareza/impacto/retenção/conversão) + score total.
- Lista das flags de validação (✓/✗).

## 5. Persistência

Adicionar coluna opcional na tabela `scripts`: `category text`, `score jsonb`, `validation jsonb` (migration). Usar em `client_content_memory` o campo `content_category` já existente para refletir a categoria escolhida.

## 6. Arquivos a criar / editar

Criar:
- `src/lib/script-categories.ts`
- `supabase/functions/_shared/script-categories.ts`
- migration: adicionar `category`, `score`, `validation` em `public.scripts`

Editar:
- `src/components/dashboard/ContentGenerator.tsx` (seletor + payload + exibição score)
- `src/pages/ScriptGenerator.tsx` (seletor + payload)
- `src/pages/CRM.tsx` (passar `script_category` quando gerar do projeto)
- `src/components/ScriptViewer.tsx` (renderizar score/categoria)
- `supabase/functions/generate-script/index.ts` (builder por categoria, tool expandido, retry de otimização, persistência)
- `supabase/functions/manual-generate/index.ts` (mesmos campos)

## 7. Detalhes técnicos

- Modelo permanece `google/gemini-3-flash-preview`; retry de otimização também.
- `internal_score.total` = média aritmética arredondada.
- Limite de 1 retry; se ainda < 8, retornar mesmo assim com flag `optimization_attempted: true`.
- Default de categoria mantém compatibilidade com chamadas existentes (sem categoria = `engajamento_viral`, sem retry forçado).
- Cache key (`hashPrompt`) deve incluir os novos campos para não devolver cache "cego".
