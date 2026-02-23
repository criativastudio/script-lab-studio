import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  status: string;
  source: string | null;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  novo: "Novo",
  em_atendimento: "Em Atendimento",
  fechado: "Fechado",
  perdido: "Perdido",
};

type LeadStatus = "novo" | "em_atendimento" | "fechado" | "perdido";

const statusColors: Record<string, string> = {
  novo: "bg-primary/10 text-primary",
  em_atendimento: "bg-warning/10 text-warning",
  fechado: "bg-success/10 text-success",
  perdido: "bg-destructive/10 text-destructive",
};

const CRM = () => {
  const { clientId } = useAuth();
  type FilterValue = LeadStatus | "all";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState<FilterValue>("all");
  const { toast } = useToast();

  const fetchLeads = async () => {
    if (!clientId) return;
    let query = supabase.from("leads").select("*").eq("client_id", clientId).order("created_at", { ascending: false }) as any;
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    if (data) setLeads(data as Lead[]);
  };

  useEffect(() => { fetchLeads(); }, [clientId, filter]);

  const updateStatus = async (leadId: string, status: LeadStatus) => {
    const { error } = await supabase.from("leads").update({ status }).eq("id", leadId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      fetchLeads();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">CRM</h1>
            <p className="text-muted-foreground">Gerencie seus leads e atendimentos</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterValue)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mb-3 opacity-50" />
                <p className="font-medium">Nenhum lead encontrado</p>
                <p className="text-sm">Os leads aparecerão aqui quando seu agente de IA iniciar conversas</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.phone || "—"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[lead.status] || ""}`}>
                          {statusLabels[lead.status] || lead.status}
                        </span>
                      </TableCell>
                      <TableCell>{lead.source || "—"}</TableCell>
                      <TableCell>{new Date(lead.created_at).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Select value={lead.status} onValueChange={(val) => updateStatus(lead.id, val as LeadStatus)}>
                          <SelectTrigger className="w-36 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="novo">Novo</SelectItem>
                            <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                            <SelectItem value="fechado">Fechado</SelectItem>
                            <SelectItem value="perdido">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
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
