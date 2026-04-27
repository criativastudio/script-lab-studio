/**
 * SINGLE SOURCE OF TRUTH for all plan data.
 *
 * All prices, limits, naming and upgrade paths are defined here.
 * Frontend uses this file directly; backend mirrors it in
 * `supabase/functions/_shared/plans-config.ts` (keep both in sync).
 *
 * To change a price or limit, change ONLY this file (and its backend mirror).
 */

export type PlanId = "starter" | "creator_pro" | "scale_studio";

export interface PlanLimits {
  /** Max distinct clients the user can register */
  clients: number;
  /** Max active briefing share-links the user can have at once */
  briefingLinks: number;
  /** Number of leads (filled briefings) that triggers blocking + invalidation */
  leadsBeforeBlock: number;
  /** Max scripts/contents per single briefing */
  scriptsPerBriefing: number;
  /** Max scripts the user can generate per month (overall cap) */
  scriptsPerMonth: number;
  /** Monthly token budget for AI generations */
  monthlyTokens: number;
  /** Monthly briefings cap */
  briefings: number;
}

export interface PlanConfig {
  id: PlanId;
  /** Marketing name */
  name: string;
  /** Numeric price in BRL (0 = free) */
  price: number;
  /** Display label, e.g. "R$ 67/mês" or "Grátis" */
  priceLabel: string;
  /** Short tagline */
  description: string;
  /** Plan checkout slug used in /checkout/:plan URLs */
  checkoutSlug: string;
  /** Whether to render with featured/highlight styling */
  highlight: boolean;
  /** Optional badge text on the plan card */
  badge?: string;
  /** Feature bullets shown on landing pricing card */
  features: string[];
  /** Plan to upgrade to when limits are hit (null = top tier) */
  upgradeTo: PlanId | null;
  limits: PlanLimits;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 0,
    priceLabel: "Grátis",
    description: "Teste o poder da criação estratégica antes de escalar.",
    checkoutSlug: "starter",
    highlight: false,
    features: [
      "Até 3 clientes cadastrados",
      "Até 3 briefings estratégicos completos",
      "Até 3 captações via link de diagnóstico",
      "Persona, tom de voz, posicionamento e funil",
      "Ganchos virais e templates de roteiro",
      "Suporte para Reels, TikTok, YouTube e Ads",
      "Acesso completo às features do Scale Studio (com limites)",
    ],
    upgradeTo: "creator_pro",
    limits: {
      clients: 3,
      briefingLinks: 3,
      leadsBeforeBlock: 3,
      scriptsPerBriefing: 3,
      scriptsPerMonth: 9,
      monthlyTokens: 120_000,
      briefings: 3,
    },
  },
  creator_pro: {
    id: "creator_pro",
    name: "Creator Pro",
    price: 67,
    priceLabel: "R$ 67/mês",
    description: "Crie conteúdo estratégico de forma consistente e profissional.",
    checkoutSlug: "creator-pro",
    highlight: true,
    badge: "⭐ Mais recomendado",
    features: [
      "Até 20 clientes",
      "25 briefings/mês",
      "Definição de persona e tom de voz",
      "Estratégia de funil e ganchos virais",
      "Templates de roteiro avançados",
      "Suporte para Reels, TikTok, YouTube e Ads",
      "Até 20 captações via link de diagnóstico",
    ],
    upgradeTo: "scale_studio",
    limits: {
      clients: 20,
      briefingLinks: 20,
      leadsBeforeBlock: 20,
      scriptsPerBriefing: 12,
      scriptsPerMonth: 300,
      monthlyTokens: 900_000,
      briefings: 25,
    },
  },
  scale_studio: {
    id: "scale_studio",
    name: "Scale Studio",
    price: 97,
    priceLabel: "R$ 97/mês",
    description: "Escale sua produção com inteligência e organização profissional.",
    checkoutSlug: "scale-studio",
    highlight: false,
    badge: "Profissional · Para escalar",
    features: [
      "Até 100 clientes",
      "Briefings ilimitados",
      "Roteiros ilimitados",
      "Geração em lote",
      "Biblioteca de persona e marca",
      "Calendário de conteúdo",
      "Workspace em equipe",
      "Organização por campanhas",
      "Links de diagnóstico ilimitados",
    ],
    upgradeTo: null,
    limits: {
      clients: 100,
      briefingLinks: Number.POSITIVE_INFINITY,
      leadsBeforeBlock: Number.POSITIVE_INFINITY,
      scriptsPerBriefing: 9999,
      scriptsPerMonth: 3000,
      monthlyTokens: 4_000_000,
      briefings: 200,
    },
  },
};

/** Ordered list (used for landing pricing & admin selects) */
export const PLAN_ORDER: PlanId[] = ["starter", "creator_pro", "scale_studio"];

/** Aliases — legacy plan keys that may still exist in the DB */
const PLAN_ALIASES: Record<string, PlanId> = {
  basic: "starter",
  premium: "creator_pro",
};

export function normalizePlanId(plan: string | null | undefined): PlanId {
  if (!plan) return "starter";
  if (plan in PLANS) return plan as PlanId;
  return PLAN_ALIASES[plan] ?? "starter";
}

export function getPlan(plan: string | null | undefined): PlanConfig {
  return PLANS[normalizePlanId(plan)];
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return getPlan(plan).limits;
}

export function getUpgradePlan(plan: string | null | undefined): PlanConfig | null {
  const next = getPlan(plan).upgradeTo;
  return next ? PLANS[next] : null;
}

/** Resolves a checkout URL slug ("creator-pro") back to the canonical id */
export function planFromCheckoutSlug(slug: string): PlanId | null {
  const found = PLAN_ORDER.find((id) => PLANS[id].checkoutSlug === slug);
  return found ?? null;
}

export function isUnlimited(value: number): boolean {
  return !Number.isFinite(value);
}

export function formatLimit(value: number): string {
  return isUnlimited(value) ? "Ilimitado" : String(value);
}
