import { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, ArrowLeft, FileText, BookOpen, Trash2, Sparkles, Loader2,
  Link as LinkIcon, Copy, Users, Download, Eye, Edit2, Building2,
  Mail, Phone, Video, Calendar, Bot
} from "lucide-react";
import { ScriptViewer } from "@/components/ScriptViewer";

interface BriefingRequest {
  id: string; business_name: string; contact_name: string | null; contact_email: string | null;
  contact_whatsapp: string | null; project_name: string; video_quantity: number;
  status: string; token: string; created_at: string; persona: string | null;
  positioning: string | null; tone_of_voice: string | null; content_strategy: string | null;
  project_id: string | null; form_answers: any;
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

const CRM = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // Client list
  const [clients, setClients] = useState<BriefingRequest[]>([]);
  const [selectedClient, setSelectedClient] = useState<BriefingRequest | null>(null);

  // New client dialog
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefingForm, setBriefingFormState] = useState({
    business_name: "", contact_name: "", contact_email: "", contact_whatsapp: "",
    project_name: "", video_quantity: "3",
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Client detail data
  const [briefings, setBriefings] = useState<Briefing[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewingScript, setViewingScript] = useState<Script | null>(null);

  // Edit dialogs
  const [editingBriefing, setEditingBriefing] = useState<Briefing | null>(null);
  const [editBriefingForm, setEditBriefingForm] = useState({ goal: "", target_audience: "", content_style: "" });
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [editScriptForm, setEditScriptForm] = useState({ title: "", script: "" });

  // PDF state
  const [pdfData, setPdfData] = useState<{ client: BriefingRequest; briefing?: Briefing; scripts: Script[] } | null>(null);

  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("briefing_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setClients((data as BriefingRequest[]) || []);
  };

  const fetchClientDetails = async (client: BriefingRequest) => {
    if (!user || !client.project_id) { setBriefings([]); setScripts([]); return; }
    const [b, s] = await Promise.all([
      supabase.from("briefings").select("*").eq("project_id", client.project_id).eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("scripts").select("*").eq("project_id", client.project_id).eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setBriefings((b.data as Briefing[]) || []);
    setScripts((s.data as Script[]) || []);
  };

  useEffect(() => { fetchClients(); }, [user]);

  useEffect(() => {
    if (selectedClient) fetchClientDetails(selectedClient);
  }, [selectedClient]);

  const handleCreateClient = async () => {
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
    fetchClients();
    toast({ title: "Cliente registrado!" });
  };

  const handleGenerateWithAgent = async () => {
    if (!selectedClient) return;
    if (!selectedClient.form_answers) {
      toast({ title: "Briefing pendente", description: "O cliente ainda não preencheu o formulário de briefing.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { error } = await supabase.functions.invoke("process-briefing", {
        body: { token: selectedClient.token },
      });
      if (error) throw error;
      // Refresh client data
      const { data: updated } = await supabase.from("briefing_requests").select("*").eq("id", selectedClient.id).single();
      if (updated) {
        setSelectedClient(updated as BriefingRequest);
        fetchClients();
      }
      toast({ title: "Conteúdo gerado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit handlers
  const openEditBriefing = (b: Briefing) => {
    setEditBriefingForm({ goal: b.goal || "", target_audience: b.target_audience || "", content_style: b.content_style || "" });
    setEditingBriefing(b);
  };
  const saveEditBriefing = async () => {
    if (!editingBriefing) return;
    const { error } = await supabase.from("briefings").update({
      goal: editBriefingForm.goal, target_audience: editBriefingForm.target_audience, content_style: editBriefingForm.content_style,
    }).eq("id", editingBriefing.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setEditingBriefing(null);
    if (selectedClient) fetchClientDetails(selectedClient);
    toast({ title: "Briefing atualizado!" });
  };

  const openEditScript = (s: Script) => {
    setEditScriptForm({ title: s.title || "", script: s.script || "" });
    setEditingScript(s);
  };
  const saveEditScript = async () => {
    if (!editingScript) return;
    const { error } = await supabase.from("scripts").update({
      title: editScriptForm.title, script: editScriptForm.script,
    }).eq("id", editingScript.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setEditingScript(null);
    if (selectedClient) fetchClientDetails(selectedClient);
    toast({ title: "Roteiro atualizado!" });
  };

  const deleteItem = async (table: "briefings" | "scripts", id: string) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    if (selectedClient) fetchClientDetails(selectedClient);
    toast({ title: "Item removido!" });
  };

  // Instant PDF download
  const downloadPdf = async (type: "briefing" | "script", item: Briefing | Script) => {
    if (!selectedClient) return;
    const allScripts = type === "script" ? [item as Script] : [];
    const briefing = type === "briefing" ? item as Briefing : undefined;
    setPdfData({ client: selectedClient, briefing, scripts: allScripts });
    setTimeout(() => window.print(), 400);
  };

  const downloadAllPdf = () => {
    if (!selectedClient) return;
    setPdfData({ client: selectedClient, briefing: briefings[0], scripts });
    setTimeout(() => window.print(), 400);
  };

  // --- RENDER ---

  // Detail View
  if (selectedClient) {
    const project = { id: selectedClient.project_id || "", name: selectedClient.project_name, client_name: selectedClient.business_name, objective: null, platform: null, status: selectedClient.status, created_at: selectedClient.created_at };
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {selectedClient.business_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{selectedClient.business_name}</h1>
              <p className="text-muted-foreground text-sm">{selectedClient.project_name}</p>
            </div>
            <Badge className={briefingStatusColors[selectedClient.status] || "bg-muted text-muted-foreground"}>
              {briefingStatusLabels[selectedClient.status] || selectedClient.status}
            </Badge>
          </div>

          {/* Client info + actions */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-6 items-center justify-between">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {selectedClient.contact_name && (
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{selectedClient.contact_name}</span>
                  )}
                  {selectedClient.contact_email && (
                    <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selectedClient.contact_email}</span>
                  )}
                  {selectedClient.contact_whatsapp && (
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selectedClient.contact_whatsapp}</span>
                  )}
                  <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" />{selectedClient.video_quantity} vídeos</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(selectedClient.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadAllPdf}>
                    <Download className="h-4 w-4 mr-1" />PDF Completo
                  </Button>
                  <Button size="sm" onClick={handleGenerateWithAgent} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Bot className="h-4 w-4 mr-1" />}
                    {isGenerating ? "Gerando..." : "Gerar com Agente"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Briefings Section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />Briefings ({briefings.length})
            </h2>
            {briefings.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Nenhum briefing gerado ainda.</CardContent></Card>
            ) : (
              <div className="grid gap-3">
                {briefings.map((b) => (
                  <Card key={b.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{b.goal || "Sem objetivo"}</p>
                        <p className="text-xs text-muted-foreground">Público: {b.target_audience || "—"} • Estilo: {b.content_style || "—"}</p>
                        <p className="text-xs text-muted-foreground">{b.created_at ? new Date(b.created_at).toLocaleDateString("pt-BR") : ""}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditBriefing(b)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => downloadPdf("briefing", b)}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteItem("briefings", b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Scripts Section */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />Roteiros ({scripts.length})
            </h2>
            {scripts.length === 0 ? (
              <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">Nenhum roteiro gerado ainda.</CardContent></Card>
            ) : (
              <div className="grid gap-3">
                {scripts.map((s) => (
                  <Card key={s.id} className="hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-sm">{s.title || "Sem título"}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{s.script || "—"}</p>
                        <p className="text-xs text-muted-foreground">{s.created_at ? new Date(s.created_at).toLocaleDateString("pt-BR") : ""}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewingScript(s)}><Eye className="h-4 w-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditScript(s)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => downloadPdf("script", s)}><Download className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteItem("scripts", s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Edit Briefing Dialog */}
        <Dialog open={!!editingBriefing} onOpenChange={(v) => { if (!v) setEditingBriefing(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Briefing</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Objetivo</Label><Input value={editBriefingForm.goal} onChange={(e) => setEditBriefingForm({ ...editBriefingForm, goal: e.target.value })} /></div>
              <div><Label>Público-alvo</Label><Input value={editBriefingForm.target_audience} onChange={(e) => setEditBriefingForm({ ...editBriefingForm, target_audience: e.target.value })} /></div>
              <div><Label>Estilo de Conteúdo</Label><Input value={editBriefingForm.content_style} onChange={(e) => setEditBriefingForm({ ...editBriefingForm, content_style: e.target.value })} /></div>
              <Button className="w-full" onClick={saveEditBriefing}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Script Dialog */}
        <Dialog open={!!editingScript} onOpenChange={(v) => { if (!v) setEditingScript(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Editar Roteiro</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={editScriptForm.title} onChange={(e) => setEditScriptForm({ ...editScriptForm, title: e.target.value })} /></div>
              <div><Label>Conteúdo</Label><Textarea value={editScriptForm.script} onChange={(e) => setEditScriptForm({ ...editScriptForm, script: e.target.value })} rows={12} /></div>
              <Button className="w-full" onClick={saveEditScript}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ScriptViewer */}
        <ScriptViewer
          script={viewingScript}
          project={project}
          open={!!viewingScript}
          onOpenChange={(open) => { if (!open) setViewingScript(null); }}
        />

        {/* Hidden PDF print container */}
        <div id="pdf-print-container" ref={printRef} className="hidden print:block">
          {pdfData && (
            <>
              <div className="pdf-header">
                <h1>{pdfData.client.business_name}</h1>
                <p><strong>Projeto:</strong> {pdfData.client.project_name}</p>
                <p><strong>Contato:</strong> {pdfData.client.contact_name || "—"}</p>
                <p><strong>Data:</strong> {new Date(pdfData.client.created_at).toLocaleDateString("pt-BR")}</p>
                <span className="pdf-status-badge">{briefingStatusLabels[pdfData.client.status] || pdfData.client.status}</span>
              </div>

              {pdfData.briefing && (
                <div className="pdf-section">
                  <div className="pdf-section-title">Briefing Estratégico</div>
                  <dl className="pdf-meta-grid">
                    <dt>Objetivo</dt><dd>{pdfData.briefing.goal || "—"}</dd>
                    <dt>Público-alvo</dt><dd>{pdfData.briefing.target_audience || "—"}</dd>
                    <dt>Estilo de Conteúdo</dt><dd>{pdfData.briefing.content_style || "—"}</dd>
                  </dl>
                </div>
              )}

              {pdfData.client.persona && (
                <div className="pdf-section">
                  <div className="pdf-section-title">Persona</div>
                  <div className="pdf-content">{pdfData.client.persona}</div>
                </div>
              )}

              {pdfData.client.positioning && (
                <div className="pdf-section">
                  <div className="pdf-section-title">Posicionamento</div>
                  <div className="pdf-content">{pdfData.client.positioning}</div>
                </div>
              )}

              {pdfData.client.tone_of_voice && (
                <div className="pdf-section">
                  <div className="pdf-section-title">Tom de Voz</div>
                  <div className="pdf-content">{pdfData.client.tone_of_voice}</div>
                </div>
              )}

              {pdfData.client.content_strategy && (
                <div className="pdf-section">
                  <div className="pdf-section-title">Estratégia de Conteúdo</div>
                  <div className="pdf-content">{pdfData.client.content_strategy}</div>
                </div>
              )}

              {pdfData.scripts.length > 0 && (
                <div className="pdf-section pdf-page-break">
                  <div className="pdf-section-title">Roteiros ({pdfData.scripts.length})</div>
                  {pdfData.scripts.map((s, idx) => (
                    <div key={s.id} className="pdf-script-card">
                      <h3>Roteiro {idx + 1}: {s.title || "Sem título"}</h3>
                      <div className="pdf-content">{s.script || "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // --- List View ---
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gerencie seus clientes e produções</p>
          </div>
          <Dialog open={briefingOpen} onOpenChange={(v) => { setBriefingOpen(v); if (!v) setGeneratedLink(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Adicionar Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
              {generatedLink ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Cliente registrado! Envie o link para o cliente preencher o briefing:</p>
                  <div className="flex gap-2">
                    <Input value={generatedLink} readOnly className="flex-1 text-xs" />
                    <Button size="sm" onClick={() => { navigator.clipboard.writeText(generatedLink); toast({ title: "Link copiado!" }); }}><Copy className="h-4 w-4" /></Button>
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
                  <Button className="w-full" onClick={handleCreateClient} disabled={!briefingForm.business_name || !briefingForm.project_name}>
                    <LinkIcon className="h-4 w-4 mr-2" />Registrar e Gerar Link
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Client Cards Grid */}
        {clients.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Nenhum cliente registrado</p>
              <p className="text-sm mt-1">Clique em "Adicionar Novo Cliente" para começar.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card
                key={client.id}
                className="cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group"
                onClick={() => setSelectedClient(client)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 mt-0.5">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {client.business_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {client.business_name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{client.project_name}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className={`text-[10px] ${briefingStatusColors[client.status] || ""}`}>
                          {briefingStatusLabels[client.status] || client.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Video className="h-3 w-3" />{client.video_quantity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(client.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CRM;
