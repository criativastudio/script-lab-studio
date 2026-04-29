
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const QUESTION_INSTRUCTIONS: Record<string, string> = {
  ideal_audience: "perfis de público-alvo (quem consome este nicho)",
  pain_points: "principais dores, dúvidas e frustrações que o cliente deste nicho enfrenta",
  differentiators: "diferenciais competitivos típicos e desejáveis para empresas deste nicho",
  marketing_objective: "objetivos de marketing realistas para empresas deste nicho",
  content_type: "tipos/formatos de conteúdo que performam bem para este nicho",
  brand_voice: "tons de voz e estilos de comunicação adequados para este nicho",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { business_context, niche, question_key } = await req.json();

    if (!business_context?.trim()) {
      return new Response(JSON.stringify({ error: "business_context is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!question_key || !QUESTION_INSTRUCTIONS[question_key]) {
      return new Response(JSON.stringify({ error: "valid question_key is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const nichoText = niche?.trim() ? niche.trim() : "não especificado";
    const targetDescription = QUESTION_INSTRUCTIONS[question_key];

    const systemPrompt = `Você é um especialista em estratégia de conteúdo e marketing digital.

Sua tarefa: gerar 6 a 8 sugestões CURTAS (2 a 5 palavras cada) em Português (Brasil) que sejam ESPECÍFICAS para o nicho informado.

REGRAS OBRIGATÓRIAS:
1. As sugestões devem ser EXCLUSIVAMENTE pertinentes ao nicho "${nichoText}".
2. PROIBIDO sugestões genéricas como "público geral", "todos os públicos", "qualidade", "preço justo".
3. Cada chip deve ser concreto, específico e fazer sentido apenas para este nicho.
4. NÃO use emojis. NÃO use pontuação no final.
5. Use vocabulário nativo do nicho — termos que um profissional da área realmente usa.
6. Retorne APENAS via a função fornecida.`;

    const userPrompt = `Nicho do cliente: "${nichoText}"
Descrição breve do negócio: "${business_context}"

Gere 6 a 8 sugestões curtas para: ${targetDescription}.

Lembre-se: específicas para o nicho "${nichoText}", proibido genérico.`;

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
            name: "return_chips",
            description: "Return 6-8 contextual chip suggestions",
            parameters: {
              type: "object",
              properties: {
                chips: {
                  type: "array",
                  items: { type: "string" },
                  description: "6 to 8 short suggestion chips (2-5 words each) in Portuguese, specific to the niche",
                },
              },
              required: ["chips"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_chips" } },
      }),
    });

    if (!response.ok) {
      console.error("AI Gateway error:", response.status, await response.text());
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI processing failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ chips: [] }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify({ chips: parsed.chips || [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
