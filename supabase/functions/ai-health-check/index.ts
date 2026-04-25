import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Alert {
  level: "warning" | "critical";
  message: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // --- Auth: require admin ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims } = await supabaseAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub as string | undefined;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- Settings ---
    const { data: settings } = await supabase
      .from("ai_settings")
      .select("monthly_token_quota, warning_threshold_percent")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const threshold = settings?.warning_threshold_percent ?? 80;
    const quota = settings?.monthly_token_quota ?? null;

    // --- Lovable Gateway health check (1 minimal call) ---
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let gateway = {
      status: "error" as "ok" | "rate_limited" | "credits_exhausted" | "error",
      latency_ms: 0,
      last_402_at: null as string | null,
      error_count_24h: 0,
    };

    if (LOVABLE_API_KEY) {
      const t0 = Date.now();
      try {
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [{ role: "user", content: "ping" }],
            max_tokens: 1,
          }),
        });
        gateway.latency_ms = Date.now() - t0;
        if (r.status === 402) gateway.status = "credits_exhausted";
        else if (r.status === 429) gateway.status = "rate_limited";
        else if (r.ok) gateway.status = "ok";
        else gateway.status = "error";

        if (!r.ok) {
          await supabase.from("ai_gateway_errors").insert({
            function_name: "ai-health-check",
            status_code: r.status,
            message: `Health probe ${r.status}`,
          });
        }
      } catch (e) {
        gateway.latency_ms = Date.now() - t0;
        gateway.status = "error";
      }
    }

    // Recent errors
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentErrs } = await supabase
      .from("ai_gateway_errors")
      .select("status_code, occurred_at")
      .gte("occurred_at", dayAgo)
      .order("occurred_at", { ascending: false });

    gateway.error_count_24h = recentErrs?.length ?? 0;
    const last402 = recentErrs?.find((e: any) => e.status_code === 402);
    gateway.last_402_at = last402?.occurred_at ?? null;

    // --- OpenAI direct ---
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const openai = {
      configured: !!OPENAI_API_KEY,
      status: (OPENAI_API_KEY ? "error" : "not_configured") as
        | "ok"
        | "invalid_key"
        | "error"
        | "not_configured",
      organization: null as string | null,
    };

    if (OPENAI_API_KEY) {
      try {
        const r = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        });
        if (r.status === 401) openai.status = "invalid_key";
        else if (r.ok) {
          openai.status = "ok";
          openai.organization = r.headers.get("openai-organization");
        } else openai.status = "error";
      } catch {
        openai.status = "error";
      }
    }

    // --- Usage this month ---
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: usageRows } = await supabase
      .from("usage_logs")
      .select("tokens_used")
      .gte("created_at", monthStart.toISOString());

    const tokensThisMonth = (usageRows || []).reduce(
      (s: number, r: any) => s + (r.tokens_used || 0),
      0,
    );
    const requestsThisMonth = usageRows?.length ?? 0;
    const percentUsed = quota ? Math.round((tokensThisMonth / quota) * 100) : null;

    // --- Alerts ---
    const alerts: Alert[] = [];
    if (gateway.status === "credits_exhausted") {
      alerts.push({
        level: "critical",
        message: "Créditos do Lovable AI Gateway esgotados — adicione fundos em Settings → Workspace → Usage.",
      });
    }
    if (gateway.last_402_at) {
      const mins = Math.round((Date.now() - new Date(gateway.last_402_at).getTime()) / 60000);
      alerts.push({
        level: "critical",
        message: `Erro 402 (créditos esgotados) detectado há ${mins} min nas funções de IA.`,
      });
    }
    if (gateway.status === "rate_limited") {
      alerts.push({
        level: "warning",
        message: "Gateway sinalizou rate-limit. Considere espaçar requisições.",
      });
    }
    if (percentUsed !== null && percentUsed >= 95) {
      alerts.push({
        level: "critical",
        message: `Uso mensal em ${percentUsed}% da cota configurada.`,
      });
    } else if (percentUsed !== null && percentUsed >= threshold) {
      alerts.push({
        level: "warning",
        message: `Uso mensal em ${percentUsed}% — acima do limite de aviso de ${threshold}%.`,
      });
    }
    if (gateway.error_count_24h > 5) {
      alerts.push({
        level: "warning",
        message: `${gateway.error_count_24h} erros do gateway nas últimas 24h.`,
      });
    }
    if (openai.configured && openai.status === "invalid_key") {
      alerts.push({
        level: "critical",
        message: "Chave OpenAI configurada está inválida ou expirada.",
      });
    }

    const result = {
      lovable_gateway: gateway,
      openai_direct: openai,
      usage: {
        tokens_this_month: tokensThisMonth,
        requests_this_month: requestsThisMonth,
        quota_tokens: quota,
        percent_used: percentUsed,
        threshold_warning: threshold,
      },
      alerts,
      checked_at: new Date().toISOString(),
    };

    // Persist last check
    if (settings) {
      await supabase
        .from("ai_settings")
        .update({ last_check_at: result.checked_at, last_check_result: result })
        .eq("warning_threshold_percent", threshold);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("ai-health-check error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
