import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { type, contact, answers } = await req.json();

    if (
      !type ||
      !contact?.name?.trim() ||
      !contact?.email?.trim() ||
      !contact?.whatsapp?.trim() ||
      !contact?.business_name?.trim() ||
      !contact?.city?.trim()
    ) {
      return new Response(JSON.stringify({ error: "Dados de contato obrigatórios." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Build prompt
    const answersText = Object.entries(answers || {})
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const typeLabels: Record<string, string> = {
      posicionamento: "Posicionamento Digital",
      conteudo: "Estratégia de Conteúdo",
      autoridade: "Autoridade Digital",
    };

    const systemPrompt = `Você é um consultor especialista em marketing digital e posicionamento nas redes sociais.
Analise as respostas do quiz de diagnóstico e gere uma avaliação personalizada, profissional e construtiva.
Responda sempre em português brasileiro.`;

    const userPrompt = `Tipo de diagnóstico: ${typeLabels[type] || type}

Nome do lead: ${contact.name}

Respostas do quiz:
${answersText}

Gere um diagnóstico completo e personalizado baseado nessas respostas.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "diagnostic_result",
              description: "Return a structured diagnostic result for the quiz.",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "Overall score from 0 to 10." },
                  summary: { type: "string", description: "A brief 1-2 sentence summary of the diagnostic." },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 key strengths identified.",
                  },
                  weaknesses: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 key weaknesses or areas of attention.",
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 actionable recommendations.",
                  },
                },
                required: ["score", "summary", "strengths", "weaknesses", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "diagnostic_result" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) throw new Error("No structured response from AI");

    const diagnostic = JSON.parse(toolCall.function.arguments);

    // Persist lead in DB (service role bypasses RLS)
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceKey) {
        const supabase = createClient(supabaseUrl, serviceKey);
        await supabase.from("diagnostic_leads").insert({
          diagnostic_type: type,
          name: contact.name.trim(),
          phone: contact.whatsapp.trim(),
          email: contact.email.trim(),
          business_name: contact.business_name.trim(),
          city: contact.city.trim(),
          answers: answers || {},
          result: diagnostic,
          score: diagnostic?.score ?? null,
        });
      }
    } catch (insertErr) {
      console.error("Failed to persist diagnostic lead:", insertErr);
      // Do not block user — continue returning the result
    }

    return new Response(JSON.stringify(diagnostic), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-diagnostic error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
