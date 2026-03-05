import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Lightbulb, FolderOpen, BookOpen } from "lucide-react";

interface ActivityItem { type: string; label: string; date: string; }

const Metrics = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ scripts: 0, ideas: 0, projects: 0, briefings: 0 });
  const [platformBreakdown, setPlatformBreakdown] = useState<{ platform: string; count: number }[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!user) return;
    const uid = user.id;

    const fetchAll = async () => {
      const [sc, ic, pc, bc, projData, scriptData, ideaData] = await Promise.all([
        supabase.from("scripts").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("ideas").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("status", "active"),
        supabase.from("briefings").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("projects").select("platform").eq("user_id", uid),
        supabase.from("scripts").select("title, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
        supabase.from("ideas").select("idea, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(5),
      ]);

      setCounts({ scripts: sc.count || 0, ideas: ic.count || 0, projects: pc.count || 0, briefings: bc.count || 0 });

      // Platform breakdown
      const platMap: Record<string, number> = {};
      (projData.data || []).forEach((p: any) => { const k = p.platform || "Sem plataforma"; platMap[k] = (platMap[k] || 0) + 1; });
      setPlatformBreakdown(Object.entries(platMap).map(([platform, count]) => ({ platform, count })));

      // Activity timeline
      const items: ActivityItem[] = [
        ...(scriptData.data || []).map((s: any) => ({ type: "Roteiro", label: s.title || "Sem título", date: s.created_at })),
        ...(ideaData.data || []).map((i: any) => ({ type: "Ideia", label: (i.idea || "").substring(0, 60), date: i.created_at })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
      setActivity(items);
    };

    fetchAll();
  }, [user]);

  const cards = [
    { title: "Roteiros Gerados", value: counts.scripts, icon: FileText },
    { title: "Ideias Criadas", value: counts.ideas, icon: Lightbulb },
    { title: "Projetos Ativos", value: counts.projects, icon: FolderOpen },
    { title: "Briefings", value: counts.briefings, icon: BookOpen },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análise de Desempenho de Conteúdo</h1>
          <p className="text-muted-foreground">Acompanhe sua produção audiovisual</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                <c.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent><p className="text-3xl font-bold">{c.value}</p></CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Por Plataforma</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {platformBreakdown.length === 0 && <p className="text-sm text-muted-foreground">Sem dados.</p>}
              {platformBreakdown.map((p) => (
                <div key={p.platform} className="flex justify-between text-sm">
                  <span>{p.platform}</span>
                  <span className="font-semibold">{p.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Atividade Recente</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {activity.length === 0 && <p className="text-sm text-muted-foreground">Sem atividade.</p>}
              {activity.map((a, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-border pb-2 last:border-0">
                  <div>
                    <span className="text-xs text-muted-foreground mr-2">[{a.type}]</span>
                    <span>{a.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{a.date ? new Date(a.date).toLocaleDateString("pt-BR") : ""}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Metrics;
