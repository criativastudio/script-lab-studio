// Shared usage guard module for all AI edge functions

export const PLAN_LIMITS: Record<string, {
  briefings: number;
  scriptsPerBriefing: number;
  ratePerMin: number;
  dailyLimit: number;
  monthlyTokens: number;
}> = {
  starter:      { briefings: 5,   scriptsPerBriefing: 4,  ratePerMin: 2,  dailyLimit: 10,  monthlyTokens: 120000 },
  basic:        { briefings: 5,   scriptsPerBriefing: 4,  ratePerMin: 2,  dailyLimit: 10,  monthlyTokens: 120000 },
  creator_pro:  { briefings: 60,  scriptsPerBriefing: 6,  ratePerMin: 5,  dailyLimit: 80,  monthlyTokens: 900000 },
  premium:      { briefings: 60,  scriptsPerBriefing: 6,  ratePerMin: 5,  dailyLimit: 80,  monthlyTokens: 900000 },
  scale_studio: { briefings: 250, scriptsPerBriefing: 10, ratePerMin: 10, dailyLimit: 400, monthlyTokens: 4000000 },
};

export type PlanName = keyof typeof PLAN_LIMITS;

export async function getUserPlan(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data?.plan || "starter";
}

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
}

export async function checkRateLimit(supabase: any, userId: string, plan: string): Promise<string | null> {
  const limits = getPlanLimits(plan);
  const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", oneMinAgo);
  if ((count || 0) >= limits.ratePerMin) {
    return "Muitas requisições. Aguarde alguns segundos e tente novamente.";
  }
  return null;
}

export async function checkDailyLimit(supabase: any, userId: string, plan: string): Promise<string | null> {
  const limits = getPlanLimits(plan);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart.toISOString());
  if ((count || 0) >= limits.dailyLimit) {
    return "Você atingiu o limite diário de gerações. Tente novamente amanhã.";
  }
  return null;
}

export async function checkMonthlyBriefings(supabase: any, userId: string, plan: string): Promise<string | null> {
  const limits = getPlanLimits(plan);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("generation_type", "briefing")
    .gte("created_at", monthStart.toISOString());
  if ((count || 0) >= limits.briefings) {
    return "Você atingiu o limite mensal de briefings do seu plano. Faça upgrade para continuar.";
  }
  return null;
}

export async function checkMonthlyTokenBudget(supabase: any, userId: string, plan: string): Promise<string | null> {
  const limits = getPlanLimits(plan);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { data } = await supabase
    .from("usage_logs")
    .select("tokens_used")
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString());
  const totalTokens = (data || []).reduce((sum: number, r: any) => sum + (r.tokens_used || 0), 0);
  if (totalTokens >= limits.monthlyTokens) {
    return "Você atingiu o limite mensal de gerações do seu plano. Faça upgrade para continuar.";
  }
  return null;
}

export async function checkCache(supabase: any, promptHash: string): Promise<any | null> {
  const { data } = await supabase
    .from("generation_cache")
    .select("response_data")
    .eq("prompt_hash", promptHash)
    .gt("expires_at", new Date().toISOString())
    .single();
  return data?.response_data || null;
}

export async function saveCache(supabase: any, promptHash: string, functionName: string, responseData: any): Promise<void> {
  await supabase.from("generation_cache").upsert({
    prompt_hash: promptHash,
    function_name: functionName,
    response_data: responseData,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: "prompt_hash" });
}

export async function logUsage(
  supabase: any,
  userId: string,
  functionName: string,
  generationType: string,
  tokensUsed: number,
  promptHash?: string,
): Promise<void> {
  await supabase.from("usage_logs").insert({
    user_id: userId,
    function_name: functionName,
    generation_type: generationType,
    tokens_used: tokensUsed,
    prompt_hash: promptHash || null,
  });
}

export async function hashPrompt(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export function validateInputLength(
  fields: Record<string, string | undefined | null>,
  maxLen: number = 2000,
  longFields: string[] = [],
  longMaxLen: number = 4000,
): string | null {
  for (const [key, value] of Object.entries(fields)) {
    if (!value) continue;
    const limit = longFields.includes(key) ? longMaxLen : maxLen;
    if (value.length > limit) {
      return `O campo "${key}" excede o limite de ${limit} caracteres.`;
    }
  }
  return null;
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for Portuguese
  return Math.ceil(text.length / 4);
}

// Run all guards in sequence. Returns error response or null if all pass.
export async function runGuards(
  supabase: any,
  userId: string,
  generationType: "briefing" | "script",
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const plan = await getUserPlan(supabase, userId);

  const rateErr = await checkRateLimit(supabase, userId, plan);
  if (rateErr) {
    return new Response(JSON.stringify({ error: rateErr }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const dailyErr = await checkDailyLimit(supabase, userId, plan);
  if (dailyErr) {
    return new Response(JSON.stringify({ error: dailyErr }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (generationType === "briefing") {
    const monthlyErr = await checkMonthlyBriefings(supabase, userId, plan);
    if (monthlyErr) {
      return new Response(JSON.stringify({ error: monthlyErr }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const tokenErr = await checkMonthlyTokenBudget(supabase, userId, plan);
  if (tokenErr) {
    return new Response(JSON.stringify({ error: tokenErr }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return null;
}
