import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { Users, FolderOpen, FileText } from "lucide-react";

interface Sub { id: string; user_id: string | null; plan: string | null; status: string | null; created_at: string | null; }

const Admin = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({ users: 0, projects: 0, scripts: 0 });
  const [subs, setSubs] = useState<Sub[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  const fetchData = async () => {
    const [uCount, pCount, sCount, subsData, clientsData] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("scripts").select("id", { count: "exact", head: true }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name"),
    ]);
    setStats({ users: uCount.count || 0, projects: pCount.count || 0, scripts: sCount.count || 0 });
    setSubs((subsData.data as Sub[]) || []);
    setClients((clientsData.data as { id: string; name: string }[]) || []);
  };

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin]);

  if (!isAdmin) return (
    <DashboardLayout>
      <p className="text-muted-foreground">Acesso restrito a administradores.</p>
    </DashboardLayout>
  );

  const statCards = [
    { title: "Usuários", value: stats.users, icon: Users },
    { title: "Projetos", value: stats.projects, icon: FolderOpen },
    { title: "Roteiros", value: stats.scripts, icon: FileText },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administração</h1>
            <p className="text-muted-foreground">Gerencie usuários e assinaturas</p>
          </div>
          <CreateUserDialog clients={clients} onUserCreated={fetchData} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((c) => (
            <Card key={c.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                <c.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent><p className="text-3xl font-bold">{c.value}</p></CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader><CardTitle className="text-sm">Assinaturas</CardTitle></CardHeader>
          <CardContent className="p-0">
            {subs.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">Nenhuma assinatura encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subs.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.plan || "—"}</TableCell>
                      <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status || "—"}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.created_at ? new Date(s.created_at).toLocaleDateString("pt-BR") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Admin;
