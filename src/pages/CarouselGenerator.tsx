import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Loader2, Lightbulb, LayoutList, Sparkles, Save, Copy } from "lucide-react";

interface StrategicContext {
  id: string;
  business_name: string;
  business_niche: string | null;
  target_audience: string | null;
  customer_persona: string | null;
  tone_of_voice: string | null;
  market_positioning: string | null;
  communication_style: string | null;
}

interface CarouselIdea {
  headline: string;
  angle: string;
  funnel_stage: string;
  pain_or_desire: string;
  explanation: string;
}

interface SlideData {
  slide_number: number;
  slide_label: string;
  text: string;
  visual_suggestion: string;
  art_text: string;
  alt_text: string;
}

interface ScriptResult {
  slides: SlideData[];
  caption: string;
}

const CarouselGenerator = () => {
  const { user } = useAuth();
  const { limits, getMonthlyScriptCount } = usePlanLimits();
  const { toast } = useToast();

  const [contexts, setContexts] = useState<StrategicContext[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedContext, setSelectedContext] = useState<StrategicContext | null>(null);
  const [topic, setTopic] = useState("");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaCount, setIdeaCount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Results
  const [ideas, setIdeas] = useState<CarouselIdea[] | null>(null);
  const [script, setScript] = useState<ScriptResult | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("client_strategic_contexts")
      .select("id, business_name, business_niche, target_audience, customer_persona, tone_of_voice, market_positioning, communication_style")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setContexts(data);
      });
  }, [user]);

  useEffect(() => {
    const ctx = contexts.find((c) => c.business_name === selectedBusiness);
    setSelectedContext(ctx || null);
  }, [selectedBusiness, contexts]);

  const handleGenerate = async (mode: "ideas" | "script") => {
    if (!user || !selectedBusiness) {
      toast({ title: "Selecione um cliente primeiro", variant: "destructive" });
      return;
    }

    const count = await getMonthlyScriptCount();
    if (count >= limits.scriptsPerMonth) {
      setShowUpgrade(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-carousel", {
        body: {
          user_id: user.id,
          business_name: selectedBusiness,
          mode,
          topic: topic || undefined,
          idea_count: mode === "ideas" ? parseInt(ideaCount) : undefined,
          idea_title: mode === "script" ? ideaTitle || undefined : undefined,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (mode === "ideas") {
        setIdeas(data.ideas);
        setScript(null);
      } else {
        setScript({ slides: data.slides, caption: data.caption });
        setIdeas(null);
      }

      toast({ title: mode === "ideas" ? "Ideias geradas!" : "Roteiro gerado!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScript = async () => {
    if (!user || !script) return;
    const fullText = script.slides.map((s) => `## ${s.slide_label}\n${s.text}\n\n**Visual:** ${s.visual_suggestion}\n**Arte:** ${s.art_text}\n**Alt:** ${s.alt_text}`).join("\n\n---\n\n")
      + `\n\n---\n\n## Legenda\n${script.caption}`;

    const { error } = await supabase.from("scripts").insert({
      title: `Carrossel — ${selectedBusiness}`,
      script: fullText,
      user_id: user.id,
    });

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      toast({ title: "Roteiro salvo com sucesso!" });
    }
  };

  const getSlideTypeLabel = (num: number) => {
    if (num === 1) return "Hook";
    if (num === 6) return "CTA";
    return "Desenvolvimento";
  };

  const getSlideAccent = (num: number) => {
    if (num === 1) return "border-primary/50 bg-primary/5";
    if (num === 6) return "border-accent/50 bg-accent/5";
    return "";
  };

  const handleDownloadPDF = () => {
    if (!script) return;
    const dateStr = new Date().toLocaleDateString("pt-BR");
    const slidesHtml = script.slides.map((s) => `
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:16px;page-break-inside:avoid;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <span style="background:#f3f4f6;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600;color:#6b7280;">S${s.slide_number}</span>
          <span style="font-size:13px;font-weight:600;color:#374151;">${getSlideTypeLabel(s.slide_number)}</span>
        </div>
        <p style="font-size:16px;font-weight:500;color:#111827;margin:0 0 16px 0;line-height:1.5;">${s.text}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;font-size:12px;color:#6b7280;">
          <div><strong>Visual:</strong> ${s.visual_suggestion}</div>
          <div><strong>Arte:</strong> ${s.art_text}</div>
          <div><strong>Alt:</strong> ${s.alt_text}</div>
        </div>
      </div>
    `).join("");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Carrossel — ${selectedBusiness}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111827; background: #fff; }
        .cover { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; padding: 60px; }
        .cover h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
        .cover .meta { font-size: 14px; color: #6b7280; margin-top: 16px; }
        .content { max-width: 720px; margin: 0 auto; padding: 40px 24px; }
        .section-title { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #374151; }
        .caption { border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-top: 24px; }
        .caption h3 { font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px; }
        .caption p { font-size: 14px; color: #4b5563; line-height: 1.6; }
        @media print { .cover { page-break-after: always; } }
      </style></head><body>
        <div class="cover">
          <h1>Carrossel Instagram</h1>
          <p style="font-size:18px;color:#6b7280;">${selectedBusiness}</p>
          ${ideaTitle ? `<p style="font-size:16px;color:#9ca3af;margin-top:8px;">${ideaTitle}</p>` : ""}
          <p class="meta">${dateStr}</p>
        </div>
        <div class="content">
          <h2 class="section-title">Slides do Carrossel</h2>
          ${slidesHtml}
          <div class="caption">
            <h3>Legenda do Post</h3>
            <p>${script.caption}</p>
          </div>
        </div>
      </body></html>`);
    win.document.close();
    win.print();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const funnelColor = (stage: string) => {
    if (stage === "atração") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (stage === "consideração") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-rose-500/20 text-rose-400 border-rose-500/30";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Gerador de Carrossel</h1>
          <p className="text-muted-foreground">Crie carrosséis estratégicos para Instagram baseados no contexto do cliente.</p>
        </div>

        {/* Client selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Cliente</label>
                <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                  <SelectContent>
                    {contexts.map((c) => (
                      <SelectItem key={c.id} value={c.business_name}>{c.business_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedContext && (
                <div className="flex flex-wrap gap-2">
                  {selectedContext.business_niche && <Badge variant="secondary">{selectedContext.business_niche}</Badge>}
                  {selectedContext.tone_of_voice && <Badge variant="outline">{selectedContext.tone_of_voice}</Badge>}
                  {selectedContext.customer_persona && <Badge variant="outline" className="max-w-[200px] truncate">{selectedContext.customer_persona}</Badge>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mode tabs */}
        <Tabs defaultValue="ideas">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="ideas" className="gap-2"><Lightbulb className="h-4 w-4" />Ideias de Carrossel</TabsTrigger>
            <TabsTrigger value="script" className="gap-2"><LayoutList className="h-4 w-4" />Roteiro Completo</TabsTrigger>
          </TabsList>

          {/* Ideas mode */}
          <TabsContent value="ideas" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Quantidade</label>
                    <Select value={ideaCount} onValueChange={setIdeaCount}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 ideias</SelectItem>
                        <SelectItem value="5">5 ideias</SelectItem>
                        <SelectItem value="10">10 ideias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tema / Palavras-chave (opcional)</label>
                    <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ex: produtividade, rotina matinal..." />
                  </div>
                </div>
                <Button onClick={() => handleGenerate("ideas")} disabled={loading || !selectedBusiness} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Gerar Ideias
                </Button>
              </CardContent>
            </Card>

            {ideas && (
              <div className="grid gap-4">
                {ideas.map((idea, i) => (
                  <Card key={i} className="hover:border-primary/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold text-lg">{idea.headline}</h3>
                          <div className="flex gap-2 flex-wrap">
                            <Badge className={funnelColor(idea.funnel_stage)}>{idea.funnel_stage}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground"><strong>Ângulo:</strong> {idea.angle}</p>
                          <p className="text-sm text-muted-foreground"><strong>Dor/Desejo:</strong> {idea.pain_or_desire}</p>
                          <p className="text-sm">{idea.explanation}</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { setIdeaTitle(idea.headline); }}>
                          Usar como roteiro →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Script mode */}
          <TabsContent value="script" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Título / Tema do carrossel</label>
                  <Input value={ideaTitle} onChange={(e) => setIdeaTitle(e.target.value)} placeholder="Ex: 5 erros que te impedem de vender mais" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Palavras-chave extras (opcional)</label>
                  <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Adicione contexto, tendências, palavras-chave..." rows={2} />
                </div>
                <Button onClick={() => handleGenerate("script")} disabled={loading || !selectedBusiness} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Gerar Roteiro Completo
                </Button>
              </CardContent>
            </Card>

            {script && (
              <div className="space-y-4">
                {/* Slides */}
                <div className="grid gap-3">
                  {script.slides.map((slide) => (
                    <Card key={slide.slide_number}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Badge variant="secondary">S{slide.slide_number}</Badge>
                          {slide.slide_label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="font-medium">{slide.text}</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-muted-foreground">
                          <div><strong>Visual:</strong> {slide.visual_suggestion}</div>
                          <div><strong>Arte:</strong> {slide.art_text}</div>
                          <div><strong>Alt:</strong> {slide.alt_text}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Caption */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Legenda do Post</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{script.caption}</p>
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => copyToClipboard(script.caption)}>
                      <Copy className="h-3 w-3 mr-1" />Copiar
                    </Button>
                  </CardContent>
                </Card>

                {/* Variations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Capas Alternativas</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {script.alternative_covers.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{i + 1}</Badge>
                          <span>{c}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-base">Aberturas A/B</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {script.ab_openings.map((a, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline">{String.fromCharCode(65 + i)}</Badge>
                          <span>{a}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Save */}
                <Button onClick={handleSaveScript} className="w-full">
                  <Save className="h-4 w-4 mr-2" />Salvar Roteiro
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {showUpgrade && <UpgradePrompt message="Você atingiu o limite mensal de roteiros do seu plano. Faça upgrade para continuar gerando." />}
      </div>
    </DashboardLayout>
  );
};

export default CarouselGenerator;
