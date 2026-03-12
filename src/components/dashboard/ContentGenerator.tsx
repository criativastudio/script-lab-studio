import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown, ChevronUp, Sparkles, Loader2,
  User, Target, MessageSquare, Filter, Download,
  Eye, FileText, BookOpen, LayoutList, Clock,
} from "lucide-react";

interface StrategicContext {
  id: string;
  business_name: string;
  business_niche: string | null;
  target_audience: string | null;
  customer_persona: string | null;
  tone_of_voice: string | null;
  market_positioning: string | null;
  communication_style: string | null;
  products_services: string | null;
  pain_points: string | null;
  differentiators: string | null;
  marketing_objectives: string | null;
}

interface GeneratedResult {
  goal?: string;
  target_audience?: string;
  content_style?: string;
  persona?: string;
  positioning?: string;
  tone_of_voice?: string;
  content_funnel?: string;
  scripts?: { title: string; script: string }[];
  // Carousel fields
  slides?: { slide_number: number; slide_label: string; headline: string; connector: string; visual_suggestion: string; alt_text: string }[];
  caption?: string;
}

interface HistoryItem {
  id: string;
  title: string | null;
  script: string | null;
  created_at: string | null;
}

const CONTENT_TYPES = [
  { value: "roteiro", label: "Roteiro", icon: FileText },
  { value: "briefing", label: "Briefing", icon: BookOpen },
  { value: "briefing_roteiro", label: "Briefing + Roteiro", icon: Target },
  { value: "carrossel", label: "Carrossel", icon: LayoutList },
];

