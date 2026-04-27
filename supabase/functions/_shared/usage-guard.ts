// Shared usage guard module for all AI edge functions
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPlan, getPlanLimits, isUnlimited, normalizePlanId } from "./plans-config.ts";

export { getPlan, getPlanLimits, normalizePlanId, isUnlimited };

/**
 * Validates the JWT in the Authorization header and returns the authenticated user_id.
 * NEVER trust a user_id supplied in the request body — always derive it from the JWT.
 */
export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<{ userId: string; response?: undefined } | { userId?: undefined; response: Response }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
  try {
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabaseAuth.auth.getClaims(token);
    const userId = data?.claims?.sub as string | undefined;
    if (error || !userId) {
      return {
        response: new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }),
      };
    }
    return { userId };
  } catch (_e) {
    return {
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }
}


export type PlanName = "starter" | "creator_pro" | "scale_studio";

export async function getUserPlan(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return normalizePlanId(data?.plan);
}

/** Counts distinct active clients (by business_name) for the user. */
export async function checkClientLimit(supabase: any, userId: string, plan: string): Promise<string | null> {
  const limits = getPlanLimits(plan);
  if (isUnlimited(limits.clients)) return null;
  const { data } = await supabase
    .from("briefing_requests")
    .select("business_name")
    .eq("user_id", userId)
    .eq("is_active", true);
  const unique = new Set((data || []).map((d: any) => (d.business_name || "").trim().toLowerCase()));
  if (unique.size >= limits.clients) {
    return `Limite de ${limits.clients} clientes do plano atingido. Faça upgrade para adicionar mais.`;
  }
  return null;
}

/** Counts active briefing share-links for the user. */
export async function checkBriefingLinkLimit(supabase: any, userId: string, plan: string): Promise<string | null> {
  const limits = getPlanLimits(plan);
  if (isUnlimited(limits.briefingLinks)) return null;
  const { count } = await supabase
    .from("briefing_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);
  if ((count || 0) >= limits.briefingLinks) {
    return `Limite de ${limits.briefingLinks} links de diagnóstico atingido. Faça upgrade para criar mais.`;
  }
  return null;
}

/**
 * Counts filled briefings (leads). When the lead count reaches the plan's
 * `leadsBeforeBlock`, automatically invalidates remaining pending links by
 * setting is_active=false and blocked_by_limit=true so they can be reactivated
 * after an upgrade. Returns an error message if the limit is hit.
 */
export async function checkLeadLimitAndInvalidate(
  supabase: any,
  userId: string,
  plan: string,
): Promise<string | null> {
  const limits = getPlanLimits(plan);
  if (isUnlimited(limits.leadsBeforeBlock)) return null;
  const { count } = await supabase
    .from("briefing_requests")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .neq("status", "pending");
  if ((count || 0) >= limits.leadsBeforeBlock) {
    // Invalidate remaining pending links
    await supabase
      .from("briefing_requests")
      .update({ is_active: false, blocked_by_limit: true })
      .eq("user_id", userId)
      .eq("status", "pending")
      .eq("is_active", true);
    return `Limite de ${limits.leadsBeforeBlock} leads do plano atingido. Links pendentes foram invalidados — faça upgrade para continuar recebendo respostas.`;
  }
  return null;
}

/**
 * Reactivates briefing links previously blocked by limit (called after upgrade).
 */
export async function reactivateBlockedLinks(supabase: any, userId: string): Promise<void> {
  await supabase
    .from("briefing_requests")
    .update({ is_active: true, blocked_by_limit: false })
    .eq("user_id", userId)
    .eq("blocked_by_limit", true);
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

export async function checkMonthlyScripts(supabase: any, userId: string, plan: string): Promise<string | null> {
  const limits = getPlanLimits(plan);
  if (isUnlimited(limits.scriptsPerMonth)) return null;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("scripts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStart.toISOString());
  if ((count || 0) >= limits.scriptsPerMonth) {
    return `Você atingiu o limite mensal de ${limits.scriptsPerMonth} roteiros do seu plano. Faça upgrade para continuar.`;
  }
  return null;
}

export async function checkScriptsPerBriefing(
  supabase: any,
  userId: string,
  briefingId: string,
  plan: string,
): Promise<string | null> {
  const limits = getPlanLimits(plan);
  if (isUnlimited(limits.scriptsPerBriefing)) return null;
  const { count } = await supabase
    .from("scripts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("project_id", briefingId);
  if ((count || 0) >= limits.scriptsPerBriefing) {
    return `Limite de ${limits.scriptsPerBriefing} roteiros por briefing atingido. Faça upgrade para gerar mais.`;
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

export async function recordGatewayError(
  supabase: any,
  functionName: string,
  statusCode: number,
  message?: string,
): Promise<void> {
  try {
    await supabase.from("ai_gateway_errors").insert({
      function_name: functionName,
      status_code: statusCode,
      message: message ?? null,
    });
  } catch (e) {
    console.error("Failed to record gateway error:", e);
  }
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

  if (generationType === "script") {
    const monthlyScriptsErr = await checkMonthlyScripts(supabase, userId, plan);
    if (monthlyScriptsErr) {
      return new Response(JSON.stringify({ error: monthlyScriptsErr }), {
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
