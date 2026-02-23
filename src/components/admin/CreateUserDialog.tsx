import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";

type Client = { id: string; name: string };

interface CreateUserDialogProps {
  clients: Client[];
  onUserCreated: () => void;
}

export const CreateUserDialog = ({ clients, onUserCreated }: CreateUserDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    client_id: "",
    client_name: "",
    office_name: "",
    plan: "basic",
  });
  const [useExisting, setUseExisting] = useState(true);

  const handleSubmit = async () => {
    if (!form.full_name || !form.email || !form.password) {
      toast({ title: "Erro", description: "Preencha nome, email e senha", variant: "destructive" });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: "Erro", description: "Senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (useExisting && !form.client_id) {
      toast({ title: "Erro", description: "Selecione uma empresa", variant: "destructive" });
      return;
    }
    if (!useExisting && !form.client_name) {
      toast({ title: "Erro", description: "Informe o nome da empresa", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, string> = {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        plan: form.plan,
      };

      if (useExisting) {
        body.client_id = form.client_id;
      } else {
        body.client_name = form.client_name;
        if (form.office_name) body.office_name = form.office_name;
      }

      const { data, error } = await supabase.functions.invoke("create-user", { body });

      if (error) throw error;

      const result = typeof data === "string" ? JSON.parse(data) : data;
      if (result.error) throw new Error(result.error);

      toast({ title: "Usuário criado com sucesso!" });
      setForm({ full_name: "", email: "", password: "", client_id: "", client_name: "", office_name: "", plan: "basic" });
      setOpen(false);
      onUserCreated();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao criar usuário", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><UserPlus className="h-4 w-4 mr-2" /> Criar Usuário</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Usuário</DialogTitle>
          <DialogDescription>Crie um novo usuário vinculado a uma empresa</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Empresa toggle */}
          <div className="flex gap-2">
            <Button type="button" variant={useExisting ? "default" : "outline"} size="sm" onClick={() => setUseExisting(true)}>
              Empresa existente
            </Button>
            <Button type="button" variant={!useExisting ? "default" : "outline"} size="sm" onClick={() => setUseExisting(false)}>
              Nova empresa
            </Button>
          </div>

          {useExisting ? (
            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} placeholder="Silva & Associados" />
              </div>
              <div className="space-y-2">
                <Label>Nome do Escritório</Label>
                <Input value={form.office_name} onChange={(e) => setForm({ ...form, office_name: e.target.value })} placeholder="Escritório Silva" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Nome do Usuário</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Dr. João Silva" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@escritorio.com" />
          </div>
          <div className="space-y-2">
            <Label>Senha</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
          </div>
          <div className="space-y-2">
            <Label>Plano</Label>
            <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar Usuário"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
