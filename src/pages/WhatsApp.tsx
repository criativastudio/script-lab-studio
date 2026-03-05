import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Smartphone, Copy, CheckCircle } from "lucide-react";

interface Script { id: string; title: string | null; script: string | null; }
interface Idea { id: string; idea: string | null; }

const WhatsApp = () => {
  const { user, clientId } = useAuth();
  const { toast } = useToast();
  const [connection, setConnection] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      if (clientId) {
        const { data } = await supabase.from("whatsapp_connections").select("*").eq("client_id", clientId).single();
        if (data) { setConnection(data); setPhoneNumber(data.phone_number || ""); }
      }

      const [sr, ir] = await Promise.all([
        supabase.from("scripts").select("id, title, script").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        supabase.from("ideas").select("id, idea").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      setScripts((sr.data as Script[]) || []);
      setIdeas((ir.data as Idea[]) || []);
    };

    fetchData();
  }, [user, clientId]);

  const handleConnect = async () => {
    if (!clientId || !phoneNumber) return;
    setLoading(true);
    const payload = { client_id: clientId, phone_number: phoneNumber, status: "connected", connected_at: new Date().toISOString() };
    const { error } = connection
      ? await supabase.from("whatsapp_connections").update(payload).eq("id", connection.id)
      : await supabase.from("whatsapp_connections").insert(payload);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "WhatsApp conectado!" }); setConnection({ ...connection, ...payload }); }
    setLoading(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: "Copiado!" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isConnected = connection?.status === "connected";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Distribuição de Conteúdo</h1>
          <p className="text-muted-foreground">Envie roteiros e ideias via WhatsApp</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" /> Conexão WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input placeholder="Número WhatsApp" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
              </div>
              <Button onClick={handleConnect} disabled={loading}>
                {isConnected ? "Atualizar" : "Conectar"}
              </Button>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Conectado" : "Desconectado"}
            </Badge>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Roteiros para Distribuir</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {scripts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum roteiro disponível.</p>}
              {scripts.map((s) => (
                <div key={s.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                  <span className="text-sm truncate flex-1">{s.title || "Sem título"}</span>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(s.script || "", s.id)}>
                    {copiedId === s.id ? <CheckCircle className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Ideias para Compartilhar</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {ideas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma ideia disponível.</p>}
              {ideas.map((i) => (
                <div key={i.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                  <span className="text-sm truncate flex-1">{i.idea || "Sem descrição"}</span>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(i.idea || "", i.id)}>
                    {copiedId === i.id ? <CheckCircle className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WhatsApp;
