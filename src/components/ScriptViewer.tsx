import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clapperboard, User, Target, Monitor, Clock, Lightbulb, Zap, Film, Heart, Camera, Music } from "lucide-react";

interface Script {
  id: string;
  title: string | null;
  script: string | null;
  created_at: string | null;
}

interface Project {
  id: string;
  name: string | null;
  client_name: string | null;
  objective: string | null;
  platform: string | null;
  status: string | null;
  created_at: string | null;
}

interface ScriptViewerProps {
  script: Script | null;
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedScript {
  overview: string;
  hook: string;
  scenes: { direction: string; dialogue: string }[];
  triggers: string[];
  visuals: string[];
  editing: string;
  body: string;
}

const sectionPatterns: Record<string, RegExp> = {
  overview: /(?:vis[aã]o\s*estrat[eé]gica|strategic\s*overview|objetivo\s*estrat[eé]gico|overview)/i,
  hook: /(?:gancho|hook|abertura|primeiro[s]?\s*segundo[s]?|first\s*\d+\s*seconds?)/i,
  scenes: /(?:cen[aá]|scene|roteiro|corpo\s*do\s*roteiro|script\s*body|estrutura\s*de\s*cenas?)/i,
  triggers: /(?:gatilho|trigger|emo[çc][õo]es|emotional|persuas[ãa]o)/i,
  visuals: /(?:visual|sugest[õo]es?\s*visuais?|visual\s*suggest|b-roll|dire[çc][ãa]o\s*visual)/i,
  editing: /(?:edi[çc][ãa]o|ritmo|rhythm|editing|pace|transi[çc][õo]es|m[úu]sica|music|trilha)/i,
  cta: /(?:cta|call\s*to\s*action|chamada\s*para\s*a[çc][ãa]o)/i,
};

function parseScriptText(text: string): ParsedScript {
  const result: ParsedScript = {
    overview: "",
    hook: "",
    scenes: [],
    triggers: [],
    visuals: [],
    editing: "",
    body: "",
  };

  if (!text) return result;

  // Split by lines that look like section headers (all caps, numbered, or with markers)
  const lines = text.split("\n");
  const sections: { type: string; content: string[] }[] = [];
  let currentSection: { type: string; content: string[] } = { type: "body", content: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentSection.content.push("");
      continue;
    }

    // Check if this line is a section header
    let matched = false;
    for (const [key, pattern] of Object.entries(sectionPatterns)) {
      // Match lines that are headers: starts with #, number, or is mostly uppercase
      const isHeader = /^(?:#{1,3}\s*|(?:\d+[\.\)]\s*)|(?:\*{2}))/.test(trimmed) || 
                       (trimmed.length < 80 && trimmed.toUpperCase() === trimmed && /[A-Z]/.test(trimmed));
      if (pattern.test(trimmed) && (isHeader || trimmed.length < 80)) {
        if (currentSection.content.length > 0) sections.push(currentSection);
        currentSection = { type: key, content: [] };
        matched = true;
        break;
      }
    }
    if (!matched) {
      currentSection.content.push(trimmed);
    }
  }
  if (currentSection.content.length > 0) sections.push(currentSection);

  for (const section of sections) {
    const content = section.content.filter(l => l).join("\n");
    switch (section.type) {
      case "overview":
        result.overview = content;
        break;
      case "hook":
        result.hook = content;
        break;
      case "scenes": {
        // Try to parse scene/dialogue pairs
        const sceneBlocks = content.split(/(?:\[cen[aá]\s*\d*\]|cen[aá]\s*\d*:|scene\s*\d*:)/i).filter(Boolean);
        for (const block of sceneBlocks) {
          const parts = block.split(/(?:narra[çc][ãa]o:|di[áa]logo:|texto:|dialogue:|narration:)/i);
          result.scenes.push({
            direction: (parts[0] || "").trim().replace(/^[-–•]\s*/, ""),
            dialogue: (parts[1] || "").trim().replace(/^[-–•]\s*/, ""),
          });
        }
        if (result.scenes.length === 0 && content) {
          result.scenes.push({ direction: content, dialogue: "" });
        }
        break;
      }
      case "triggers":
        result.triggers = content.split(/[,;\n•\-–]/).map(t => t.trim()).filter(Boolean);
        break;
      case "visuals":
        result.visuals = content.split(/[\n•\-–]/).map(v => v.trim()).filter(Boolean);
        break;
      case "editing":
        result.editing = content;
        break;
      case "cta":
        // Append CTA to body or scenes
        if (result.scenes.length > 0) {
          result.scenes.push({ direction: "CTA / Encerramento", dialogue: content });
        } else {
          result.body += "\n\n**CTA:**\n" + content;
        }
        break;
      default:
        result.body += (result.body ? "\n\n" : "") + content;
    }
  }

  // If no sections were detected, put everything in overview/body
  if (!result.overview && !result.hook && result.scenes.length === 0 && result.body) {
    const paragraphs = result.body.split("\n\n");
    if (paragraphs.length > 1) {
      result.overview = paragraphs[0];
      result.body = paragraphs.slice(1).join("\n\n");
    }
  }

  return result;
}

function SectionCard({ icon: Icon, title, children, accent }: { icon: React.ElementType; title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={accent ? "border-l-4 border-l-primary" : ""}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className={`p-1.5 rounded-md ${accent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-sm tracking-wide uppercase text-foreground">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function ScriptViewer({ script, project, open, onOpenChange }: ScriptViewerProps) {
  if (!script) return null;

  const parsed = parseScriptText(script.script || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6 space-y-5">
            <DialogHeader className="pb-0">
              <DialogTitle className="sr-only">Visualizar Roteiro</DialogTitle>
            </DialogHeader>

            {/* Header Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">{script.title || "Roteiro sem título"}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  {project?.client_name && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span>{project.client_name}</span>
                    </div>
                  )}
                  {project?.objective && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="h-3.5 w-3.5" />
                      <span className="line-clamp-1">{project.objective}</span>
                    </div>
                  )}
                  {project?.platform && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Monitor className="h-3.5 w-3.5" />
                      <span>{project.platform}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clapperboard className="h-3.5 w-3.5" />
                    <span>Produção</span>
                  </div>
                  {script.created_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{new Date(script.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Strategic Overview */}
            {parsed.overview && (
              <SectionCard icon={Lightbulb} title="Visão Estratégica">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{parsed.overview}</p>
              </SectionCard>
            )}

            {/* Hook */}
            {parsed.hook && (
              <SectionCard icon={Zap} title="Gancho (Primeiros Segundos)" accent>
                <blockquote className="text-base font-medium text-foreground italic border-l-2 border-primary/40 pl-4">
                  "{parsed.hook}"
                </blockquote>
              </SectionCard>
            )}

            {/* Script Body — Two-column layout */}
            {parsed.scenes.length > 0 && (
              <SectionCard icon={Film} title="Corpo do Roteiro">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                    <span>Direção de Cena</span>
                    <span>Narração / Diálogo</span>
                  </div>
                  {parsed.scenes.map((scene, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-muted/50 rounded-md p-3">
                        <span className="text-xs font-semibold text-primary mb-1 block">Cena {i + 1}</span>
                        <p className="text-muted-foreground whitespace-pre-line">{scene.direction || "—"}</p>
                      </div>
                      <div className="p-3">
                        <p className="text-foreground whitespace-pre-line">{scene.dialogue || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Fallback body content */}
            {parsed.body && parsed.scenes.length === 0 && (
              <SectionCard icon={Film} title="Corpo do Roteiro">
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{parsed.body}</p>
              </SectionCard>
            )}

            {/* Emotional Triggers */}
            {parsed.triggers.length > 0 && (
              <SectionCard icon={Heart} title="Gatilhos Emocionais">
                <div className="flex flex-wrap gap-2">
                  {parsed.triggers.map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Visual Suggestions */}
            {parsed.visuals.length > 0 && (
              <SectionCard icon={Camera} title="Sugestões Visuais">
                <ul className="space-y-1.5">
                  {parsed.visuals.map((v, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Editing & Rhythm */}
            {parsed.editing && (
              <SectionCard icon={Music} title="Edição & Ritmo">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{parsed.editing}</p>
              </SectionCard>
            )}

            {/* Body fallback when we have scenes already */}
            {parsed.body && parsed.scenes.length > 0 && (
              <SectionCard icon={Film} title="Informações Adicionais">
                <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{parsed.body}</p>
              </SectionCard>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
