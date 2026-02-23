import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, MessageSquare, Users, TrendingUp, CheckCircle } from "lucide-react";

const Metrics = () => {
  const { clientId } = useAuth();
  const [metrics, setMetrics] = useState({
    totalConversations: 0,
    totalLeads: 0,
    responseRate: 0,
    conversions: 0,
    newLeads: 0,
    inProgress: 0,
    closed: 0,
    lost: 0,
  });

  useEffect(() => {
    if (!clientId) return;

    const fetchMetrics = async () => {
      const [convRes, leadsRes, newRes, progressRes, closedRes, lostRes] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact" }).eq("client_id", clientId),
        supabase.from("leads").select("id", { count: "exact" }).eq("client_id", clientId),
        supabase.from("leads").select("id", { count: "exact" }).eq("client_id", clientId).eq("status", "novo"),
        supabase.from("leads").select("id", { count: "exact" }).eq("client_id", clientId).eq("status", "em_atendimento"),
        supabase.from("leads").select("id", { count: "exact" }).eq("client_id", clientId).eq("status", "fechado"),
        supabase.from("leads").select("id", { count: "exact" }).eq("client_id", clientId).eq("status", "perdido"),
      ]);

      const totalConv = convRes.count || 0;
      const totalLeads = leadsRes.count || 0;

      setMetrics({
        totalConversations: totalConv,
        totalLeads: totalLeads,
        responseRate: totalConv > 0 ? Math.round((totalLeads / totalConv) * 100) : 0,
        conversions: closedRes.count || 0,
        newLeads: newRes.count || 0,
        inProgress: progressRes.count || 0,
        closed: closedRes.count || 0,
        lost: lostRes.count || 0,
      });
    };

    fetchMetrics();
  }, [clientId]);

  const cards = [
    { title: "Total de Conversas", value: metrics.totalConversations, icon: MessageSquare, description: "Conversas com o agente IA" },
    { title: "Leads Gerados", value: metrics.totalLeads, icon: Users, description: "Contatos captados" },
    { title: "Taxa de Resposta", value: `${metrics.responseRate}%`, icon: TrendingUp, description: "Leads / conversas" },
    { title: "Conversões", value: metrics.conversions, icon: CheckCircle, description: "Leads fechados" },
  ];

  const statusCards = [
    { title: "Novos", value: metrics.newLeads, color: "border-l-primary" },
    { title: "Em Atendimento", value: metrics.inProgress, color: "border-l-warning" },
    { title: "Fechados", value: metrics.closed, color: "border-l-success" },
    { title: "Perdidos", value: metrics.lost, color: "border-l-destructive" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Métricas</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho do seu agente de IA</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Status dos Leads</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusCards.map((card) => (
              <Card key={card.title} className={`border-l-4 ${card.color}`}>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Metrics;
