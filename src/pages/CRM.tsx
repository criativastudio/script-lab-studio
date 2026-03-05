import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderOpen, ChevronDown, ChevronRight, FileText, Lightbulb, BookOpen, Trash2 } from "lucide-react";

interface Project {
  id: string; name: string | null; client_name: string | null; objective: string | null;
  platform: string | null; status: string | null; created_at: string | null;
}
interface Briefing { id: string; goal: string | null; target_audience: string | null; content_style: string | null; created_at: string | null; }
interface Script { id: string; title: string | null; script: string | null; created_at: string | null; }
interface Idea { id: string; idea: string | null; status: string | null; created_at: string | null; }

const statusLabels: Record<string, string> = { active: "Ativo", completed: "Concluído", paused: "Pausado" };
const statusColors: Record<string, string> = { active: "bg-accent text-accent-foreground", completed: "bg-primary text-primary-foreground", paused: "bg-muted text-muted-foreground" };

const CRM = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", client_name: "", objective: "", platform: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Detail data for expanded project
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  // Forms for adding items
  const [briefingForm, setBriefingForm] = useState({ goal: "", target_audience: "", content_style: "" });
  const [scriptForm, setScriptForm] = useState({ title: "", script: "" });
  const [ideaForm, setIdeaForm] = useState({ idea: "" });

  const fetchProjects = async () => {
    if (!user) return;
    let q = supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }) as any;
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setProjects((data as Project[]) || []);
  };

  const fetchProjectDetails = async (projectId: string) => {
    if (!user) return;
    const [b, s, i] = await Promise.all([
      supabase.from("briefings").select("*").eq("project_id", projectId).eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("scripts").select("*").eq("project_id", projectId).eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("ideas").select("*").eq("project_id", projectId).eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setBriefings((b.data as Briefing[]) || []);
    setScripts((s.data as Script[]) || []);
    setIdeas((i.data as Idea[]) || []);
  };

  useEffect(() => { fetchProjects(); }, [user, filter]);

  useEffect(() => {
    if (expandedId) fetchProjectDetails(expandedId);
  }, [expandedId]);

  const handleCreate = async () => {
    if (!user || !form.name) return;
    const { error } = await supabase.from("projects").insert({
      name: form.name, client_name: form.client_name || null, objective: form.objective || null,
      platform: form.platform || null, user_id: user.id,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setForm({ name: "", client_name: "", objective: "", platform: "" });
    setOpen(false);
    fetchProjects();
    toast({ title: "Projeto criado!" });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const addBriefing = async () => {
    if (!user || !expandedId || !briefingForm.goal) return;
    const { error } = await supabase.from("briefings").insert({
      goal: briefingForm.goal, target_audience: briefingForm.target_audience || null,
      content_style: briefingForm.content_style || null, project_id: expandedId, user_id: user.id,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setBriefingForm({ goal: "", target_audience: "", content_style: "" });
    fetchProjectDetails(expandedId);
    toast({ title: "Briefing adicionado!" });
  };

  const addScript = async () => {
    if (!user || !expandedId || !scriptForm.title) return;
    const { error } = await supabase.from("scripts").insert({
      title: scriptForm.title, script: scriptForm.script || null,
      project_id: expandedId, user_id: user.id,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setScriptForm({ title: "", script: "" });
    fetchProjectDetails(expandedId);
    toast({ title: "Roteiro adicionado!" });
  };

  const addIdea = async () => {
    if (!user || !expandedId || !ideaForm.idea) return;
    const { error } = await supabase.from("ideas").insert({
      idea: ideaForm.idea, project_id: expandedId, user_id: user.id,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setIdeaForm({ idea: "" });
    fetchProjectDetails(expandedId);
    toast({ title: "Ideia adicionada!" });
  };

  const deleteItem = async (table: "briefings" | "scripts" | "ideas", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    if (expandedId) fetchProjectDetails(expandedId);
    toast({ title: "Item removido!" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gerenciador de Projetos</h1>
            <p className="text-muted-foreground">Gerencie suas produções audiovisuais</p>
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="completed">Concluídos</SelectItem>
                <SelectItem value="paused">Pausados</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Novo Projeto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Nome do Projeto</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div><Label>Cliente</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
                  <div><Label>Objetivo</Label><Textarea value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })} /></div>
                  <div><Label>Plataforma</Label>
                    <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="YouTube">YouTube</SelectItem>
                        <SelectItem value="Instagram">Instagram</SelectItem>
                        <SelectItem value="TikTok">TikTok</SelectItem>
                        <SelectItem value="TV">TV</SelectItem>
                        <SelectItem value="Cinema">Cinema</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={handleCreate}>Criar Projeto</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {projects.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum projeto encontrado.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Projeto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <>
                      <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(p.id)}>
                        <TableCell>
                          {expandedId === p.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </TableCell>
                        <TableCell className="font-medium">{p.name || "—"}</TableCell>
                        <TableCell>{p.client_name || "—"}</TableCell>
                        <TableCell>{p.platform || "—"}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[p.status || "active"]}>{statusLabels[p.status || "active"] || p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {p.created_at ? new Date(p.created_at).toLocaleDateString("pt-BR") : "—"}
                        </TableCell>
                      </TableRow>
                      {expandedId === p.id && (
                        <TableRow key={`${p.id}-detail`}>
                          <TableCell colSpan={6} className="p-0">
                            <div className="p-4 bg-muted/30 border-t border-border">
                              <Tabs defaultValue="briefings">
                                <TabsList>
                                  <TabsTrigger value="briefings"><BookOpen className="h-4 w-4 mr-1" />Briefings ({briefings.length})</TabsTrigger>
                                  <TabsTrigger value="scripts"><FileText className="h-4 w-4 mr-1" />Roteiros ({scripts.length})</TabsTrigger>
                                  <TabsTrigger value="ideas"><Lightbulb className="h-4 w-4 mr-1" />Ideias ({ideas.length})</TabsTrigger>
                                </TabsList>

                                <TabsContent value="briefings" className="space-y-4 mt-4">
                                  {briefings.map((b) => (
                                    <Card key={b.id}>
                                      <CardContent className="p-3 flex justify-between items-start">
                                        <div className="space-y-1 flex-1">
                                          <p className="font-medium text-sm">{b.goal || "Sem objetivo"}</p>
                                          <p className="text-xs text-muted-foreground">Público: {b.target_audience || "—"} • Estilo: {b.content_style || "—"}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => deleteItem("briefings", b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  <div className="grid gap-2 border border-border rounded-md p-3">
                                    <Label className="text-xs font-semibold">Novo Briefing</Label>
                                    <Input placeholder="Objetivo" value={briefingForm.goal} onChange={(e) => setBriefingForm({ ...briefingForm, goal: e.target.value })} />
                                    <Input placeholder="Público-alvo" value={briefingForm.target_audience} onChange={(e) => setBriefingForm({ ...briefingForm, target_audience: e.target.value })} />
                                    <Input placeholder="Estilo de conteúdo" value={briefingForm.content_style} onChange={(e) => setBriefingForm({ ...briefingForm, content_style: e.target.value })} />
                                    <Button size="sm" onClick={addBriefing}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
                                  </div>
                                </TabsContent>

                                <TabsContent value="scripts" className="space-y-4 mt-4">
                                  {scripts.map((s) => (
                                    <Card key={s.id}>
                                      <CardContent className="p-3 flex justify-between items-start">
                                        <div className="space-y-1 flex-1">
                                          <p className="font-medium text-sm">{s.title || "Sem título"}</p>
                                          <p className="text-xs text-muted-foreground line-clamp-2">{s.script || "—"}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => deleteItem("scripts", s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  <div className="grid gap-2 border border-border rounded-md p-3">
                                    <Label className="text-xs font-semibold">Novo Roteiro</Label>
                                    <Input placeholder="Título" value={scriptForm.title} onChange={(e) => setScriptForm({ ...scriptForm, title: e.target.value })} />
                                    <Textarea placeholder="Texto do roteiro" value={scriptForm.script} onChange={(e) => setScriptForm({ ...scriptForm, script: e.target.value })} rows={4} />
                                    <Button size="sm" onClick={addScript}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
                                  </div>
                                </TabsContent>

                                <TabsContent value="ideas" className="space-y-4 mt-4">
                                  {ideas.map((i) => (
                                    <Card key={i.id}>
                                      <CardContent className="p-3 flex justify-between items-start">
                                        <p className="text-sm flex-1">{i.idea || "—"}</p>
                                        <Button variant="ghost" size="icon" onClick={() => deleteItem("ideas", i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                      </CardContent>
                                    </Card>
                                  ))}
                                  <div className="grid gap-2 border border-border rounded-md p-3">
                                    <Label className="text-xs font-semibold">Nova Ideia</Label>
                                    <Input placeholder="Descreva sua ideia" value={ideaForm.idea} onChange={(e) => setIdeaForm({ ...ideaForm, idea: e.target.value })} />
                                    <Button size="sm" onClick={addIdea}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CRM;
