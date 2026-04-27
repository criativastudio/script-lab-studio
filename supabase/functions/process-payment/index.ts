import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PLANS, planFromCheckoutSlug } from "../_shared/plans-config.ts";
import { reactivateBlockedLinks } from "../_shared/usage-guard.ts";

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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const asaasApiKey = Deno.env.get("ASAAS_API_KEY");
    const asaasBaseUrl = Deno.env.get("ASAAS_BASE_URL") || "https://sandbox.asaas.com/api/v3";

    if (!asaasApiKey) {
      return new Response(JSON.stringify({ error: "Configuração de pagamento não disponível" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify JWT
    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { userId, plan, cpf, billingName, whatsapp, cep, endereco, numero, complemento, bairro, cidade, estado, cardHolderName, cardNumber, expiryMonth, expiryYear, cvv } = body;

    // Verify userId matches JWT
    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: "Usuário não autorizado" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate plan via single source of truth
    const planId = planFromCheckoutSlug(plan);
    const planConfigCentral = planId ? PLANS[planId] : null;
    if (!planConfigCentral || planConfigCentral.price <= 0) {
      return new Response(JSON.stringify({ error: "Plano inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const selectedPlan = { value: planConfigCentral.price, name: planConfigCentral.name };

    // Sanitize
    const cleanCpf = (cpf || "").replace(/\D/g, "");
    const cleanCard = (cardNumber || "").replace(/\s/g, "");
    const cleanPhone = (whatsapp || "").replace(/\D/g, "");

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check existing Asaas customer
    const { data: existingUser } = await adminClient.from("users").select("asaas_customer_id").eq("id", userId).single();

    let customerId = existingUser?.asaas_customer_id;

    if (!customerId) {
      // Create Asaas customer
      const customerRes = await fetch(`${asaasBaseUrl}/customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "access_token": asaasApiKey },
        body: JSON.stringify({
          name: billingName,
          cpfCnpj: cleanCpf,
          email: user.email,
          mobilePhone: cleanPhone,
          postalCode: (cep || "").replace(/\D/g, ""),
          address: endereco,
          addressNumber: numero,
          complement: complemento || "",
          province: bairro,
          city: cidade,
          state: estado,
          externalReference: userId,
          notificationDisabled: true,
        }),
      });

      const customerData = await customerRes.json();
      if (!customerRes.ok) {
        console.error("Asaas customer error:", JSON.stringify(customerData));
        return new Response(JSON.stringify({ error: "Erro ao criar cadastro de pagamento" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      customerId = customerData.id;
    }

    // Create subscription
    const subscriptionRes = await fetch(`${asaasBaseUrl}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "access_token": asaasApiKey },
      body: JSON.stringify({
        customer: customerId,
        billingType: "CREDIT_CARD",
        cycle: "MONTHLY",
        value: selectedPlan.value,
        nextDueDate: new Date().toISOString().split("T")[0],
        description: `Assinatura ${selectedPlan.name} - ScriptLab`,
        externalReference: userId,
        creditCard: {
          holderName: cardHolderName,
          number: cleanCard,
          expiryMonth,
          expiryYear,
          ccv: cvv,
        },
        creditCardHolderInfo: {
          name: billingName,
          cpfCnpj: cleanCpf,
          email: user.email,
          mobilePhone: cleanPhone,
          postalCode: (cep || "").replace(/\D/g, ""),
          address: endereco,
          addressNumber: numero,
          complement: complemento || "",
          province: bairro,
        },
      }),
    });

    const subscriptionData = await subscriptionRes.json();
    if (!subscriptionRes.ok) {
      console.error("Asaas subscription error:", JSON.stringify(subscriptionData));
      return new Response(JSON.stringify({ error: subscriptionData.errors?.[0]?.description || "Erro ao processar pagamento" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const asaasSubscriptionId = subscriptionData.id;
    const planKey = planConfigCentral.id;

    // Save to DB
    try {
      await adminClient.from("payments").insert({
        user_id: userId,
        plan: planKey,
        amount: selectedPlan.value,
        status: "pending",
        asaas_subscription_id: asaasSubscriptionId,
      });

      await adminClient.from("users").update({
        billing_name: billingName,
        cpf: cleanCpf,
        whatsapp: cleanPhone,
        cep, endereco, numero, complemento, bairro, cidade, estado,
        plano_ativo: planKey,
        asaas_customer_id: customerId,
        status_assinatura: "active",
        data_expiracao: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq("id", userId);

      // Upsert subscription record
      await adminClient.from("subscriptions").upsert({
        user_id: userId,
        plan: planKey,
        status: "active",
      }, { onConflict: "user_id" });

    } catch (dbError) {
      // Rollback: delete Asaas subscription
      console.error("DB error, rolling back:", dbError);
      await fetch(`${asaasBaseUrl}/subscriptions/${asaasSubscriptionId}`, {
        method: "DELETE",
        headers: { "access_token": asaasApiKey },
      });
      return new Response(JSON.stringify({ error: "Erro ao salvar dados. Pagamento foi cancelado." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: asaasSubscriptionId,
      plan: planKey,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Process payment error:", err);
    return new Response(JSON.stringify({ error: "Erro interno no processamento" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
