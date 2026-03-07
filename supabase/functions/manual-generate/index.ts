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
    const { objective, target_audience, platform, hook, duration, notes, video_quantity, user_id, business_name, niche } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!objective || !target_audience || !platform) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: objetivo, público-alvo e plataforma." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation
    const inputErr = validateInputLength({ objective, target_audience, platform, hook, notes, business_name, niche }, 2000);
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
      const promptContent = JSON.stringify({ objective, target_audience, platform, hook, duration, notes, video_quantity, business_name, niche });
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
    const bName = business_name || "a empresa";
    const bNiche = niche || "geral";

    const systemPrompt = `Você é um estrategista de conteúdo digital e roteirista profissional para redes sociais.
Com base nas informações fornecidas pelo usuário, crie um planejamento estratégico completo e ${qty} roteiro(s) de vídeo.

O resultado DEVE incluir obrigatoriamente:
1. **Briefing**: Objetivo claro e estratégia de conteúdo para ${bName} no nicho ${bNiche}.
2. **Persona**: Descrição detalhada da persona ideal do público-alvo, incluindo dores, desejos e comportamento.
3. **Posicionamento**: Como a marca deve se posicionar no mercado e se diferenciar da concorrência.
4. **Tom de Voz**: Estilo de comunicação, linguagem e personalidade da marca nas redes sociais.
5. **Funil de Conteúdo**: Estratégia de conteúdo dividida em Topo (awareness), Meio (consideração) e Fundo (conversão) do funil.
6. **Roteiro(s)**: Cada roteiro deve ter título atrativo e o roteiro completo com GANCHO, DESENVOLVIMENTO e CTA, incluindo indicações de cena e falas.

Escreva tudo em português do Brasil.`;

    const userPrompt = `Informações do cliente:
- Empresa: ${bName}
- Nicho: ${bNiche}
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
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_briefing_and_scripts",
              description: "Retorna briefing estratégico completo com persona, posicionamento, tom de voz, funil e roteiros.",
              parameters: {
                type: "object",
                properties: {
                  goal: { type: "string", description: "Briefing: objetivo estratégico do conteúdo" },
                  target_audience: { type: "string", description: "Público-alvo detalhado" },
                  content_style: { type: "string", description: "Estilo e tom do conteúdo" },
                  persona: { type: "string", description: "Persona detalhada do público-alvo com dores, desejos e comportamento" },
                  positioning: { type: "string", description: "Posicionamento da marca no mercado e diferenciais competitivos" },
                  tone_of_voice: { type: "string", description: "Tom de voz e estilo de comunicação da marca" },
                  content_funnel: { type: "string", description: "Estratégia de funil de conteúdo: Topo, Meio e Fundo" },
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
                required: ["goal", "target_audience", "content_style", "persona", "positioning", "tone_of_voice", "content_funnel", "scripts"],
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
      const promptContent = JSON.stringify({ objective, target_audience, platform, hook, duration, notes, video_quantity, business_name, niche });
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
