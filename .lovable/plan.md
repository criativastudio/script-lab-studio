

# Tipo de Conteúdo + Estilo no "Novo Projeto"

## Objetivo

No diálogo **Novo Projeto** (CRM > Projetos), adicionar:
1. **Tipo de Conteúdo** (obrigatório): Roteiro ou Carrossel
2. **Estilo de Conteúdo** (seletor com 18 opções pré-definidas)

E propagar essas escolhas para a IA, garantindo geração personalizada, natural e adaptada ao estilo escolhido — sem perder a fidelidade ao nicho nem a lógica "Conecta-Entretém-Vende" já implementadas.

## Mudanças no Frontend

### `src/components/crm/ProjectsTab.tsx`

Substituir o campo livre `Estilo de Conteúdo` (Input de texto) por:

- **Tipo de Conteúdo** *(obrigatório)* — `Select` com:
  - Roteiro (vídeo)
  - Carrossel (Instagram)
- **Estilo de Conteúdo** — `Select` com 18 opções:
  Engraçado, Sério, Educativo, Inspiracional, Curioso, Polêmico, Irônico, Bastidores, Narrativo, Minimalista, UGC, Nostálgico, Empático, Técnico, Urgente, Interativo, Reflexivo, Aspiracional.

Botão "Criar Projeto" desabilitado enquanto `project_name` ou `content_type` estiverem vazios.

### `src/pages/CRM.tsx`

- Estender o `newProjectForm` com `content_type: ""` e manter `content_style` como string do enum.
- Em `handleCreateProject`, salvar os dois novos campos em `briefing_requests.form_answers` (JSON) — sem migration, pois `form_answers` já é `jsonb` livre:
  ```ts
  form_answers: {
    ...(first.form_answers || {}),
    content_type: newProjectForm.content_type,
    content_style: newProjectForm.content_style,
  }
  ```

## Mudanças nas Edge Functions

### `supabase/functions/process-briefing/index.ts`

- Ler `answers.content_type` e `answers.content_style` do `form_answers`.
- Injetar no `systemPrompt` um bloco dinâmico:
  ```text
  TIPO DE CONTEÚDO ALVO: {Roteiro|Carrossel}
  ESTILO DE CONTEÚDO: {estilo selecionado}
  
  Adapte tom, ritmo, vocabulário e exemplos a este estilo
  sem perder profissionalismo, fidelidade ao nicho e a
  lógica Conecta-Entretém-Vende.
  ```
- Quando `content_type === "Carrossel"`, instruir a IA a gerar os scripts no formato de slides (S1–S6) em vez de roteiro de vídeo. Quando `Roteiro`, manter o formato atual.

### `supabase/functions/manual-generate/index.ts`, `generate-script/index.ts`, `generate-carousel/index.ts`

- Aceitar dois novos campos opcionais no body: `content_type` e `content_style`.
- Quando presentes, injetar o mesmo bloco dinâmico no `systemPrompt` (mantendo fidelidade ao nicho + Conecta-Entretém-Vende).
- `manual-generate` e `generate-script` recebem `content_style` do formulário/projeto e ajustam tom.
- `generate-carousel` usa `content_style` para ajustar o tom dos slides.

### Em `CRM.tsx > handleManualGenerate` e `handleGenerateWithAgent`

Repassar `content_type` e `content_style` (lidos de `project.form_answers`) para as edge functions correspondentes.

## Regras de Geração reforçadas no prompt

Bloco fixo a adicionar ao `systemPrompt` (junto ao bloco existente de Conecta-Entretém-Vende):

```text
REGRAS DE PERSONALIZAÇÃO POR ESTILO (OBRIGATÓRIAS):
- Adapte tom e ritmo ao estilo selecionado.
- Linguagem natural, humana e estratégica — proibido tom robótico.
- Use exemplos reais do contexto do público do nicho.
- Foque em retenção, conexão e clareza.
- Ajuste o tom sem perder profissionalismo.
- Estilo é uma camada de tom, não substitui fidelidade ao nicho
  nem a lógica Conecta-Entretém-Vende.
```

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/crm/ProjectsTab.tsx` | Trocar Input de estilo por Select de 18 opções; adicionar Select de Tipo (Roteiro/Carrossel) |
| `src/pages/CRM.tsx` | Estender `newProjectForm`, salvar em `form_answers`, repassar para functions |
| `supabase/functions/process-briefing/index.ts` | Ler e injetar `content_type` + `content_style` no prompt |
| `supabase/functions/manual-generate/index.ts` | Aceitar e injetar os 2 campos no prompt |
| `supabase/functions/generate-script/index.ts` | Aceitar e injetar `content_style` no prompt |
| `supabase/functions/generate-carousel/index.ts` | Aceitar e injetar `content_style` no prompt |

## O que NÃO muda

- Schema do banco (uso de `form_answers` jsonb existente — sem migration).
- Schemas das tool calls da IA.
- Regra de Fidelidade ao Nicho e lógica Conecta-Entretém-Vende.
- UI do restante do CRM.

