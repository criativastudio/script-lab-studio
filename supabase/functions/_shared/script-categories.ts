// Shared taxonomy for the structured script generator (edge functions copy).
// Keep in sync with src/lib/script-categories.ts

export const SCRIPT_CATEGORIES = ["trafego_pago", "engajamento_viral", "comercial_profissional"] as const;
export type ScriptCategory = typeof SCRIPT_CATEGORIES[number];

export const SCRIPT_OBJECTIVES = ["conversao", "engajamento", "posicionamento"] as const;
export type ScriptObjective = typeof SCRIPT_OBJECTIVES[number];

export const FUNNEL_STAGES = ["topo", "meio", "fundo"] as const;
export type FunnelStage = typeof FUNNEL_STAGES[number];

export const VOICE_TONES = ["popular", "profissional", "premium"] as const;
export type VoiceTone = typeof VOICE_TONES[number];

export const AUDIENCE_TEMPERATURES = ["frio", "morno", "quente"] as const;
export type AudienceTemperature = typeof AUDIENCE_TEMPERATURES[number];

export interface CategoryParams {
  objective?: ScriptObjective | string | null;
  funnel_stage?: FunnelStage | string | null;
  voice_tone?: VoiceTone | string | null;
  audience_temperature?: AudienceTemperature | string | null;
}

const TONE_BLOCK: Record<string, string> = {
  popular: "TOM DE VOZ — POPULAR: linguagem simples, direta e cotidiana. Frases curtas. Fale como amigo.",
  profissional: "TOM DE VOZ — PROFISSIONAL: linguagem técnica, objetiva e clara. Sem gírias. Foco em precisão.",
  premium: "TOM DE VOZ — PREMIUM: linguagem sofisticada, confiante e refinada. Ritmo pausado, autoridade calma.",
};

export function buildCategoryPrompt(category: string | null | undefined, p: CategoryParams): string {
  const cat = (category || "engajamento_viral") as ScriptCategory;
  const tone = (p.voice_tone || "profissional") as string;
  const stage = p.funnel_stage || "—";
  const objective = p.objective || "—";
  const temp = p.audience_temperature;

  const toneBlock = TONE_BLOCK[tone] || TONE_BLOCK.profissional;

  let categoryBlock = "";
  if (cat === "trafego_pago") {
    const tempRule =
      temp === "frio" ? "PÚBLICO FRIO → priorize DOR + CURIOSIDADE no gancho. Não pressuponha conhecimento da marca." :
      temp === "morno" ? "PÚBLICO MORNO → priorize BENEFÍCIO + PROVA. Reforce credibilidade." :
      temp === "quente" ? "PÚBLICO QUENTE → priorize URGÊNCIA + CTA DIRETO. Vá direto à oferta." :
      "Adapte automaticamente à temperatura do público (frio = dor + curiosidade, morno = benefício + prova, quente = urgência + CTA).";
    categoryBlock = `
CATEGORIA: TRÁFEGO PAGO (anúncio de conversão)
ESTRUTURA OBRIGATÓRIA (nesta ordem, sem rótulos visíveis no texto final):
1. Gancho direto (dor ou promessa).
2. Problema específico.
3. Promessa clara.
4. Prova ou argumento.
5. Oferta.
6. CTA forte e explícito.
REGRAS:
- ${tempRule}
- Inserção do produto: DIRETA — produto/serviço é o protagonista.
- CTA: explícito, com verbo de ação ("clique", "garanta", "comece agora").
- Gancho deve nascer de dor ou promessa, nunca curiosidade abstrata.
- Texto enxuto, ~30s. Cada bloco resolve um único objetivo.`;
  } else if (cat === "engajamento_viral") {
    categoryBlock = `
CATEGORIA: ENGAJAMENTO / VIRALIZAÇÃO (orgânico, retenção máxima)
ESTRUTURA OBRIGATÓRIA (sem rótulos visíveis):
1. Gancho curioso ou polêmico.
2. Quebra de expectativa imediata.
3. Desenvolvimento com LOOP ABERTO (lacuna de curiosidade não resolvida).
4. Micro-recompensas (insights ao longo da fala).
5. Final interativo ou inesperado.
REGRAS:
- PROIBIDO venda direta. Produto entra de forma SUTIL, integrado à narrativa.
- Storytelling OBRIGATÓRIO.
- CTA = interação: comentar, salvar, compartilhar, perguntar — nunca "compre".
- Crie pelo menos 1 lacuna de curiosidade que só fecha no fim.
- Foco total em RETENÇÃO nos primeiros 3 segundos.`;
  } else {
    categoryBlock = `
CATEGORIA: COMERCIAL PROFISSIONAL (institucional / autoridade)
ESTRUTURA OBRIGATÓRIA (sem rótulos visíveis):
1. Abertura institucional (autoridade ou pergunta estratégica).
2. Apresentação da marca/empresa.
3. Problema de mercado (não pessoal — mercado/setor).
4. Solução estruturada.
5. Diferenciais.
6. Fechamento com autoridade + CTA LEVE (institucional).
REGRAS:
- Linguagem refinada e clara. Foco em valor e posicionamento.
- Inserção do produto: ESTRATÉGICA — apresentado como solução estruturada, não promoção.
- CTA institucional: "conheça", "agende uma conversa", "saiba mais".
- Storytelling opcional, somente se aumentar clareza.`;
  }

  return `
================ CONFIGURAÇÃO DO ROTEIRO ================
Categoria: ${cat}
Objetivo estratégico: ${objective}
Etapa do funil: ${stage}
${temp ? `Temperatura do público: ${temp}` : ""}

${toneBlock}

${categoryBlock}

================ REGRAS GLOBAIS DE QUALIDADE ================
GANCHO (mapeie pelo objetivo):
- conversão → dor ou promessa
- engajamento/viral → curiosidade ou polêmica
- posicionamento/comercial → autoridade ou pergunta estratégica

INSERÇÃO DO PRODUTO:
- Tráfego pago: DIRETA. Engajamento: SUTIL. Comercial: ESTRATÉGICA.

CTA:
- Conversão: explícito. Engajamento: interação. Comercial: institucional.

VALIDAÇÃO INTERNA OBRIGATÓRIA antes de retornar:
1. O gancho prende nos primeiros 3 segundos? (gancho_forte_3s)
2. Há clareza ou curiosidade adequadas ao objetivo? (clareza_curiosidade_ok)
3. O texto cabe em ~30s falados (curto e direto)? (texto_curto_30s)
4. O roteiro mantém foco em RESULTADO até o fim? (foco_resultado)

SCORE INTERNO (0–10 cada): clareza, impacto_gancho, retencao, conversao.
Se a média total < 8 OU qualquer flag de validação for false, REESCREVA antes de retornar.
================================================================
`;
}
