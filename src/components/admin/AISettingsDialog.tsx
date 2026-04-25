import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: () => void;
  openaiConfigured: boolean;
}

export const AISettingsDialog = ({ open, onOpenChange, onSaved, openaiConfigured }: Props) => {
  const [threshold, setThreshold] = useState(80);
  const [quota, setQuota] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase
      .from("ai_settings")
      .select("warning_threshold_percent, monthly_token_quota")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setThreshold(data.warning_threshold_percent ?? 80);
          setQuota(data.monthly_token_quota ? String(data.monthly_token_quota) : "");
        }
        setLoading(false);
      });
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    const quotaNum = quota.trim() ? parseInt(quota, 10) : null;
    const { data: existing } = await supabase
      .from("ai_settings")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const payload = {
      warning_threshold_percent: threshold,
      monthly_token_quota: quotaNum,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase.from("ai_settings").update(payload).eq("id", existing.id)
      : await supabase.from("ai_settings").insert(payload);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Configurações salvas");
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações da IA</DialogTitle>
          <DialogDescription>
            Defina alertas de uso e gerencie chaves de API.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Alertar quando uso atingir</Label>
                <span className="text-sm font-semibold text-primary">{threshold}%</span>
              </div>
              <Slider
                value={[threshold]}
                min={60}
                max={95}
                step={5}
                onValueChange={([v]) => setThreshold(v)}
              />
              <p className="text-xs text-muted-foreground">
                Será exibido aviso quando o consumo mensal estimado ultrapassar este limite.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cota mensal de tokens (opcional)</Label>
              <Input
                type="number"
                placeholder="ex: 1000000"
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para desativar o cálculo de percentual.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-border/60 p-3">
              <Label className="text-sm">Chave OpenAI própria (opcional)</Label>
              <p className="text-xs text-muted-foreground">
                Status:{" "}
                <span className={openaiConfigured ? "text-emerald-500" : "text-muted-foreground"}>
                  {openaiConfigured ? "Configurada" : "Não configurada"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Para adicionar ou atualizar a chave OPENAI_API_KEY, use o gerenciador de secrets do
                Supabase. Quando presente, será validada automaticamente em cada checagem.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
