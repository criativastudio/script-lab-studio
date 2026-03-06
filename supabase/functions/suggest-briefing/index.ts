import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { business_context, previous_answers, current_step } = await req.json();
    
    if (!business_context?.trim()) {
      return new Response(JSON.stringify({ error: "business_context is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const step = typeof current_step === "number" ? current_step : 0;
    const prev = previous_answers || {};

    // Build context block from previous answers
    const contextLines: string[] = [`Descrição do negócio: "${business_context}"`];
    if (prev.ideal_audience) contextLines.push(`Público informado: "${Array.isArray(prev.ideal_audience) ? prev.ideal_audience.join(", ") : prev.ideal_audience}"`);
    if (prev.desired_outcome) contextLines.push(`Resultado desejado: "${Array.isArray(prev.desired_outcome) ? prev.desired_outcome.join(", ") : prev.desired_outcome}"`);
    if (prev.brand_voice) contextLines.push(`Voz da marca: "${Array.isArray(prev.brand_voice) ? prev.brand_voice.join(", ") : prev.brand_voice}"`);

    // Determine which chip sets to generate based on remaining steps
    const neededChips: string[] = [];
    const properties: Record<string, any> = {};
    const required: string[] = [];

    if (step <= 0) {
      neededChips.push("audience_chips (6-8 sugestões de público-alvo)");
      properties.audience_chips = { type: "array", items: { type: "string" }, description: "6-8 audience suggestion chips in Portuguese" };
      required.push("audience_chips");
    }
    if (step <= 1) {
      neededChips.push("outcome_chips (5-6 sugestões de resultado desejado)");
      properties.outcome_chips = { type: "array", items: { type: "string" }, description: "5-6 desired outcome chips in Portuguese" };
      required.push("outcome_chips");
    }
    if (step <= 2) {
      neededChips.push("voice_chips (5-6 sugestões de voz da marca)");
      properties.voice_chips = { type: "array", items: { type: "string" }, description: "5-6 brand voice chips in Portuguese" };
      required.push("voice_chips");
    }

    if (required.length === 0) {
      return new Response(JSON.stringify({}), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const systemPrompt = `Você é um especialista em estratégia de conteúdo e marketing digital.

Sua tarefa: gerar sugestões contextuais (chips) para um formulário de briefing de vídeos. As sugestões devem ser em Português (Brasil), concisas (2-6 palavras cada).

REGRAS OBRIGATÓRIAS:
1. Analise TODAS as informações já fornecidas pelo cliente antes de gerar sugestões.
2. As sugestões devem ser específicas e coerentes com o nicho/segmento do negócio descrito.
3. Priorize perfis de público que realmente consumiriam o produto ou serviço.
4. Se houver informação de localização ou região, inclua sugestões relacionadas ao público local.
5. Sugira opções que o cliente talvez não tenha considerado, mas que façam sentido para o negócio.
6. NUNCA gere sugestões genéricas como "público geral" ou "todos os públicos".
7. Cada chip deve ser curto e objetivo (2-6 palavras).
8. Se o cliente já informou respostas anteriores, use-as para refinar e contextualizar as próximas sugestões.

Exemplo: Para uma "Confeitaria artesanal em Curitiba", chips de público poderiam ser:
- "Noivas planejando casamento"
- "Empresas buscando brindes premium"  
- "Moradores de Curitiba"
- "Amantes de doces gourmet"
- "Mães organizando festas infantis"
- "Casais em datas comemorativas"`;

    const userPrompt = `Contexto completo do cliente:
${contextLines.join("\n")}

Com base nessas informações, gere sugestões contextualizadas para:
${neededChips.join("\n")}

Lembre-se: as sugestões devem ser ESPECÍFICAS para este negócio, não genéricas.`;

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
            name: "return_suggestions",
            description: "Return contextual chip suggestions for briefing form questions",
            parameters: {
              type: "object",
              properties,
              required,
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_suggestions" } },
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
      return new Response(JSON.stringify({ error: "No structured response" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(suggestions), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("suggest-briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
