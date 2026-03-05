import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { briefing, target_audience, platform, video_duration } = await req.json();

    if (!briefing || !target_audience || !platform || !video_duration) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: briefing, target_audience, platform, video_duration" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um roteirista profissional especializado em vídeos de marketing para redes sociais.
Seu objetivo é criar roteiros envolventes, persuasivos e otimizados para a plataforma indicada.

Diretrizes:
- Escreva em português brasileiro
- Use linguagem adequada ao público-alvo
- Estruture o roteiro com: GANCHO (abertura), DESENVOLVIMENTO, CTA (chamada para ação)
- Inclua indicações de cena entre colchetes [CENA: descrição]
- Inclua indicações de texto na tela entre parênteses (TEXTO NA TELA: conteúdo)
- Adapte o tom e ritmo à duração e plataforma
- Para vídeos curtos (15s-30s): seja direto e impactante
- Para vídeos médios (60s): desenvolva uma mini-narrativa
- Para vídeos longos (3min+): crie uma estrutura completa com storytelling`;

    const userPrompt = `Crie um roteiro de vídeo de marketing com as seguintes especificações:

**Briefing:** ${briefing}
**Público-alvo:** ${target_audience}
**Plataforma:** ${platform}
**Duração do vídeo:** ${video_duration}

Gere o roteiro completo e otimizado.`;

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
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao gerar roteiro" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const scriptContent = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ script: scriptContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
