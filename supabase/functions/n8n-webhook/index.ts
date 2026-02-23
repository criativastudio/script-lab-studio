import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { client_id, phone, name, email, source, notes, message, is_ai_response } = body;

    // Validate required fields
    if (!client_id) {
      return new Response(JSON.stringify({ error: "client_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!phone && !name) {
      return new Response(JSON.stringify({ error: "phone ou name é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify client exists and is active
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, is_active")
      .eq("id", client_id)
      .single();

    if (clientError || !client) {
      return new Response(JSON.stringify({ error: "Cliente não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!client.is_active) {
      return new Response(JSON.stringify({ error: "Cliente inativo" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if lead already exists by phone for this client
    let leadId: string | null = null;

    if (phone) {
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("client_id", client_id)
        .eq("phone", phone)
        .maybeSingle();

      if (existingLead) {
        leadId = existingLead.id;
        // Update lead with new info if provided
        const updates: Record<string, string> = {};
        if (name) updates.name = name;
        if (email) updates.email = email;
        if (notes) updates.notes = notes;
        if (Object.keys(updates).length > 0) {
          await supabase.from("leads").update(updates).eq("id", leadId);
        }
      }
    }

    // Create lead if not found
    if (!leadId) {
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          client_id,
          name: name || phone || "Desconhecido",
          phone: phone || null,
          email: email || null,
          source: source || "whatsapp",
          notes: notes || null,
          status: "novo",
        })
        .select("id")
        .single();

      if (leadError) {
        return new Response(JSON.stringify({ error: `Erro ao criar lead: ${leadError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      leadId = newLead.id;
    }

    // Create or update conversation
    let conversationId: string | null = null;

    if (phone) {
      const { data: existingConv } = await supabase
        .from("conversations")
        .select("id, message_count")
        .eq("client_id", client_id)
        .eq("phone", phone)
        .eq("status", "active")
        .maybeSingle();

      if (existingConv) {
        conversationId = existingConv.id;
        await supabase
          .from("conversations")
          .update({
            message_count: existingConv.message_count + 1,
            last_message_at: new Date().toISOString(),
            is_ai_response: is_ai_response ?? true,
          })
          .eq("id", conversationId);
      }
    }

    if (!conversationId) {
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          client_id,
          phone: phone || null,
          lead_id: leadId,
          status: "active",
          message_count: 1,
          last_message_at: new Date().toISOString(),
          is_ai_response: is_ai_response ?? true,
        })
        .select("id")
        .single();

      if (convError) {
        return new Response(JSON.stringify({ error: `Erro ao criar conversa: ${convError.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      conversationId = newConv.id;
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: leadId,
        conversation_id: conversationId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Erro interno do servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
