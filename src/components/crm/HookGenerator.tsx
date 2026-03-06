import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Copy, RefreshCw, Zap, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Hook {
  hook: string;
  trigger_type: string;
  why_it_works: string;
}

interface HookGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topic: string;
  contextId: string;
  audience?: string;
  tone?: string;
  platform?: string;
}

const TRIGGER_LABELS: Record<string, string> = {
  curiosity: "Curiosidade",
  controversial: "Controvérsia",
  authority: "Autoridade",
  problem: "Problema",
  fear: "Medo",
  statistic: "Estatística",
  myth_breaking: "Quebra de Mito",
  question: "Pergunta",
  story: "História",
  bold_statement: "Declaração Ousada",
};

const TRIGGER_COLORS: Record<string, string> = {
  curiosity: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  controversial: "bg-red-500/10 text-red-700 dark:text-red-400",
  authority: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  problem: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  fear: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  statistic: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  myth_breaking: "bg-pink-500/10 text-pink-700 dark:text-pink-400",
  question: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400",
  story: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  bold_statement: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

const PLATFORMS = ["Instagram Reels", "TikTok", "YouTube Shorts", "YouTube", "LinkedIn"];
const CONTENT_TYPES = [
  { value: "educational", label: "Educacional" },
  { value: "story", label: "Storytelling" },
  { value: "authority", label: "Autoridade" },
  { value: "tips", label: "Dicas" },
  { value: "myth_breaking", label: "Quebra de Mito" },
  { value: "case_study", label: "Estudo de Caso" },
];

export function HookGenerator({ open, onOpenChange, topic: initialTopic, contextId, audience, tone, platform: initialPlatform }: HookGeneratorProps) {
  const [topicInput, setTopicInput] = useState(initialTopic);
  const [platformInput, setPlatformInput] = useState(initialPlatform || "Instagram Reels");
  const [contentType, setContentType] = useState("educational");
  const [hooks, setHooks] = useState<Hook[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Reset state when dialog opens with new topic
  const handleOpenChange = (v: boolean) => {
    if (v) {
      setTopicInput(initialTopic);
      setPlatformInput(initialPlatform || "Instagram Reels");
      setHooks([]);
    }
    onOpenChange(v);
  };

  const generate = async () => {
    if (!topicInput.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-hooks", {
        body: {
          context_id: contextId,
          topic: topicInput,
          platform: platformInput,
          audience,
          tone,
          content_type: contentType,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setHooks(data.hooks || []);
    } catch (e: any) {
      toast.error(e.message || "Erro ao gerar ganchos");
    } finally {
      setLoading(false);
    }
  };

  const copyHook = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    toast.success("Gancho copiado!");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Gerador de Ganchos
              </DialogTitle>
            </DialogHeader>

            {/* Inputs */}
            <div className="space-y-3">
              <Input
                placeholder="Tópico do vídeo..."
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select value={platformInput} onValueChange={setPlatformInput}>
                  <SelectTrigger><SelectValue placeholder="Plataforma" /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger><SelectValue placeholder="Tipo de conteúdo" /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generate} disabled={loading || !topicInput.trim()} className="w-full">
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando 10 ganchos...</>
                ) : hooks.length > 0 ? (
                  <><RefreshCw className="h-4 w-4 mr-2" />Gerar Novos Ganchos</>
                ) : (
                  <><Zap className="h-4 w-4 mr-2" />Gerar Ganchos</>
                )}
              </Button>
            </div>

            {/* Results */}
            {hooks.length > 0 && (
              <div className="space-y-3">
                {hooks.map((h, i) => (
                  <Card key={i} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                            <Badge variant="outline" className={`text-[10px] ${TRIGGER_COLORS[h.trigger_type] || ""}`}>
                              {TRIGGER_LABELS[h.trigger_type] || h.trigger_type}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-foreground leading-snug mb-2">
                            "{h.hook}"
                          </p>
                          <p className="text-xs text-muted-foreground italic">
                            {h.why_it_works}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyHook(h.hook, i)}
                        >
                          {copiedIdx === i ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
