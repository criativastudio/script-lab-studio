import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { context_id, project_id, count = 10, user_id } = await req.json();
    if (!context_id || !user_id) {
      return new Response(JSON.stringify({ error: "context_id and user_id are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load strategic context
    const { data: ctx, error: ctxErr } = await supabase
      .from("client_strategic_contexts")
      .select("*")
      .eq("id", context_id)
      .single();

    if (ctxErr || !ctx) {
      return new Response(JSON.stringify({ error: "Strategic context not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load project info if provided
    let projectInfo = "";
    if (project_id) {
      const { data: proj } = await supabase.from("projects").select("*").eq("id", project_id).single();
      if (proj) {
        projectInfo = `
Projeto: ${proj.name || ""}
Objetivo da campanha: ${proj.campaign_objective || "Não definido"}
Etapa do funil: ${proj.funnel_stage || "Não definido"}
Plataforma: ${proj.platform || "Multi-plataforma"}
Estilo de conteúdo: ${proj.content_style || "Não definido"}
Quantidade de vídeos: ${proj.video_count || count}`;
      }
    }

    // Load existing ideas to avoid repetition
    const { data: existingIdeas } = await supabase
      .from("content_ideas")
      .select("title")
      .eq("user_id", user_id)
      .eq("context_id", context_id);

    const existingTopics = (existingIdeas || []).map((i: any) => i.title).join("\n- ");

    const systemPrompt = `Você é um estrategista de conteúdo especializado em marketing digital. Gere ideias de conteúdo para vídeos usando a função fornecida. As ideias devem ser específicas, acionáveis e relevantes para o negócio do cliente.`;

    const userPrompt = `
Contexto Estratégico do Cliente:
- Negócio: ${ctx.business_name}
- Nicho: ${ctx.business_niche || "Não informado"}
- Produtos/Serviços: ${ctx.products_services || "Não informado"}
- Público-alvo: ${ctx.target_audience || "Não informado"}
- Persona: ${ctx.customer_persona || "Não informado"}
- Tom de voz: ${ctx.tone_of_voice || "Não informado"}
- Posicionamento: ${ctx.market_positioning || "Não informado"}
- Dores do cliente: ${ctx.pain_points || "Não informado"}
- Diferenciais: ${ctx.differentiators || "Não informado"}
- Objetivos de marketing: ${ctx.marketing_objectives || "Não informado"}
- Plataformas: ${(ctx.main_platforms || []).join(", ") || "Não informado"}
- Estilo de comunicação: ${ctx.communication_style || "Não informado"}
${projectInfo}

${existingTopics ? `Tópicos já existentes (NÃO repita estes):\n- ${existingTopics}` : ""}

Gere exatamente ${count} ideias de conteúdo para vídeos. Cada ideia deve ter um título claro e uma breve descrição de 1-2 frases.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_content_ideas",
            description: "Generate content ideas for videos",
            parameters: {
              type: "object",
              properties: {
                ideas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Clear, concise idea title" },
                      description: { type: "string", description: "Brief 1-2 sentence description" },
                    },
                    required: ["title", "description"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["ideas"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_content_ideas" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required for AI processing." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    const ideas = result.ideas || [];

    // Insert ideas into database
    if (ideas.length > 0) {
      const inserts = ideas.map((idea: any) => ({
        user_id,
        project_id: project_id || null,
        context_id,
        title: idea.title,
        description: idea.description || null,
        status: "pending",
      }));
      await supabase.from("content_ideas").insert(inserts);
    }

    return new Response(JSON.stringify({ success: true, ideas, count: ideas.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-ideas error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
