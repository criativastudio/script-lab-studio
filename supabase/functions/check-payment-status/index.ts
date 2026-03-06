import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    const asaasBaseUrl = Deno.env.get("ASAAS_BASE_URL") || "https://sandbox.asaas.com/api/v3";

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: payment } = await adminClient
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!payment) {
      return new Response(JSON.stringify({ status: "NOT_FOUND" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let mappedStatus = payment.status?.toUpperCase() || "PENDING";

    if (payment.asaas_subscription_id && asaasApiKey) {
      try {
        const res = await fetch(`${asaasBaseUrl}/subscriptions/${payment.asaas_subscription_id}`, {
          headers: { "access_token": asaasApiKey },
        });
        if (res.ok) {
          const sub = await res.json();
          const statusMap: Record<string, string> = {
            ACTIVE: "ACTIVE",
            EXPIRED: "REJECTED",
            INACTIVE: "REJECTED",
          };
          mappedStatus = statusMap[sub.status] || "PENDING";

          // Update payment status in DB
          if (mappedStatus === "ACTIVE" && payment.status !== "active") {
            await adminClient.from("payments").update({ status: "active", paid_at: new Date().toISOString() }).eq("id", payment.id);
          }
        }
      } catch (e) {
        console.error("Asaas status check error:", e);
      }
    }

    return new Response(JSON.stringify({
      status: mappedStatus,
      plan: payment.plan,
      subscriptionId: payment.asaas_subscription_id,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Check payment status error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
