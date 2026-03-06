import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runGuards, hashPrompt, checkCache, saveCache, logUsage, validateInputLength, estimateTokens } from "../_shared/usage-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { objective, target_audience, platform, hook, duration, notes, video_quantity, user_id } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!objective || !target_audience || !platform) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: objetivo, público-alvo e plataforma." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation
    const inputErr = validateInputLength({ objective, target_audience, platform, hook, notes }, 2000);
    if (inputErr) {
      return new Response(JSON.stringify({ error: inputErr }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usage guards
    if (user_id) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const guardResponse = await runGuards(supabase, user_id, "briefing", corsHeaders);
      if (guardResponse) return guardResponse;

      // Cache check
      const promptContent = JSON.stringify({ objective, target_audience, platform, hook, duration, notes, video_quantity });
      const pHash = await hashPrompt(promptContent);
      const cached = await checkCache(supabase, pHash);
      if (cached) {
        await logUsage(supabase, user_id, "manual-generate", "briefing", 0, pHash);
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const qty = video_quantity || 1;

    const systemPrompt = `Você é um estrategista de conteúdo digital e roteirista profissional para redes sociais.
Com base nas informações fornecidas pelo usuário, crie um briefing estratégico completo e ${qty} roteiro(s) de vídeo.
O briefing deve incluir: objetivo claro, público-alvo detalhado e estilo de conteúdo.
Cada roteiro deve ter: título atrativo, e o roteiro completo com GANCHO, DESENVOLVIMENTO e CTA, incluindo indicações de cena e falas.
Escreva tudo em português do Brasil.`;

    const userPrompt = `Informações do cliente:
- Objetivo: ${objective}
- Público-alvo: ${target_audience}
- Plataforma: ${platform}
- Mensagem principal / Gancho: ${hook || "Livre"}
- Duração: ${duration || "30s"}
- Notas estratégicas: ${notes || "Nenhuma"}
- Quantidade de roteiros: ${qty}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 3700,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_briefing_and_scripts",
              description: "Retorna briefing estratégico e roteiros de vídeo estruturados.",
              parameters: {
                type: "object",
                properties: {
                  goal: { type: "string", description: "Objetivo estratégico do conteúdo" },
                  target_audience: { type: "string", description: "Público-alvo detalhado" },
                  content_style: { type: "string", description: "Estilo e tom do conteúdo" },
                  scripts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título do roteiro" },
                        script: { type: "string", description: "Roteiro completo com GANCHO, DESENVOLVIMENTO e CTA" },
                      },
                      required: ["title", "script"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["goal", "target_audience", "content_style", "scripts"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_briefing_and_scripts" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      return new Response(JSON.stringify({ error: "Erro no gateway de IA." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "Resposta inesperada da IA." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    // Log usage and cache
    if (user_id) {
      const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      const promptContent = JSON.stringify({ objective, target_audience, platform, hook, duration, notes, video_quantity });
      const pHash = await hashPrompt(promptContent);
      const tokens = estimateTokens(JSON.stringify(result));
      await logUsage(supabase, user_id, "manual-generate", "briefing", tokens, pHash);
      await saveCache(supabase, pHash, "manual-generate", result);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("manual-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
