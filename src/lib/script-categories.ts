// Shared taxonomy for the structured script generator.
// Keep this file in sync with supabase/functions/_shared/script-categories.ts

export const SCRIPT_CATEGORIES = [
  "trafego_pago",
  "engajamento_viral",
  "comercial_profissional",
] as const;
export type ScriptCategory = typeof SCRIPT_CATEGORIES[number];

export const SCRIPT_CATEGORY_META: Record<ScriptCategory, {
  label: string;
  shortLabel: string;
  tagline: string;
  description: string;
  defaultObjective: ScriptObjective;
}> = {
  trafego_pago: {
    label: "Tráfego Pago",
    shortLabel: "Conversão",
    tagline: "Para anúncios diretos com objetivo claro de conversão.",
    description: "Estrutura: gancho direto (dor/promessa) → problema → promessa → prova → oferta → CTA forte.",
    defaultObjective: "conversao",
  },
  engajamento_viral: {
    label: "Engajamento / Viralização",
    shortLabel: "Retenção",
    tagline: "Para vídeos orgânicos focados em alcance e retenção.",
    description: "Gancho curioso/polêmico → quebra de expectativa → loop aberto → micro-recompensas → final interativo.",
    defaultObjective: "engajamento",
  },
  comercial_profissional: {
    label: "Comercial Profissional",
    shortLabel: "Autoridade",
    tagline: "Para conteúdo institucional com posicionamento e autoridade.",
    description: "Abertura institucional → marca → problema de mercado → solução → diferenciais → fechamento + CTA leve.",
    defaultObjective: "posicionamento",
  },
};

export const SCRIPT_OBJECTIVES = ["conversao", "engajamento", "posicionamento"] as const;
export type ScriptObjective = typeof SCRIPT_OBJECTIVES[number];
export const SCRIPT_OBJECTIVE_LABEL: Record<ScriptObjective, string> = {
  conversao: "Conversão",
  engajamento: "Engajamento",
  posicionamento: "Posicionamento",
};

export const FUNNEL_STAGES = ["topo", "meio", "fundo"] as const;
export type FunnelStage = typeof FUNNEL_STAGES[number];
export const FUNNEL_STAGE_LABEL: Record<FunnelStage, string> = {
  topo: "Topo (atração)",
  meio: "Meio (consideração)",
  fundo: "Fundo (conversão)",
};

export const VOICE_TONES = ["popular", "profissional", "premium"] as const;
export type VoiceTone = typeof VOICE_TONES[number];
export const VOICE_TONE_LABEL: Record<VoiceTone, string> = {
  popular: "Popular (simples e direto)",
  profissional: "Profissional (técnico e objetivo)",
  premium: "Premium (sofisticado e confiante)",
};

export const AUDIENCE_TEMPERATURES = ["frio", "morno", "quente"] as const;
export type AudienceTemperature = typeof AUDIENCE_TEMPERATURES[number];
export const AUDIENCE_TEMPERATURE_LABEL: Record<AudienceTemperature, string> = {
  frio: "Frio (não conhece a marca)",
  morno: "Morno (já interagiu)",
  quente: "Quente (pronto para comprar)",
};
