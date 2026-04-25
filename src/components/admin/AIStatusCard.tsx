import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Activity, AlertCircle, AlertTriangle, CheckCircle2, RefreshCw, Settings2, Zap } from "lucide-react";
import { useAIHealth } from "@/hooks/useAIHealth";
import { AISettingsDialog } from "./AISettingsDialog";

export const AIStatusCard = () => {
  const { data, loading, refresh } = useAIHealth();
  const [openSettings, setOpenSettings] = useState(false);

  const overall: "ok" | "warning" | "critical" = (() => {
    if (!data) return "ok";
    if (data.alerts.some(a => a.level === "critical")) return "critical";
    if (data.alerts.length > 0 || data.lovable_gateway.status !== "ok") return "warning";
    return "ok";
  })();

  const statusBadge = {
    ok: { label: "Operacional", icon: CheckCircle2, cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
    warning: { label: "Atenção", icon: AlertTriangle, cls: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30" },
    critical: { label: "Crítico", icon: AlertCircle, cls: "bg-red-500/15 text-red-500 border-red-500/30" },
  }[overall];
  const StatusIcon = statusBadge.icon;

  const fmt = (n: number) => n.toLocaleString("pt-BR");

  return (
    <>
      <Card className="border-border/60">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  Status da IA
                  <Badge variant="outline" className={statusBadge.cls}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusBadge.label}
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Lovable AI Gateway {data?.openai_direct.configured && "+ OpenAI"}
                  {data && ` · atualizado ${new Date(data.checked_at).toLocaleTimeString("pt-BR")}`}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
                Verificar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setOpenSettings(true)}>
                <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                Configurar
              </Button>
            </div>
          </div>

          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/60 p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3 w-3" /> Latência do gateway
                </div>
                <div className="text-lg font-semibold mt-0.5">
                  {data.lovable_gateway.latency_ms} ms
                </div>
                <div className="text-[10px] text-muted-foreground capitalize">
                  {data.lovable_gateway.status.replace("_", " ")}
                </div>
              </div>

              <div className="rounded-lg border border-border/60 p-3">
                <div className="text-xs text-muted-foreground">Tokens este mês</div>
                <div className="text-lg font-semibold mt-0.5">
                  {fmt(data.usage.tokens_this_month)}
                  {data.usage.quota_tokens && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {" "}/ {fmt(data.usage.quota_tokens)}
                    </span>
                  )}
                </div>
                {data.usage.percent_used !== null && (
                  <Progress value={Math.min(100, data.usage.percent_used)} className="h-1.5 mt-1.5" />
                )}
              </div>

              <div className="rounded-lg border border-border/60 p-3">
                <div className="text-xs text-muted-foreground">Requisições / Erros 24h</div>
                <div className="text-lg font-semibold mt-0.5">
                  {fmt(data.usage.requests_this_month)}
                  <span className="text-xs text-red-500 font-normal ml-2">
                    {data.lovable_gateway.error_count_24h} erros
                  </span>
                </div>
                {data.openai_direct.configured && (
                  <div className="text-[10px] text-muted-foreground">
                    OpenAI: {data.openai_direct.status}
                  </div>
                )}
              </div>
            </div>
          )}

          {data?.alerts.map((a, i) => (
            <Alert
              key={i}
              variant={a.level === "critical" ? "destructive" : "default"}
              className={a.level === "warning" ? "border-yellow-500/40 bg-yellow-500/5" : undefined}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{a.message}</AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      <AISettingsDialog
        open={openSettings}
        onOpenChange={setOpenSettings}
        onSaved={refresh}
        openaiConfigured={data?.openai_direct.configured ?? false}
      />
    </>
  );
};
