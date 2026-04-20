

# Refinar Novo Projeto: Linha Editorial multi-select + Quantidade ampliada

## 1. Mudanças no formulário (`ProjectsTab.tsx` — diálogo Novo Projeto)

### a) **Tipo de Conteúdo** (obrigatório) — sem mudança
Mantém `Roteiro` / `Carrossel` (já existe).

### b) **Linha Editorial** (NOVO — multi-select, obrigatório com fallback Automático)
Substitui o atual `Etapa do Funil` (3 opções) por um seletor visual de **chips clicáveis multi-seleção** com 12 opções:

> Autoridade, Educação, Conexão, Storytelling, Prova, Bastidores, Solução de Problemas, Posicionamento, Conversão, Topo de Funil, Meio de Funil, Fundo de Funil

- Botão extra no topo: **"Automático (IA define)"** — quando ativo, limpa todas as seleções e a IA decide com base no briefing. É o **default**.
- UI: grid `grid-cols-2 md:grid-cols-3 gap-2` com `Toggle`/`Badge` clicáveis (variant outline → default quando selecionado). Indicador "X selecionadas" ou "Automático".
- Estado: `editorial_lines: string[]` no `newProjectForm` (default `[]` = automático).

### c) **Estilo de Conteúdo** (expandido, opcional)
Atualizar a lista de 18 para incluir **todas** as opções pedidas (atualmente faltam algumas reordenações; lista final):

> Engraçado, Sério, Educativo, Inspiracional, Curioso, Polêmico, Irônico, Narrativo, Minimalista, UGC, Nostálgico, Empático, Técnico, Urgente, Interativo, Reflexivo, Aspiracional, Bastidores

Mantém `Select` de seleção única (já implementado).

### d) **Quantidade de Conteúdos** (expandido)
Substituir as 5 opções atuais (`1, 3, 5, 10, 15`) pela lista pedida:

> 1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20

Mantém validação contra `maxVideos` do plano.

### e) Remover campo redundante
Remover o campo separado **"Etapa do Funil"** — agora as 3 etapas (Topo/Meio/Fundo de Funil) vivem dentro de Linha Editorial. `funnel_stage` permanece no payload por retrocompat: se o usuário marcar uma das 3 etapas, derivamos `funnel_stage` ("top"/"middle"/"bottom") automaticamente; senão fica `""`.

## 2. Persistência (`CRM.tsx` → `handleCreateProject`)

`form_answers` mesclado ganha:

```ts
{
  content_type,
  content_style,
  campaign_objective,
  funnel_stage,                  // derivado
  publishing_frequency,
  editorial_lines: string[],     // NOVO — array das linhas escolhidas, [] = automático
  editorial_mode: "auto" | "manual",
}
```

Reset do form e prop drilling de/para `ProjectsTab` ajustados para incluir `editorial_lines`.

## 3. Edge Functions (prompts adaptados)

Em `process-briefing`, `manual-generate` e `generate-script`, dentro do bloco **REGRAS DE PERSONALIZAÇÃO POR ESTILO**, injetar nova seção:

```
LINHA EDITORIAL (estratégia / objetivo do conteúdo):
- Modo: ${editorial_mode === "auto" ? "AUTOMÁTICO — você decide a melhor combinação com base no briefing, persona e momento do funil" : "MANUAL — use exclusivamente: " + editorial_lines.join(", ")}
- Distribua os ${video_quantity} conteúdos equilibrando as linhas escolhidas (no modo manual) ou siga jornada Topo→Meio→Fundo proporcional (no modo auto).
- Linha editorial = OBJETIVO. Estilo = FORMA. Combine ambos sem que um anule o outro.
- Foco obrigatório: retenção (primeiros 3s), conexão (identificação com a persona) e conversão (CTA orgânico).
- Linguagem natural, específica do nicho — proibido genérico/IA-óbvio.
```

Funções tocadas:
- `supabase/functions/process-briefing/index.ts`
- `supabase/functions/manual-generate/index.ts`
- `supabase/functions/generate-script/index.ts`

Todas leem `editorial_lines`/`editorial_mode` de `form_answers` (process-briefing) ou do body (manual-generate, generate-script).

## 4. Memória de aprendizado

`process-briefing` e `manual-generate` já gravam tópicos em `client_content_memory`. Adicionar `editorial_line` como categoria para o sistema rastrear distribuição e evitar repetição (campo `category` já existe na tabela — usar a linha editorial escolhida pela IA).

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/crm/ProjectsTab.tsx` | Novo grid de chips multi-select para Linha Editorial + botão Automático; remover Select de Funil; expandir options de Quantidade; sincronizar `funnel_stage` derivado |
| `src/pages/CRM.tsx` | `newProjectForm` ganha `editorial_lines: []` e `editorial_mode: "auto"`; reset/handleCreateProject persistem em `form_answers` |
| `supabase/functions/process-briefing/index.ts` | Ler e injetar bloco LINHA EDITORIAL no system prompt |
| `supabase/functions/manual-generate/index.ts` | Aceitar `editorial_lines`/`editorial_mode` e injetar bloco no prompt |
| `supabase/functions/generate-script/index.ts` | Aceitar `editorial_lines`/`editorial_mode` e injetar bloco no prompt |

## O que NÃO muda

- Schema do banco (tudo em `form_answers` jsonb — sem migration)
- Tipo de Conteúdo, Estilo, Frequência, Nome, Plano de limites
- Edge functions de Hooks, Carrossel direto e Ideias (estas usam project context já populado)
- Validação `maxVideos` do plano

