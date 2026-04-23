import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EDITORIAL_LINES, CONTENT_STYLES, VIDEO_QUANTITIES, deriveFunnelStage } from "@/lib/editorial-lines";
import { Sparkle } from "lucide-react";
import {
  FolderPlus, Hash, Video, Calendar, ChevronDown, Bot, Sparkles, Download,
  BookOpen, FileText, Edit2, Trash2, Eye, Loader2, Target, Megaphone, MessageSquare, Lightbulb, Copy, Link as LinkIcon, RefreshCcw,
} from "lucide-react";

interface BriefingRequest {
  id: string; business_name: string; contact_name: string | null; contact_email: string | null;
  contact_whatsapp: string | null; project_name: string; video_quantity: number;
  status: string; token: string; created_at: string; persona: string | null;
  positioning: string | null; tone_of_voice: string | null; content_strategy: string | null;
  project_id: string | null; form_answers: any; city: string | null; niche: string | null;
  is_active: boolean;
}
interface Briefing { id: string; goal: string | null; target_audience: string | null; content_style: string | null; created_at: string | null; project_id: string | null; }
interface Script { id: string; title: string | null; script: string | null; created_at: string | null; project_id: string | null; }

const briefingStatusLabels: Record<string, string> = { pending: "Pendente", submitted: "Enviado", processing: "Processando", completed: "Concluído" };
const briefingStatusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  submitted: "bg-accent text-accent-foreground",
  processing: "bg-primary text-primary-foreground",
  completed: "bg-primary text-primary-foreground",
};

interface ProjectsTabProps {
  projects: BriefingRequest[];
  businessName: string;
  openProjects: Set<string>;
  toggleProject: (p: BriefingRequest) => void;
  projectBriefings: Record<string, Briefing[]>;
  projectScripts: Record<string, Script[]>;
  generatingProject: string | null;
  handleGenerateWithAgent: (p: BriefingRequest) => void;
  setManualCreateProjectId: (v: string | null) => void;
  manualGenerating: boolean;
  downloadProjectPdf: (p: BriefingRequest) => void;
  downloadPdf: (type: "briefing" | "script", item: Briefing | Script, project: BriefingRequest) => void;
  openEditBriefing: (b: Briefing) => void;
  openEditScript: (s: Script) => void;
  deleteItem: (table: "briefings" | "scripts", id: string, project: BriefingRequest) => void;
  deleteProject: (project: BriefingRequest) => void;
  setViewingScript: (s: Script | null) => void;
  setViewingProject: (p: BriefingRequest | null) => void;
  // New project dialog
  newProjectOpen: boolean;
  setNewProjectOpen: (v: boolean) => void;
  newProjectForm: any;
  setNewProjectForm: (v: any) => void;
  creatingProject: boolean;
  handleCreateProject: () => void;
  toast: (opts: any) => void;
  maxVideos?: number;
  onVideoLimitExceeded?: () => void;
  handleRenameProject: (projectId: string, newName: string) => Promise<void>;
  hasStrategicContext?: boolean;
  onGenerateNewLink?: () => void;
}

