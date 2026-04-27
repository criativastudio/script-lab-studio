# Remover menções a roteiros por briefing dos planos

## Objetivo
Limpar as descrições dos planos removendo menções à quantidade de roteiros por briefing e roteiros por projeto, já que esses limites são gerenciados internamente e exibidos no momento do uso (CRM, geração de conteúdo).

## Arquivos a modificar

### 1. `src/config/plans.ts`
- **Starter**: Remover `"3 roteiros por briefing (total de 9)"` da lista de features.
- **Creator Pro**: Remover `"Até 12 roteiros por briefing"` da lista de features.
- **Scale Studio**: Remover `"Roteiros ilimitados"` da lista de features (já fica implícito em "Briefings ilimitados" + a experiência do produto).

### 2. `src/pages/LandingPage.tsx`
- Nenhuma mudança direta necessária — as features vêm de `src/config/plans.ts` via `PLANS` import.

### 3. `src/pages/Checkout.tsx`
- Nenhuma mudança direta necessária — as features vêm de `src/config/plans.ts` via `PLAN_CONFIGS`.

## Resumo
Apenas o arquivo `src/config/plans.ts` precisa ser editado. As landing page e checkout já consomem as features dinamicamente a partir desse arquivo centralizado.
