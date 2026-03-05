import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub as string;

    // Parse body
    const { business_name, target_audience, objectives, brand_positioning, production_capacity, content_references } = await req.json();

    if (!business_name?.trim()) {
      return new Response(JSON.stringify({ error: "Nome do negócio é obrigatório." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert initial row
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: report, error: insertError } = await supabaseAdmin
      .from("strategic_reports")
      .insert({
        user_id: userId,
        business_name: business_name.trim(),
        target_audience: target_audience?.trim() || null,
        objectives: objectives?.trim() || null,
        brand_positioning: brand_positioning?.trim() || null,
        production_capacity: production_capacity?.trim() || null,
        content_references: content_references?.trim() || null,
        status: "processing",
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    // AI call with tool calling for structured output
    const systemPrompt = `Você é um estrategista de conteúdo audiovisual especialista em marketing digital. 
Analise o briefing estratégico do cliente e retorne uma análise completa e profissional.
Responda sempre em português brasileiro.`;

    const userPrompt = `Analise o seguinte briefing estratégico:

Nome do Negócio: ${business_name}
Público-Alvo: ${target_audience || "Não informado"}
Objetivos: ${objectives || "Não informado"}
Posicionamento da Marca: ${brand_positioning || "Não informado"}
Capacidade de Produção: ${production_capacity || "Não informado"}
Referências de Conteúdo: ${content_references || "Não informado"}

Gere uma análise estratégica completa.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "strategic_analysis",
              description: "Return a complete strategic analysis for audiovisual content production.",
              parameters: {
                type: "object",
                properties: {
                  persona: {
                    type: "string",
                    description: "Detailed description of the ideal customer persona including demographics, psychographics, pain points, and media consumption habits.",
                  },
                  positioning: {
                    type: "string",
                    description: "Brand positioning strategy for the audiovisual market including differentiators and value proposition.",
                  },
                  tone_of_voice: {
                    type: "string",
                    description: "Recommended tone of voice for content including communication style, vocabulary level, and emotional approach.",
                  },
                  content_funnel: {
                    type: "string",
                    description: "Content funnel strategy with top, middle and bottom of funnel content types and distribution plan.",
                  },
                  script_ideas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        platform: { type: "string" },
                        format: { type: "string" },
                      },
                      required: ["title", "description"],
                      additionalProperties: false,
                    },
                    description: "5-10 video script ideas with title, description, suggested platform, and format.",
                  },
                },
                required: ["persona", "positioning", "tone_of_voice", "content_funnel", "script_ideas"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "strategic_analysis" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos ao workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No structured response from AI");

    const analysis = JSON.parse(toolCall.function.arguments);

    // Update report with AI results
    const { error: updateError } = await supabaseAdmin
      .from("strategic_reports")
      .update({
        persona: analysis.persona,
        positioning: analysis.positioning,
        tone_of_voice: analysis.tone_of_voice,
        content_funnel: analysis.content_funnel,
        script_ideas: analysis.script_ideas,
        status: "completed",
      })
      .eq("id", report.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        id: report.id,
        ...analysis,
        status: "completed",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("strategic-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
