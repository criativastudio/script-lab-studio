import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runGuards, hashPrompt, checkCache, saveCache, logUsage, estimateTokens } from "../_shared/usage-guard.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Token is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch the briefing request
    const { data: br, error: brError } = await supabase
      .from("briefing_requests")
      .select("*")
      .eq("token", token)
      .single();

    if (brError || !br) {
      return new Response(JSON.stringify({ error: "Briefing request not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (br.status === "completed") {
      return new Response(JSON.stringify({ error: "Already processed", data: br }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usage guards
    const guardResponse = await runGuards(supabase, br.user_id, "briefing", corsHeaders);
    if (guardResponse) return guardResponse;

    // Cache check
    const answers = br.form_answers || {};
    const promptContent = JSON.stringify({ business_name: br.business_name, project_name: br.project_name, video_quantity: br.video_quantity, answers });
    const pHash = await hashPrompt(promptContent);
    const cached = await checkCache(supabase, pHash);

    // Update status to processing
    await supabase.from("briefing_requests").update({ status: "processing" }).eq("id", br.id);

    let result: any;

    if (cached) {
      result = cached;
      await logUsage(supabase, br.user_id, "process-briefing", "briefing", 0, pHash);
    } else {
      const videoCount = br.video_quantity || 3;

      const nicho = br.niche || "não especificado";
      const contentType = answers.content_type || null;
      const contentStyle = answers.content_style || null;
      const editorialLines: string[] = Array.isArray(answers.editorial_lines) ? answers.editorial_lines : [];
      const editorialMode: string = answers.editorial_mode || (editorialLines.length === 0 ? "auto" : "manual");

      const editorialBlock = `

LINHA EDITORIAL (estratégia / objetivo do conteúdo):
- Modo: ${editorialMode === "auto"
        ? "AUTOMÁTICO — você decide a melhor combinação de linhas editoriais com base no briefing, persona e momento do funil."
        : "MANUAL — use EXCLUSIVAMENTE as seguintes linhas editoriais: " + editorialLines.join(", ") + "."}
- Distribua os ${videoCount} conteúdos equilibrando as linhas escolhidas (no modo manual) ou siga jornada Topo→Meio→Fundo proporcional (no modo automático).
- Linha editorial = OBJETIVO estratégico. Estilo = FORMA de comunicação. Combine ambos sem que um anule o outro.
- Foco obrigatório: retenção (primeiros 3s), conexão (identificação com a persona) e conversão (CTA orgânico).
- Linguagem natural e específica do nicho — proibido genérico ou óbvio.`;

      const stylePersonalizationBlock = (contentType || contentStyle) ? `

TIPO DE CONTEÚDO ALVO: ${contentType || "Não definido"}
ESTILO DE CONTEÚDO: ${contentStyle || "Não definido"}

REGRAS DE PERSONALIZAÇÃO POR ESTILO (OBRIGATÓRIAS):
- Adapte tom, ritmo, vocabulário e exemplos ao estilo "${contentStyle || "padrão"}".
- Linguagem natural, humana e estratégica — proibido tom robótico.
- Use exemplos reais do contexto do público do nicho.
- Foque em retenção, conexão e clareza.
- Ajuste o tom sem perder profissionalismo.
- Estilo é uma camada de tom, não substitui fidelidade ao nicho nem a lógica Conecta-Entretém-Vende.
${contentType === "Carrossel" ? "- FORMATO: Estruture cada script como SLIDES (S1 a S6) de carrossel para Instagram (headline curta + conector entre slides), em vez de roteiro de vídeo. Use os campos hook=S1, scene_structure=descrição dos slides, narration=texto de cada slide numerado, call_to_action=S6." : ""}${editorialBlock}` : editorialBlock;

      const systemPrompt = `Você é um estrategista de conteúdo audiovisual profissional de alto nível. A partir de respostas condensadas de um briefing estratégico com apenas 4 perguntas, você deve:

REGRA DE FIDELIDADE AO NICHO (OBRIGATÓRIA):
- Use EXCLUSIVAMENTE vocabulário, termos técnicos e expressões nativas do nicho "${nicho}" do cliente.
- PROIBIDO misturar metáforas, analogias ou estilos de comunicação de outros mercados ou nichos.
- Toda referência, exemplo, caso e linguagem deve fazer sentido 100% dentro do contexto profissional do cliente.
- Antes de finalizar, valide internamente: "Este conteúdo soaria natural vindo de um profissional deste nicho específico?" Se não, reescreva.
- Evite analogias genéricas que servem para qualquer nicho (ex: "transforme sua vida", "destaque-se da multidão").
- Mantenha coerência absoluta entre posicionamento, tom de voz e vocabulário do nicho.

LÓGICA DE CONTEÚDO "CONECTA-ENTRETÉM-VENDE" (OBRIGATÓRIA para todos os roteiros gerados):
1. ABERTURA POR IDENTIFICAÇÃO: cada hook deve começar com problema, situação ou pensamento comum do público — nunca saudação ou anúncio direto.
2. STORYTELLING NATURAL: a narração deve fluir como história, não como pitch comercial.
3. ENTRETENIMENTO ANTES DE VENDA: os primeiros segundos prendem atenção e geram conexão; tom de anúncio é PROIBIDO na abertura.
4. OFERTA ORGÂNICA: o call_to_action deve emergir da história — nunca soar como bloco isolado de venda.
5. EXPERIÊNCIA PRÁTICA: priorize uso real, bastidores, resultado concreto sobre teoria.
6. ANTI-ENGESSAMENTO: hook, scene_structure, narration e call_to_action são campos estruturais internos — a narração final deve fluir como fala natural, não como esqueleto rotulado.
7. ANTI-PROPAGANDA: antes de finalizar, valide "Isso parece anúncio?" — se sim, reescreva como conversa, história ou observação genuína.
OBJETIVO FINAL: roteiros que conectam, entretêm e vendem sem parecer venda.

1. INFERIR o contexto estratégico completo do negócio:
   - Nicho de mercado
   - Persona detalhada do cliente ideal
   - Dores e motivações do público-alvo
   - Posicionamento de marca
   - Tom de voz adequado
   - Estratégia de conteúdo
   - Categorias de vídeo recomendadas
   - Etapas do funil de conteúdo

2. GERAR roteiros completos e prontos para produção baseados nessa análise.

Responda usando a função fornecida.${stylePersonalizationBlock}`;

      const userPrompt = `
Cliente: ${br.business_name}
Projeto: ${br.project_name}
Quantidade de vídeos: ${videoCount}

Respostas do briefing estratégico:
1. Contexto do negócio (o que faz, para quem vende, problema que resolve): ${answers.business_context || "Não informado"}
2. Público ideal para os vídeos: ${answers.ideal_audience || "Não informado"}
3. Resultado desejado (ação dos espectadores): ${JSON.stringify(answers.desired_outcome || [])}
4. Voz da marca: ${JSON.stringify(answers.brand_voice || [])}

A partir dessas 4 respostas, infira toda a estratégia de conteúdo e gere exatamente ${videoCount} roteiros estratégicos diferentes. Cada roteiro deve ser completo e pronto para produção.
`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          max_tokens: 3700,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_briefing_and_scripts",
              description: "Generate strategic briefing and video scripts",
              parameters: {
                type: "object",
                properties: {
                  persona: { type: "string", description: "Detailed customer persona description" },
                  positioning: { type: "string", description: "Brand positioning strategy" },
                  tone_of_voice: { type: "string", description: "Recommended tone of voice for content" },
                  content_strategy: { type: "string", description: "Overall content strategy" },
                  scripts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        objective: { type: "string" },
                        hook: { type: "string" },
                        scene_structure: { type: "string" },
                        narration: { type: "string" },
                        visual_direction: { type: "string" },
                        call_to_action: { type: "string" },
                      },
                      required: ["title", "objective", "hook", "scene_structure", "narration", "visual_direction", "call_to_action"],
                      additionalProperties: false,
                    },
                    description: `Exactly ${videoCount} video scripts`,
                  },
                },
                required: ["persona", "positioning", "tone_of_voice", "content_strategy", "scripts"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_briefing_and_scripts" } },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("AI Gateway error:", response.status, errText);
        await supabase.from("briefing_requests").update({ status: "submitted" }).eq("id", br.id);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Payment required for AI processing." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "AI processing failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await response.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        await supabase.from("briefing_requests").update({ status: "submitted" }).eq("id", br.id);
        return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      result = JSON.parse(toolCall.function.arguments);
      const tokens = estimateTokens(JSON.stringify(result));
      await logUsage(supabase, br.user_id, "process-briefing", "briefing", tokens, pHash);
      await saveCache(supabase, pHash, "process-briefing", result);
    }

    // 1. Create project
    const { data: project, error: projErr } = await supabase.from("projects").insert({
      name: br.project_name,
      client_name: br.business_name,
      objective: result.content_strategy?.substring(0, 200),
      platform: "Multi-plataforma",
      user_id: br.user_id,
      status: "active",
    }).select("id").single();

    if (projErr) {
      console.error("Project creation error:", projErr);
      await supabase.from("briefing_requests").update({ status: "submitted" }).eq("id", br.id);
      return new Response(JSON.stringify({ error: "Failed to create project" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Create briefing
    await supabase.from("briefings").insert({
      goal: result.content_strategy,
      target_audience: result.persona,
      content_style: result.tone_of_voice,
      project_id: project.id,
      user_id: br.user_id,
    });

    // 3. Create scripts
    const scriptInserts = (result.scripts || []).map((s: any) => ({
      title: s.title,
      script: `**Objetivo:** ${s.objective}\n\n**Gancho:** ${s.hook}\n\n**Estrutura de Cenas:**\n${s.scene_structure}\n\n**Narração:**\n${s.narration}\n\n**Direção Visual:**\n${s.visual_direction}\n\n**Call to Action:**\n${s.call_to_action}`,
      project_id: project.id,
      user_id: br.user_id,
    }));

    if (scriptInserts.length > 0) {
      await supabase.from("scripts").insert(scriptInserts);
    }

    // 4. Update briefing_requests
    await supabase.from("briefing_requests").update({
      persona: result.persona,
      positioning: result.positioning,
      tone_of_voice: result.tone_of_voice,
      content_strategy: result.content_strategy,
      project_id: project.id,
      status: "completed",
    }).eq("id", br.id);

    // 5. Create/update strategic context
    const contextData: Record<string, any> = {
      user_id: br.user_id,
      business_name: br.business_name,
      business_niche: br.niche || null,
      products_services: answers.business_context || null,
      target_audience: answers.ideal_audience || result.persona || null,
      customer_persona: result.persona || null,
      tone_of_voice: result.tone_of_voice || null,
      market_positioning: result.positioning || null,
      pain_points: null,
      differentiators: null,
      marketing_objectives: Array.isArray(answers.desired_outcome)
        ? answers.desired_outcome.join(", ")
        : (answers.desired_outcome || null),
      main_platforms: [],
      communication_style: Array.isArray(answers.brand_voice)
        ? answers.brand_voice.join(", ")
        : (answers.brand_voice || null),
      is_completed: true,
    };

    const { data: existingCtx } = await supabase
      .from("client_strategic_contexts")
      .select("id")
      .eq("user_id", br.user_id)
      .eq("business_name", br.business_name)
      .single();

    if (existingCtx) {
      await supabase.from("client_strategic_contexts").update(contextData).eq("id", existingCtx.id);
    } else {
      await supabase.from("client_strategic_contexts").insert(contextData);
    }

    return new Response(JSON.stringify({
      success: true,
      project_id: project.id,
      persona: result.persona,
      positioning: result.positioning,
      tone_of_voice: result.tone_of_voice,
      content_strategy: result.content_strategy,
      scripts_count: scriptInserts.length,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("process-briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
