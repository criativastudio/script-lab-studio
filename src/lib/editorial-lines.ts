export const EDITORIAL_LINES = [
  "Autoridade",
  "Educação",
  "Conexão",
  "Storytelling",
  "Prova",
  "Bastidores",
  "Solução de Problemas",
  "Posicionamento",
  "Conversão",
  "Topo de Funil",
  "Meio de Funil",
  "Fundo de Funil",
] as const;

export const CONTENT_STYLES = [
  "Engraçado","Sério","Educativo","Inspiracional","Curioso","Polêmico",
  "Irônico","Narrativo","Minimalista","UGC","Nostálgico","Empático",
  "Técnico","Urgente","Interativo","Reflexivo","Aspiracional","Bastidores",
] as const;

export const VIDEO_QUANTITIES = ["1","2","4","6","8","10","12"] as const;

export function deriveFunnelStage(lines: string[]): string {
  if (lines.includes("Topo de Funil")) return "top";
  if (lines.includes("Meio de Funil")) return "middle";
  if (lines.includes("Fundo de Funil")) return "bottom";
  return "";
}
