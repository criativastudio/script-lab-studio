import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePdfSettings } from "@/hooks/usePdfSettings";
import { useToast } from "@/hooks/use-toast";
import { Upload, Save, Loader2, Image, Type, Palette, Layout, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { hasFeatureAccess, requiredPlanLabel } from "@/lib/plan-features";
import { UpgradePrompt } from "@/components/UpgradePrompt";

const FONT_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman" },
];

const PdfSettings = () => {
  const { settings, loading, updateSettings, uploadLogo } = usePdfSettings();
  const { isAdmin } = useAuth();
  const { plan } = usePlanLimits();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const allowed = hasFeatureAccess(plan, "pdf_settings", isAdmin);

  const [local, setLocal] = useState(settings);
  const [initialized, setInitialized] = useState(false);

  if (!loading && !initialized) {
    setLocal(settings);
    setInitialized(true);
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadLogo(file);
      if (url) setLocal(prev => ({ ...prev, logo_url: url }));
    } catch (err: any) {
      toast({ title: "Erro no upload", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(local);
      toast({ title: "Configurações salvas!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
          <h1 className="text-2xl font-semibold">Personalização de PDFs</h1>
          <UpgradePrompt message={`Disponível no plano ${requiredPlanLabel("pdf_settings")}. Faça upgrade para personalizar seus PDFs.`} />
        </div>
      </DashboardLayout>
    );
  }

  const logoAlign = local.logo_position === "left" ? "flex-start" : local.logo_position === "right" ? "flex-end" : "center";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Personalizar PDF</h1>
            <p className="text-muted-foreground text-sm">Configure o layout dos seus PDFs exportados</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Image className="h-4 w-4" /> Logo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  {local.logo_url ? (
                    <img src={local.logo_url} alt="Logo" className="h-16 w-auto rounded border border-border" />
                  ) : (
                    <div className="h-16 w-16 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  )}
                  <div>
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                      Upload Logo
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou SVG</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Posição do Logo</Label>
                  <RadioGroup value={local.logo_position} onValueChange={(v) => setLocal(prev => ({ ...prev, logo_position: v as any }))} className="flex gap-4 mt-2">
                    <div className="flex items-center gap-2"><RadioGroupItem value="left" id="logo-left" /><Label htmlFor="logo-left">Esquerda</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="center" id="logo-center" /><Label htmlFor="logo-center">Centro</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="right" id="logo-right" /><Label htmlFor="logo-right">Direita</Label></div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Palette className="h-4 w-4" /> Cores</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm">Cor Primária</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={local.primary_color} onChange={(e) => setLocal(prev => ({ ...prev, primary_color: e.target.value }))} className="h-10 w-10 rounded cursor-pointer border-0" />
                    <Input value={local.primary_color} onChange={(e) => setLocal(prev => ({ ...prev, primary_color: e.target.value }))} className="font-mono text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Cor Secundária</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={local.secondary_color} onChange={(e) => setLocal(prev => ({ ...prev, secondary_color: e.target.value }))} className="h-10 w-10 rounded cursor-pointer border-0" />
                    <Input value={local.secondary_color} onChange={(e) => setLocal(prev => ({ ...prev, secondary_color: e.target.value }))} className="font-mono text-sm" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Type className="h-4 w-4" /> Tipografia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Fonte</Label>
                  <Select value={local.font_family} onValueChange={(v) => setLocal(prev => ({ ...prev, font_family: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Tamanho do Título: {local.font_size_title}pt</Label>
                  <Slider value={[local.font_size_title]} onValueChange={([v]) => setLocal(prev => ({ ...prev, font_size_title: v }))} min={16} max={48} step={2} className="mt-2" />
                </div>
                <div>
                  <Label className="text-sm">Tamanho do Corpo: {local.font_size_body}pt</Label>
                  <Slider value={[local.font_size_body]} onValueChange={([v]) => setLocal(prev => ({ ...prev, font_size_body: v }))} min={8} max={14} step={1} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Layout */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><Layout className="h-4 w-4" /> Layout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Texto do Cabeçalho</Label>
                  <Input value={local.header_text} onChange={(e) => setLocal(prev => ({ ...prev, header_text: e.target.value }))} placeholder="Ex: Nome da sua empresa" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Texto do Rodapé</Label>
                  <Input value={local.footer_text} onChange={(e) => setLocal(prev => ({ ...prev, footer_text: e.target.value }))} placeholder="Ex: Confidencial • www.suaempresa.com" className="mt-1" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Mostrar Página de Capa</Label>
                  <Switch checked={local.show_cover_page} onCheckedChange={(v) => setLocal(prev => ({ ...prev, show_cover_page: v }))} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview column */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-border rounded-lg overflow-hidden bg-white text-black" style={{ fontFamily: local.font_family, aspectRatio: "210/297" }}>
                  {/* Mini cover */}
                  {local.show_cover_page && (
                    <div className="flex flex-col items-center justify-center p-4 border-b border-gray-200" style={{ minHeight: "40%", justifyContent: logoAlign === "center" ? "center" : "flex-start", alignItems: logoAlign }}>
                      {local.logo_url && <img src={local.logo_url} alt="Logo" className="max-h-8 mb-2" />}
                      <div style={{ fontSize: `${Math.max(local.font_size_title / 3, 8)}px`, fontWeight: 700, color: local.secondary_color, textAlign: local.logo_position as any }}>
                        Título do Documento
                      </div>
                      <div style={{ fontSize: "7px", color: "#6b7280", marginTop: "4px" }}>
                        {local.header_text || "Sua Empresa"}
                      </div>
                    </div>
                  )}
                  {/* Mini content */}
                  <div className="p-3 space-y-2">
                    <div style={{ height: "3px", width: "60%", background: local.primary_color, borderRadius: "2px" }} />
                    <div style={{ fontSize: `${Math.max(local.font_size_body / 2, 5)}px`, color: "#374151", lineHeight: 1.4 }}>
                      <div style={{ height: "2px", width: "100%", background: "#e5e7eb", margin: "3px 0" }} />
                      <div style={{ height: "2px", width: "90%", background: "#e5e7eb", margin: "3px 0" }} />
                      <div style={{ height: "2px", width: "75%", background: "#e5e7eb", margin: "3px 0" }} />
                    </div>
                    <div style={{ borderLeft: `2px solid ${local.primary_color}`, paddingLeft: "6px", marginTop: "6px" }}>
                      <div style={{ height: "2px", width: "80%", background: "#d1d5db", margin: "2px 0" }} />
                      <div style={{ height: "2px", width: "65%", background: "#d1d5db", margin: "2px 0" }} />
                    </div>
                  </div>
                  {/* Mini footer */}
                  {local.footer_text && (
                    <div className="px-3 py-1 border-t border-gray-200" style={{ fontSize: "6px", color: "#9ca3af", textAlign: "center" }}>
                      {local.footer_text}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PdfSettings;
