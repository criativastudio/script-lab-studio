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
import { Plus, FolderOpen, ChevronDown, ChevronRight, FileText, Lightbulb, BookOpen, Trash2, Sparkles, Loader2, Link as LinkIcon, Copy, Users, Download, Eye } from "lucide-react";
import { ScriptViewer } from "@/components/ScriptViewer";
import { useRef } from "react";

interface Project {
  id: string; name: string | null; client_name: string | null; objective: string | null;
  platform: string | null; status: string | null; created_at: string | null;
}
interface Briefing { id: string; goal: string | null; target_audience: string | null; content_style: string | null; created_at: string | null; }
interface Script { id: string; title: string | null; script: string | null; created_at: string | null; }
interface Idea { id: string; idea: string | null; status: string | null; created_at: string | null; }
interface BriefingRequest {
  id: string; business_name: string; contact_name: string | null; contact_email: string | null;
  contact_whatsapp: string | null; project_name: string; video_quantity: number;
  status: string; token: string; created_at: string; persona: string | null; positioning: string | null;
}

const statusLabels: Record<string, string> = { active: "Ativo", completed: "Concluído", paused: "Pausado" };
const statusColors: Record<string, string> = { active: "bg-accent text-accent-foreground", completed: "bg-primary text-primary-foreground", paused: "bg-muted text-muted-foreground" };
const briefingStatusLabels: Record<string, string> = { pending: "Pendente", submitted: "Enviado", processing: "Processando", completed: "Concluído" };
const briefingStatusColors: Record<string, string> = { pending: "bg-muted text-muted-foreground", submitted: "bg-warning text-warning-foreground", processing: "bg-primary text-primary-foreground", completed: "bg-accent text-accent-foreground" };

