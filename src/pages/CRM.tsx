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
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, FolderOpen } from "lucide-react";

interface Project {
  id: string; name: string | null; client_name: string | null; objective: string | null;
  platform: string | null; status: string | null; created_at: string | null;
}

const statusLabels: Record<string, string> = { active: "Ativo", completed: "Concluído", paused: "Pausado" };
const statusColors: Record<string, string> = { active: "bg-accent text-accent-foreground", completed: "bg-primary text-primary-foreground", paused: "bg-muted text-muted-foreground" };

const CRM = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", client_name: "", objective: "", platform: "" });

  const fetchProjects = async () => {
    if (!user) return;
    let q = supabase.from("projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }) as any;
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setProjects((data as Project[]) || []);
  };

  useEffect(() => { fetchProjects(); }, [user, filter]);

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
                    <TableHead>Projeto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plataforma</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((p) => (
                    <TableRow key={p.id}>
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
