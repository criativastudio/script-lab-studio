# Diagnostic Quiz Funnel — 3 Formulários Estratégicos

## Visão Geral

Criar uma página pública `/diagnostico` com menu de 3 quiz funnels focados em posicionamento nas redes sociais. Cada quiz coleta dados de contato, faz perguntas com chips de sugestão (mesmo padrão do `ClientBriefingForm`), chama uma edge function para gerar diagnóstico via IA, e apresenta o resultado com CTA sutil para o especialista.

## Os 3 Diagnósticos

1. **Diagnóstico de Posicionamento** — Avalia como a marca se posiciona nas redes (nicho, diferencial, público)
2. **Diagnóstico de Conteúdo** — Analisa a estratégia de conteúdo atual (frequência, formatos, engajamento)
3. **Diagnóstico de Autoridade** — Mede o nível de autoridade digital (prova social, consistência, percepção)

## Arquivos a criar/editar


| Arquivo                                           | Descrição                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `src/pages/DiagnosticQuiz.tsx`                    | Página principal com menu dos 3 quizzes + fluxo multi-step completo        |
| `supabase/functions/generate-diagnostic/index.ts` | Edge function que recebe respostas e gera diagnóstico personalizado via IA |
| `src/App.tsx`                                     | Adicionar rota pública `/diagnostico` e `/diagnostico/:type`               |


## Estrutura do fluxo (por quiz)

```text
┌─────────────────────┐
│  Menu (3 cards)      │  ← Escolha do diagnóstico
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Step 0: Contato     │  ← Nome, Email, WhatsApp
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Steps 1-4: Perguntas│  ← Chips + textarea, guidance contextual
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Loading IA          │  ← Animação de processamento
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  Resultado           │  ← Diagnóstico + nota + recomendações
│  + CTA Expert sutil  │  ← "Quer aprofundar? Fale com [nome]"
└─────────────────────┘
```

## Detalhes técnicos

### `DiagnosticQuiz.tsx`

- Rota `/diagnostico` mostra 3 cards (posicionamento, conteúdo, autoridade) com ícones e descrições
- Rota `/diagnostico/:type` inicia o quiz selecionado
- Step 0 coleta nome, email, WhatsApp (campos obrigatórios)
- Steps 1-4 são perguntas estratégicas específicas por tipo, com chips de sugestão pré-definidos
- Ao finalizar, chama `supabase.functions.invoke("generate-diagnostic")`
- Exibe resultado com: nota geral (0-10), pontos fortes, pontos fracos, recomendações, e CTA com perfil do especialista
- Salva lead na tabela `leads` existente (já tem `name`, `email`, `phone`, `status`)

### `generate-diagnostic/index.ts`

- Recebe tipo do quiz + respostas + dados de contato
- Não requer auth (público)
- Salva lead na tabela `leads` via service role
- Chama IA com tool calling para retornar: `score` (0-10), `strengths`, `weaknesses`, `recommendations`, `summary`
- Retorna resultado estruturado

### Perguntas por tipo (exemplos)

**Posicionamento**: Qual seu nicho? → Quem é seu público ideal? → Qual seu diferencial? → Como você se apresenta nas redes?

**Conteúdo**: Que tipo de conteúdo você publica? → Com que frequência? → Quais formatos usa? → Qual o maior desafio?

**Autoridade**: Há quanto tempo está nas redes? → Tem prova social? → Que resultados já entregou? → Como educa sua audiência?

### Rotas

- `/diagnostico` — menu público (sem auth)
- `/diagnostico/:type` — quiz específico (posicionamento | conteudo | autoridade)

Cada formulario deve ter um link para o usuario compartilhar nas redes sociais para os leads preencher.