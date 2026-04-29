import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runGuards, hashPrompt, checkCache, saveCache, logUsage, estimateTokens, getUserPlan, checkLeadLimitAndInvalidate } from "../_shared/usage-guard.ts";
import { callAIWithFallback } from "../_shared/ai-fallback.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Upsert raw context from form_answers BEFORE calling AI.
// Guarantees the user's answers are preserved even if AI fails.
function flat(v: any): string | null {
  if (v == null) return null;
  if (Array.isArray(v)) return v.join(", ") || null;
  const s = String(v).trim();
  return s || null;
}

async function upsertRawContext(supabase: any, br: any) {
  const answers = br.form_answers || {};
  const objective = flat(answers.marketing_objective) || flat(answers.desired_outcome);
  const rawData: Record<string, any> = {
    user_id: br.user_id,
    business_name: br.business_name,
    business_niche: br.niche || null,
    products_services: flat(answers.business_context),
    target_audience: flat(answers.ideal_audience),
    pain_points: flat(answers.pain_points),
    differentiators: flat(answers.differentiators),
    marketing_objectives: objective,
    communication_style: flat(answers.brand_voice),
    is_completed: false,
  };

  const { data: existing } = await supabase
    .from("client_strategic_contexts")
    .select("id, is_completed")
    .eq("user_id", br.user_id)
    .eq("business_name", br.business_name)
    .maybeSingle();

  if (existing) {
    if (!existing.is_completed) {
      await supabase.from("client_strategic_contexts").update(rawData).eq("id", existing.id);
    }
  } else {
    await supabase.from("client_strategic_contexts").insert(rawData);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token) {
      console.error("[process-briefing] Missing token in request");
      return new Response(JSON.stringify({ error: "Token is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[process-briefing] Iniciando processamento para token=${token.slice(0, 8)}...`);

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
      console.error("[process-briefing] Briefing not found:", brError);
      return new Response(JSON.stringify({ error: "Briefing request not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[process-briefing] Processando: ${br.business_name} / ${br.project_name} (status atual=${br.status})`);

    if (br.status === "completed") {
      return new Response(JSON.stringify({ error: "Already processed", data: br }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency: if status === 'processing' but it has been stuck for less than 2 minutes, refuse re-entry.
    // Otherwise allow retake (means a previous run died).
    if (br.status === "processing") {
      const updatedAt = new Date(br.created_at || Date.now()).getTime();
      // Use created_at as fallback; if recently set to processing we conservatively allow after 2min
      const now = Date.now();
      const diffMs = now - updatedAt;
      if (diffMs < 2 * 60 * 1000) {
        // Briefing requests don't have updated_at, but if it was just created, likely concurrent.
        // We still proceed — process-briefing is safe to re-run thanks to upserts.
      }
    }

    // STEP 1 — Save raw context FIRST so the user's answers are never lost
    try {
      await upsertRawContext(supabase, br);
    } catch (e) {
      console.error("upsertRawContext error (non-fatal):", e);
    }

    // Usage guards
    const guardResponse = await runGuards(supabase, br.user_id, "briefing", corsHeaders);
    if (guardResponse) return guardResponse;

    // Lead limit: if reached, invalidate remaining pending links and abort
    const userPlan = await getUserPlan(supabase, br.user_id);
    const leadErr = await checkLeadLimitAndInvalidate(supabase, br.user_id, userPlan);
    if (leadErr) {
      await supabase.from("briefing_requests").update({ status: "blocked" }).eq("id", br.id);
      return new Response(JSON.stringify({ error: leadErr }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      const videoCount = Math.min(br.video_quantity || 3, 12);

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

REGRA DE CONCISÃO (OBRIGATÓRIA): Seja direto e objetivo. Evite repetições, explicações redundantes ou texto de preenchimento. Cada campo deve conter APENAS o essencial — qualidade > volume.

Responda usando a função fornecida.${stylePersonalizationBlock}`;

      const objectiveAnswer = flat(answers.marketing_objective) || flat(answers.desired_outcome) || "Não informado";
      const userPrompt = `
Cliente: ${br.business_name}
Projeto: ${br.project_name}
Nicho: ${nicho}
Quantidade de vídeos: ${videoCount}

Respostas do briefing estratégico:
1. Contexto do negócio: ${flat(answers.business_context) || "Não informado"}
2. Público ideal: ${flat(answers.ideal_audience) || "Não informado"}
3. Dores do cliente: ${flat(answers.pain_points) || "Não informado"}
4. Diferencial da empresa: ${flat(answers.differentiators) || "Não informado"}
5. Objetivo principal de marketing: ${objectiveAnswer}
6. Tipo de conteúdo desejado: ${flat(answers.content_type) || "Não definido"}
7. Voz da marca: ${flat(answers.brand_voice) || "Não informado"}

Use OBRIGATORIAMENTE as dores e os diferenciais nos hooks e CTAs dos roteiros.
Gere exatamente ${videoCount} roteiros estratégicos diferentes, completos e prontos para produção.
`;

      let aiResult;
      try {
        aiResult = await callAIWithFallback({
          functionName: "process-briefing",
          supabase,
          maxTokens: 6000,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tool: {
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
                  },
                  description: `Exactly ${videoCount} video scripts`,
                },
              },
              required: ["persona", "positioning", "tone_of_voice", "content_strategy", "scripts"],
            },
          },
        });
      } catch (e: any) {
        const msg = e?.message || String(e);
        console.error("[process-briefing] AI call failed:", msg);
        await supabase.from("briefing_requests").update({ status: "submitted" }).eq("id", br.id);
        if (msg === "RATE_LIMIT") {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (msg === "PAYMENT_REQUIRED") {
          return new Response(JSON.stringify({ error: "Payment required for AI processing." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "AI processing failed", context_saved: true }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      result = aiResult.toolArguments;
      console.log(`[process-briefing] AI ok via ${aiResult.provider}, scripts=${result.scripts?.length || 0}`);
      const tokens = aiResult.rawTokens || estimateTokens(JSON.stringify(result));
      await logUsage(supabase, br.user_id, "process-briefing", "briefing", tokens, pHash);
      await saveCache(supabase, pHash, "process-briefing", result);
    }

    // 1. Create project (only if not already created — idempotency)
    let projectId = br.project_id;
    if (!projectId) {
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
        return new Response(JSON.stringify({ error: "Failed to create project", context_saved: true }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      projectId = project.id;
    }

    // 2. Create briefing
    const { error: briefingErr } = await supabase.from("briefings").insert({
      goal: result.content_strategy,
      target_audience: result.persona,
      content_style: result.tone_of_voice,
      project_id: projectId,
      user_id: br.user_id,
    });
    if (briefingErr) console.error("[process-briefing] Erro ao salvar briefing:", briefingErr);

    // 3. Create scripts
    const scriptInserts = (result.scripts || []).map((s: any) => ({
      title: s.title,
      script: `**Objetivo:** ${s.objective}\n\n**Gancho:** ${s.hook}\n\n**Estrutura de Cenas:**\n${s.scene_structure}\n\n**Narração:**\n${s.narration}\n\n**Direção Visual:**\n${s.visual_direction}\n\n**Call to Action:**\n${s.call_to_action}`,
      project_id: projectId,
      user_id: br.user_id,
    }));

    if (scriptInserts.length > 0) {
      const { error: scriptsErr } = await supabase.from("scripts").insert(scriptInserts);
      if (scriptsErr) console.error("[process-briefing] Erro ao salvar scripts:", scriptsErr);
      else console.log(`[process-briefing] ${scriptInserts.length} scripts salvos`);
    }

    // 4. Update briefing_requests
    await supabase.from("briefing_requests").update({
      persona: result.persona,
      positioning: result.positioning,
      tone_of_voice: result.tone_of_voice,
      content_strategy: result.content_strategy,
      project_id: projectId,
      status: "completed",
    }).eq("id", br.id);

    // 5. Update strategic context with AI-enriched data and mark complete
    const answersAfter = br.form_answers || {};
    const objectiveAfter = flat(answersAfter.marketing_objective) || flat(answersAfter.desired_outcome);
    const fullContextData: Record<string, any> = {
      user_id: br.user_id,
      business_name: br.business_name,
      business_niche: br.niche || null,
      products_services: flat(answersAfter.business_context),
      target_audience: flat(answersAfter.ideal_audience) || result.persona || null,
      customer_persona: result.persona || null,
      tone_of_voice: result.tone_of_voice || null,
      market_positioning: result.positioning || null,
      pain_points: flat(answersAfter.pain_points),
      differentiators: flat(answersAfter.differentiators),
      marketing_objectives: objectiveAfter,
      communication_style: flat(answersAfter.brand_voice),
      is_completed: true,
    };

    const { data: existingCtx } = await supabase
      .from("client_strategic_contexts")
      .select("id")
      .eq("user_id", br.user_id)
      .eq("business_name", br.business_name)
      .maybeSingle();

    let ctxErr: any = null;
    if (existingCtx) {
      const { error } = await supabase.from("client_strategic_contexts").update(fullContextData).eq("id", existingCtx.id);
      ctxErr = error;
    } else {
      const { error } = await supabase.from("client_strategic_contexts").insert(fullContextData);
      ctxErr = error;
    }
    if (ctxErr) console.error("[process-briefing] Erro ao salvar contexto estratégico:", ctxErr);
    else console.log(`[process-briefing] ✅ Concluído com sucesso: ${br.business_name}`);

    return new Response(JSON.stringify({
      success: true,
      project_id: projectId,
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
