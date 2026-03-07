import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FolderOpen, FileText, Lightbulb, BookOpen, Plus, Target, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { QuickScriptCreator } from "@/components/dashboard/QuickScriptCreator";

interface Project {
  id: string;
  name: string | null;
  client_name: string | null;
  platform: string | null;
  status: string | null;
  created_at: string | null;
}
interface Script {
  id: string;
  title: string | null;
  script: string | null;
  created_at: string | null;
}
interface Idea {
  id: string;
  idea: string | null;
  created_at: string | null;
}
interface StrategicReport {
  id: string;
  business_name: string;
  status: string | null;
  created_at: string;
}
interface BriefingRequest {
  id: string;
  business_name: string;
  project_name: string;
  video_quantity: number;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState({ projects: 0, scripts: 0, ideas: 0, briefings: 0 });
  const [quickIdea, setQuickIdea] = useState("");
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentScripts, setRecentScripts] = useState<Script[]>([]);
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([]);
  const [recentReports, setRecentReports] = useState<StrategicReport[]>([]);
  const [recentBriefings, setRecentBriefings] = useState<BriefingRequest[]>([]);

  useEffect(() => {
    if (!user) return;
    const uid = user.id;

    const fetch = async () => {
      const [
        projCount,
        scriptCount,
        ideaCount,
        briefCount,
        projRecent,
        scriptRecent,
        ideaRecent,
        reportsRecent,
        briefingReqRecent,
      ] = await Promise.all([
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("scripts").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("ideas").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("briefings").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("projects").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
        supabase.from("scripts").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
        supabase.from("ideas").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
        supabase
          .from("strategic_reports")
          .select("id, business_name, status, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("briefing_requests")
          .select("id, business_name, project_name, video_quantity, status, created_at")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setStats({
        projects: projCount.count || 0,
        scripts: scriptCount.count || 0,
        ideas: ideaCount.count || 0,
        briefings: briefCount.count || 0,
      });
      setRecentProjects((projRecent.data as Project[]) || []);
      setRecentScripts((scriptRecent.data as Script[]) || []);
      setRecentIdeas((ideaRecent.data as Idea[]) || []);
      setRecentReports((reportsRecent.data as StrategicReport[]) || []);
      setRecentBriefings((briefingReqRecent.data as BriefingRequest[]) || []);
    };

    fetch();
  }, [user, isAdmin]);

  const statCards = [
    { title: "Projetos", value: stats.projects, icon: FolderOpen, color: "text-primary" },
    { title: "Roteiros", value: stats.scripts, icon: FileText, color: "text-accent" },
    { title: "Ideias", value: stats.ideas, icon: Lightbulb, color: "text-warning" },
    { title: "Briefings", value: stats.briefings, icon: BookOpen, color: "text-success" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral dos seus projetos de planejamento estratégico</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <QuickScriptCreator />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Projetos Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentProjects.length === 0 && <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p>}
              {recentProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0"
                >
                  <span className="font-medium truncate">{p.name || p.client_name || "Sem nome"}</span>
                  <span className="text-xs text-muted-foreground">{p.platform}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Roteiros Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentScripts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum roteiro ainda.</p>}
              {recentScripts.map((s) => (
                <div key={s.id} className="text-sm border-b border-border pb-2 last:border-0">
                  <span className="font-medium">{s.title || "Sem título"}</span>
                  <p className="text-xs text-muted-foreground truncate">{s.script?.substring(0, 80)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ideias Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentIdeas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma ideia ainda.</p>}
              {recentIdeas.map((i) => (
                <div key={i.id} className="text-sm border-b border-border pb-2 last:border-0">
                  <p className="truncate">{i.idea || "Sem descrição"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Briefings Recentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Briefings Recentes
            </CardTitle>
            <Link to="/crm">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Novo Briefing
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentBriefings.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum briefing de cliente ainda.</p>
            )}
            {recentBriefings.map((b) => (
              <div
                key={b.id}
                className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0"
              >
                <div>
                  <span className="font-medium">{b.business_name}</span>
                  <span className="text-muted-foreground ml-2 text-xs">
                    {b.project_name} • {b.video_quantity} vídeos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      b.status === "completed"
                        ? "bg-accent text-accent-foreground"
                        : b.status === "processing"
                          ? "bg-primary text-primary-foreground"
                          : b.status === "submitted"
                            ? "bg-warning text-warning-foreground"
                            : "bg-muted text-muted-foreground",
                    )}
                  >
                    {b.status === "completed"
                      ? "Concluído"
                      : b.status === "processing"
                        ? "Processando"
                        : b.status === "submitted"
                          ? "Enviado"
                          : "Pendente"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Strategic Reports Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Relatórios Estratégicos
            </CardTitle>
            <Link to="/analise-estrategica">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Nova Análise
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentReports.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum relatório estratégico ainda.</p>
            )}
            {recentReports.map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0"
              >
                <span className="font-medium truncate">{r.business_name}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded",
                      r.status === "completed" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {r.status === "completed" ? "Concluído" : "Processando"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
