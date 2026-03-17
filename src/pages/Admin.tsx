import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { ChangePlanDialog } from "@/components/admin/ChangePlanDialog";
import { Users, FolderOpen, FileText, Search } from "lucide-react";

interface Sub { id: string; user_id: string | null; plan: string | null; status: string | null; created_at: string | null; }

interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
  created_at: string | null;
  plan: string | null;
  briefings_used: number;
  scripts_used: number;
}

const PLAN_CONFIGS: Record<string, { briefings: number; scriptsPerMonth: number }> = {
  starter: { briefings: 3, scriptsPerMonth: 9 },
  basic: { briefings: 3, scriptsPerMonth: 9 },
  creator_pro: { briefings: 25, scriptsPerMonth: 250 },
  premium: { briefings: 25, scriptsPerMonth: 250 },
  scale_studio: { briefings: 9999, scriptsPerMonth: 9999 },
};

const Admin = () => {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({ users: 0, projects: 0, scripts: 0 });
  const [subs, setSubs] = useState<Sub[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [userList, setUserList] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthISO = monthStart.toISOString();

    const [uCount, pCount, sCount, subsData, clientsData, profilesData, usersData, activeSubs, briefingsData, scriptsData] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("scripts").select("id", { count: "exact", head: true }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("clients").select("id, name"),
      supabase.from("profiles").select("user_id, full_name, created_at"),
      supabase.from("users").select("id, email, whatsapp, plano_ativo, created_at"),
      supabase.from("subscriptions").select("user_id, plan").eq("status", "active"),
      supabase.from("briefing_requests").select("user_id").gte("created_at", monthISO),
      supabase.from("scripts").select("user_id").gte("created_at", monthISO),
    ]);

    setStats({ users: uCount.count || 0, projects: pCount.count || 0, scripts: sCount.count || 0 });
    setSubs((subsData.data as Sub[]) || []);
    setClients((clientsData.data as { id: string; name: string }[]) || []);

    // Build user list
    const profiles = (profilesData.data || []) as { user_id: string; full_name: string | null; created_at: string | null }[];
    const users = (usersData.data || []) as { id: string; email: string | null; whatsapp: string | null; plano_ativo: string | null; created_at: string | null }[];
    const activeSubsMap = new Map<string, string>();
    ((activeSubs.data || []) as { user_id: string | null; plan: string | null }[]).forEach(s => {
      if (s.user_id && s.plan) activeSubsMap.set(s.user_id, s.plan);
    });

    // Count monthly usage
    const briefingCounts = new Map<string, number>();
    ((briefingsData.data || []) as { user_id: string }[]).forEach(b => {
      briefingCounts.set(b.user_id, (briefingCounts.get(b.user_id) || 0) + 1);
    });
    const scriptCounts = new Map<string, number>();
    ((scriptsData.data || []) as { user_id: string | null }[]).forEach(s => {
      if (s.user_id) scriptCounts.set(s.user_id, (scriptCounts.get(s.user_id) || 0) + 1);
    });

    const usersMap = new Map(users.map(u => [u.id, u]));
    const combined: UserRow[] = profiles.map(p => {
      const u = usersMap.get(p.user_id);
      const plan = activeSubsMap.get(p.user_id) || u?.plano_ativo || "starter";
      return {
        user_id: p.user_id,
        full_name: p.full_name,
        email: u?.email || null,
        whatsapp: u?.whatsapp || null,
        created_at: p.created_at || u?.created_at || null,
        plan,
        briefings_used: briefingCounts.get(p.user_id) || 0,
        scripts_used: scriptCounts.get(p.user_id) || 0,
      };
    });
    setUserList(combined);
  };

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin]);

  if (!isAdmin) return (
    <DashboardLayout>
      <p className="text-muted-foreground">Acesso restrito a administradores.</p>
    </DashboardLayout>
  );

  const filteredUsers = userList.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(term)) ||
      (u.email?.toLowerCase().includes(term)) ||
      (u.whatsapp?.includes(term))
    );
  });

  const statCards = [
    { title: "Usuários", value: stats.users, icon: Users },
    { title: "Projetos", value: stats.projects, icon: FolderOpen },
    { title: "Roteiros", value: stats.scripts, icon: FileText },
  ];

  const getPlanLimits = (plan: string) => PLAN_CONFIGS[plan] || PLAN_CONFIGS.starter;

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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-sm">Usuários</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredUsers.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">Nenhum usuário encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Uso do Mês</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const limits = getPlanLimits(u.plan || "starter");
                      return (
                        <TableRow key={u.user_id}>
                          <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                          <TableCell className="text-sm">{u.email || "—"}</TableCell>
                          <TableCell className="text-sm">{u.whatsapp || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString("pt-BR") : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">{u.plan || "starter"}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <span>{u.briefings_used}/{limits.briefings} briefings</span>
                            <span className="mx-1 text-muted-foreground">·</span>
                            <span>{u.scripts_used}/{limits.scriptsPerMonth} roteiros</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
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
