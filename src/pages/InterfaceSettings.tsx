import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, ChevronLeft, Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useInterfaceSettings, type InterfaceSettings as IS } from "@/hooks/useInterfaceSettings";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { hasFeatureAccess, requiredPlanLabel } from "@/lib/plan-features";
import { UpgradePrompt } from "@/components/UpgradePrompt";

const FONTS = ["Inter", "Helvetica", "Georgia", "System"];

const InterfaceSettings = () => {
  const { settings, loading, updateSettings } = useInterfaceSettings();
  const { isAdmin } = useAuth();
  const { plan } = usePlanLimits();
  const { toast } = useToast();
  const [local, setLocal] = useState<IS>(settings);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const allowed = hasFeatureAccess(plan, "interface_settings", isAdmin);

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
      toast({ title: "Configurações salvas", description: "Suas preferências de interface foram atualizadas." });
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

  if (!allowed) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-2xl">
          <Link to="/configuracoes" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <ChevronLeft className="h-3 w-3" /> Voltar
          </Link>
          <h1 className="text-2xl font-semibold">Ajustes da Interface</h1>
          <UpgradePrompt message={`Disponível no plano ${requiredPlanLabel("interface_settings")}. Faça upgrade para personalizar a interface.`} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link to="/configuracoes" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ChevronLeft className="h-3 w-3" /> Configurações
            </Link>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary" /> Ajustes da Interface
            </h1>
            <p className="text-sm text-muted-foreground">Personalize a aparência geral da plataforma.</p>
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
                <CardDescription>Defina as cores principais da interface.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {([
                  ["primary_color", "Primária"],
                  ["accent_color", "Destaque"],
                  ["background_color", "Fundo"],
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
                <CardTitle className="text-base">Tipografia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Fonte</Label>
                  <Select value={local.font_family} onValueChange={(v) => setLocal({ ...local, font_family: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Tamanho do texto base</Label>
                    <span className="text-sm text-muted-foreground">{local.font_size_base}px</span>
                  </div>
                  <Slider value={[local.font_size_base]} min={12} max={18} step={1} onValueChange={([v]) => setLocal({ ...local, font_size_base: v })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Layout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Arredondamento das bordas</Label>
                    <span className="text-sm text-muted-foreground">{local.border_radius}px</span>
                  </div>
                  <Slider value={[local.border_radius]} min={0} max={16} step={1} onValueChange={([v]) => setLocal({ ...local, border_radius: v })} />
                </div>
                <div className="space-y-2">
                  <Label>Densidade</Label>
                  <RadioGroup value={local.density} onValueChange={(v: any) => setLocal({ ...local, density: v })} className="flex gap-4">
                    {["compact", "comfortable", "spacious"].map(d => (
                      <div key={d} className="flex items-center gap-2">
                        <RadioGroupItem value={d} id={`d-${d}`} />
                        <Label htmlFor={`d-${d}`} className="capitalize cursor-pointer">{d}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="lg:sticky lg:top-4 h-fit">
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
              <CardDescription>Visualização das suas configurações.</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="p-6 space-y-4"
                style={{
                  background: local.background_color,
                  fontFamily: local.font_family,
                  fontSize: `${local.font_size_base}px`,
                  borderRadius: `${local.border_radius}px`,
                  border: "1px solid hsl(var(--border))",
                  padding: local.density === "compact" ? "12px" : local.density === "spacious" ? "32px" : "24px",
                }}
              >
                <h3 style={{ color: local.primary_color, fontSize: `${local.font_size_base + 8}px`, fontWeight: 600 }}>
                  Título de exemplo
                </h3>
                <p style={{ color: "#e5e5e5" }}>
                  Texto de corpo demonstrando a aparência geral da plataforma com suas configurações aplicadas.
                </p>
                <button
                  style={{
                    background: local.primary_color,
                    color: local.background_color,
                    padding: "8px 16px",
                    borderRadius: `${local.border_radius}px`,
                    fontSize: `${local.font_size_base}px`,
                    fontWeight: 500,
                  }}
                >
                  Botão Primário
                </button>
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: 8,
                    background: local.accent_color,
                    color: "#000",
                    padding: "4px 10px",
                    borderRadius: `${local.border_radius}px`,
                    fontSize: `${local.font_size_base - 2}px`,
                  }}
                >
                  Destaque
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InterfaceSettings;
