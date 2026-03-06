import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Loader2, Zap, Wand2, Monitor } from "lucide-react";
import { toast } from "sonner";

interface ViralScoreCriteria {
  hook_strength: number;
  message_clarity: number;
  audience_relevance: number;
  storytelling_structure: number;
  emotional_trigger: number;
  cta_strength: number;
  platform_optimization: number;
}

interface ViralScoreData {
  total_score: number;
  criteria: ViralScoreCriteria;
  strengths: string[];
  improvements: string[];
}

const CRITERIA_LABELS: Record<keyof ViralScoreCriteria, { label: string; max: number }> = {
  hook_strength: { label: "Força do Gancho", max: 20 },
  message_clarity: { label: "Clareza da Mensagem", max: 15 },
  audience_relevance: { label: "Relevância para Público", max: 15 },
  storytelling_structure: { label: "Estrutura Narrativa", max: 15 },
  emotional_trigger: { label: "Gatilhos Emocionais", max: 15 },
  cta_strength: { label: "Força do CTA", max: 10 },
  platform_optimization: { label: "Otimização Plataforma", max: 10 },
};

function getScoreColor(score: number) {
  if (score >= 70) return "text-green-500";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
}

function getProgressColor(score: number) {
  if (score >= 70) return "[&>div]:bg-green-500";
  if (score >= 40) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-red-500";
}

interface ViralScoreCardProps {
  scriptText: string;
  contextId?: string;
  platform?: string;
  onRegenerateHook?: () => void;
}

export function ViralScoreCard({ scriptText, contextId, platform, onRegenerateHook }: ViralScoreCardProps) {
  const [score, setScore] = useState<ViralScoreData | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("score-script", {
        body: { script_text: scriptText, context_id: contextId, platform },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setScore({ total_score: data.total_score, criteria: data.criteria, strengths: data.strengths, improvements: data.improvements });
    } catch (e: any) {
      toast.error(e.message || "Erro ao analisar score");
    } finally {
      setLoading(false);
    }
  };

  if (!score) {
    return (
      <Card>
        <CardContent className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm tracking-wide uppercase text-foreground">Viral Score</h3>
          </div>
          <Button onClick={analyze} disabled={loading} size="sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <BarChart3 className="h-4 w-4 mr-1.5" />}
            {loading ? "Analisando..." : "Analisar Score"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="p-5 space-y-4">
        {/* Header with total score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h3 className="font-semibold text-sm tracking-wide uppercase text-foreground">Viral Score</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-3xl font-bold ${getScoreColor(score.total_score)}`}>{score.total_score}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
        </div>

        {/* Total progress bar */}
        <Progress value={score.total_score} className={`h-3 ${getProgressColor(score.total_score)}`} />

        {/* Criteria breakdown */}
        <div className="space-y-2.5">
          {(Object.entries(CRITERIA_LABELS) as [keyof ViralScoreCriteria, { label: string; max: number }][]).map(([key, { label, max }]) => {
            const val = score.criteria[key];
            const pct = (val / max) * 100;
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{val}/{max}</span>
                </div>
                <Progress value={pct} className={`h-1.5 ${getProgressColor(pct)}`} />
              </div>
            );
          })}
        </div>

        {/* Strengths & Improvements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {score.strengths.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Pontos Fortes</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {score.strengths.map((s, i) => (
                  <Badge key={i} className="bg-green-500/10 text-green-700 border-green-500/20 text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          {score.improvements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-600">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Melhorias</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {score.improvements.map((s, i) => (
                  <Badge key={i} className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20 text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" disabled>
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            Melhorar Roteiro
          </Button>
          {onRegenerateHook && (
            <Button variant="outline" size="sm" onClick={onRegenerateHook}>
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Regenerar Gancho
            </Button>
          )}
          <Button variant="outline" size="sm" disabled>
            <Monitor className="h-3.5 w-3.5 mr-1.5" />
            Otimizar para Plataforma
          </Button>
        </div>

        {/* Re-analyze */}
        <Button variant="ghost" size="sm" onClick={analyze} disabled={loading} className="w-full text-xs">
          {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <TrendingUp className="h-3 w-3 mr-1" />}
          Reanalisar
        </Button>
      </CardContent>
    </Card>
  );
}
