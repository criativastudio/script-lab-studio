import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const toneRules: Record<string, string> = {
  educacional: `Tom EDUCACIONAL: Use linguagem didática e acessível. Explique conceitos passo a passo. Use analogias e exemplos práticos. Posicione o cliente como professor/mentor. Evite jargões sem explicação. Estruture com "você sabia que...", "o segredo é...", "aqui está o passo a passo...".`,
  autoridade: `Tom de AUTORIDADE: Use linguagem firme e assertiva. Cite dados, resultados e cases. Posicione como especialista referência. Use frases como "na minha experiência...", "o que os dados mostram é...", "a verdade que ninguém conta...". Transmita confiança absoluta.`,
  casual: `Tom CASUAL: Use linguagem coloquial e próxima. Fale como amigo dando conselho. Use humor leve e expressões do dia a dia. Pode usar gírias moderadas. Crie conexão emocional. Use "olha só...", "vou te contar um negócio...", "sabe aquele momento que...".`,
  influencer: `Tom INFLUENCER: Use linguagem energética e engajante. Crie urgência e FOMO. Use expressões virais e trending. Fale direto com a câmera como se fosse stories. Use CTAs fortes. Expressões como "gente, vocês não vão acreditar...", "eu PRECISO compartilhar isso...", "salva esse vídeo...".`,
  storytelling: `Tom STORYTELLING: Estruture como narrativa com início, meio e fim. Comece com uma situação/problema. Desenvolva tensão. Apresente a virada/solução. Use elementos emocionais. Frases como "tudo começou quando...", "e foi aí que eu descobri...", "o resultado? ...".`,
  vendas_diretas: `Tom de VENDAS DIRETAS: Foque em benefícios e transformação. Use gatilhos mentais (escassez, prova social, autoridade). Apresente o problema → agite → resolva. CTAs diretos e urgentes. Use "imagine poder...", "e se eu te dissesse que...", "últimas vagas...", "resultado garantido...".`,
};

