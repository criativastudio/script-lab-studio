import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { runGuards, hashPrompt, checkCache, saveCache, logUsage, validateInputLength, estimateTokens, requireAuth } from "../_shared/usage-guard.ts";

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

const CONTENT_CATEGORIES = ["educational", "authority", "story", "case_study", "tips", "myth_breaking", "behind_scenes"];

const ADVERTISING_STRUCTURE_GUIDE = `
ESTRUTURA VISUAL DE ROTEIRO PUBLICITÁRIO (OBRIGATÓRIA quando aplicável):
Organize o roteiro de fala (speaking_script) em blocos visuais claros, no formato exato:

[CENA N – NOME]
• Objetivo: ...
• Visual: enquadramento (close, médio, plano aberto) + movimento (corte rápido, zoom, reação) + expressão/personagem
• Fala: texto principal, em linha separada, com respiro visual
• Intenção: curiosidade / impacto / conexão / humor / venda

Sequência base de 6 cenas (ajustar conforme duração):
1. [CENA 1 – HOOK] Prender atenção em 0–3s. Curiosidade ou impacto.
2. [CENA 2 – SITUAÇÃO] Contexto cotidiano, gerar identificação.
3. [CENA 3 – ESCALADA] Evoluir o problema, aumentar retenção.
4. [CENA 4 – QUEBRA] Twist/punchline. Surpresa, humor ou impacto.
5. [CENA 5 – PRODUTO/SERVIÇO] Inserção orgânica: solução, parte da piada ou gatilho da situação. NUNCA forçada.
6. [CENA 6 – CTA] Final limpo, pergunta ou chamada leve.

REGRAS DE TOM (mapeie a partir do estilo de comunicação do cliente):
- CÔMICO: exagero, ironia, situações inesperadas, punchlines com linguagem brasileira.
- PROFISSIONAL: clareza, autoridade, benefício direto.
- SÉRIO: emocional, direto, reflexivo.

DIREÇÃO DE CENA (sempre pensar visualmente):
- Cenas simples de gravar, poucos elementos, clareza de ação.
- Evitar complexidade desnecessária.
- Sempre indicar enquadramento + movimento + expressão dentro de "Visual".

DIRETRIZES FINAIS:
- Linguagem simples e conversacional. Frases curtas. Ritmo dinâmico.
- Destacar falas principais com quebra de linha (respiro visual).
- Evitar blocos densos de texto.
- Foco total em retenção em qualquer duração.
`;

function getDurationProfile(duration: string | undefined | null): string {
  if (!duration) return "60 segundos — 6 cenas completas. Contexto + payoff.";
  const d = String(duration).toLowerCase();
  if (d.includes("15")) return "15 segundos — Use APENAS [CENA 1 – HOOK] + [CENA 4 – QUEBRA/PUNCHLINE] + [CENA 5 – PRODUTO]. Máximo impacto, sem enrolação.";
  if (d.includes("30")) return "30 segundos — Estrutura completa resumida (4 cenas). Ritmo rápido. Falas curtas.";
  if (d.includes("60") || d.includes("1 min") || d.includes("1min")) return "60 segundos — 6 cenas completas. Contexto + payoff. Ritmo dinâmico.";
  if (d.includes("90") || d.includes("3 min") || d.includes("3min") || d.includes("5")) return "Narrativa estendida — 6 cenas com maior construção emocional ou humor. Desenvolva contexto antes do payoff.";
  return `${duration} — adapte número de cenas mantendo retenção total.`;
}

function isShortVideoPlatform(platform: string | undefined | null): boolean {
  if (!platform) return false;
  const p = String(platform).toLowerCase();
  return p.includes("reels") || p.includes("tiktok") || p.includes("tik tok") || p.includes("shorts");
}

function shouldUseAdvertisingStructure(contentType: string | undefined | null, platform: string | undefined | null): boolean {
  const ct = (contentType || "").toLowerCase();
  if (ct.includes("carrossel") || ct.includes("carousel")) return false;
  if (!contentType || ct.includes("roteiro") || ct.includes("video") || ct.includes("vídeo")) return true;
  return isShortVideoPlatform(platform);
}

function getToneInstructions(communicationStyle: string | null): string {
  if (!communicationStyle) return "";
  const key = communicationStyle.toLowerCase().replace(/[^a-zà-ú_]/g, "_");
  for (const [k, v] of Object.entries(toneRules)) {
    if (key.includes(k)) return v;
  }
  return `Adapte o tom de comunicação para: ${communicationStyle}`;
}

