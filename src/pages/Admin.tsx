import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Link as LinkIcon, Zap } from "lucide-react";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";

type ClientWithFlow = {
  id: string;
  name: string;
  email: string | null;
  office_name: string | null;
  is_active: boolean;
  created_at: string;
  flow?: { id: string; flow_name: string; webhook_url: string; is_active: boolean } | null;
};

const Admin = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientWithFlow[]>([]);
  const [newClient, setNewClient] = useState({ name: "", email: "", office_name: "" });
  const [flowForm, setFlowForm] = useState({ clientId: "", flowName: "", webhookUrl: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [flowDialogOpen, setFlowDialogOpen] = useState(false);

  const fetchClients = async () => {
    const { data: clientsData } = await supabase.from("clients").select("*").order("created_at", { ascending: false });
    if (!clientsData) return;

    const { data: flowsData } = await supabase.from("n8n_flows").select("*");

    const merged = clientsData.map((c: any) => ({
      ...c,
      flow: flowsData?.find((f: any) => f.client_id === c.id) || null,
    }));

    setClients(merged);
  };

  useEffect(() => { if (isAdmin) fetchClients(); }, [isAdmin]);

  const createClient = async () => {
    if (!newClient.name) return;
    const { error } = await supabase.from("clients").insert({
      name: newClient.name,
      email: newClient.email || null,
      office_name: newClient.office_name || null,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cliente criado!" });
      setNewClient({ name: "", email: "", office_name: "" });
      setDialogOpen(false);
      fetchClients();
    }
  };

  const linkFlow = async () => {
    if (!flowForm.clientId || !flowForm.flowName || !flowForm.webhookUrl) return;
    const existing = clients.find((c) => c.id === flowForm.clientId)?.flow;

    if (existing) {
      const { error } = await supabase.from("n8n_flows").update({
        flow_name: flowForm.flowName,
        webhook_url: flowForm.webhookUrl,
      }).eq("id", existing.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("n8n_flows").insert({
        client_id: flowForm.clientId,
        flow_name: flowForm.flowName,
        webhook_url: flowForm.webhookUrl,
        is_active: false,
      });
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    }
    toast({ title: "Fluxo vinculado!" });
    setFlowForm({ clientId: "", flowName: "", webhookUrl: "" });
    setFlowDialogOpen(false);
    fetchClients();
  };

  const toggleFlow = async (flowId: string, currentState: boolean) => {
    await supabase.from("n8n_flows").update({ is_active: !currentState }).eq("id", flowId);
    fetchClients();
  };

  const toggleClient = async (clientId: string, currentState: boolean) => {
    await supabase.from("clients").update({ is_active: !currentState }).eq("id", clientId);
    fetchClients();
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Acesso restrito a administradores.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Painel Admin
            </h1>
            <p className="text-muted-foreground">Gerencie clientes e fluxos de automação</p>
          </div>
          <div className="flex gap-2">
            <CreateUserDialog clients={clients.map(c => ({ id: c.id, name: c.name }))} onUserCreated={fetchClients} />
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Novo Cliente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Cliente</DialogTitle>
                <DialogDescription>Cadastre um novo escritório de advocacia</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Dr. João Silva" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} placeholder="joao@escritorio.com" />
                </div>
                <div className="space-y-2">
                  <Label>Nome do Escritório</Label>
                  <Input value={newClient.office_name} onChange={(e) => setNewClient({ ...newClient, office_name: e.target.value })} placeholder="Silva & Associados" />
                </div>
                <Button onClick={createClient} className="w-full">Criar Cliente</Button>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>{clients.length} clientes cadastrados</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Escritório</TableHead>
                  <TableHead>Fluxo n8n</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.office_name || "—"}</TableCell>
                    <TableCell>
                      {client.flow ? (
                        <Badge variant="outline" className="gap-1">
                          <Zap className="h-3 w-3" />
                          {client.flow.flow_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem fluxo</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.flow ? (
                        <Switch checked={client.flow.is_active} onCheckedChange={() => toggleFlow(client.flow!.id, client.flow!.is_active)} />
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch checked={client.is_active} onCheckedChange={() => toggleClient(client.id, client.is_active)} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFlowForm({
                            clientId: client.id,
                            flowName: client.flow?.flow_name || "",
                            webhookUrl: client.flow?.webhook_url || "",
                          });
                          setFlowDialogOpen(true);
                        }}
                      >
                        <LinkIcon className="h-3 w-3 mr-1" />
                        {client.flow ? "Editar fluxo" : "Vincular fluxo"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Flow dialog */}
      <Dialog open={flowDialogOpen} onOpenChange={setFlowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Fluxo n8n</DialogTitle>
            <DialogDescription>Configure o webhook do fluxo de automação para este cliente</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Fluxo</Label>
              <Input value={flowForm.flowName} onChange={(e) => setFlowForm({ ...flowForm, flowName: e.target.value })} placeholder="Atendimento Jurídico" />
            </div>
            <div className="space-y-2">
              <Label>Webhook URL (n8n)</Label>
              <Input value={flowForm.webhookUrl} onChange={(e) => setFlowForm({ ...flowForm, webhookUrl: e.target.value })} placeholder="https://n8n.seudominio.com/webhook/..." />
            </div>
            <Button onClick={linkFlow} className="w-full">Salvar Fluxo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Admin;
