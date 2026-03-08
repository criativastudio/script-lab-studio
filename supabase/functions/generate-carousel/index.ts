import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  runGuards,
  hashPrompt,
  checkCache,
  saveCache,
  logUsage,
  estimateTokens,
  validateInputLength,
} from "../_shared/usage-guard.ts";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    const { user_id, business_name, mode, topic, idea_count, idea_title } = await req.json();
    if (!user_id || !business_name || !mode) {
      return new Response(JSON.stringify({ error: "user_id, business_name e mode são obrigatórios." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const inputErr = validateInputLength({ topic, idea_title, business_name }, 2000);
    if (inputErr) {
      return new Response(JSON.stringify({ error: inputErr }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const guardErr = await runGuards(supabase, user_id, "script", corsHeaders);
    if (guardErr) return guardErr;

    // Fetch strategic context
    const { data: context } = await supabase
      .from("client_strategic_contexts")
      .select("*")
      .eq("user_id", user_id)
      .eq("business_name", business_name)
      .single();

    if (!context) {
      return new Response(JSON.stringify({ error: "Contexto estratégico não encontrado para este cliente." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contextBlock = `
BRIEFING ESTRATÉGICO DO CLIENTE:
- Empresa: ${context.business_name}
- Nicho: ${context.business_niche || "Não definido"}
- Produtos/Serviços: ${context.products_services || "Não definido"}
- Público-alvo: ${context.target_audience || "Não definido"}
- Persona: ${context.customer_persona || "Não definida"}
- Tom de voz: ${context.tone_of_voice || "Não definido"}
- Posicionamento: ${context.market_positioning || "Não definido"}
- Dores do público: ${context.pain_points || "Não definido"}
- Diferenciais: ${context.differentiators || "Não definido"}
- Objetivos de marketing: ${context.marketing_objectives || "Não definido"}
- Plataformas: ${(context.main_platforms || []).join(", ") || "Instagram"}
- Estilo de comunicação: ${context.communication_style || "Não definido"}
`.trim();

    const systemPrompt = `Você é um especialista em estratégia de conteúdo para Instagram focado em crescimento orgânico e geração de autoridade.
Sua função é criar ideias e roteiros estratégicos de carrossel que gerem alto alcance para não seguidores, salvamentos e compartilhamentos.

${contextBlock}

REGRAS OBRIGATÓRIAS:
- Nunca gerar conteúdo genérico. Toda ideia deve estar alinhada ao nicho, persona e objetivos do cliente.
- O conteúdo deve ser útil, prático e salvarável.
- Linguagem deve respeitar o tom de voz definido no briefing.
- Headlines devem ser fortes, específicas e conectadas com dores ou desejos da persona.
- O conteúdo deve ser otimizado para Instagram.
- Frases curtas, máximo de 16 palavras por slide.
- Linguagem clara e direta, fácil leitura em mobile.

MÉTRICAS DE REFERÊNCIA:
- Salvamentos ≥ 8%
- Compartilhamentos ≥ 5%
- Alcance de não seguidores ≥ 60%

AUDITORIA ANTI-GENÉRICO: Se algum conteúdo puder servir para qualquer nicho, reescreva adaptando para o nicho e persona do cliente.`;

    let toolSchema: any;
    let userPrompt: string;

    if (mode === "ideas") {
      const count = idea_count || 5;
      userPrompt = `Gere ${count} ideias estratégicas de carrossel para Instagram.${topic ? ` Tema/palavras-chave: ${topic}` : ""}

Cada ideia deve conter: headline poderoso, ângulo estratégico, objetivo no funil (atração/consideração/conversão), dor ou desejo da persona que resolve, e breve explicação.`;

      toolSchema = {
        type: "function",
        function: {
          name: "generate_carousel_ideas",
          description: "Gera ideias estratégicas de carrossel",
          parameters: {
            type: "object",
            properties: {
              ideas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    headline: { type: "string", description: "Título poderoso do carrossel" },
                    angle: { type: "string", description: "Ângulo estratégico do conteúdo" },
                    funnel_stage: { type: "string", enum: ["atração", "consideração", "conversão"] },
                    pain_or_desire: { type: "string", description: "Dor ou desejo da persona que resolve" },
                    explanation: { type: "string", description: "Breve explicação da ideia" },
                  },
                  required: ["headline", "angle", "funnel_stage", "pain_or_desire", "explanation"],
                },
              },
            },
            required: ["ideas"],
          },
        },
      };
    } else {
      userPrompt = `Crie um roteiro COMPLETO de carrossel para Instagram com 10 slides (S1–S10).${idea_title ? ` Tema: ${idea_title}` : ""}${topic ? ` Palavras-chave: ${topic}` : ""}

ESTRUTURA OBRIGATÓRIA:
S1 – CAPA: Gancho forte com no máximo 9 palavras.
S2 – CONTEXTO DA DOR: Situação real que a persona vive.
S3 – PROMESSA DO CONTEÚDO: Resultado claro ao continuar.
S4 – PASSO 1: Primeira ação prática.
S5 – PASSO 2: Segunda ação prática.
S6 – PASSO 3: Terceira ação prática.
S7 – DICA OU INSIGHT EXTRA.
S8 – PROVA: Número, exemplo real ou mini estudo.
S9 – ERRO COMUM: Erro que a maioria comete e a forma correta.
S10 – CTA: Chamada para ação estratégica.

Para cada slide gere: texto do slide, sugestão visual, texto da arte, e alt text para SEO.
Gere também: legenda do post (120-180 palavras), 3 opções alternativas de capa, 2 variações de abertura para testes A/B.`;

      toolSchema = {
        type: "function",
        function: {
          name: "generate_carousel_script",
          description: "Gera roteiro completo de carrossel com 10 slides",
          parameters: {
            type: "object",
            properties: {
              slides: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    slide_number: { type: "number" },
                    slide_label: { type: "string" },
                    text: { type: "string" },
                    visual_suggestion: { type: "string" },
                    art_text: { type: "string" },
                    alt_text: { type: "string" },
                  },
                  required: ["slide_number", "slide_label", "text", "visual_suggestion", "art_text", "alt_text"],
                },
              },
              caption: { type: "string", description: "Legenda do post (120-180 palavras)" },
              alternative_covers: {
                type: "array",
                items: { type: "string" },
                description: "3 opções alternativas de capa",
              },
              ab_openings: {
                type: "array",
                items: { type: "string" },
                description: "2 variações de abertura para testes A/B",
              },
            },
            required: ["slides", "caption", "alternative_covers", "ab_openings"],
          },
        },
      };
    }

    // Cache check
    const promptHash = await hashPrompt(systemPrompt + userPrompt);
    const cached = await checkCache(supabase, promptHash);
    if (cached) {
      return new Response(JSON.stringify({ success: true, ...cached }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: toolSchema.function.name } },
        temperature: 0.8,
      }),
    });

    if (!aiRes.ok) {
      const status = aiRes.status;
      const errBody = await aiRes.text();
      console.error("AI gateway error:", status, errBody);
      if (status === 429 || status === 402) {
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);
    const tokens = estimateTokens(systemPrompt + userPrompt + toolCall.function.arguments);

    await logUsage(supabase, user_id, "generate-carousel", "script", tokens, promptHash);
    await saveCache(supabase, promptHash, "generate-carousel", result);

    return new Response(JSON.stringify({ success: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-carousel error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