const CRM = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", client_name: "", objective: "", platform: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Briefing requests
  const [briefingRequests, setBriefingRequests] = useState<BriefingRequest[]>([]);
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefingForm, setBriefingFormState] = useState({
    business_name: "", contact_name: "", contact_email: "", contact_whatsapp: "",
    project_name: "", video_quantity: "3",
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Detail data for expanded project
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  // Forms for adding items
  const [briefingFormData, setBriefingForm] = useState({ goal: "", target_audience: "", content_style: "" });
  const [scriptForm, setScriptForm] = useState({ title: "", script: "" });
  const [ideaForm, setIdeaForm] = useState({ idea: "" });
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [viewingScript, setViewingScript] = useState<Script | null>(null);

  // PDF Export state
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfProjectId, setPdfProjectId] = useState<string | null>(null);
  const [pdfConfig, setPdfConfig] = useState({
    agency_name: "", agency_logo: "", client_name: "", business_name: "",
    project_name: "", project_date: new Date().toISOString().split("T")[0], project_status: "Em análise",
  });
  const [pdfBriefingData, setPdfBriefingData] = useState<{ persona: string | null; positioning: string | null; tone_of_voice: string | null; content_strategy: string | null; briefing: Briefing | null } | null>(null);
  const [pdfScripts, setPdfScripts] = useState<Script[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const openPdfDialog = async (project: Project) => {
    setPdfProjectId(project.id);
    setPdfConfig(prev => ({
      ...prev,
      client_name: project.client_name || "",
      project_name: project.name || "",
      project_date: project.created_at ? new Date(project.created_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    }));
    // Fetch briefing_request for this project
    const { data: brData } = await supabase.from("briefing_requests").select("persona, positioning, tone_of_voice, content_strategy, business_name").eq("project_id", project.id).maybeSingle();
    // Fetch briefings
    const { data: bData } = await supabase.from("briefings").select("*").eq("project_id", project.id).limit(1);
    // Fetch scripts
    const { data: sData } = await supabase.from("scripts").select("*").eq("project_id", project.id).order("created_at", { ascending: true });
    
    if (brData) {
      setPdfConfig(prev => ({ ...prev, business_name: brData.business_name || prev.business_name }));
    }
    setPdfBriefingData({
      persona: brData?.persona || null,
      positioning: brData?.positioning || null,
      tone_of_voice: brData?.tone_of_voice || null,
      content_strategy: brData?.content_strategy || null,
      briefing: (bData && bData.length > 0) ? bData[0] as Briefing : null,
    });
    setPdfScripts((sData as Script[]) || []);
    setPdfDialogOpen(true);
  };

  const handlePrintPdf = () => {
    setTimeout(() => window.print(), 300);
  };

  const fetchProjects = async () => {
    if (!user) return;
    let q = supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }) as any;
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setProjects((data as Project[]) || []);
  };

  const fetchBriefingRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("briefing_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setBriefingRequests((data as BriefingRequest[]) || []);
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

  useEffect(() => { fetchProjects(); fetchBriefingRequests(); }, [user, filter]);

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

  const handleCreateBriefingRequest = async () => {
    if (!user || !briefingForm.business_name || !briefingForm.project_name) return;
    const { data, error } = await supabase.from("briefing_requests").insert({
      user_id: user.id,
      business_name: briefingForm.business_name,
      contact_name: briefingForm.contact_name || null,
      contact_email: briefingForm.contact_email || null,
      contact_whatsapp: briefingForm.contact_whatsapp || null,
      project_name: briefingForm.project_name,
      video_quantity: parseInt(briefingForm.video_quantity),
    }).select("token").single();

    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }

    const link = `${window.location.origin}/briefing/${data.token}`;
    setGeneratedLink(link);
    fetchBriefingRequests();
    toast({ title: "Cliente registrado!" });
  };

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      toast({ title: "Link copiado!" });
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const addBriefing = async () => {
    if (!user || !expandedId || !briefingFormData.goal) return;
    const { error } = await supabase.from("briefings").insert({
      goal: briefingFormData.goal, target_audience: briefingFormData.target_audience || null,
      content_style: briefingFormData.content_style || null, project_id: expandedId, user_id: user.id,
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
            <Dialog open={briefingOpen} onOpenChange={(v) => { setBriefingOpen(v); if (!v) setGeneratedLink(null); }}>
              <DialogTrigger asChild>
                <Button variant="outline"><Users className="h-4 w-4 mr-2" />Novo Cliente + Briefing</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Registrar Cliente + Briefing</DialogTitle></DialogHeader>
                {generatedLink ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Cliente registrado! Envie o link abaixo para o cliente preencher o briefing:</p>
                    <div className="flex gap-2">
                      <Input value={generatedLink} readOnly className="flex-1 text-xs" />
                      <Button size="sm" onClick={copyLink}><Copy className="h-4 w-4" /></Button>
                    </div>
                    <Button className="w-full" variant="outline" onClick={() => { setBriefingOpen(false); setGeneratedLink(null); setBriefingFormState({ business_name: "", contact_name: "", contact_email: "", contact_whatsapp: "", project_name: "", video_quantity: "3" }); }}>Fechar</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div><Label>Nome da Empresa *</Label><Input value={briefingForm.business_name} onChange={(e) => setBriefingFormState({ ...briefingForm, business_name: e.target.value })} /></div>
                    <div><Label>Nome do Contato</Label><Input value={briefingForm.contact_name} onChange={(e) => setBriefingFormState({ ...briefingForm, contact_name: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Email</Label><Input type="email" value={briefingForm.contact_email} onChange={(e) => setBriefingFormState({ ...briefingForm, contact_email: e.target.value })} /></div>
                      <div><Label>WhatsApp</Label><Input value={briefingForm.contact_whatsapp} onChange={(e) => setBriefingFormState({ ...briefingForm, contact_whatsapp: e.target.value })} /></div>
                    </div>
                    <div><Label>Nome do Projeto *</Label><Input value={briefingForm.project_name} onChange={(e) => setBriefingFormState({ ...briefingForm, project_name: e.target.value })} /></div>
                    <div>
                      <Label>Quantidade de Vídeos</Label>
                      <Select value={briefingForm.video_quantity} onValueChange={(v) => setBriefingFormState({ ...briefingForm, video_quantity: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 vídeo</SelectItem>
                          <SelectItem value="3">3 vídeos</SelectItem>
                          <SelectItem value="5">5 vídeos</SelectItem>
                          <SelectItem value="10">10 vídeos</SelectItem>
                          <SelectItem value="15">15 vídeos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full" onClick={handleCreateBriefingRequest} disabled={!briefingForm.business_name || !briefingForm.project_name}>
                      <LinkIcon className="h-4 w-4 mr-2" />Gerar Link de Briefing
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="projects"><FolderOpen className="h-4 w-4 mr-1" />Projetos</TabsTrigger>
            <TabsTrigger value="briefings"><Users className="h-4 w-4 mr-1" />Clientes & Briefings</TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-4">
            <div className="flex gap-2 mb-4">
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
                                   <div className="flex justify-end mb-3">
                                     <Button variant="outline" size="sm" onClick={() => openPdfDialog(p)}>
                                       <Download className="h-4 w-4 mr-1" />Download Project PDF
                                     </Button>
                                   </div>
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
                                        <Input placeholder="Objetivo" value={briefingFormData.goal} onChange={(e) => setBriefingForm({ ...briefingFormData, goal: e.target.value })} />
                                        <Input placeholder="Público-alvo" value={briefingFormData.target_audience} onChange={(e) => setBriefingForm({ ...briefingFormData, target_audience: e.target.value })} />
                                        <Input placeholder="Estilo de conteúdo" value={briefingFormData.content_style} onChange={(e) => setBriefingForm({ ...briefingFormData, content_style: e.target.value })} />
                                        <Button size="sm" onClick={addBriefing}><Plus className="h-3 w-3 mr-1" />Adicionar</Button>
                                      </div>
                                    </TabsContent>

                                    <TabsContent value="scripts" className="space-y-4 mt-4">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={isGeneratingAI || briefings.length === 0}
                                        onClick={async () => {
                                          if (!user || !expandedId || briefings.length === 0) return;
                                          const b = briefings[0];
                                          const project = projects.find(p => p.id === expandedId);
                                          setIsGeneratingAI(true);
                                          const { data, error } = await supabase.functions.invoke("generate-script", {
                                            body: {
                                              briefing: b.goal || "Marketing video",
                                              target_audience: b.target_audience || "Público geral",
                                              platform: project?.platform || "Instagram Reels",
                                              video_duration: "60 segundos",
                                            },
                                          });
                                          setIsGeneratingAI(false);
                                          if (error || data?.error) {
                                            toast({ title: "Erro ao gerar", description: data?.error || error?.message, variant: "destructive" });
                                            return;
                                          }
                                          const title = `IA: ${(b.goal || "Roteiro").substring(0, 50)}`;
                                          await supabase.from("scripts").insert({
                                            title, script: data.script, project_id: expandedId, user_id: user.id,
                                          });
                                          fetchProjectDetails(expandedId);
                                          toast({ title: "Roteiro gerado e salvo!" });
                                        }}
                                      >
                                        {isGeneratingAI ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                                        {isGeneratingAI ? "Gerando..." : "Gerar com IA"}
                                      </Button>
                                      {briefings.length === 0 && (
                                        <p className="text-xs text-muted-foreground">Adicione um briefing primeiro para gerar com IA.</p>
                                      )}
                                      {scripts.map((s) => (
                                        <Card key={s.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setViewingScript(s)}>
                                          <CardContent className="p-3 flex justify-between items-start">
                                            <div className="space-y-1 flex-1">
                                              <p className="font-medium text-sm">{s.title || "Sem título"}</p>
                                              <p className="text-xs text-muted-foreground line-clamp-2">{s.script || "—"}</p>
                                            </div>
                                            <div className="flex gap-1">
                                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setViewingScript(s); }}><Eye className="h-4 w-4 text-primary" /></Button>
                                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteItem("scripts", s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
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
          </TabsContent>

          {/* Clientes & Briefings Tab */}
          <TabsContent value="briefings" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {briefingRequests.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum cliente registrado ainda.</p>
                    <p className="text-sm">Clique em "Novo Cliente + Briefing" para começar.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Vídeos</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Data</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {briefingRequests.map((br) => (
                        <TableRow key={br.id}>
                          <TableCell className="font-medium">{br.business_name}</TableCell>
                          <TableCell>{br.project_name}</TableCell>
                          <TableCell className="text-sm">
                            {br.contact_name && <span>{br.contact_name}<br /></span>}
                            <span className="text-muted-foreground">{br.contact_email || br.contact_whatsapp || "—"}</span>
                          </TableCell>
                          <TableCell>{br.video_quantity}</TableCell>
                          <TableCell>
                            <Badge className={briefingStatusColors[br.status] || "bg-muted text-muted-foreground"}>
                              {briefingStatusLabels[br.status] || br.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/briefing/${br.token}`);
                                toast({ title: "Link copiado!" });
                              }}
                            >
                              <Copy className="h-3 w-3 mr-1" />Copiar
                            </Button>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {new Date(br.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* PDF Config Dialog */}
        <Dialog open={pdfDialogOpen} onOpenChange={setPdfDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Configurar PDF do Projeto</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              <div><Label>Nome da Agência</Label><Input value={pdfConfig.agency_name} onChange={(e) => setPdfConfig({ ...pdfConfig, agency_name: e.target.value })} /></div>
              <div><Label>Logo da Agência (URL)</Label><Input value={pdfConfig.agency_logo} onChange={(e) => setPdfConfig({ ...pdfConfig, agency_logo: e.target.value })} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Nome do Cliente</Label><Input value={pdfConfig.client_name} onChange={(e) => setPdfConfig({ ...pdfConfig, client_name: e.target.value })} /></div>
                <div><Label>Nome da Empresa</Label><Input value={pdfConfig.business_name} onChange={(e) => setPdfConfig({ ...pdfConfig, business_name: e.target.value })} /></div>
              </div>
              <div><Label>Nome do Projeto</Label><Input value={pdfConfig.project_name} onChange={(e) => setPdfConfig({ ...pdfConfig, project_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Data do Projeto</Label><Input type="date" value={pdfConfig.project_date} onChange={(e) => setPdfConfig({ ...pdfConfig, project_date: e.target.value })} /></div>
                <div>
                  <Label>Status do Projeto</Label>
                  <Select value={pdfConfig.project_status} onValueChange={(v) => setPdfConfig({ ...pdfConfig, project_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Em análise">Em análise</SelectItem>
                      <SelectItem value="Em edição">Em edição</SelectItem>
                      <SelectItem value="Aprovado">Aprovado</SelectItem>
                      <SelectItem value="Rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={handlePrintPdf}><Download className="h-4 w-4 mr-2" />Gerar PDF</Button>
          </DialogContent>
        </Dialog>

        {/* Hidden print container */}
        <div id="pdf-print-container" ref={printRef} className="hidden print:block">
          <div className="pdf-header">
            {pdfConfig.agency_logo && <img src={pdfConfig.agency_logo} alt="Logo" />}
            {pdfConfig.agency_name && <h1>{pdfConfig.agency_name}</h1>}
            <p><strong>Cliente:</strong> {pdfConfig.client_name}</p>
            <p><strong>Empresa:</strong> {pdfConfig.business_name}</p>
            <p><strong>Projeto:</strong> {pdfConfig.project_name}</p>
            <p><strong>Data:</strong> {pdfConfig.project_date}</p>
            <span className="pdf-status-badge">{pdfConfig.project_status}</span>
          </div>

          {pdfBriefingData?.briefing && (
            <div className="pdf-section">
              <div className="pdf-section-title">Briefing Estratégico</div>
              <dl className="pdf-meta-grid">
                <dt>Objetivo</dt><dd>{pdfBriefingData.briefing.goal || "—"}</dd>
                <dt>Público-alvo</dt><dd>{pdfBriefingData.briefing.target_audience || "—"}</dd>
                <dt>Estilo de Conteúdo</dt><dd>{pdfBriefingData.briefing.content_style || "—"}</dd>
              </dl>
            </div>
          )}

          {pdfBriefingData?.persona && (
            <div className="pdf-section">
              <div className="pdf-section-title">Persona do Cliente</div>
              <div className="pdf-content">{pdfBriefingData.persona}</div>
            </div>
          )}

          {pdfBriefingData?.positioning && (
            <div className="pdf-section">
              <div className="pdf-section-title">Posicionamento de Marca</div>
              <div className="pdf-content">{pdfBriefingData.positioning}</div>
            </div>
          )}

          {pdfBriefingData?.tone_of_voice && (
            <div className="pdf-section">
              <div className="pdf-section-title">Tom de Voz</div>
              <div className="pdf-content">{pdfBriefingData.tone_of_voice}</div>
            </div>
          )}

          {pdfBriefingData?.content_strategy && (
            <div className="pdf-section">
              <div className="pdf-section-title">Estratégia de Conteúdo</div>
              <div className="pdf-content">{pdfBriefingData.content_strategy}</div>
            </div>
          )}

          {pdfScripts.length > 0 && (
            <div className="pdf-section pdf-page-break">
              <div className="pdf-section-title">Roteiros de Vídeo ({pdfScripts.length})</div>
              {pdfScripts.map((s, idx) => (
                <div key={s.id} className="pdf-script-card">
                  <h3>Roteiro {idx + 1}: {s.title || "Sem título"}</h3>
                  <div className="pdf-content">{s.script || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ScriptViewer
        script={viewingScript}
        project={expandedId ? projects.find(p => p.id === expandedId) || null : null}
        open={!!viewingScript}
        onOpenChange={(open) => { if (!open) setViewingScript(null); }}
      />
    </DashboardLayout>
  );
};

export default CRM;
