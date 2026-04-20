export type Feature = "interface_settings" | "form_settings" | "pdf_settings";

export const FEATURE_MIN_PLAN: Record<Feature, "creator_pro" | "scale_studio"> = {
  interface_settings: "creator_pro",
  form_settings: "scale_studio",
  pdf_settings: "scale_studio",
};

export const PLAN_RANK: Record<string, number> = {
  starter: 0,
  basic: 0,
  creator_pro: 1,
  premium: 1,
  scale_studio: 2,
};

const PLAN_LABELS: Record<string, string> = {
  creator_pro: "Creator Pro",
  scale_studio: "Scale Studio",
};

export function hasFeatureAccess(plan: string | null | undefined, feature: Feature, isAdmin = false): boolean {
  if (isAdmin) return true;
  const userRank = PLAN_RANK[plan || "starter"] ?? 0;
  const requiredRank = PLAN_RANK[FEATURE_MIN_PLAN[feature]] ?? 0;
  return userRank >= requiredRank;
}

export function requiredPlanFor(feature: Feature): "creator_pro" | "scale_studio" {
  return FEATURE_MIN_PLAN[feature];
}

export function requiredPlanLabel(feature: Feature): string {
  return PLAN_LABELS[FEATURE_MIN_PLAN[feature]] || FEATURE_MIN_PLAN[feature];
}

export function planLabel(plan: string): string {
  return PLAN_LABELS[plan] || plan;
}
