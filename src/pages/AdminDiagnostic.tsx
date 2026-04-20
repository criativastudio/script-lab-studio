import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, Eye, Trash2, Search, Copy, ExternalLink, LayoutGrid, Table as TableIcon } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { LeadKanbanColumn, ColumnConfig } from "@/components/admin/LeadKanbanColumn";
import { LeadKanbanCard, KanbanLead, PipelineStage } from "@/components/admin/LeadKanbanCard";

interface DiagnosticLead extends KanbanLead {
  answers: Record<string, string>;
  result: {
    score?: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
  } | null;
  contacted_at: string | null;
  stage_updated_at: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  posicionamento: "Posicionamento",
  conteudo: "Conteúdo",
  autoridade: "Autoridade",
};

const STAGE_LABELS: Record<PipelineStage, string> = {
  cold: "Lead Frio",
  warm: "Lead Morno",
  hot: "Lead Quente",
  contacted: "Contatado",
};

const COLUMNS: ColumnConfig[] = [
  { id: "cold", label: "Lead Frio", accent: "border-sky-500/60 bg-sky-500/5" },
  { id: "warm", label: "Lead Morno", accent: "border-amber-500/60 bg-amber-500/5" },
  { id: "hot", label: "Lead Quente", accent: "border-rose-500/60 bg-rose-500/5" },
  { id: "contacted", label: "Contatado", accent: "border-emerald-500/60 bg-emerald-500/5" },
];

