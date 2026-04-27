## Objetivo

Centralizar preços e limites em uma única fonte de verdade, atualizar valores (Free / R$ 67 / R$ 97), destacar Creator Pro, e implementar bloqueio + invalidação de links de briefing ao atingir limite de leads.

## Esclarecimentos de escopo

- **"Links de diagnóstico" = links de briefing público** gerados pelo CRM (tabela `briefing_requests`, campo `token`, página `/briefing/:token`). O quiz público `/diagnostico` é uma página única de captação geral, não conta como link por usuário.
- **"Leads" = registros em `briefing_requests`** preenchidos pelo cliente final (status diferente de `pending`).

## 1. Fonte única de verdade (centralização)

Criar `src/config/plans.ts` (frontend) e `supabase/functions/_shared/plans-config.ts` (backend) — mesmo conteúdo, exportado em ambos os runtimes:

```ts
export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 0,
    priceLabel: "Grátis",
    highlight: false,
    limits: {
      clients: 3,
      briefingLinks: 3,        // total de briefing_requests ativos
      leadsBeforeBlock: 3,     // leads que travam novos links
      scriptsPerBriefing: 3,
      monthlyTokens: 120000,
    },
    upgradeTo: "creator_pro",
  },
  creator_pro: {
    id: "creator_pro",
    name: "Creator Pro",
    price: 67,
    priceLabel: "R$ 67/mês",
    highlight: true,            // destaque "Mais recomendado"
    limits: {
      clients: 20,
      briefingLinks: 20,
      leadsBeforeBlock: 20,
      scriptsPerBriefing: 10,
      monthlyTokens: 900000,
    },
    upgradeTo: "scale_studio",
  },
  scale_studio: {
    id: "scale_studio",
    name: "Scale Studio",
    price: 97,
    priceLabel: "R$ 97/mês",
    highlight: false,
    badge: "Profissional para escala",
    limits: {
      clients: 100,
      briefingLinks: Infinity,
      leadsBeforeBlock: Infinity,
      scriptsPerBriefing: 9999,
      monthlyTokens: 4000000,
    },
    upgradeTo: null,
  },
} as const;
```

Todos os arquivos abaixo passam a importar dessa fonte — remoção de literais espalhados.

## 2. Arquivos atualizados

### Frontend
- `src/config/plans.ts` — **NOVO** (config central + helpers `getPlan`, `getPlanLimits`, `formatPrice`).
- `src/lib/plan-features.ts` — manter, mas alinhar `PLAN_RANK`.
- `src/hooks/usePlanLimits.ts` — passar a ler de `PLANS`. Adicionar `getBriefingLinkCount()` (count de `briefing_requests` ativos) e `getLeadCount()` (briefings preenchidos).
- `src/pages/LandingPage.tsx` — remover array `plans` literal, mapear `PLANS`. Aplicar destaque visual (borda/glow) em Creator Pro com badge "Mais recomendado", e badge secundário "Profissional para escala" em Scale Studio.
- `src/pages/Checkout.tsx` — remover `PLANS` local; usar central. Atualizar `priceLabel`, totais e textos.
- `src/components/UpgradePrompt.tsx` — aceitar prop `targetPlan` opcional; CTA dinâmico via `upgradeTo` do plano atual.
- `src/components/admin/ChangePlanDialog.tsx` — `PLAN_OPTIONS` lido de `PLANS`.
- `src/pages/CRM.tsx` — antes de criar cliente: validar `clients`. Antes de criar briefing/link: validar `briefingLinks` e `leadsBeforeBlock`. Em ambos os casos, bloquear com toast + `<UpgradePrompt>`.

