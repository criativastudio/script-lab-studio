import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runGuards, hashPrompt, checkCache, saveCache, logUsage, validateInputLength, estimateTokens, requireAuth } from "../_shared/usage-guard.ts";
import { callAIWithFallback } from "../_shared/ai-fallback.ts";
import { buildCategoryPrompt } from "../_shared/script-categories.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireAuth(req, corsHeaders);
    if (auth.response) return auth.response;
    const user_id = auth.userId;

    const {
      objective, target_audience, platform, hook, duration, notes, video_quantity, business_name, niche,
      customer_persona, tone_of_voice, market_positioning, communication_style,
      products_services, pain_points, differentiators, marketing_objectives,
      content_type, content_style, editorial_lines, editorial_mode,
      script_category, script_objective, funnel_stage, voice_tone, audience_temperature,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!objective || !target_audience || !platform) {
      return new Response(JSON.stringify({ error: "Campos obrigatórios: objetivo, público-alvo e plataforma." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Input validation
    const inputErr = validateInputLength({ objective, target_audience, platform, hook, notes, business_name, niche }, 2000);
    if (inputErr) {
      return new Response(JSON.stringify({ error: inputErr }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usage guards
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const guardResponse = await runGuards(supabase, user_id, "briefing", corsHeaders);
    if (guardResponse) return guardResponse;

    // Cache check
    const promptContent = JSON.stringify({ objective, target_audience, platform, hook, duration, notes, video_quantity, business_name, niche, script_category, script_objective, funnel_stage, voice_tone, audience_temperature });
    const pHash = await hashPrompt(promptContent);
    const cached = await checkCache(supabase, pHash);
    if (cached) {
      await logUsage(supabase, user_id, "manual-generate", "briefing", 0, pHash);
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const qty = video_quantity || 1;
    const bName = business_name || "a empresa";
    const bNiche = niche || "geral";

    // Build enriched context from strategic fields if available
    const contextBlock = customer_persona || tone_of_voice || market_positioning
      ? `\n\nContexto estratégico do cliente:
- Persona: ${customer_persona || "Não informado"}
- Tom de Voz: ${tone_of_voice || "Não informado"}
- Posicionamento: ${market_positioning || "Não informado"}
- Estilo de Comunicação: ${communication_style || "Não informado"}
- Produtos/Serviços: ${products_services || "Não informado"}
- Dores do Público: ${pain_points || "Não informado"}
- Diferenciais: ${differentiators || "Não informado"}
- Objetivos de Marketing: ${marketing_objectives || "Não informado"}`
      : "";

    const _editorialLines: string[] = Array.isArray(editorial_lines) ? editorial_lines : [];
    const _editorialMode: string = editorial_mode || (_editorialLines.length === 0 ? "auto" : "manual");
    const editorialBlock = `

LINHA EDITORIAL (estratégia / objetivo do conteúdo):
- Modo: ${_editorialMode === "auto"
      ? "AUTOMÁTICO — você decide a melhor combinação de linhas editoriais com base no briefing, persona e momento do funil."
      : "MANUAL — use EXCLUSIVAMENTE as seguintes linhas editoriais: " + _editorialLines.join(", ") + "."}
- Distribua os ${qty} conteúdos equilibrando as linhas escolhidas (no modo manual) ou siga jornada Topo→Meio→Fundo proporcional (no modo automático).
- Linha editorial = OBJETIVO estratégico. Estilo = FORMA de comunicação. Combine ambos sem que um anule o outro.
- Foco obrigatório: retenção (primeiros 3s), conexão (identificação com a persona) e conversão (CTA orgânico).
- Linguagem natural e específica do nicho — proibido genérico ou óbvio.`;

    const stylePersonalizationBlock = (content_type || content_style) ? `

TIPO DE CONTEÚDO ALVO: ${content_type || "Não definido"}
ESTILO DE CONTEÚDO: ${content_style || "Não definido"}

REGRAS DE PERSONALIZAÇÃO POR ESTILO (OBRIGATÓRIAS):
- Adapte tom, ritmo, vocabulário e exemplos ao estilo "${content_style || "padrão"}".
- Linguagem natural, humana e estratégica — proibido tom robótico.
- Use exemplos reais do contexto do público do nicho.
- Foque em retenção, conexão e clareza.
- Ajuste o tom sem perder profissionalismo.
- Estilo é uma camada de tom, não substitui fidelidade ao nicho nem a lógica Conecta-Entretém-Vende.
${content_type === "Carrossel" ? "- FORMATO: Estruture cada roteiro como SLIDES (S1 a S6) de carrossel para Instagram, com headline curta + conector entre slides, em vez de roteiro de vídeo contínuo." : ""}${editorialBlock}` : editorialBlock;

    const systemPrompt = `Você é um estrategista de conteúdo digital e roteirista profissional para redes sociais.
Com base nas informações fornecidas pelo usuário, crie um planejamento estratégico completo e ${qty} roteiro(s) de vídeo.

REGRA DE FIDELIDADE AO NICHO (OBRIGATÓRIA):
- Use EXCLUSIVAMENTE vocabulário, termos técnicos e expressões nativas do nicho "${bNiche}" do cliente.
- PROIBIDO misturar metáforas, analogias ou estilos de comunicação de outros mercados ou nichos.
- Toda referência, exemplo, caso e linguagem deve fazer sentido 100% dentro do contexto profissional do cliente.
- Antes de finalizar, valide internamente: "Este conteúdo soaria natural vindo de um profissional deste nicho específico?" Se não, reescreva.
- Evite analogias genéricas que servem para qualquer nicho (ex: "transforme sua vida", "destaque-se da multidão").
- Mantenha coerência absoluta entre posicionamento, tom de voz e vocabulário do nicho.

LÓGICA DE CONTEÚDO "CONECTA-ENTRETÉM-VENDE" (OBRIGATÓRIA):
1. ABERTURA POR IDENTIFICAÇÃO: comece com problema, situação ou pensamento comum do público — nunca com saudação, apresentação pessoal ou anúncio direto.
2. STORYTELLING NATURAL: narrativa leve e fluida, não lista de benefícios.
3. ENTRETENIMENTO ANTES DE VENDA: os primeiros segundos devem prender atenção e gerar conexão. Tom de anúncio é PROIBIDO na abertura.
4. OFERTA ORGÂNICA: insira CTA/oferta dentro da história — nunca como bloco isolado tipo "COMPRE AGORA".
5. EXPERIÊNCIA PRÁTICA: mostre uso real, resultado, bastidores ou reação concreta sempre que possível.
6. LINGUAGEM SIMPLES E PROFISSIONAL: conversacional, envolvente, sem jargão desnecessário, mantendo autoridade do nicho.
7. FLEXIBILIDADE: NÃO use todos os elementos em todo conteúdo. Adapte tom (divertido/sério) ao contexto. EVITE rótulos visíveis tipo "GANCHO/DESENVOLVIMENTO/CTA" no texto final — flua como narrativa contínua. GANCHO/DESENVOLVIMENTO/CTA são camadas internas, não rótulos a aparecer no texto.
8. ANTI-PROPAGANDA: antes de finalizar, valide "Isso parece anúncio?" — se sim, reescreva como conversa, história ou observação genuína.
OBJETIVO FINAL: conteúdo que conecta, entretém e vende sem parecer venda.

O resultado DEVE incluir obrigatoriamente:
1. **Briefing**: Objetivo claro e estratégia de conteúdo para ${bName} no nicho ${bNiche}.
2. **Persona**: Descrição detalhada da persona ideal do público-alvo, incluindo dores, desejos e comportamento.
3. **Posicionamento**: Como a marca deve se posicionar no mercado e se diferenciar da concorrência.
4. **Tom de Voz**: Estilo de comunicação, linguagem e personalidade da marca nas redes sociais.
5. **Funil de Conteúdo**: Estratégia de conteúdo dividida em Topo (awareness), Meio (consideração) e Fundo (conversão) do funil.
6. **Roteiro(s)**: Cada roteiro deve ter título atrativo e o roteiro completo com GANCHO, DESENVOLVIMENTO e CTA, incluindo indicações de cena e falas.

Escreva tudo em português do Brasil.${contextBlock}${stylePersonalizationBlock}

${script_category ? buildCategoryPrompt(script_category, { objective: script_objective, funnel_stage, voice_tone, audience_temperature }) : ""}`;

    const userPrompt = `Informações do cliente:
- Empresa: ${bName}
- Nicho: ${bNiche}
- Objetivo: ${objective}
- Público-alvo: ${target_audience}
- Plataforma: ${platform}
- Mensagem principal / Gancho: ${hook || "Livre"}
- Duração: ${duration || "30s"}
- Notas estratégicas: ${notes || "Nenhuma"}
- Quantidade de roteiros: ${qty}`;

    let aiResult;
    try {
      aiResult = await callAIWithFallback({
        functionName: "manual-generate",
        supabase,
        maxTokens: 5000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tool: {
          name: "generate_briefing_and_scripts",
          description: "Retorna briefing estratégico completo com persona, posicionamento, tom de voz, funil e roteiros.",
          parameters: {
            type: "object",
            properties: {
              goal: { type: "string", description: "Briefing: objetivo estratégico do conteúdo" },
              target_audience: { type: "string", description: "Público-alvo detalhado" },
              content_style: { type: "string", description: "Estilo e tom do conteúdo" },
              persona: { type: "string", description: "Persona detalhada do público-alvo com dores, desejos e comportamento" },
              positioning: { type: "string", description: "Posicionamento da marca no mercado e diferenciais competitivos" },
              tone_of_voice: { type: "string", description: "Tom de voz e estilo de comunicação da marca" },
              content_funnel: { type: "string", description: "Estratégia de funil de conteúdo: Topo, Meio e Fundo" },
              scripts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Título do roteiro" },
                    script: { type: "string", description: "Roteiro completo com GANCHO, DESENVOLVIMENTO e CTA" },
                  },
                  required: ["title", "script"],
                },
              },
            },
            required: ["goal", "target_audience", "content_style", "persona", "positioning", "tone_of_voice", "content_funnel", "scripts"],
          },
        },
      });
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error("[manual-generate] AI failed:", msg);
      if (msg === "RATE_LIMIT") {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (msg === "PAYMENT_REQUIRED") {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro na geração de IA. Tente novamente em alguns instantes." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = aiResult.toolArguments;
    console.log(`[manual-generate] AI ok via ${aiResult.provider}`);

    // Log usage and cache
    const promptContentLog = JSON.stringify({ objective, target_audience, platform, hook, duration, notes, video_quantity, business_name, niche });
    const pHashLog = await hashPrompt(promptContentLog);
    const tokens = estimateTokens(JSON.stringify(result));
    await logUsage(supabase, user_id, "manual-generate", "briefing", tokens, pHashLog);
    await saveCache(supabase, pHashLog, "manual-generate", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("manual-generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
