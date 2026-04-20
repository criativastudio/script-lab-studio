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

    const { user_id, business_name, mode, topic, idea_count, idea_title, content_style } = await req.json();
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

    const nicho = context?.business_niche || "não especificado";

    const systemPrompt = `Você é um especialista em carrosséis para Instagram focado em ALCANCE PARA NÃO SEGUIDORES.
Sua missão é criar conteúdo que maximize descoberta, salvamentos e compartilhamentos — fazendo o Instagram distribuir o post para pessoas que ainda não seguem o perfil.

${contextBlock}

REGRA DE FIDELIDADE AO NICHO (OBRIGATÓRIA):
- Use EXCLUSIVAMENTE vocabulário, termos técnicos e expressões nativas do nicho "${nicho}" do cliente.
- PROIBIDO misturar metáforas, analogias ou estilos de comunicação de outros mercados ou nichos.
- Toda referência, exemplo, caso e linguagem deve fazer sentido 100% dentro do contexto profissional do cliente.
- Antes de finalizar, valide internamente: "Este conteúdo soaria natural vindo de um profissional deste nicho específico?" Se não, reescreva.
- Evite analogias genéricas que servem para qualquer nicho (ex: "transforme sua vida", "destaque-se da multidão").
- Mantenha coerência absoluta entre posicionamento, tom de voz e vocabulário do nicho.

LÓGICA DE CONTEÚDO "CONECTA-ENTRETÉM-VENDE" (OBRIGATÓRIA):
1. ABERTURA POR IDENTIFICAÇÃO: o S1 deve começar com problema, situação ou pensamento comum do público — nunca com saudação ou anúncio direto.
2. STORYTELLING NATURAL ENTRE SLIDES: trate os 6 slides como narrativa contínua, não blocos isolados de venda. Os conectores devem fluir como história.
3. ENTRETENIMENTO ANTES DE VENDA: S1-S3 devem prender atenção e gerar conexão; tom de anúncio é PROIBIDO nos primeiros slides.
4. OFERTA ORGÂNICA: o CTA do S6 deve fluir naturalmente da história construída — nunca soar como "COMPRE AGORA" descolado do conteúdo.
5. EXPERIÊNCIA PRÁTICA: priorize uso real, resultado concreto, bastidores ou reação verdadeira sobre teoria genérica.
6. FLEXIBILIDADE: adapte o tom (divertido/sério) ao contexto do cliente. Os rótulos S1=Hook, S2=Problema etc. são guias internos — o texto final deve parecer narrativa, não estrutura engessada.
7. ANTI-PROPAGANDA: antes de finalizar, valide "Esse carrossel parece anúncio?" — se sim, reescreva para parecer conversa, história ou observação genuína.
OBJETIVO FINAL: carrossel que conecta, entretém e vende sem parecer venda.

REGRAS OBRIGATÓRIAS:
- Cada slide tem APENAS: uma HEADLINE/HOOK forte (máx 6-8 palavras) + um TEXTO CONECTOR curto (máx 4-6 palavras).
- PROIBIDO parágrafos, explicações ou frases longas.
- Headline = frase de impacto que gera curiosidade ou quebra de crença.
- Conector = frase curta que liga ao próximo slide ou complementa a headline.
- Nunca genérico. Tudo adaptado ao nicho, persona e dores do cliente.
- Priorizar: números específicos, contrastes, listas, revelações inesperadas.
- Otimizado para mobile — leitura instantânea em 2 segundos por slide.

MÉTRICAS-ALVO:
- Salvamentos ≥ 8%
- Compartilhamentos ≥ 5%
- Alcance de não seguidores ≥ 60%

AUDITORIA ANTI-GENÉRICO: Se algum conteúdo puder servir para qualquer nicho, reescreva adaptando para o nicho e persona do cliente.${content_style ? `

ESTILO DE CONTEÚDO: ${content_style}

REGRAS DE PERSONALIZAÇÃO POR ESTILO (OBRIGATÓRIAS):
- Adapte tom, ritmo e vocabulário dos slides ao estilo "${content_style}".
- Linguagem natural, humana e estratégica — proibido tom robótico.
- Use exemplos reais do contexto do público do nicho.
- Foque em retenção, conexão e clareza.
- Ajuste o tom sem perder profissionalismo.
- Estilo é uma camada de tom, não substitui fidelidade ao nicho nem a lógica Conecta-Entretém-Vende.` : ""}`;

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
      userPrompt = `Crie um roteiro de carrossel para Instagram com 6 slides otimizado para ALCANCE DE NÃO SEGUIDORES.${idea_title ? ` Tema: ${idea_title}` : ""}${topic ? ` Palavras-chave: ${topic}` : ""}

ESTRUTURA OBRIGATÓRIA (6 slides):
S1 – HOOK: Gancho que interrompe o scroll. Máx 8 palavras headline.
S2 – PROBLEMA: Dor específica do público. Máx 8 palavras headline + 6 palavras conector.
S3 – SOLUÇÃO: Promessa clara. Máx 8 palavras headline + 6 palavras conector.
S4 – PROVA: Resultado ou dado concreto. Máx 8 palavras headline + 6 palavras conector.
S5 – MÉTODO: Passo simples e direto. Máx 8 palavras headline + 6 palavras conector.
S6 – CTA: Chamada para ação direta. Máx 8 palavras headline + 6 palavras conector.

Para cada slide gere: headline (máx 8 palavras), conector (máx 6 palavras), sugestão visual e alt text.
Gere também: legenda do post (120-180 palavras).`;

      toolSchema = {
        type: "function",
        function: {
          name: "generate_carousel_script",
          description: "Gera roteiro de carrossel com 6 slides para alcance de não seguidores",
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
                    headline: { type: "string", description: "Frase de impacto do slide (máx 8 palavras)" },
                    connector: { type: "string", description: "Texto conector curto (máx 6 palavras)" },
                    visual_suggestion: { type: "string" },
                    alt_text: { type: "string" },
                  },
                  required: ["slide_number", "slide_label", "headline", "connector", "visual_suggestion", "alt_text"],
                },
              },
              caption: { type: "string", description: "Legenda do post (120-180 palavras)" },
            },
            required: ["slides", "caption"],
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
