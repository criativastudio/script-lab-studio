import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runGuards, hashPrompt, checkCache, saveCache, logUsage, validateInputLength, estimateTokens, requireAuth, recordGatewayError } from "../_shared/usage-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRIGGER_TYPES = [
  "curiosity", "controversial", "authority", "problem", "fear",
  "statistic", "myth_breaking", "question", "story", "bold_statement"
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (auth.response) return auth.response;
    const user_id = auth.userId;

    const { context_id, topic, platform, audience, tone, content_type } = await req.json();

    if (!context_id || !topic) {
      return new Response(JSON.stringify({ error: "context_id and topic are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation
    const inputErr = validateInputLength({ topic, audience, tone }, 2000);
    if (inputErr) {
      return new Response(JSON.stringify({ error: inputErr }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Usage guards
    const guardResponse = await runGuards(supabase, user_id, "script", corsHeaders);
    if (guardResponse) return guardResponse;

    // Cache check
    const pHash = await hashPrompt(JSON.stringify({ context_id, topic, platform, content_type }));
    const cached = await checkCache(supabase, pHash);
    if (cached) {
      await logUsage(supabase, user_id, "generate-hooks", "script", 0, pHash);
      return new Response(JSON.stringify({ success: true, hooks: cached.hooks || cached }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load strategic context
    const { data: context } = await supabase
      .from("client_strategic_contexts")
      .select("*")
      .eq("id", context_id)
      .single();

    if (!context) {
      return new Response(JSON.stringify({ error: "Strategic context not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load previous hooks to avoid repetition
    const { data: memoryEntries } = await supabase
      .from("client_content_memory")
      .select("hook")
      .eq("context_id", context_id)
      .not("hook", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    const previousHooks = (memoryEntries || []).map(e => e.hook).filter(Boolean);
    const previousHooksBlock = previousHooks.length > 0
      ? `\n\nGANCHOS JÁ USADOS (NÃO REPITA, evolua e melhore):\n${previousHooks.map((h, i) => `${i + 1}. "${h}"`).join("\n")}`
      : "";

    const effectiveAudience = audience || context.target_audience || "público geral";
    const effectiveTone = tone || context.tone_of_voice || context.communication_style || "profissional";
    const effectivePlatform = platform || (context.main_platforms?.length ? context.main_platforms[0] : "Instagram");

    const nicho = context.business_niche || "não especificado";

    const systemPrompt = `Você é um especialista em copywriting para vídeos curtos e retenção de audiência.
Seu objetivo é criar 10 ganchos de vídeo altamente impactantes que capturam atenção nos primeiros 3 segundos.

REGRA DE FIDELIDADE AO NICHO (OBRIGATÓRIA):
- Use EXCLUSIVAMENTE vocabulário, termos técnicos e expressões nativas do nicho "${nicho}" do cliente.
- PROIBIDO misturar metáforas, analogias ou estilos de comunicação de outros mercados ou nichos.
- Toda referência, exemplo, caso e linguagem deve fazer sentido 100% dentro do contexto profissional do cliente.
- Antes de finalizar, valide internamente: "Este conteúdo soaria natural vindo de um profissional deste nicho específico?" Se não, reescreva.
- Evite analogias genéricas que servem para qualquer nicho (ex: "transforme sua vida", "destaque-se da multidão").
- Mantenha coerência absoluta entre posicionamento, tom de voz e vocabulário do nicho.

LÓGICA DE CONTEÚDO "CONECTA-ENTRETÉM-VENDE" (OBRIGATÓRIA):
- Todo gancho deve partir de IDENTIFICAÇÃO IMEDIATA: problema, situação ou pensamento comum do público — nunca apresentação pessoal, saudação ou anúncio direto.
- Priorize gatilhos baseados em STORY, PROBLEM, QUESTION e MYTH_BREAKING — eles geram mais conexão antes de vender.
- O gatilho BOLD_STATEMENT deve ser usado com tom de observação genuína ou quebra de crença, NUNCA com tom de propaganda.
- Ganchos devem soar como conversa, história ou observação real do nicho — não como manchete de anúncio.
- Antes de finalizar cada gancho, valide: "Isso parece anúncio?" Se sim, reescreva para parecer conversa ou identificação espontânea.

CONTEXTO DO CLIENTE:
- Negócio: ${context.business_name}
- Nicho: ${nicho}
- Público-alvo: ${effectiveAudience}
- Tom de voz: ${effectiveTone}
- Posicionamento: ${context.market_positioning || "não especificado"}
- Dores do público: ${context.pain_points || "não especificado"}
- Diferenciais: ${context.differentiators || "não especificado"}
${previousHooksBlock}

REGRAS:
1. Cada gancho deve usar um gatilho psicológico DIFERENTE
2. Ganchos devem ser curtos (máx 2 frases), diretos e provocativos
3. Adapte o tom ao estilo de comunicação do cliente
4. Considere a plataforma (${effectivePlatform}) para ajustar o formato
5. O tipo de conteúdo é: ${content_type || "educacional"}
6. NUNCA repita ganchos anteriores — evolua e melhore`;

    const userPrompt = `Gere 10 ganchos de vídeo para o tópico: "${topic}"

Plataforma: ${effectivePlatform}
Tipo de conteúdo: ${content_type || "educacional"}

Cada gancho deve usar um dos seguintes gatilhos psicológicos (use cada um exatamente uma vez):
1. curiosity (Curiosidade)
2. controversial (Controvérsia)
3. authority (Autoridade)
4. problem (Problema)
5. fear (Medo)
6. statistic (Estatística)
7. myth_breaking (Quebra de Mito)
8. question (Pergunta)
9. story (História)
10. bold_statement (Declaração Ousada)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 2200,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_hooks",
            description: "Return 10 hook variations with different psychological triggers",
            parameters: {
              type: "object",
              properties: {
                hooks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      hook: { type: "string", description: "The hook text" },
                      trigger_type: { type: "string", enum: TRIGGER_TYPES },
                      why_it_works: { type: "string", description: "Why this hook is effective" },
                    },
                    required: ["hook", "trigger_type", "why_it_works"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["hooks"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_hooks" } },
      }),
    });

    if (!response.ok) {
      await recordGatewayError(supabase, "generate-hooks", response.status).catch(()=>{});
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Add credits to your workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No structured response from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const hooks = parsed.hooks || [];

    // Log usage and cache
    const tokens = estimateTokens(JSON.stringify(parsed));
    await logUsage(supabase, user_id, "generate-hooks", "script", tokens, pHash);
    await saveCache(supabase, pHash, "generate-hooks", parsed);

    return new Response(JSON.stringify({ success: true, hooks }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-hooks error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
