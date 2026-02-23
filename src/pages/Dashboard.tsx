import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Users, TrendingUp, CheckCircle, Smartphone, Zap } from "lucide-react";

const Dashboard = () => {
  const { clientId, isAdmin } = useAuth();
  const [stats, setStats] = useState({ conversations: 0, leads: 0, conversions: 0, responseRate: 0 });
  const [whatsappStatus, setWhatsappStatus] = useState("disconnected");
  const [flowActive, setFlowActive] = useState(false);

  useEffect(() => {
    if (!clientId && !isAdmin) return;

    const fetchData = async () => {
      const cid = clientId;
      if (!cid) return;

      const [convRes, leadsRes, closedRes, waRes, flowRes] = await Promise.all([
        supabase.from("conversations").select("id", { count: "exact" }).eq("client_id", cid),
        supabase.from("leads").select("id", { count: "exact" }).eq("client_id", cid),
        supabase.from("leads").select("id", { count: "exact" }).eq("client_id", cid).eq("status", "fechado"),
        supabase.from("whatsapp_connections").select("status").eq("client_id", cid).single(),
        supabase.from("n8n_flows").select("is_active").eq("client_id", cid).single(),
      ]);

      const totalConv = convRes.count || 0;
      const totalLeads = leadsRes.count || 0;
      const totalClosed = closedRes.count || 0;

      setStats({
        conversations: totalConv,
        leads: totalLeads,
        conversions: totalClosed,
        responseRate: totalConv > 0 ? Math.round((totalLeads / totalConv) * 100) : 0,
      });

      if (waRes.data) setWhatsappStatus(waRes.data.status);
      if (flowRes.data) setFlowActive(flowRes.data.is_active);
    };

    fetchData();
  }, [clientId, isAdmin]);

  const statCards = [
    { title: "Conversas", value: stats.conversations, icon: MessageSquare, color: "text-primary" },
    { title: "Leads Gerados", value: stats.leads, icon: Users, color: "text-accent" },
    { title: "Taxa de Resposta", value: `${stats.responseRate}%`, icon: TrendingUp, color: "text-warning" },
    { title: "Conversões", value: stats.conversions, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu agente de IA</p>
        </div>

        {/* Status cards */}
        <div className="flex gap-3">
          <Badge variant={whatsappStatus === "connected" ? "default" : "secondary"} className="gap-1">
            <Smartphone className="h-3 w-3" />
            WhatsApp: {whatsappStatus === "connected" ? "Conectado" : "Desconectado"}
          </Badge>
          <Badge variant={flowActive ? "default" : "secondary"} className="gap-1">
            <Zap className="h-3 w-3" />
            Agente IA: {flowActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>

        {/* Metrics grid */}
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
      </div>
    </DashboardLayout>
  );
};

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

export default Dashboard;
