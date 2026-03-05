import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Lightbulb } from "lucide-react";

interface ContentIdea {
  id: string; title: string; description: string | null; status: string;
  project_id: string | null; created_at: string;
}

interface ContentCalendarTabProps {
  contentIdeas: ContentIdea[];
  publishingFrequency?: number; // ideas per week
}

export function ContentCalendarTab({ contentIdeas, publishingFrequency = 3 }: ContentCalendarTabProps) {
  const selectedOrPending = contentIdeas.filter(i => i.status === "pending" || i.status === "selected");

  // Distribute ideas across weeks
  const weeks: ContentIdea[][] = [];
  for (let i = 0; i < selectedOrPending.length; i += publishingFrequency) {
    weeks.push(selectedOrPending.slice(i, i + publishingFrequency));
  }

  if (weeks.length === 0) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhuma ideia de conteúdo disponível para o calendário.</p>
          <p className="text-xs mt-1">Gere ou adicione ideias na aba "Ideias" primeiro.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Distribuição automática: <strong>{publishingFrequency} vídeos/semana</strong> · {selectedOrPending.length} ideias no total
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {weeks.map((weekIdeas, idx) => (
          <Card key={idx} className="rounded-2xl border-border/50 shadow-sm transition-all duration-200 hover:shadow-md">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  {idx + 1}
                </div>
                <h3 className="font-semibold text-foreground text-sm">Semana {idx + 1}</h3>
                <Badge variant="secondary" className="text-[10px] ml-auto">{weekIdeas.length} vídeo{weekIdeas.length !== 1 ? "s" : ""}</Badge>
              </div>
              <div className="space-y-2">
                {weekIdeas.map((idea, ideaIdx) => (
                  <div key={idea.id} className="flex items-start gap-2 rounded-xl bg-muted/50 p-3">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                      {ideaIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground leading-snug">{idea.title}</p>
                      {idea.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{idea.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
