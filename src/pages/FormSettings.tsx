import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, ChevronLeft, FormInput, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFormSettings, type FormSettings as FS } from "@/hooks/useFormSettings";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { hasFeatureAccess, requiredPlanLabel } from "@/lib/plan-features";
import { UpgradePrompt } from "@/components/UpgradePrompt";

const FormSettingsPage = () => {
  const { settings, loading, updateSettings } = useFormSettings();
  const { toast } = useToast();
  const [local, setLocal] = useState<FS>(settings);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !initialized) {
      setLocal(settings);
      setInitialized(true);
    }
  }, [loading, settings, initialized]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(local);
      toast({ title: "Configurações salvas", description: "Aparência dos formulários atualizada." });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const inputPad = local.compact_mode ? "8px 12px" : "12px 14px";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link to="/configuracoes" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ChevronLeft className="h-3 w-3" /> Configurações
            </Link>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <FormInput className="h-6 w-6 text-primary" /> Personalização de Formulários
            </h1>
            <p className="text-sm text-muted-foreground">Defina cores, bordas e comportamento dos campos.</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cores</CardTitle>
                <CardDescription>Personalize as cores dos campos e rótulos.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([
                  ["field_bg_color", "Fundo do campo"],
                  ["field_border_color", "Borda do campo"],
                  ["label_color", "Cor do rótulo"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label>{label}</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={local[key]} onChange={(e) => setLocal({ ...local, [key]: e.target.value })} className="w-12 h-10 p-1" />
                      <Input value={local[key]} onChange={(e) => setLocal({ ...local, [key]: e.target.value })} className="flex-1" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Layout dos campos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Arredondamento dos campos</Label>
                    <span className="text-sm text-muted-foreground">{local.input_radius}px</span>
                  </div>
                  <Slider value={[local.input_radius]} min={0} max={16} step={1} onValueChange={([v]) => setLocal({ ...local, input_radius: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mostrar ícones nos campos</Label>
                    <p className="text-xs text-muted-foreground">Adiciona ícones contextuais nos inputs.</p>
                  </div>
                  <Switch checked={local.show_field_icons} onCheckedChange={(v) => setLocal({ ...local, show_field_icons: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Modo compacto</Label>
                    <p className="text-xs text-muted-foreground">Reduz o espaçamento interno dos campos.</p>
                  </div>
                  <Switch checked={local.compact_mode} onCheckedChange={(v) => setLocal({ ...local, compact_mode: v })} />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:sticky lg:top-4 h-fit">
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>Visualização do formulário.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "Nome", placeholder: "Seu nome", icon: User },
                  { label: "E-mail", placeholder: "voce@email.com", icon: Mail },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="space-y-1.5">
                      <label style={{ color: local.label_color, fontSize: 13, fontWeight: 500 }}>{f.label}</label>
                      <div
                        className="flex items-center gap-2"
                        style={{
                          background: local.field_bg_color,
                          border: `1px solid ${local.field_border_color}`,
                          borderRadius: `${local.input_radius}px`,
                          padding: inputPad,
                        }}
                      >
                        {local.show_field_icons && <Icon className="h-4 w-4" style={{ color: local.label_color }} />}
                        <span style={{ color: "#888", fontSize: 14 }}>{f.placeholder}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FormSettingsPage;
