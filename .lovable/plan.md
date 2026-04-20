# Liberar menus admin para usuários comuns com gating por plano

## Objetivo

Hoje os menus **Diagnóstico CRM** e **Configurações** (e suas 4 subpáginas) só aparecem para `isAdmin`. Vou expor esses menus para todos os usuários autenticados e controlar acesso por plano contratado, mantendo "Gerenciar Usuários & Planos" e "Diagnóstico CRM" exclusivos do admin (são funcionalidades de plataforma, não de cliente).

## Matriz de acesso por plano


| Funcionalidade                  | Starter | Creator Pro | Scale Studio | Admin |
| ------------------------------- | ------- | ----------- | ------------ | ----- |
| Dashboard, Clientes, Análises   | ✅       | ✅           | ✅            | ✅     |
| Configurações (hub)             | ✅       | ✅           | ✅            | ✅     |
| └ Ajustes da Interface          | 🔒      | ✅           | ✅            | ✅     |
| └ Personalização de Formulários | 🔒      | 🔒          | ✅            | ✅     |
| └ Personalização de PDFs        | 🔒      | 🔒          | ✅            | ✅     |
| └ Gerenciar Usuários & Planos   | ❌       | ❌           | ❌            | ✅     |
| Diagnóstico CRM                 | ❌       | ❌           | ❌            | ✅     |


- 🔒 = card visível com badge de upgrade; clicar leva para `/checkout/<plano>`
- ❌ = não aparece no menu (admin-only)
- ✅ = acesso liberado

Justificativa: gerenciar usuários da plataforma e gerar leads via diagnóstico público são tarefas operacionais do dono da plataforma, não do cliente pagante. Personalização visual (interface/forms/PDF) é o que faz sentido como diferencial de plano.

## Mudanças

### 1. `src/lib/plan-features.ts` (NOVO)

Centralizar regras de acesso por plano:

```ts
export type Feature = "interface_settings" | "form_settings" | "pdf_settings";
export const FEATURE_MIN_PLAN: Record<Feature, "creator_pro" | "scale_studio"> = {
  interface_settings: "creator_pro",
  form_settings: "creator_pro",
  pdf_settings: "scale_studio",
};
export const PLAN_RANK = { starter: 0, basic: 0, creator_pro: 1, premium: 1, scale_studio: 2 };
export function hasFeatureAccess(plan: string, feature: Feature): boolean { ... }
export function requiredPlanLabel(feature: Feature): string { ... }
```

### 2. `src/components/DashboardLayout.tsx`

- Mover `adminItem` (Configurações) para fora do gating `isAdmin` — fica visível para todos os autenticados.
- Manter `diagnosticItem` apenas para admin (continua como hoje).
- Ordem final do menu para usuário comum: Dashboard → Clientes → Análises → **Configurações**.

### 3. `src/pages/Configuracoes.tsx`

- Mostrar todos os 4 cards para todos os usuários (com filtragem por `adminOnly` mantida só para "Gerenciar Usuários & Planos").
- Cards de Interface, Formulários e PDFs ganham:
  - **Badge de plano requerido** (ex: "Creator Pro", "Scale Studio") quando o usuário não tem acesso.
  - Ícone `Lock` discreto no canto.
  - Ao clicar em card bloqueado, redirecionar para `/checkout/creator_pro` ou `/checkout/scale_studio` (em vez da página de configuração) + toast "Disponível no plano X".
  - Cards desbloqueados navegam normalmente.

### 4. `src/App.tsx` — rotas

Mudar de `adminOnly` para `ProtectedRoute` simples nas 3 rotas de personalização. O gating de plano será feito **dentro** de cada página (server-side check via hook), não na rota:

```diff
- <Route path="/configuracoes" element={<ProtectedRoute adminOnly>...
+ <Route path="/configuracoes" element={<ProtectedRoute>...
- <Route path="/configuracoes/interface" element={<ProtectedRoute adminOnly>...
+ <Route path="/configuracoes/interface" element={<ProtectedRoute>...
- <Route path="/configuracoes/formularios" element={<ProtectedRoute adminOnly>...
+ <Route path="/configuracoes/formularios" element={<ProtectedRoute>...
```

Manter `/configuracoes/usuarios` e `/admin/diagnostico` como `adminOnly`.

### 5. Gating dentro de InterfaceSettings, FormSettings, PdfSettings

No topo de cada página, checar `hasFeatureAccess(plan, "<feature>")`:

- Se sim → renderiza normalmente.
- Se não → renderiza um "paywall" reaproveitando o componente `UpgradePrompt` existente (`src/components/UpgradePrompt.tsx`), com CTA para `/checkout/<plano>`.

Isso impede que um usuário starter acesse digitando a URL diretamente.

### 6. Permissão de admin não-restritiva

Admin vê e usa **tudo**, independente de plano (já garantido pelo `PLAN_RANK` quando combinado com bypass: `if (isAdmin) return true` dentro de `hasFeatureAccess` — passar `isAdmin` como segundo parâmetro opcional, ou checar no caller).

## Arquivos modificados / criados


| Arquivo                              | Mudança                                                                                                               |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `src/lib/plan-features.ts`           | **NOVO** — matriz de features × plano + helpers                                                                       |
| `src/components/DashboardLayout.tsx` | Remover gating `isAdmin` do item Configurações                                                                        |
| `src/pages/Configuracoes.tsx`        | Mostrar todos os cards; bloquear visualmente os sem acesso; redirect para checkout                                    |
| `src/App.tsx`                        | Trocar `adminOnly` por `ProtectedRoute` em `/configuracoes`, `/configuracoes/interface`, `/configuracoes/formularios` |
| `src/pages/InterfaceSettings.tsx`    | Gating no topo via `hasFeatureAccess` + `UpgradePrompt`                                                               |
| `src/pages/FormSettings.tsx`         | Gating no topo via `hasFeatureAccess` + `UpgradePrompt`                                                               |
| `src/pages/PdfSettings.tsx`          | Gating no topo via `hasFeatureAccess` + `UpgradePrompt` (já existe regra Scale Studio — consolidar via helper)        |


## O que NÃO muda

- Schema do banco / RLS (controle é puramente de UX/UI; backend já protege via RLS por `user_id`)
- Páginas Admin (`/configuracoes/usuarios`) e Diagnóstico (`/admin/diagnostico`) continuam admin-only
- Edge functions, limites de uso de geração (clientes/briefings/scripts/mês) — `usePlanLimits` permanece intacto
- Fluxo de checkout existente