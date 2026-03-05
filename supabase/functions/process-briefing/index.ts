import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Token is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the briefing request
    const { data: br, error: brError } = await supabase
      .from("briefing_requests")
      .select("*")
      .eq("token", token)
      .single();

    if (brError || !br) {
      return new Response(JSON.stringify({ error: "Briefing request not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (br.status === "completed") {
      return new Response(JSON.stringify({ error: "Already processed", data: br }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to processing
    await supabase.from("briefing_requests").update({ status: "processing" }).eq("id", br.id);

    const answers = br.form_answers || {};
    const videoCount = br.video_quantity || 3;

    const systemPrompt = `Você é um estrategista de conteúdo audiovisual profissional. Analise as respostas do cliente e gere uma estratégia completa de conteúdo com roteiros para vídeos. Responda usando a função fornecida.`;

    const userPrompt = `
Cliente: ${br.business_name}
Projeto: ${br.project_name}
Quantidade de vídeos: ${videoCount}

Respostas do formulário:
1. Sobre o negócio: ${answers.about_business || "Não informado"}
2. Cliente típico: ${answers.typical_customer || "Não informado"}
3. Problema resolvido: ${answers.problem_solved || "Não informado"}
4. Objetivo do negócio: ${JSON.stringify(answers.business_objectives || [])}
5. Referências de conteúdo: ${JSON.stringify(answers.content_references || [])}
6. Estilo de comunicação: ${JSON.stringify(answers.communication_style || [])}
7. Plataformas principais: ${JSON.stringify(answers.main_platforms || [])}
8. Dores do cliente: ${answers.pain_points || "Não informado"}
9. Diferenciais: ${answers.differentiators || "Não informado"}

Gere exatamente ${videoCount} roteiros estratégicos diferentes para este cliente. Cada roteiro deve ser completo e pronto para produção.
`;

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
            name: "generate_briefing_and_scripts",
            description: "Generate strategic briefing and video scripts",
            parameters: {
              type: "object",
              properties: {
                persona: { type: "string", description: "Detailed customer persona description" },
                positioning: { type: "string", description: "Brand positioning strategy" },
                tone_of_voice: { type: "string", description: "Recommended tone of voice for content" },
                content_strategy: { type: "string", description: "Overall content strategy" },
                scripts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      objective: { type: "string" },
                      hook: { type: "string" },
                      scene_structure: { type: "string" },
                      narration: { type: "string" },
                      visual_direction: { type: "string" },
                      call_to_action: { type: "string" },
                    },
                    required: ["title", "objective", "hook", "scene_structure", "narration", "visual_direction", "call_to_action"],
                    additionalProperties: false,
                  },
                  description: `Exactly ${videoCount} video scripts`,
                },
              },
              required: ["persona", "positioning", "tone_of_voice", "content_strategy", "scripts"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_briefing_and_scripts" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI Gateway error:", response.status, errText);
      await supabase.from("briefing_requests").update({ status: "submitted" }).eq("id", br.id);
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
      await supabase.from("briefing_requests").update({ status: "submitted" }).eq("id", br.id);
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // 1. Create project
    const { data: project, error: projErr } = await supabase.from("projects").insert({
      name: br.project_name,
      client_name: br.business_name,
      objective: result.content_strategy?.substring(0, 200),
      platform: "Multi-plataforma",
      user_id: br.user_id,
      status: "active",
    }).select("id").single();

    if (projErr) {
      console.error("Project creation error:", projErr);
      await supabase.from("briefing_requests").update({ status: "submitted" }).eq("id", br.id);
      return new Response(JSON.stringify({ error: "Failed to create project" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create briefing
    await supabase.from("briefings").insert({
      goal: result.content_strategy,
      target_audience: result.persona,
      content_style: result.tone_of_voice,
      project_id: project.id,
      user_id: br.user_id,
    });

    // 3. Create scripts
    const scriptInserts = (result.scripts || []).map((s: any) => ({
      title: s.title,
      script: `**Objetivo:** ${s.objective}\n\n**Gancho:** ${s.hook}\n\n**Estrutura de Cenas:**\n${s.scene_structure}\n\n**Narração:**\n${s.narration}\n\n**Direção Visual:**\n${s.visual_direction}\n\n**Call to Action:**\n${s.call_to_action}`,
      project_id: project.id,
      user_id: br.user_id,
    }));

    if (scriptInserts.length > 0) {
      await supabase.from("scripts").insert(scriptInserts);
    }

    // 4. Update briefing_requests
    await supabase.from("briefing_requests").update({
      persona: result.persona,
      positioning: result.positioning,
      tone_of_voice: result.tone_of_voice,
      content_strategy: result.content_strategy,
      project_id: project.id,
      status: "completed",
    }).eq("id", br.id);

    // 5. Create/update strategic context from form answers
    const contextData: Record<string, any> = {
      user_id: br.user_id,
      business_name: br.business_name,
      business_niche: br.niche || null,
      products_services: answers.about_business || null,
      target_audience: answers.typical_customer || result.persona || null,
      customer_persona: result.persona || null,
      tone_of_voice: result.tone_of_voice || null,
      market_positioning: result.positioning || null,
      pain_points: answers.pain_points || answers.problem_solved || null,
      differentiators: answers.differentiators || null,
      marketing_objectives: Array.isArray(answers.business_objectives)
        ? answers.business_objectives.join(", ")
        : (answers.business_objectives || null),
      main_platforms: Array.isArray(answers.main_platforms) ? answers.main_platforms : [],
      communication_style: Array.isArray(answers.communication_style)
        ? answers.communication_style.join(", ")
        : (answers.communication_style || null),
      is_completed: true,
    };

    // Upsert: try update first, then insert
    const { data: existingCtx } = await supabase
      .from("client_strategic_contexts")
      .select("id")
      .eq("user_id", br.user_id)
      .eq("business_name", br.business_name)
      .single();

    if (existingCtx) {
      await supabase.from("client_strategic_contexts")
        .update(contextData)
        .eq("id", existingCtx.id);
    } else {
      await supabase.from("client_strategic_contexts").insert(contextData);
    }

    return new Response(JSON.stringify({
      success: true,
      project_id: project.id,
      persona: result.persona,
      positioning: result.positioning,
      tone_of_voice: result.tone_of_voice,
      content_strategy: result.content_strategy,
      scripts_count: scriptInserts.length,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