export function ContentGenerator() {
  const { user } = useAuth();
  const { limits, getMonthlyScriptCount } = usePlanLimits();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(true);
  const [contexts, setContexts] = useState<StrategicContext[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState("");
  const [selectedContext, setSelectedContext] = useState<StrategicContext | null>(null);
  const [contentType, setContentType] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewItem, setViewItem] = useState<HistoryItem | null>(null);

  // Load clients
  useEffect(() => {
    if (!user) return;
    supabase
      .from("client_strategic_contexts")
      .select("id, business_name, business_niche, target_audience, customer_persona, tone_of_voice, market_positioning, communication_style, products_services, pain_points, differentiators, marketing_objectives")
      .eq("user_id", user.id)
      .then(({ data }) => { if (data) setContexts(data as StrategicContext[]); });
  }, [user]);

  // Update selected context
  useEffect(() => {
    const ctx = contexts.find((c) => c.business_name === selectedBusiness);
    setSelectedContext(ctx || null);
  }, [selectedBusiness, contexts]);

  // Load history for selected client
  useEffect(() => {
    if (!user || !selectedBusiness) { setHistory([]); return; }
    supabase
      .from("scripts")
      .select("id, title, script, created_at")
      .eq("user_id", user.id)
      .ilike("title", `%${selectedBusiness}%`)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setHistory(data); });
  }, [user, selectedBusiness, result]);

  const contentTypeLabel = (type: string) =>
    CONTENT_TYPES.find((t) => t.value === type)?.label || type;

  const handleGenerate = async () => {
    if (!user) return;
    if (!selectedBusiness || !contentType) {
      toast({ title: "Selecione o cliente e o tipo de conteúdo", variant: "destructive" });
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
      let data: any;

      if (contentType === "carrossel") {
        const resp = await supabase.functions.invoke("generate-carousel", {
          body: {
            user_id: user.id,
            business_name: selectedBusiness,
            mode: "script",
            topic: keywords.trim() || undefined,
          },
        });
        if (resp.error) throw resp.error;
        if (resp.data?.error) throw new Error(resp.data.error);
        data = resp.data;
      } else {
        // Map content type to what the edge function expects
        const objective = contentType === "briefing"
          ? `Criar briefing estratégico completo para ${selectedBusiness}`
          : contentType === "roteiro"
            ? `Criar roteiro de vídeo para ${selectedBusiness}`
            : `Criar briefing estratégico e roteiro de vídeo para ${selectedBusiness}`;

        const resp = await supabase.functions.invoke("manual-generate", {
          body: {
            business_name: selectedBusiness,
            objective,
            target_audience: selectedContext?.target_audience || `Público do nicho ${selectedContext?.business_niche || "geral"}`,
            platform: "Instagram",
            niche: selectedContext?.business_niche || "geral",
            notes: keywords.trim() || undefined,
            hook: keywords.trim() || undefined,
            duration: "30s",
            video_quantity: 1,
            user_id: user.id,
            // Strategic context fields
            customer_persona: selectedContext?.customer_persona,
            tone_of_voice: selectedContext?.tone_of_voice,
            market_positioning: selectedContext?.market_positioning,
            communication_style: selectedContext?.communication_style,
            products_services: selectedContext?.products_services,
            pain_points: selectedContext?.pain_points,
            differentiators: selectedContext?.differentiators,
            marketing_objectives: selectedContext?.marketing_objectives,
          },
        });
        if (resp.error) throw resp.error;
        if (resp.data?.error) throw new Error(resp.data.error);
        data = resp.data;
      }

      setResult(data as GeneratedResult);
      setModalOpen(true);

      // Auto-save to scripts
      const dateStr = new Date().toLocaleDateString("pt-BR");
      const title = `${selectedBusiness} — ${contentTypeLabel(contentType)} — ${dateStr}`;
      const scriptText = buildScriptText(data, contentType);

      await supabase.from("scripts").insert({
        title,
        script: scriptText,
        user_id: user.id,
      });

      toast({ title: "Conteúdo gerado e salvo com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar conteúdo", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const buildScriptText = (data: any, type: string): string => {
    if (type === "carrossel") {
      const slides = (data.slides || []).map((s: any) =>
        `## ${s.slide_label}\n**${s.headline}**\n${s.connector}\n\n**Visual:** ${s.visual_suggestion}\n**Alt:** ${s.alt_text}`
      ).join("\n\n---\n\n");
      return slides + `\n\n---\n\n## Legenda\n${data.caption || ""}`;
    }

    const parts: string[] = [];
    if (data.goal) parts.push(`## Briefing\n${data.goal}`);
    if (data.persona) parts.push(`## Persona\n${data.persona}`);
    if (data.positioning) parts.push(`## Posicionamento\n${data.positioning}`);
    if (data.tone_of_voice) parts.push(`## Tom de Voz\n${data.tone_of_voice}`);
    if (data.content_funnel) parts.push(`## Funil de Conteúdo\n${data.content_funnel}`);
    if (data.scripts) {
      data.scripts.forEach((s: any) => parts.push(`## ${s.title}\n${s.script}`));
    }
    return parts.join("\n\n");
  };

  const getSlideTypeLabel = (num: number) => {
    if (num === 1) return "Hook";
    if (num === 6) return "CTA";
    return "Desenvolvimento";
  };

  const handleDownloadPDF = () => {
    if (contentType === "carrossel" && result?.slides) {
      // Premium PDF for carousel
      const dateStr = new Date().toLocaleDateString("pt-BR");
      const slidesHtml = result.slides.map((s) => `
        <div style="border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:16px;page-break-inside:avoid;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
            <span style="background:#f3f4f6;padding:4px 12px;border-radius:6px;font-size:13px;font-weight:600;color:#6b7280;">S${s.slide_number}</span>
            <span style="font-size:13px;font-weight:600;color:#374151;">${getSlideTypeLabel(s.slide_number)}</span>
          </div>
          <p style="font-size:20px;font-weight:700;color:#111827;margin:0 0 4px 0;line-height:1.3;">${s.headline}</p>
          <p style="font-size:14px;font-weight:400;color:#6b7280;margin:0 0 16px 0;">${s.connector}</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;color:#6b7280;">
            <div><strong>Visual:</strong> ${s.visual_suggestion}</div>
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
            <p class="meta">${dateStr}</p>
          </div>
          <div class="content">
            <h2 class="section-title">Slides do Carrossel</h2>
            ${slidesHtml}
            <div class="caption">
              <h3>Legenda do Post</h3>
              <p>${result.caption || ""}</p>
            </div>
          </div>
        </body></html>`);
      win.document.close();
      win.print();
      return;
    }

    // Fallback for non-carousel
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Conteúdo — ${selectedBusiness}</title>
      <style>
        body { font-family: sans-serif; padding: 40px; color: #1a1a1a; background: #fff; max-width: 800px; margin: 0 auto; }
        h2 { margin-top: 24px; color: #333; } h3 { color: #555; }
        p, div { line-height: 1.6; } .section { margin-bottom: 20px; padding: 16px; border: 1px solid #eee; border-radius: 8px; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; background: #f0f0f0; font-size: 12px; margin-right: 4px; }
      </style></head><body>${printContent}</body></html>
    `);
    win.document.close();
    win.print();
  };

  // Render sections for briefing/roteiro results
  const renderBriefingResult = (data: GeneratedResult) => {
    const sections = [
      { icon: Target, label: "Briefing", content: data.goal },
      { icon: User, label: "Persona", content: data.persona },
      { icon: Target, label: "Posicionamento", content: data.positioning },
      { icon: MessageSquare, label: "Tom de Voz", content: data.tone_of_voice },
      { icon: Filter, label: "Funil de Conteúdo", content: data.content_funnel },
    ].filter((s) => s.content);

    return (
      <>
        {sections.map((s) => (
          <div key={s.label} className="section rounded-lg border border-border bg-muted/50 p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{s.label}</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{s.content}</p>
          </div>
        ))}
        {data.scripts?.map((script, idx) => (
          <div key={idx} className="rounded-lg border border-primary/30 bg-primary/5 p-3 mb-3">
            <h3 className="text-sm font-semibold text-foreground mb-1">{script.title}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{script.script}</p>
          </div>
        ))}
      </>
    );
  };

  // Render carousel result
  const renderCarouselResult = (data: GeneratedResult) => (
    <>
      {data.slides?.map((slide) => (
        <div key={slide.slide_number} className={`rounded-lg border p-3 mb-3 ${slide.slide_number === 1 ? "border-primary/50 bg-primary/5" : slide.slide_number === 6 ? "border-accent/50 bg-accent/5" : "border-border bg-muted/50"}`}>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary">S{slide.slide_number}</Badge>
            <span className="text-xs text-muted-foreground">{getSlideTypeLabel(slide.slide_number)}</span>
            <span className="text-sm font-semibold text-foreground">{slide.slide_label}</span>
          </div>
          <p className="text-sm font-medium text-foreground mb-2">{slide.text}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 text-xs text-muted-foreground">
            <span><strong>Visual:</strong> {slide.visual_suggestion}</span>
            <span><strong>Arte:</strong> {slide.art_text}</span>
            <span><strong>Alt:</strong> {slide.alt_text}</span>
          </div>
        </div>
      ))}
      {data.caption && (
        <div className="rounded-lg border border-border bg-muted/50 p-3 mb-3">
          <span className="text-sm font-semibold text-foreground">Legenda</span>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{data.caption}</p>
        </div>
      )}
    </>
  );

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Gerador de Conteúdo
              </CardTitle>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="space-y-4">
              {/* Client selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Cliente</Label>
                  <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                    <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                    <SelectContent>
                      {contexts.map((c) => (
                        <SelectItem key={c.id} value={c.business_name}>{c.business_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Tipo de Conteúdo</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent>
                      {CONTENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <div className="space-y-1.5">
                <Label htmlFor="cg-keywords">Palavras-chave / Tema (opcional)</Label>
                <Textarea
                  id="cg-keywords"
                  placeholder="Insira palavras-chave, tendências ou ideias específicas..."
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  maxLength={500}
                  rows={2}
                />
              </div>

              {limitReached && (
                <UpgradePrompt message="Você atingiu o limite de conteúdos do seu plano este mês." className="mt-2" />
              )}

              <RainbowButton
                className="w-full"
                onClick={handleGenerate}
                disabled={loading || limitReached}
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Gerar Conteúdo</>
                )}
              </RainbowButton>

              {/* History */}
              {selectedBusiness && history.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Histórico — {selectedBusiness}
                  </h4>
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                        <div className="truncate flex-1 mr-2">
                          <span className="font-medium">{item.title || "Sem título"}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString("pt-BR") : ""}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setViewItem(item)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            setViewItem(item);
                            setTimeout(() => handleDownloadPDF(), 300);
                          }}>
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Results Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBusiness} — {contentTypeLabel(contentType)}</DialogTitle>
            <DialogDescription>Conteúdo gerado automaticamente com base no contexto estratégico do cliente.</DialogDescription>
          </DialogHeader>

          <div ref={printRef}>
            {result && contentType === "carrossel"
              ? renderCarouselResult(result)
              : result && renderBriefingResult(result)}
          </div>

          <Button onClick={handleDownloadPDF} variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Baixar em PDF
          </Button>
        </DialogContent>
      </Dialog>

      {/* View history item modal */}
      <Dialog open={!!viewItem} onOpenChange={(o) => { if (!o) setViewItem(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewItem?.title}</DialogTitle>
            <DialogDescription>
              {viewItem?.created_at ? new Date(viewItem.created_at).toLocaleDateString("pt-BR") : ""}
            </DialogDescription>
          </DialogHeader>
          <div ref={!modalOpen ? printRef : undefined}>
            <div className="text-sm whitespace-pre-wrap text-foreground">{viewItem?.script}</div>
          </div>
          <Button onClick={handleDownloadPDF} variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Baixar em PDF
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
