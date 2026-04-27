## Objetivo

Refinar a estrutura já centralizada de planos com os novos limites exatos, copy persuasiva e validações solicitadas. Preços (Free / R$ 67 / R$ 97) já estão corretos — o foco agora é **ajustar limites, features, copy e bloqueios**.

## Estado atual (já implementado)

- Fonte única: `src/config/plans.ts` + `supabase/functions/_shared/plans-config.ts`.
- Coluna `briefing_requests.blocked_by_limit` criada.
- `usage-guard.ts` com `checkClientLimit`, `checkBriefingLinkLimit`, `checkLeadLimitAndInvalidate`, `reactivateBlockedLinks`.
- Checkout, LandingPage, CRM e UpgradePrompt já consomem a config central.

## 1. Ajustar limites na config central

`src/config/plans.ts` e `supabase/functions/_shared/plans-config.ts` (espelho):


| Limite                         | Starter | Creator Pro   | Scale Studio           |
| ------------------------------ | ------- | ------------- | ---------------------- |
| `clients`                      | 3       | 20            | 100                    |
| `briefings` (mensal)           | 3       | 25            | **200** (cap interno)  |
| `scriptsPerBriefing`           | 3       | **12**        | 9999                   |
| `scriptsPerMonth` (novo campo) | **9**   | 25 × 12 = 300 | **3000** (cap interno) |
| `briefingLinks` ativos         | 3       | 20            | Infinity               |
| `leadsBeforeBlock`             | 3       | 20            | Infinity               |
| `monthlyTokens`                | 120k    | 900k          | 4M                     |


Observação: Scale Studio comunica "ilimitado" no marketing, mas backend faz cap em 200 briefings + 3000 roteiros/mês.

## 2. Atualizar copy e features (frontend)

`src/config/plans.ts` — atualizar `description` e `features` de cada plano.

### Starter (FREE)

- **Description**: "Teste o poder da criação estratégica antes de escalar."
- **Features** (todas as funcionalidades do Scale com limites baixos):
  - Até 3 clientes cadastrados
  - Até 3 briefings estratégicos completos
  - 3 roteiros por briefing (total 9)
  - Até 3 captações via link de diagnóstico
  - Persona, tom de voz, posicionamento e funil
  - Ganchos virais e templates
  - Suporte Reels, TikTok, YouTube e Ads
  - Acesso completo (com limites) a todas as features do Scale Studio

### Creator Pro — `R$ 67/mês` · destaque "⭐ Mais recomendado"

- **Description**: "Crie conteúdo estratégico de forma consistente e profissional."
- **Features**:
  - Até 20 clientes
  - 25 briefings/mês
  - Até 12 roteiros por projeto
  - Definição de persona e tom de voz
  - Estratégia de funil e ganchos virais
  - Templates de roteiro avançados
  - Suporte Reels, TikTok, YouTube e Ads
  - Até 20 captações via link de diagnóstico

### Scale Studio — `R$ 97/mês` · badge "Profissional · Para escalar"

- **Description**: "Escale sua produção com inteligência e organização profissional."
- **Features**:
  - Até 100 clientes
  - Briefings ilimitados
  - Roteiros ilimitados
  - Geração em lote
  - Biblioteca de persona e marca
  - Calendário de conteúdo
  - Workspace em equipe
  - Organização por campanhas
  - Links de diagnóstico ilimitados

## 3. Validações de bloqueio

### Frontend (`src/pages/CRM.tsx`)

Já valida `clients`, `briefingLinks` e `leadsBeforeBlock` antes de criar registro. Adicionar:

- Validação de `scriptsPerBriefing` no fluxo de geração (CRM e Dashboard ContentGenerator) — bloquear botão "Gerar roteiro" quando o briefing já alcançou o limite, com `<UpgradePrompt>`.

### Backend

- `checkLeadLimitAndInvalidate` já invalida links automaticamente — manter.
- Adicionar `checkScriptsPerBriefingLimit(supabase, userId, briefingId, plan)` em `usage-guard.ts` e chamar em `generate-script` e `manual-generate`.
- Adicionar `checkMonthlyScriptsLimit(supabase, userId, plan)` (Scale: 3000, Pro: 300, Starter: 9) em `runGuards` quando `generationType === "script"`.
- `checkMonthlyBriefings` já existe; ajustar `briefings` no plans-config (Scale = 200).

## 4. Reativação no upgrade

Já implementado: `process-payment` chama `reactivateBlockedLinks` ao confirmar plano superior. Sem mudanças.

## 5. Arquivos a editar

- `src/config/plans.ts` — limites + copy + features.
- `supabase/functions/_shared/plans-config.ts` — espelhar limites (incluir `scriptsPerMonth`).
- `src/hooks/usePlanLimits.ts` — adicionar `getScriptsInBriefingCount(briefingId)` e `getMonthlyScriptCount` já existe; expor `scriptsPerMonth` no `limits`.
- `supabase/functions/_shared/usage-guard.ts` — novos guards `checkScriptsPerBriefingLimit` e `checkMonthlyScriptsLimit`; integrar em `runGuards`.
- `supabase/functions/generate-script/index.ts` e `manual-generate/index.ts` — chamar novo guard com `briefingId`.
- `src/components/dashboard/ContentGenerator.tsx` e `src/pages/CRM.tsx` — bloquear UI quando `scriptsPerBriefing` atingido.
- `src/pages/LandingPage.tsx` — não muda código (consome `PLANS.features`); apenas validar visual.

## 6. Sem migração de banco

Todas as mudanças são em config + lógica. A coluna `blocked_by_limit` já existe.

## Resultado

- Limites exatos solicitados aplicados em frontend + backend a partir de 1 arquivo.
- Copy persuasiva alinhada à proposta de cada plano.
- Geração de roteiro bloqueada quando briefing atinge limite, com CTA de upgrade.
- Scale Studio comunica "ilimitado" mas com cap interno de 200 briefings / 3000 roteiros/mês.