function buildMemoryBlocks(memoryEntries: any[]): string {
  if (!memoryEntries || memoryEntries.length === 0) return "";

  const topics = memoryEntries.map(m => m.topic).filter(Boolean);
  const hooks = memoryEntries.map(m => m.hook).filter(Boolean);
  
  const catCounts: Record<string, number> = {};
  const catSelected: Record<string, number> = {};
  for (const cat of CONTENT_CATEGORIES) { catCounts[cat] = 0; catSelected[cat] = 0; }
  for (const m of memoryEntries) {
    if (m.content_category && catCounts[m.content_category] !== undefined) {
      catCounts[m.content_category]++;
      if (m.was_selected) catSelected[m.content_category]++;
    }
  }

  const total = memoryEntries.length;
  const catDistribution = CONTENT_CATEGORIES.map(c => `${c}: ${catCounts[c]} gerados, ${catSelected[c]} selecionados`).join("\n  ");
  const avgCount = total / CONTENT_CATEGORIES.length;
  const underRepresented = CONTENT_CATEGORIES.filter(c => catCounts[c] < avgCount * 0.5);
  const preferred = CONTENT_CATEGORIES.filter(c => catSelected[c] > 0).sort((a, b) => catSelected[b] - catSelected[a]);

  let block = `
MEMÓRIA DE CONTEÚDO DO CLIENTE (${total} entradas anteriores):

TÓPICOS JÁ GERADOS (NÃO repita):
- ${topics.slice(0, 50).join("\n- ")}

GANCHOS JÁ USADOS (evolua e melhore, NÃO repita):
- ${hooks.slice(0, 30).join("\n- ")}

DISTRIBUIÇÃO DE CATEGORIAS:
  ${catDistribution}`;

  if (preferred.length > 0) block += `\n\nPREFERÊNCIA DO CLIENTE (priorize estes estilos): ${preferred.join(", ")}`;
  if (underRepresented.length > 0) block += `\n\nCATEGORIAS SUB-REPRESENTADAS (considere usar): ${underRepresented.join(", ")}`;
  block += `\n\nVocê DEVE criar um ângulo completamente novo e diferente dos listados acima. Evolua os ganchos para versões mais impactantes.`;

  return block;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const auth = await requireAuth(req, corsHeaders);
    if (auth.response) return auth.response;
    const user_id = auth.userId;

    const body = await req.json();
    const { briefing, target_audience, platform, video_duration, context_id, idea_id, idea_title, project_id, content_type, content_style, editorial_lines, editorial_mode } = body;

    // Enhanced mode: use strategic context + idea
    if (context_id && (idea_id || idea_title)) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Usage guards
      const guardResponse = await runGuards(supabase, user_id, "script", corsHeaders);
      if (guardResponse) return guardResponse;

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

      // Cache check
      const pHash = await hashPrompt(JSON.stringify({ context_id, idea_id, idea_title, platform, video_duration }));
      const cached = await checkCache(supabase, pHash);
      if (cached) {
        await logUsage(supabase, user_id, "generate-script", "script", 0, pHash);
        if (idea_id) await supabase.from("content_ideas").update({ status: "used" }).eq("id", idea_id);
        return new Response(JSON.stringify(cached), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

      // Content Memory
      let memoryBlock = "";
      if (ctx?.id) {
        const { data: memoryEntries } = await supabase
          .from("client_content_memory")
          .select("*")
          .eq("context_id", ctx.id)
          .order("created_at", { ascending: false })
          .limit(100);
        memoryBlock = buildMemoryBlocks(memoryEntries || []);
      }

      if (!memoryBlock && ctx?.user_id) {
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

      const nicho = ctx?.business_niche || "não especificado";

      const systemPrompt = `Você é um roteirista estratégico profissional especializado em vídeos de marketing para redes sociais.

REGRA DE FIDELIDADE AO NICHO (OBRIGATÓRIA):
- Use EXCLUSIVAMENTE vocabulário, termos técnicos e expressões nativas do nicho "${nicho}" do cliente.
- PROIBIDO misturar metáforas, analogias ou estilos de comunicação de outros mercados ou nichos.
- Toda referência, exemplo, caso e linguagem deve fazer sentido 100% dentro do contexto profissional do cliente.
- Antes de finalizar, valide internamente: "Este conteúdo soaria natural vindo de um profissional deste nicho específico?" Se não, reescreva.
- Evite analogias genéricas que servem para qualquer nicho (ex: "transforme sua vida", "destaque-se da multidão").
- Mantenha coerência absoluta entre posicionamento, tom de voz e vocabulário do nicho.

LÓGICA DE CONTEÚDO "CONECTA-ENTRETÉM-VENDE" (OBRIGATÓRIA):
1. ABERTURA POR IDENTIFICAÇÃO: o gancho deve começar com problema, situação ou pensamento comum do público — nunca com saudação, apresentação pessoal ou anúncio direto.
2. STORYTELLING NATURAL: o roteiro de fala deve fluir como narrativa leve, não como lista de benefícios ou pitch comercial.
3. ENTRETENIMENTO ANTES DE VENDA: os primeiros segundos devem prender atenção e gerar conexão. Tom de anúncio é PROIBIDO na abertura.
4. OFERTA ORGÂNICA: o CTA deve emergir naturalmente da história — nunca soar como bloco isolado de venda.
5. EXPERIÊNCIA PRÁTICA: priorize mostrar uso real, resultado concreto, bastidores ou reação verdadeira sobre teoria.
6. LINGUAGEM SIMPLES E PROFISSIONAL: conversacional, envolvente, mantendo autoridade do nicho.
7. ANTI-ENGESSAMENTO: GANCHO, DESENVOLVIMENTO e CTA são CAMADAS INTERNAS de estrutura — NÃO escreva esses rótulos literalmente no roteiro de fala (speaking_script). O texto final deve parecer fala contínua e natural, não esqueleto rotulado.
8. FLEXIBILIDADE: adapte o tom (divertido/sério) ao contexto do cliente. Não force todos os elementos em todo roteiro.
9. ANTI-PROPAGANDA: antes de finalizar, valide "Isso parece anúncio?" — se sim, reescreva como conversa, história ou observação genuína.
OBJETIVO FINAL: roteiro que conecta, entretém e vende sem parecer venda.

Siga este pipeline de geração em 5 etapas obrigatórias:

ETAPA 1 — ÂNGULO ESTRATÉGICO: Analise o contexto do cliente, projeto e ideia. Derive um ângulo estratégico único que conecte a dor do público com o diferencial do negócio.

ETAPA 2 — OPÇÕES DE GANCHO: Crie 3 opções de gancho (hook) de abertura. Escolha o melhor e use-o. Os ganchos devem parar o scroll em 3 segundos.

ETAPA 3 — BRIEFING ESTRATÉGICO: Defina o objetivo do vídeo, a mensagem central, e como ele se encaixa no funil de vendas.

ETAPA 4 — ROTEIRO DE FALA: Escreva o texto completo que será falado, palavra por palavra, otimizado para a plataforma e duração.

ETAPA 5 — CTA: Crie uma chamada para ação alinhada com a etapa do funil (topo = engajamento, meio = consideração, fundo = conversão).

CATEGORIZAÇÃO: Classifique este roteiro em UMA categoria: educational, authority, story, case_study, tips, myth_breaking, behind_scenes

${toneInstructions}

${shouldUseAdvertisingStructure(content_type, platform) ? ADVERTISING_STRUCTURE_GUIDE : ""}

${(() => {
  const _lines: string[] = Array.isArray(editorial_lines) ? editorial_lines : [];
  const _mode: string = editorial_mode || (_lines.length === 0 ? "auto" : "manual");
  return `
LINHA EDITORIAL (estratégia / objetivo do conteúdo):
- Modo: ${_mode === "auto"
    ? "AUTOMÁTICO — você decide a melhor linha editorial com base no contexto do cliente, projeto e ideia."
    : "MANUAL — use EXCLUSIVAMENTE: " + _lines.join(", ") + "."}
- Linha editorial = OBJETIVO estratégico. Estilo = FORMA de comunicação. Combine ambos sem que um anule o outro.
- Foco obrigatório: retenção (primeiros 3s), conexão (identificação com a persona) e conversão (CTA orgânico).
- Linguagem natural e específica do nicho — proibido genérico ou óbvio.
`;
})()}
${(content_type || content_style) ? `
TIPO DE CONTEÚDO ALVO: ${content_type || "Não definido"}
ESTILO DE CONTEÚDO: ${content_style || "Não definido"}

REGRAS DE PERSONALIZAÇÃO POR ESTILO (OBRIGATÓRIAS):
- Adapte tom, ritmo, vocabulário e exemplos ao estilo "${content_style || "padrão"}".
- Linguagem natural, humana e estratégica — proibido tom robótico.
- Use exemplos reais do contexto do público do nicho.
- Foque em retenção, conexão e clareza.
- Ajuste o tom sem perder profissionalismo.
- Estilo é uma camada de tom, não substitui fidelidade ao nicho nem a lógica Conecta-Entretém-Vende.
${content_type === "Carrossel" ? "- FORMATO: Estruture o roteiro como SLIDES de carrossel (S1 a S6) com headline curta + conector entre slides, em vez de roteiro de vídeo contínuo. Use video_structure para descrever os slides e speaking_script para o texto de cada slide numerado." : ""}
` : ""}
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
                hook: { type: "string", description: "O gancho de abertura escolhido (melhor dos 3 gerados). Deve parar o scroll em 3 segundos." },
                strategic_briefing: { type: "string", description: "Briefing estratégico: objetivo do vídeo, mensagem central, posição no funil." },
                video_structure: { type: "string", description: "Estrutura do vídeo com indicações de cena [CENA: descrição] e tempos." },
                speaking_script: { type: "string", description: "Roteiro de fala completo, palavra por palavra, pronto para gravação." },
                cta: { type: "string", description: "Chamada para ação alinhada com a etapa do funil." },
                recording_style: { type: "string", description: "Sugestão de estilo de gravação: enquadramento, cenário, edição, ritmo." },
                content_category: {
                  type: "string",
                  enum: ["educational", "authority", "story", "case_study", "tips", "myth_breaking", "behind_scenes"],
                  description: "Categoria do conteúdo gerado.",
                },
              },
              required: ["hook", "strategic_briefing", "video_structure", "speaking_script", "cta", "recording_style", "content_category"],
              additionalProperties: false,
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
          max_tokens: 2200,
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
      
      let scriptContent = "";
      let structured: Record<string, string> | null = null;
      
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try {
          const args = typeof toolCall.function.arguments === "string" 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function.arguments;
          structured = args;
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
      
      if (!scriptContent) {
        scriptContent = data.choices?.[0]?.message?.content || "";
      }

      // Update idea status
      if (idea_id) {
        await supabase.from("content_ideas").update({ status: "used" }).eq("id", idea_id);
      }

      // Save to client_content_memory
      if (structured && ctx?.id) {
        try {
          await supabase.from("client_content_memory").insert({
            user_id,
            context_id: ctx.id,
            idea_id: idea_id || null,
            topic: ideaText,
            hook: structured.hook,
            content_category: structured.content_category || null,
            angle: structured.strategic_briefing?.substring(0, 500) || null,
            was_selected: false,
          });
        } catch (memErr) {
          console.error("Failed to save content memory:", memErr);
        }
      }

      const responseData = { script: scriptContent, title: ideaText, structured };

      // Log usage and cache
      const tokens = estimateTokens(scriptContent);
      await logUsage(supabase, user_id, "generate-script", "script", tokens, pHash);
      await saveCache(supabase, pHash, "generate-script", responseData);

      return new Response(JSON.stringify(responseData), {
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

    // Input validation
    const inputErr = validateInputLength({ briefing, target_audience, platform }, 2000);
    if (inputErr) {
      return new Response(JSON.stringify({ error: inputErr }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Usage guards for legacy mode
    const supabaseLegacy = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const guardResponseLegacy = await runGuards(supabaseLegacy, user_id, "script", corsHeaders);
    if (guardResponseLegacy) return guardResponseLegacy;

    const systemPrompt = `Você é um roteirista profissional especializado em vídeos de marketing para redes sociais.
Seu objetivo é criar roteiros envolventes, persuasivos e otimizados para a plataforma indicada.

REGRA DE FIDELIDADE AO NICHO (OBRIGATÓRIA):
- Use EXCLUSIVAMENTE vocabulário, termos técnicos e expressões nativas do nicho do cliente.
- PROIBIDO misturar metáforas, analogias ou estilos de comunicação de outros mercados ou nichos.
- Toda referência, exemplo, caso e linguagem deve fazer sentido 100% dentro do contexto profissional do cliente.
- Antes de finalizar, valide internamente: "Este conteúdo soaria natural vindo de um profissional deste nicho específico?" Se não, reescreva.
- Evite analogias genéricas que servem para qualquer nicho (ex: "transforme sua vida", "destaque-se da multidão").
- Mantenha coerência absoluta entre posicionamento, tom de voz e vocabulário do nicho.

LÓGICA DE CONTEÚDO "CONECTA-ENTRETÉM-VENDE" (OBRIGATÓRIA):
- Abra com IDENTIFICAÇÃO IMEDIATA (problema, situação ou pensamento comum do público) — nunca com saudação ou anúncio direto.
- Use storytelling natural; entretenimento vem antes da venda; CTA orgânico dentro da narrativa.
- GANCHO/DESENVOLVIMENTO/CTA são camadas INTERNAS — NÃO escreva esses rótulos literalmente no texto final.
- Antes de finalizar, valide "Isso parece anúncio?" — se sim, reescreva como conversa, história ou observação genuína.

Diretrizes:
- Escreva em português brasileiro
- Use linguagem adequada ao público-alvo
- Estruture internamente com gancho, desenvolvimento e CTA, mas faça o texto final fluir como narrativa contínua (sem rótulos visíveis)
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
        max_tokens: 2200,
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

    // Log usage for legacy mode
    const tokens = estimateTokens(scriptContent);
    const pHash = await hashPrompt(JSON.stringify({ briefing, target_audience, platform, video_duration }));
    await logUsage(supabaseLegacy, user_id, "generate-script", "script", tokens, pHash);
    await saveCache(supabaseLegacy, pHash, "generate-script", { script: scriptContent });

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
