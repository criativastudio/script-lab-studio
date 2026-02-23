import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Wifi, WifiOff, Zap } from "lucide-react";

const WhatsApp = () => {
  const { clientId } = useAuth();
  const { toast } = useToast();
  const [connection, setConnection] = useState<any>(null);
  const [flow, setFlow] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    const fetchData = async () => {
      const [waRes, flowRes] = await Promise.all([
        supabase.from("whatsapp_connections").select("*").eq("client_id", clientId).single(),
        supabase.from("n8n_flows").select("*").eq("client_id", clientId).single(),
      ]);
      if (waRes.data) {
        setConnection(waRes.data);
        setPhoneNumber(waRes.data.phone_number || "");
      }
      if (flowRes.data) setFlow(flowRes.data);
    };
    fetchData();
  }, [clientId]);

  const handleConnect = async () => {
    if (!clientId || !phoneNumber) return;
    setLoading(true);
    try {
      if (connection) {
        await supabase.from("whatsapp_connections").update({
          phone_number: phoneNumber,
          status: "connected",
          connected_at: new Date().toISOString(),
        }).eq("id", connection.id);
      } else {
        await supabase.from("whatsapp_connections").insert({
          client_id: clientId,
          phone_number: phoneNumber,
          status: "connected",
          connected_at: new Date().toISOString(),
        });
      }
      toast({ title: "WhatsApp conectado!", description: "Seu número foi vinculado com sucesso." });
      // Refresh
      const { data } = await supabase.from("whatsapp_connections").select("*").eq("client_id", clientId).single();
      if (data) setConnection(data);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isConnected = connection?.status === "connected";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">WhatsApp</h1>
          <p className="text-muted-foreground">Conecte seu WhatsApp ao agente de IA</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Connection card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Conexão WhatsApp
                </CardTitle>
                <Badge variant={isConnected ? "default" : "secondary"} className="gap-1">
                  {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                  {isConnected ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
              <CardDescription>
                Insira o número do WhatsApp da sua empresa para ativar o agente de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número do WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="+55 11 99999-9999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <Button onClick={handleConnect} disabled={loading || !phoneNumber} className="w-full">
                {loading ? "Conectando..." : isConnected ? "Atualizar conexão" : "Conectar WhatsApp"}
              </Button>
              {isConnected && connection?.connected_at && (
                <p className="text-xs text-muted-foreground">
                  Conectado em: {new Date(connection.connected_at).toLocaleString("pt-BR")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Flow status card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Agente de IA
              </CardTitle>
              <CardDescription>
                Status do fluxo de automação vinculado à sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {flow ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                    <div>
                      <p className="font-medium text-sm">{flow.flow_name}</p>
                      <p className="text-xs text-muted-foreground">Fluxo n8n</p>
                    </div>
                    <Badge variant={flow.is_active ? "default" : "secondary"}>
                      {flow.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O fluxo é gerenciado pelo administrador. Entre em contato para ativar/desativar.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Zap className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">Nenhum fluxo vinculado</p>
                  <p className="text-sm">O administrador precisa vincular um fluxo à sua conta</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WhatsApp;