function StrategicCard({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-2 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary/60" />
        {title}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

export function ProjectsTab({
  projects, businessName, openProjects, toggleProject,
  projectBriefings, projectScripts, generatingProject,
  handleGenerateWithAgent, setManualCreateProjectId, manualGenerating,
  downloadProjectPdf, downloadPdf, openEditBriefing, openEditScript,
  deleteItem, deleteProject, setViewingScript, setViewingProject,
  newProjectOpen, setNewProjectOpen, newProjectForm, setNewProjectForm,
  creatingProject, handleCreateProject, toast,
  maxVideos, onVideoLimitExceeded, handleRenameProject,
  hasStrategicContext, onGenerateNewLink,
}: ProjectsTabProps) {
  const [renamingProject, setRenamingProject] = useState<BriefingRequest | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);

  const openRename = (p: BriefingRequest) => {
    setRenamingProject(p);
    setRenameValue(p.project_name);
  };

  const submitRename = async () => {
    if (!renamingProject) return;
    setRenameSaving(true);
    await handleRenameProject(renamingProject.id, renameValue);
    setRenameSaving(false);
    setRenamingProject(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={newProjectOpen} onOpenChange={(v) => { if (creatingProject) return; setNewProjectOpen(v); if (!v) { setNewProjectForm({ project_name: "", video_quantity: "3", campaign_objective: "", funnel_stage: "", content_type: "", content_style: "", publishing_frequency: "", editorial_lines: [], editorial_mode: "auto" }); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><FolderPlus className="h-4 w-4 mr-1.5" />Novo Projeto</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Projeto para {businessName}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-muted-foreground">
                O conteúdo será criado de forma estratégica utilizando o contexto original preenchido pelo cliente no formulário.
              </div>
              <div><Label>Nome do Projeto *</Label><Input value={newProjectForm.project_name} onChange={(e) => setNewProjectForm({ ...newProjectForm, project_name: e.target.value })} placeholder="Ex: Campanha Abril 2026" /></div>
              <div>
                <Label>Quantidade de Conteúdos</Label>
                <Select value={newProjectForm.video_quantity} onValueChange={(v) => {
                  if (maxVideos && parseInt(v) > maxVideos) {
                    setNewProjectForm({ ...newProjectForm, video_quantity: String(maxVideos) });
                    onVideoLimitExceeded?.();
                    return;
                  }
                  setNewProjectForm({ ...newProjectForm, video_quantity: v });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VIDEO_QUANTITIES.map(v => <SelectItem key={v} value={v}>{v} conteúdo{v !== "1" ? "s" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Objetivo da Campanha</Label><Input value={newProjectForm.campaign_objective} onChange={(e) => setNewProjectForm({ ...newProjectForm, campaign_objective: e.target.value })} placeholder="Ex: Lançar novo serviço" /></div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Linha Editorial</Label>
                  <span className="text-[10px] text-muted-foreground">
                    {newProjectForm.editorial_mode === "auto" || !newProjectForm.editorial_lines?.length
                      ? "Automático (IA define)"
                      : `${newProjectForm.editorial_lines.length} selecionada${newProjectForm.editorial_lines.length > 1 ? "s" : ""}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setNewProjectForm({ ...newProjectForm, editorial_lines: [], editorial_mode: "auto" })}
                  className={`w-full mb-2 flex items-center justify-center gap-1.5 text-xs rounded-lg px-3 py-2 border transition-colors ${
                    newProjectForm.editorial_mode === "auto" || !newProjectForm.editorial_lines?.length
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  <Sparkle className="h-3 w-3" /> Automático (IA define)
                </button>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
                  {EDITORIAL_LINES.map((line) => {
                    const selected = (newProjectForm.editorial_lines || []).includes(line);
                    return (
                      <button
                        key={line}
                        type="button"
                        onClick={() => {
                          const current: string[] = newProjectForm.editorial_lines || [];
                          const next = selected ? current.filter((l) => l !== line) : [...current, line];
                          setNewProjectForm({
                            ...newProjectForm,
                            editorial_lines: next,
                            editorial_mode: next.length === 0 ? "auto" : "manual",
                          });
                        }}
                        className={`text-[11px] rounded-lg px-2 py-1.5 border transition-colors text-left ${
                          selected
                            ? "border-primary bg-primary/15 text-primary font-medium"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {line}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Tipo de Conteúdo *</Label>
                <Select value={newProjectForm.content_type} onValueChange={(v) => setNewProjectForm({ ...newProjectForm, content_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Roteiro">Roteiro (vídeo)</SelectItem>
                    <SelectItem value="Carrossel">Carrossel (Instagram)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estilo de Conteúdo</Label>
                <Select value={newProjectForm.content_style} onValueChange={(v) => setNewProjectForm({ ...newProjectForm, content_style: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um estilo" /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_STYLES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Frequência de Publicação</Label><Input value={newProjectForm.publishing_frequency} onChange={(e) => setNewProjectForm({ ...newProjectForm, publishing_frequency: e.target.value })} placeholder="Ex: 3x por semana" /></div>
              <Button className="w-full" onClick={handleCreateProject} disabled={!newProjectForm.project_name || !newProjectForm.content_type || creatingProject}>
                {creatingProject ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando conteúdo...</> : <><FolderPlus className="h-4 w-4 mr-2" />Criar Projeto e Gerar</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-border/60">
          <CardContent className="p-10 text-center space-y-4">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <FolderPlus className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-semibold text-foreground">Nenhum projeto ainda</p>
              <p className="text-sm text-muted-foreground">O contexto estratégico do cliente foi preservado e está pronto para um novo projeto.</p>
            </div>
            <Button onClick={() => setNewProjectOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />Criar Primeiro Projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const isOpen = openProjects.has(project.id);
          const briefs = projectBriefings[project.id] || [];
          const scrpts = projectScripts[project.id] || [];
          const isGen = generatingProject === project.id;

          return (
            <Collapsible key={project.id} open={isOpen} onOpenChange={() => toggleProject(project)}>
              <Card className={`rounded-2xl border-border/50 shadow-sm transition-all duration-200 ${isOpen ? "border-primary/40 shadow-md" : "hover:shadow-md hover:border-primary/20"}`}>
                <CollapsibleTrigger asChild>
                  <button className="w-full text-left p-5 flex items-center gap-3 group">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0">
                      <Hash className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{project.project_name}</h3>
                        <Badge variant="secondary" className={`text-[10px] shrink-0 ${briefingStatusColors[project.status] || ""}`}>
                          {briefingStatusLabels[project.status] || project.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={(e) => { e.stopPropagation(); openRename(project); }}
                          title="Renomear projeto"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Video className="h-3 w-3 text-primary/60" />{project.video_quantity} vídeos</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-primary/60" />{new Date(project.created_at).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-border/50 px-5 pb-5 pt-4 space-y-5">
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => downloadProjectPdf(project)}>
                        <Download className="h-3.5 w-3.5 mr-1.5" />PDF
                      </Button>
                      <Button size="sm" onClick={() => handleGenerateWithAgent(project)} disabled={isGen}>
                        {isGen ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Bot className="h-3.5 w-3.5 mr-1.5" />}
                        {isGen ? "Gerando..." : "Gerar com Agente"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setManualCreateProjectId(project.id)} disabled={manualGenerating}>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />Criar Manual + IA
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />Excluir Projeto
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir projeto «{project.project_name}»?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é permanente e removerá também todos os briefings e roteiros vinculados. Não pode ser desfeita.
                              {projects.length === 1 && " O contexto estratégico do cliente será preservado."}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteProject(project)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir permanentemente
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {(project.persona || project.positioning || project.tone_of_voice || project.content_strategy) && (
                      <div className="grid grid-cols-1 gap-3">
                        {project.persona && <StrategicCard icon={Target} title="Persona" content={project.persona} />}
                        {project.positioning && <StrategicCard icon={Megaphone} title="Posicionamento" content={project.positioning} />}
                        {project.tone_of_voice && <StrategicCard icon={MessageSquare} title="Tom de Voz" content={project.tone_of_voice} />}
                        {project.content_strategy && <StrategicCard icon={Lightbulb} title="Funil de Conteúdo" content={project.content_strategy} />}
                      </div>
                    )}

                    {/* Briefings */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-primary/60" />Briefings ({briefs.length})
                      </h4>
                      {briefs.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">Nenhum briefing gerado.</p>
                      ) : (
                        <div className="space-y-2">
                          {briefs.map((b) => (
                            <div key={b.id} className="rounded-xl border border-border/50 bg-background p-3 flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-sm font-medium text-foreground">{b.goal || "Sem objetivo"}</p>
                                <p className="text-xs text-muted-foreground">Público: {b.target_audience || "—"} · Estilo: {b.content_style || "—"}</p>
                              </div>
                              <div className="flex gap-0.5 shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditBriefing(b)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadPdf("briefing", b, project)}><Download className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteItem("briefings", b.id, project)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Scripts */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-primary/60" />Roteiros ({scrpts.length})
                      </h4>
                      {scrpts.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">Nenhum roteiro gerado.</p>
                      ) : (
                        <div className="space-y-2">
                          {scrpts.map((s) => (
                            <div key={s.id} className="rounded-xl border border-border/50 bg-background p-3 flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-sm font-medium text-foreground">{s.title || "Sem título"}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">{s.script || "—"}</p>
                              </div>
                              <div className="flex gap-0.5 shrink-0">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewingScript(s); setViewingProject(project); }}><Eye className="h-3.5 w-3.5 text-primary" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditScript(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadPdf("script", s, project)}><Download className="h-3.5 w-3.5" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteItem("scripts", s.id, project)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
      )}

      <Dialog open={!!renamingProject} onOpenChange={(v) => { if (!renameSaving && !v) setRenamingProject(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Renomear projeto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome do projeto</Label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Nome do projeto"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && renameValue.trim()) submitRename(); }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRenamingProject(null)} disabled={renameSaving}>Cancelar</Button>
              <Button onClick={submitRename} disabled={renameSaving || !renameValue.trim()}>
                {renameSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Salvando...</> : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
