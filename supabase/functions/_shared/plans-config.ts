/**
 * Backend mirror of src/config/plans.ts.
 * KEEP IN SYNC with the frontend file.
 */

export type PlanId = "starter" | "creator_pro" | "scale_studio";

export interface PlanLimits {
  clients: number;
  briefingLinks: number;
  leadsBeforeBlock: number;
  scriptsPerBriefing: number;
  scriptsPerMonth: number;
  monthlyTokens: number;
  // Backend-only operational caps.
  ratePerMin: number;
  dailyLimit: number;
  briefings: number; // monthly briefing creations
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  price: number;
  checkoutSlug: string;
  upgradeTo: PlanId | null;
  limits: PlanLimits;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 0,
    checkoutSlug: "starter",
    upgradeTo: "creator_pro",
    limits: {
      clients: 3,
      briefingLinks: 3,
      leadsBeforeBlock: 3,
      scriptsPerBriefing: 3,
      scriptsPerMonth: 9,
      monthlyTokens: 120_000,
      ratePerMin: 2,
      dailyLimit: 10,
      briefings: 3,
    },
  },
  creator_pro: {
    id: "creator_pro",
    name: "Creator Pro",
    price: 67,
    checkoutSlug: "creator-pro",
    upgradeTo: "scale_studio",
    limits: {
      clients: 20,
      briefingLinks: 20,
      leadsBeforeBlock: 20,
      scriptsPerBriefing: 12,
      scriptsPerMonth: 300,
      monthlyTokens: 900_000,
      ratePerMin: 5,
      dailyLimit: 80,
      briefings: 25,
    },
  },
  scale_studio: {
    id: "scale_studio",
    name: "Scale Studio",
    price: 97,
    checkoutSlug: "scale-studio",
    upgradeTo: null,
    limits: {
      clients: 100,
      briefingLinks: Number.POSITIVE_INFINITY,
      leadsBeforeBlock: Number.POSITIVE_INFINITY,
      scriptsPerBriefing: 9999,
      scriptsPerMonth: 3000,
      monthlyTokens: 4_000_000,
      ratePerMin: 10,
      dailyLimit: 400,
      briefings: 200,
    },
  },
};

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

export function planFromCheckoutSlug(slug: string): PlanId | null {
  const ids: PlanId[] = ["starter", "creator_pro", "scale_studio"];
  return ids.find((id) => PLANS[id].checkoutSlug === slug) ?? null;
}

export function isUnlimited(value: number): boolean {
  return !Number.isFinite(value);
}