export default function AdminDiagnostic() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<DiagnosticLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [viewing, setViewing] = useState<DiagnosticLead | null>(null);
  const [deleting, setDeleting] = useState<DiagnosticLead | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("diagnostic_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar leads", description: error.message, variant: "destructive" });
    } else {
      setLeads((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
    const channel = supabase
      .channel("diagnostic_leads_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "diagnostic_leads" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setLeads((prev) =>
              prev.find((l) => l.id === (payload.new as any).id) ? prev : [payload.new as any, ...prev],
            );
          } else if (payload.eventType === "UPDATE") {
            setLeads((prev) => prev.map((l) => (l.id === (payload.new as any).id ? (payload.new as any) : l)));
          } else if (payload.eventType === "DELETE") {
            setLeads((prev) => prev.filter((l) => l.id !== (payload.old as any).id));
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("diagnostic_leads").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead excluído" });
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
    setDeleting(null);
  };

  const updateStage = async (lead: DiagnosticLead, stage: PipelineStage) => {
    if (lead.pipeline_stage === stage) return;
    const previous = lead.pipeline_stage;
    // optimistic
    setLeads((prev) =>
      prev.map((l) =>
        l.id === lead.id
          ? {
              ...l,
              pipeline_stage: stage,
              contacted_at: stage === "contacted" ? new Date().toISOString() : l.contacted_at,
              stage_updated_at: new Date().toISOString(),
            }
          : l,
      ),
    );
    const update: any = { pipeline_stage: stage, stage_updated_at: new Date().toISOString() };
    if (stage === "contacted" && !lead.contacted_at) update.contacted_at = new Date().toISOString();

    const { error } = await supabase.from("diagnostic_leads").update(update).eq("id", lead.id);
    if (error) {
      // rollback
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, pipeline_stage: previous } : l)));
      toast({ title: "Erro ao atualizar estágio", description: error.message, variant: "destructive" });
    }
  };

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (typeFilter !== "all" && l.diagnostic_type !== typeFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.business_name.toLowerCase().includes(q)
      );
    });
  }, [leads, search, typeFilter]);

  const grouped = useMemo(() => {
    const map: Record<PipelineStage, DiagnosticLead[]> = { cold: [], warm: [], hot: [], contacted: [] };
    for (const l of filtered) {
      const stage = (l.pipeline_stage as PipelineStage) || "cold";
      (map[stage] ||= []).push(l);
    }
    return map;
  }, [filtered]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthLeads = leads.filter((l) => new Date(l.created_at) >= startOfMonth).length;
    const byType = leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.diagnostic_type] = (acc[l.diagnostic_type] || 0) + 1;
      return acc;
    }, {});
    return { total: leads.length, month: monthLeads, byType };
  }, [leads]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const lead = leads.find((l) => l.id === active.id);
    if (!lead) return;

    // over.id may be a column id or another lead id
    const overId = String(over.id);
    let targetStage: PipelineStage | null = null;
    if ((COLUMNS.map((c) => c.id) as string[]).includes(overId)) {
      targetStage = overId as PipelineStage;
    } else {
      const overLead = leads.find((l) => l.id === overId);
      if (overLead) targetStage = overLead.pipeline_stage as PipelineStage;
    }
    if (!targetStage) return;
    updateStage(lead, targetStage);
  };

  const activeLead = activeId ? leads.find((l) => l.id === activeId) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">CRM de Diagnósticos</h1>
              <p className="text-sm text-muted-foreground">
                Leads qualificados via quiz de diagnóstico — arraste para mover entre estágios
              </p>
            </div>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList>
              <TabsTrigger value="kanban" className="gap-1.5">
                <LayoutGrid className="w-4 h-4" /> Kanban
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-1.5">
                <TableIcon className="w-4 h-4" /> Tabela
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Public link */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Link público para divulgação</CardTitle>
            <p className="text-sm text-muted-foreground">
              Use este link como ferramenta de captação qualificada: quanto mais pessoas preencherem, mais oportunidades
              você gera para vender seus serviços.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-2">
            <Input
              readOnly
              value={`${window.location.origin}/diagnostico`}
              className="flex-1 font-mono text-sm"
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/diagnostico`);
                  toast({ title: "Link copiado!", description: "Cole onde quiser divulgar." });
                }}
              >
                <Copy className="w-4 h-4 mr-2" /> Copiar link
              </Button>
              <Button variant="outline" onClick={() => window.open("/diagnostico", "_blank")}>
                <ExternalLink className="w-4 h-4 mr-2" /> Abrir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total de Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Este Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.month}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Quentes + Contatados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(grouped.hot?.length || 0) + (grouped.contacted?.length || 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Em Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {(grouped.cold?.length || 0) + (grouped.warm?.length || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou empresa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Kanban / Table */}
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">Carregando...</CardContent>
          </Card>
        ) : view === "kanban" ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
              {COLUMNS.map((col) => (
                <LeadKanbanColumn
                  key={col.id}
                  column={col}
                  leads={grouped[col.id] || []}
                  onView={(l) => setViewing(l as DiagnosticLead)}
                  onMarkContacted={(l) => updateStage(l as DiagnosticLead, "contacted")}
                  onDelete={(l) => setDeleting(l as DiagnosticLead)}
                />
              ))}
            </div>
            <DragOverlay>
              {activeLead && (
                <div className="rotate-2 opacity-95">
                  <LeadKanbanCard
                    lead={activeLead}
                    onView={() => {}}
                    onMarkContacted={() => {}}
                    onDelete={() => {}}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <Card>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Nenhum lead encontrado.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Cidade</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Estágio</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs">
                          {new Date(l.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{TYPE_LABELS[l.diagnostic_type] || l.diagnostic_type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{l.name}</TableCell>
                        <TableCell>{l.business_name}</TableCell>
                        <TableCell>{l.city}</TableCell>
                        <TableCell className="text-xs">{l.email}</TableCell>
                        <TableCell>
                          {l.score != null ? (
                            <Badge variant="outline">{l.score}/10</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={(l.pipeline_stage as PipelineStage) || "cold"}
                            onValueChange={(v) => updateStage(l, v as PipelineStage)}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COLUMNS.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {STAGE_LABELS[c.id]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setViewing(l)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setDeleting(l)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete confirm */}
        <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é permanente e removerá o lead «{deleting?.name}» do CRM.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleting && handleDelete(deleting.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir permanentemente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View dialog */}
        <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {viewing?.name} — {viewing && TYPE_LABELS[viewing.diagnostic_type]}
              </DialogTitle>
            </DialogHeader>
            {viewing && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Empresa:</span> {viewing.business_name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cidade:</span> {viewing.city}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span> {viewing.email}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Telefone:</span> {viewing.phone}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Respostas do quiz</h3>
                  <div className="space-y-2">
                    {Object.entries(viewing.answers || {}).map(([k, v]) => (
                      <div key={k} className="border rounded-md p-3 bg-muted/30">
                        <div className="text-xs text-muted-foreground uppercase mb-1">{k}</div>
                        <div className="text-sm">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {viewing.result && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      Resultado da IA{" "}
                      {viewing.score != null && (
                        <Badge variant="outline" className="ml-2">
                          {viewing.score}/10
                        </Badge>
                      )}
                    </h3>
                    {viewing.result.summary && <p className="text-sm mb-3">{viewing.result.summary}</p>}
                    {viewing.result.strengths && viewing.result.strengths.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Pontos Fortes</div>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {viewing.result.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {viewing.result.weaknesses && viewing.result.weaknesses.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Pontos de Atenção</div>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {viewing.result.weaknesses.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {viewing.result.recommendations && viewing.result.recommendations.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Recomendações</div>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {viewing.result.recommendations.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
