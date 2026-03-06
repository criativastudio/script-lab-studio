import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runGuards, hashPrompt, checkCache, saveCache, logUsage, validateInputLength, estimateTokens } from "../_shared/usage-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { script_text, context_id, platform, user_id } = await req.json();
    if (!script_text) {
      return new Response(JSON.stringify({ error: "script_text is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation
    const inputErr = validateInputLength({ script_text }, 2000, ["script_text"], 4000);
    if (inputErr) {
      return new Response(JSON.stringify({ error: inputErr }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Usage guards
    if (user_id) {
      const guardResponse = await runGuards(supabase, user_id, "script", corsHeaders);
      if (guardResponse) return guardResponse;

      const pHash = await hashPrompt(script_text + (context_id || "") + (platform || ""));
      const cached = await checkCache(supabase, pHash);
      if (cached) {
        await logUsage(supabase, user_id, "score-script", "script", 0, pHash);
        return new Response(JSON.stringify({ success: true, ...cached }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let contextBlock = "";
    if (context_id) {
      const { data: ctx } = await supabase
        .from("client_strategic_contexts")
        .select("*")
        .eq("id", context_id)
        .single();
      if (ctx) {
        contextBlock = `
CONTEXTO ESTRATÉGICO DO CLIENTE:
- Negócio: ${ctx.business_name}
- Nicho: ${ctx.business_niche || "N/A"}
- Público-alvo: ${ctx.target_audience || "N/A"}
- Persona: ${ctx.customer_persona || "N/A"}
- Tom de voz: ${ctx.tone_of_voice || ctx.communication_style || "N/A"}
- Diferenciais: ${ctx.differentiators || "N/A"}
- Objetivos: ${ctx.marketing_objectives || "N/A"}
- Plataformas: ${(ctx.main_platforms || []).join(", ") || "N/A"}
`;
      }
    }

    const systemPrompt = `Você é um especialista em marketing viral e conteúdo para redes sociais. Sua função é analisar roteiros de vídeo e atribuir um score de potencial viral de 0 a 100.

Avalie o roteiro com base em 7 critérios:
1. hook_strength (0-20): Força do gancho nos primeiros segundos
2. message_clarity (0-15): Clareza e objetividade da mensagem
3. audience_relevance (0-15): Relevância para o público-alvo
4. storytelling_structure (0-15): Estrutura narrativa e fluidez
5. emotional_trigger (0-15): Uso de gatilhos emocionais
6. cta_strength (0-10): Força do call-to-action
7. platform_optimization (0-10): Otimização para a plataforma

${contextBlock}

Plataforma alvo: ${platform || "Instagram Reels"}

Seja criterioso mas justo. Roteiros excelentes ficam entre 75-90. Apenas roteiros excepcionais passam de 90.`;

    const userPrompt = `Analise o seguinte roteiro e retorne o score viral:\n\n${script_text}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "score_script",
            description: "Return the viral score analysis for a script",
            parameters: {
              type: "object",
              properties: {
                total_score: { type: "number", description: "Total viral score 0-100" },
                criteria: {
                  type: "object",
                  properties: {
                    hook_strength: { type: "number", description: "0-20" },
                    message_clarity: { type: "number", description: "0-15" },
                    audience_relevance: { type: "number", description: "0-15" },
                    storytelling_structure: { type: "number", description: "0-15" },
                    emotional_trigger: { type: "number", description: "0-15" },
                    cta_strength: { type: "number", description: "0-10" },
                    platform_optimization: { type: "number", description: "0-10" },
                  },
                  required: ["hook_strength", "message_clarity", "audience_relevance", "storytelling_structure", "emotional_trigger", "cta_strength", "platform_optimization"],
                  additionalProperties: false,
                },
                strengths: { type: "array", items: { type: "string" }, description: "2-4 strengths in Portuguese" },
                improvements: { type: "array", items: { type: "string" }, description: "2-4 improvements in Portuguese" },
              },
              required: ["total_score", "criteria", "strengths", "improvements"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "score_script" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const args = typeof toolCall.function.arguments === "string"
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;

    // Log usage and cache
    if (user_id) {
      const pHash = await hashPrompt(script_text + (context_id || "") + (platform || ""));
      const tokens = estimateTokens(JSON.stringify(args));
      await logUsage(supabase, user_id, "score-script", "script", tokens, pHash);
      await saveCache(supabase, pHash, "score-script", args);
    }

    return new Response(JSON.stringify({ success: true, ...args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