function getToneInstructions(communicationStyle: string | null): string {
  if (!communicationStyle) return "";
  const key = communicationStyle.toLowerCase().replace(/[^a-zà-ú_]/g, "_");
  for (const [k, v] of Object.entries(toneRules)) {
    if (key.includes(k)) return v;
  }
  return `Adapte o tom de comunicação para: ${communicationStyle}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { briefing, target_audience, platform, video_duration, context_id, idea_id, idea_title, user_id, project_id } = body;

    // Enhanced mode: use strategic context + idea
    if (context_id && (idea_id || idea_title)) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Layer 1: Strategic Context
      const { data: ctx } = await supabase
        .from("client_strategic_contexts")
        .select("*")
        .eq("id", context_id)
        .single();

      // Layer 3: Content Idea
      let ideaText = idea_title || "";
      let ideaDesc = "";
      let resolvedProjectId = project_id;
      if (idea_id) {
        const { data: idea } = await supabase.from("content_ideas").select("*").eq("id", idea_id).single();
        if (idea) {
          ideaText = idea.title;
          ideaDesc = idea.description || "";
          if (!resolvedProjectId) resolvedProjectId = idea.project_id;
        }
      }

      // Layer 2: Project Context
      let projectBlock = "";
      if (resolvedProjectId) {
        const { data: project } = await supabase.from("projects").select("*").eq("id", resolvedProjectId).single();
        if (project) {
          projectBlock = `
Contexto do Projeto (Layer 2 — Campanha):
- Objetivo da campanha: ${project.campaign_objective || project.objective || "N/A"}
- Etapa do funil: ${project.funnel_stage || "N/A"}
- Estilo de conteúdo: ${project.content_style || "N/A"}
- Frequência de publicação: ${project.publishing_frequency || "N/A"}
- Plataforma: ${project.platform || platform || "Instagram Reels"}
- Quantidade de vídeos: ${project.video_count || "N/A"}`;
        }
      }

      // Content Memory: query previous scripts to avoid repetition
      let memoryBlock = "";
      if (ctx?.user_id) {
        const { data: prevScripts } = await supabase
          .from("scripts")
          .select("title")
          .eq("user_id", ctx.user_id)
          .order("created_at", { ascending: false })
          .limit(50);
        if (prevScripts && prevScripts.length > 0) {
          const prevTitles = prevScripts.map(s => s.title).filter(Boolean).join("\n- ");
          memoryBlock = `
REGRA DE DIVERSIDADE — Tópicos já gerados para este cliente (NÃO repita estes temas, ângulos ou ganchos similares):
- ${prevTitles}

Você DEVE criar um ângulo completamente novo e diferente dos listados acima.`;
        }
      }

      // Tone adaptation
      const toneInstructions = getToneInstructions(ctx?.communication_style);

      const contextBlock = ctx ? `
Contexto Estratégico do Cliente (Layer 1 — Permanente):
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
- Estilo de comunicação: ${ctx.communication_style || "N/A"}` : "";

      const systemPrompt = `Você é um roteirista estratégico profissional especializado em vídeos de marketing para redes sociais.

Siga este pipeline de geração em 5 etapas obrigatórias:

ETAPA 1 — ÂNGULO ESTRATÉGICO: Analise o contexto do cliente, projeto e ideia. Derive um ângulo estratégico único que conecte a dor do público com o diferencial do negócio.

ETAPA 2 — OPÇÕES DE GANCHO: Crie 3 opções de gancho (hook) de abertura. Escolha o melhor e use-o. Os ganchos devem parar o scroll em 3 segundos.

ETAPA 3 — BRIEFING ESTRATÉGICO: Defina o objetivo do vídeo, a mensagem central, e como ele se encaixa no funil de vendas.

ETAPA 4 — ROTEIRO DE FALA: Escreva o texto completo que será falado, palavra por palavra, otimizado para a plataforma e duração.

ETAPA 5 — CTA: Crie uma chamada para ação alinhada com a etapa do funil (topo = engajamento, meio = consideração, fundo = conversão).

${toneInstructions}

Escreva em português brasileiro. Adapte ao tom de voz e estilo do cliente.
Retorne o resultado usando a função generate_strategic_script.`;

      const userPrompt = `${contextBlock}
${projectBlock}
${memoryBlock}

Ideia de Conteúdo (Layer 3): ${ideaText}
${ideaDesc ? `Descrição da ideia: ${ideaDesc}` : ""}
Plataforma: ${platform || "Instagram Reels"}
Duração: ${video_duration || "60s"}

Gere o roteiro estratégico completo seguindo o pipeline de 5 etapas.`;

      const tools = [
        {
          type: "function",
          function: {
            name: "generate_strategic_script",
            description: "Gera um roteiro estratégico estruturado para vídeo de marketing",
            parameters: {
              type: "object",
              properties: {
                hook: {
                  type: "string",
                  description: "O gancho de abertura escolhido (melhor dos 3 gerados). Deve parar o scroll em 3 segundos.",
                },
                strategic_briefing: {
                  type: "string",
                  description: "Briefing estratégico: objetivo do vídeo, mensagem central, posição no funil.",
                },
                video_structure: {
                  type: "string",
                  description: "Estrutura do vídeo com indicações de cena [CENA: descrição] e tempos.",
                },
                speaking_script: {
                  type: "string",
                  description: "Roteiro de fala completo, palavra por palavra, pronto para gravação.",
                },
                cta: {
                  type: "string",
                  description: "Chamada para ação alinhada com a etapa do funil.",
                },
                recording_style: {
                  type: "string",
                  description: "Sugestão de estilo de gravação: enquadramento, cenário, edição, ritmo.",
                },
              },
              required: ["hook", "strategic_briefing", "video_structure", "speaking_script", "cta", "recording_style"],
            },
          },
        },
      ];

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
          tools,
          tool_choice: { type: "function", function: { name: "generate_strategic_script" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const errorText = await response.text();
        console.error("AI gateway error:", status, errorText);
        return new Response(JSON.stringify({ error: "Erro ao gerar roteiro" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      
      // Try structured tool call output first
      let scriptContent = "";
      let structured: Record<string, string> | null = null;
      
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const args = typeof toolCall.function.arguments === "string" 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function.arguments;
          structured = args;
          // Build formatted script from structured sections
          scriptContent = `## GANCHO (HOOK)
${args.hook}

## BRIEFING ESTRATÉGICO
${args.strategic_briefing}

## ESTRUTURA DO VÍDEO
${args.video_structure}

## ROTEIRO DE FALA
${args.speaking_script}

## CTA (CHAMADA PARA AÇÃO)
${args.cta}

## ESTILO DE GRAVAÇÃO SUGERIDO
${args.recording_style}`;
        } catch (e) {
          console.error("Failed to parse tool call args:", e);
        }
      }
      
      // Fallback to regular content
      if (!scriptContent) {
        scriptContent = data.choices?.[0]?.message?.content || "";
      }

      // Update idea status
      if (idea_id) {
        await supabase.from("content_ideas").update({ status: "used" }).eq("id", idea_id);
      }

      return new Response(JSON.stringify({ 
        script: scriptContent, 
        title: ideaText,
        structured,
      }), {
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
