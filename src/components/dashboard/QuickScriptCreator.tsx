import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, Sparkles, Save, Loader2, User, Target, MessageSquare, Filter } from "lucide-react";

const FORMATOS = ["TikTok", "Reels", "Stories", "Para Tráfego"];
const NICHOS = [
  "Fitness Saúde", "Finanças", "Tecnologia", "Restaurantes", "Educação",
  "E-commerce", "Loja de Roupas", "Loja de Carros", "Doceria", "Cafeteria",
  "Odontologia", "Advocacia",
];
const OBJETIVOS = [
  "Conquistar seguidores", "Construir confiança",
  "Impulsionar vendas", "Impulsionar engajamento",
];

interface GeneratedResult {
  goal: string;
  target_audience: string;
  content_style: string;
  persona: string;
  positioning: string;
  tone_of_voice: string;
  content_funnel: string;
  scripts: { title: string; script: string }[];
}

export function QuickScriptCreator() {
  const { user } = useAuth();
  const { limits, getMonthlyScriptCount } = usePlanLimits();
  const { toast } = useToast();

  const [open, setOpen] = useState(true);
  const [businessName, setBusinessName] = useState("");
  const [formato, setFormato] = useState("");
  const [nicho, setNicho] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  const handleGenerate = async () => {
    if (!user) return;
    if (!businessName.trim() || !formato || !nicho || !objetivo) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const currentCount = await getMonthlyScriptCount();
    if (currentCount >= limits.scriptsPerMonth) {
      setLimitReached(true);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("manual-generate", {
        body: {
          business_name: businessName.trim(),
          objective: objetivo,
          target_audience: `Público do nicho ${nicho}`,
          platform: formato,
          hook: keywords.trim() || undefined,
          duration: "30s",
          niche: nicho,
          notes: keywords.trim() || undefined,
          video_quantity: 1,
          user_id: user.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as GeneratedResult);
      toast({ title: "Roteiro gerado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar roteiro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !result) return;
    setSaving(true);

    try {
      const fullScript = [
        `## Briefing\n${result.goal}`,
        `## Persona\n${result.persona}`,
        `## Posicionamento\n${result.positioning}`,
        `## Tom de Voz\n${result.tone_of_voice}`,
        `## Funil de Conteúdo\n${result.content_funnel}`,
        ...result.scripts.map((s) => `## ${s.title}\n${s.script}`),
      ].join("\n\n");

      const { error } = await supabase.from("scripts").insert({
        title: `${businessName} - ${formato} (${nicho})`,
        script: fullScript,
        user_id: user.id,
      });

      if (error) throw error;
      toast({ title: "Roteiro salvo com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sections = result
    ? [
        { icon: Target, label: "Briefing", content: result.goal },
        { icon: User, label: "Persona", content: result.persona },
        { icon: Target, label: "Posicionamento", content: result.positioning },
        { icon: MessageSquare, label: "Tom de Voz", content: result.tone_of_voice },
        { icon: Filter, label: "Funil de Conteúdo", content: result.content_funnel },
      ]
    : [];

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Criador Rápido de Roteiros
              </CardTitle>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="qsc-business">Nome da Empresa</Label>
                  <Input
                    id="qsc-business"
                    placeholder="Ex: Studio Fitness"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Formato</Label>
                  <Select value={formato} onValueChange={setFormato}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {FORMATOS.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Nicho</Label>
                  <Select value={nicho} onValueChange={setNicho}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {NICHOS.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Objetivo</Label>
                  <Select value={objetivo} onValueChange={setObjetivo}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {OBJETIVOS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qsc-keywords">Palavras-chave / Ideias (opcional)</Label>
                <Textarea
                  id="qsc-keywords"
                  placeholder="Insira palavras-chave, tendências ou ideias específicas..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  maxLength={500}
                  rows={2}
                />
              </div>

              {limitReached && (
                <UpgradePrompt message="Você atingiu o limite de roteiros do seu plano este mês." className="mt-2" />
              )}
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Roteiro
                  </>
                )}
              </RainbowButton>

              {/* Result */}
              {result && (
                <div className="space-y-3 pt-4 border-t border-border">
                  {sections.map((s) => (
                    <div key={s.label} className="rounded-lg border border-border bg-muted/50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <s.icon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{s.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.content}</p>
                    </div>
                  ))}

                  {result.scripts.map((script, idx) => (
                    <div key={idx} className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                      <h4 className="text-sm font-semibold text-foreground mb-1">{script.title}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{script.script}</p>
                    </div>
                  ))}

                  <Button onClick={handleSave} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Roteiro
                  </Button>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <UpgradePrompt open={showUpgrade} onOpenChange={setShowUpgrade} />
    </>
  );
}
