import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ClipboardCheck, Eye, Trash2, Search } from "lucide-react";

interface DiagnosticLead {
  id: string;
  created_at: string;
  diagnostic_type: string;
  name: string;
  phone: string;
  email: string;
  business_name: string;
  city: string;
  answers: Record<string, string>;
  result: {
    score?: number;
    summary?: string;
    strengths?: string[];
    weaknesses?: string[];
    recommendations?: string[];
  } | null;
  score: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  posicionamento: "Posicionamento",
  conteudo: "Conteúdo",
  autoridade: "Autoridade",
};

export default function AdminDiagnostic() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<DiagnosticLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewing, setViewing] = useState<DiagnosticLead | null>(null);

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
  }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("diagnostic_leads").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead excluído" });
      setLeads((prev) => prev.filter((l) => l.id !== id));
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">CRM de Diagnósticos</h1>
            <p className="text-sm text-muted-foreground">
              Leads que preencheram o quiz de diagnóstico gratuito
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          {Object.entries(TYPE_LABELS).map(([key, label]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.byType[key] || 0}</div>
              </CardContent>
            </Card>
          )).slice(0, 2)}
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Carregando...</div>
            ) : filtered.length === 0 ? (
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
                    <TableHead>Telefone</TableHead>
                    <TableHead>Score</TableHead>
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
                      <TableCell className="text-xs">{l.phone}</TableCell>
                      <TableCell>
                        {l.score != null ? (
                          <Badge variant="outline">{l.score}/10</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setViewing(l)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação é permanente e removerá o lead «{l.name}» do CRM.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(l.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir permanentemente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

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
                  <div><span className="text-muted-foreground">Empresa:</span> {viewing.business_name}</div>
                  <div><span className="text-muted-foreground">Cidade:</span> {viewing.city}</div>
                  <div><span className="text-muted-foreground">Email:</span> {viewing.email}</div>
                  <div><span className="text-muted-foreground">Telefone:</span> {viewing.phone}</div>
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
                      Resultado da IA {viewing.score != null && <Badge variant="outline" className="ml-2">{viewing.score}/10</Badge>}
                    </h3>
                    {viewing.result.summary && (
                      <p className="text-sm mb-3">{viewing.result.summary}</p>
                    )}
                    {viewing.result.strengths && viewing.result.strengths.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Pontos Fortes</div>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {viewing.result.strengths.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {viewing.result.weaknesses && viewing.result.weaknesses.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Pontos de Atenção</div>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {viewing.result.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
                        </ul>
                      </div>
                    )}
                    {viewing.result.recommendations && viewing.result.recommendations.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Recomendações</div>
                        <ul className="text-sm list-disc list-inside space-y-1">
                          {viewing.result.recommendations.map((s, i) => <li key={i}>{s}</li>)}
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