### Backend
- `supabase/functions/_shared/plans-config.ts` — **NOVO** (espelho da config).
- `supabase/functions/_shared/usage-guard.ts` — `PLAN_LIMITS` deletado; importar de `plans-config.ts`. Adicionar:
  - `checkClientLimit(supabase, userId, plan)` — conta clientes únicos.
  - `checkBriefingLinkLimit(supabase, userId, plan)` — conta `briefing_requests` com `is_active=true`.
  - `checkLeadLimitAndInvalidate(supabase, userId, plan)` — se `leads >= leadsBeforeBlock`, faz `UPDATE briefing_requests SET is_active=false WHERE user_id=? AND status='pending'` e retorna erro.
- `supabase/functions/process-payment/index.ts` — `planConfig` lido de `plans-config.ts` (valores 67 / 97).
- `supabase/functions/process-briefing/index.ts` — chamar `checkLeadLimitAndInvalidate` antes de processar.
- `supabase/functions/create-user/index.ts` — usar config central para plano default.

## 3. Posicionamento visual

- **Creator Pro**: card central elevado, borda lavanda (`#cbacef`), badge "⭐ Mais recomendado" no topo, botão CTA com `rainbow-button`.
- **Scale Studio**: badge "Profissional · Para escalar" em peach (`#f5cea5`), estilo sóbrio.
- **Starter**: card neutro, CTA "Começar grátis".

## 4. Lógica de bloqueio + invalidação

Quando `leads >= leadsBeforeBlock`:
1. Frontend (`CRM.tsx`): desabilitar botão "Novo Link/Briefing" com tooltip + render `<UpgradePrompt>` apontando para `upgradeTo`.
2. Backend (`process-briefing`, criação de briefing): retornar 403 com mensagem padronizada.
3. **Invalidação**: trigger no banco OU executado no edge function ao detectar limite — `UPDATE briefing_requests SET is_active=false WHERE user_id=? AND status='pending'`. Página `/briefing/:token` já checa `is_active` (verificar e adicionar guard se faltar).

Ao fazer upgrade (webhook Asaas confirma plano), reativar links: `UPDATE briefing_requests SET is_active=true WHERE user_id=?` (apenas se anteriormente bloqueados por limite — adicionar coluna `blocked_by_limit boolean default false` para rastrear).

## 5. Migração de banco

```sql
ALTER TABLE briefing_requests
ADD COLUMN blocked_by_limit boolean NOT NULL DEFAULT false;
```

Sem alteração nos planos existentes em `subscriptions` (chaves `starter`/`creator_pro`/`scale_studio` já em uso).

## 6. Validações

| Ação | Frontend | Backend |
|---|---|---|
| Criar cliente | `usePlanLimits.getClientCount()` vs `limits.clients` | `checkClientLimit` em edge function de criação (se houver) ou validar no insert via RLS+trigger |
| Criar link de briefing | `getBriefingLinkCount()` vs `limits.briefingLinks` | `checkBriefingLinkLimit` no `process-briefing` |
| Receber novo lead | n/a | Após insert de lead, `checkLeadLimitAndInvalidate` dispara invalidação |

## 7. Ordem de implementação

1. Criar `src/config/plans.ts` + `supabase/functions/_shared/plans-config.ts`.
2. Migration: coluna `blocked_by_limit`.
3. Refatorar `usage-guard.ts`, `usePlanLimits.ts`, `plan-features.ts` para ler da config.
4. Atualizar `LandingPage.tsx`, `Checkout.tsx`, `process-payment` com novos preços.
5. Implementar checagens de cliente/links em `CRM.tsx` + edge functions.
6. Implementar invalidação automática + reativação no upgrade.
7. Atualizar `UpgradePrompt`, `ChangePlanDialog`, banners.
8. Deploy edge functions afetadas.

## Resultado

- Um único arquivo controla preços e limites — alterações futuras em 1 lugar.
- Preços corretos (Free / R$ 67 / R$ 97) em landing, checkout e Asaas.
- Creator Pro visualmente destacado.
- Limites de clientes e links aplicados; ao atingir leads, links são invalidados automaticamente e usuário vê CTA de upgrade.