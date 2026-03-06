import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Lightbulb, FileText, Edit2, Trash2, CheckCircle, Loader2, Brain, Zap,
} from "lucide-react";
import { HookGenerator } from "@/components/crm/HookGenerator";

interface BriefingRequest {
  id: string; business_name: string; project_name: string; project_id: string | null;
  [key: string]: any;
}
interface ContentIdea {
  id: string; user_id: string; project_id: string | null; context_id: string | null;
  title: string; description: string | null; status: string; created_at: string;
}

interface ContentIdeasTabProps {
  projects: BriefingRequest[];
  contentIdeas: ContentIdea[];
  ideasLoading: boolean;
  ideasProjectFilter: string;
  setIdeasProjectFilter: (v: string) => void;
  generatingIdeas: boolean;
  handleGenerateIdeas: (count: number) => void;
  selectedIdeas: Set<string>;
  handleToggleIdeaSelection: (id: string) => void;
  generatingScriptsFromIdeas: boolean;
  handleGenerateScriptsFromIdeas: () => void;
  newIdeaTitle: string;
  setNewIdeaTitle: (v: string) => void;
  handleAddCustomIdea: () => void;
  editingIdea: string | null;
  setEditingIdea: (v: string | null) => void;
  editIdeaText: string;
  setEditIdeaText: (v: string) => void;
  handleUpdateIdea: (id: string, title: string) => void;
  handleDeleteIdea: (id: string) => void;
  strategicContextId: string | undefined;
}

export function ContentIdeasTab({
  projects, contentIdeas, ideasLoading, ideasProjectFilter, setIdeasProjectFilter,
  generatingIdeas, handleGenerateIdeas, selectedIdeas, handleToggleIdeaSelection,
  generatingScriptsFromIdeas, handleGenerateScriptsFromIdeas,
  newIdeaTitle, setNewIdeaTitle, handleAddCustomIdea,
  editingIdea, setEditingIdea, editIdeaText, setEditIdeaText,
  handleUpdateIdea, handleDeleteIdea, strategicContextId,
}: ContentIdeasTabProps) {
  const [hookGenOpen, setHookGenOpen] = useState(false);
  const [hookGenTopic, setHookGenTopic] = useState("");

  const filteredIdeas = ideasProjectFilter === "all"
    ? contentIdeas
    : contentIdeas.filter(i => i.project_id === ideasProjectFilter);

  const openHookGen = (title: string) => {
    setHookGenTopic(title);
    setHookGenOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Actions bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 items-center">
          <Select value={ideasProjectFilter} onValueChange={setIdeasProjectFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos os projetos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.filter(p => p.project_id).map(p => (
                <SelectItem key={p.project_id!} value={p.project_id!}>{p.project_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Select onValueChange={(v) => handleGenerateIdeas(parseInt(v))} disabled={generatingIdeas || !strategicContextId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={generatingIdeas ? "Gerando..." : "Gerar Ideias"} />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20].map(n => (
                <SelectItem key={n} value={n.toString()}>{n} ideias</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedIdeas.size > 0 && (
            <Button onClick={handleGenerateScriptsFromIdeas} disabled={generatingScriptsFromIdeas}>
              {generatingScriptsFromIdeas ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileText className="h-4 w-4 mr-1.5" />}
              Gerar {selectedIdeas.size} Roteiro{selectedIdeas.size !== 1 ? "s" : ""}
            </Button>
          )}
        </div>
      </div>

      {/* Add custom idea */}
      <div className="flex gap-2">
        <Input
          placeholder="Adicionar ideia personalizada..."
          value={newIdeaTitle}
          onChange={e => setNewIdeaTitle(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleAddCustomIdea(); }}
        />
        <Button variant="outline" onClick={handleAddCustomIdea} disabled={!newIdeaTitle.trim() || !strategicContextId}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {!strategicContextId && (
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-6 text-center text-muted-foreground">
            <Brain className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Preencha o Contexto Estratégico primeiro para gerar ideias de conteúdo.</p>
          </CardContent>
        </Card>
      )}

      {ideasLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filteredIdeas.length === 0 && strategicContextId ? (
        <Card className="rounded-2xl border-border/50 shadow-sm">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Lightbulb className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">Nenhuma ideia ainda. Clique em "Gerar Ideias" para começar.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIdeas.map((idea) => (
            <Card
              key={idea.id}
              className={`rounded-2xl border-border/50 shadow-sm transition-all duration-200 ${
                selectedIdeas.has(idea.id)
                  ? "border-primary ring-1 ring-primary/30 shadow-md"
                  : "hover:shadow-md"
              } ${idea.status === "used" ? "opacity-60" : ""}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIdeas.has(idea.id)}
                    onCheckedChange={() => handleToggleIdeaSelection(idea.id)}
                    disabled={idea.status === "used"}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    {editingIdea === idea.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={editIdeaText}
                          onChange={e => setEditIdeaText(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") handleUpdateIdea(idea.id, editIdeaText); }}
                          className="flex-1"
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleUpdateIdea(idea.id, editIdeaText)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-foreground leading-snug">{idea.title}</p>
                        {idea.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{idea.description}</p>}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                  <div>
                    {idea.status === "used" && <Badge variant="secondary" className="text-[10px]">Usado</Badge>}
                  </div>
                  <div className="flex gap-0.5">
                    {strategicContextId && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Gerar Ganchos" onClick={() => openHookGen(idea.title)}>
                        <Zap className="h-3 w-3 text-primary" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingIdea(idea.id); setEditIdeaText(idea.title); }}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteIdea(idea.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {strategicContextId && (
        <HookGenerator
          open={hookGenOpen}
          onOpenChange={setHookGenOpen}
          topic={hookGenTopic}
          contextId={strategicContextId}
        />
      )}
    </div>
  );
}
