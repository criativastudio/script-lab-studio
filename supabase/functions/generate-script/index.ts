import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { briefing, target_audience, platform, video_duration, context_id, idea_id, idea_title, user_id } = body;

    // Enhanced mode: use strategic context + idea
    if (context_id && (idea_id || idea_title)) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { data: ctx } = await supabase
        .from("client_strategic_contexts")
        .select("*")
        .eq("id", context_id)
        .single();

      let ideaText = idea_title || "";
      let ideaDesc = "";
      if (idea_id) {
        const { data: idea } = await supabase.from("content_ideas").select("*").eq("id", idea_id).single();
        if (idea) {
          ideaText = idea.title;
          ideaDesc = idea.description || "";
        }
      }

      const contextBlock = ctx ? `
Contexto Estratégico do Cliente:
- Negócio: ${ctx.business_name}
- Nicho: ${ctx.business_niche || "N/A"}
- Produtos/Serviços: ${ctx.products_services || "N/A"}
- Público-alvo: ${ctx.target_audience || "N/A"}
- Persona: ${ctx.customer_persona || "N/A"}
- Tom de voz: ${ctx.tone_of_voice || "N/A"}
- Posicionamento: ${ctx.market_positioning || "N/A"}
- Dores: ${ctx.pain_points || "N/A"}
- Diferenciais: ${ctx.differentiators || "N/A"}
- Objetivos: ${ctx.marketing_objectives || "N/A"}
- Plataformas: ${(ctx.main_platforms || []).join(", ") || "N/A"}
- Estilo: ${ctx.communication_style || "N/A"}` : "";

      const systemPrompt = `Você é um roteirista profissional especializado em vídeos de marketing para redes sociais.
Crie roteiros completos e prontos para produção, otimizados para engajamento.

Cada roteiro deve conter:
1. GANCHO (hook de abertura impactante)
2. BRIEFING ESTRATÉGICO (objetivo do vídeo)
3. ESTRUTURA DO VÍDEO (cenas com indicações [CENA: descrição])
4. ROTEIRO DE FALA (texto completo para narração)
5. CTA (chamada para ação)
6. ESTILO DE GRAVAÇÃO SUGERIDO (dicas de produção)

Escreva em português brasileiro. Use o tom de voz e estilo do cliente.`;

      const userPrompt = `${contextBlock}

Ideia de Conteúdo: ${ideaText}
${ideaDesc ? `Descrição: ${ideaDesc}` : ""}
Plataforma: ${platform || "Instagram Reels"}
Duração: ${video_duration || "60s"}

Crie o roteiro completo baseado nesta ideia e no contexto estratégico do cliente.`;

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
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "Erro ao gerar roteiro" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const scriptContent = data.choices?.[0]?.message?.content || "";

      // Update idea status if idea_id provided
      if (idea_id) {
        await supabase.from("content_ideas").update({ status: "used" }).eq("id", idea_id);
      }

      return new Response(JSON.stringify({ script: scriptContent, title: ideaText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Legacy mode: original behavior
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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro ao gerar roteiro" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const scriptContent = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ script: scriptContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-script error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
