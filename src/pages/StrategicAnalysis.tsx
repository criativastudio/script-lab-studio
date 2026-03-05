import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText, Download, Printer } from "lucide-react";

interface ScriptIdea {
  title: string;
  description: string;
  platform?: string;
  format?: string;
}

interface AnalysisResult {
  id: string;
  persona: string;
  positioning: string;
  tone_of_voice: string;
  content_funnel: string;
  script_ideas: ScriptIdea[];
}

const StrategicAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [objectives, setObjectives] = useState("");
  const [brandPositioning, setBrandPositioning] = useState("");
  const [productionCapacity, setProductionCapacity] = useState("");
  const [contentReferences, setContentReferences] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !businessName.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("strategic-analysis", {
        body: {
          business_name: businessName,
          target_audience: targetAudience,
          objectives,
          brand_positioning: brandPositioning,
          production_capacity: productionCapacity,
          content_references: contentReferences,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as AnalysisResult);
      toast({ title: "Análise concluída!", description: "Relatório estratégico gerado com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message || "Erro ao gerar análise.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análise Estratégica</h1>
          <p className="text-muted-foreground">Gere um relatório estratégico completo com IA</p>
        </div>

        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Briefing Estratégico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Nome do Negócio *</Label>
                  <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex: Studio Criativo XYZ" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Público-Alvo</Label>
                  <Textarea id="targetAudience" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="Descreva seu público-alvo ideal..." rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="objectives">Objetivos</Label>
                  <Textarea id="objectives" value={objectives} onChange={(e) => setObjectives(e.target.value)} placeholder="Quais são os principais objetivos de conteúdo?" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandPositioning">Posicionamento da Marca</Label>
                  <Textarea id="brandPositioning" value={brandPositioning} onChange={(e) => setBrandPositioning(e.target.value)} placeholder="Como a marca quer ser percebida?" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productionCapacity">Capacidade de Produção</Label>
                  <Input id="productionCapacity" value={productionCapacity} onChange={(e) => setProductionCapacity(e.target.value)} placeholder="Ex: 4 vídeos por mês" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentReferences">Referências de Conteúdo</Label>
                  <Textarea id="contentReferences" value={contentReferences} onChange={(e) => setContentReferences(e.target.value)} placeholder="Links ou descrições de referências..." rows={3} />
                </div>
                <Button type="submit" disabled={loading || !businessName.trim()} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando análise estratégica...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Gerar Análise Estratégica
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 print:space-y-6" id="strategic-report">
            {/* Print header */}
            <div className="hidden print:block text-center mb-8">
              <h1 className="text-3xl font-bold">Relatório Estratégico</h1>
              <p className="text-lg">{businessName}</p>
              <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("pt-BR")}</p>
              <hr className="mt-4" />
            </div>

            <div className="flex gap-2 print:hidden">
              <Button variant="outline" onClick={() => setResult(null)}>
                Nova Análise
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>

            <Card>
              <CardHeader><CardTitle>Persona</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{result.persona}</p></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Posicionamento</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{result.positioning}</p></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Tom de Voz</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{result.tone_of_voice}</p></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Funil de Conteúdo</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{result.content_funnel}</p></CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Ideias de Roteiro</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.script_ideas?.map((idea, i) => (
                    <div key={i} className="border border-border rounded-lg p-3">
                      <h4 className="font-medium">{idea.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{idea.description}</p>
                      {(idea.platform || idea.format) && (
                        <div className="flex gap-2 mt-2">
                          {idea.platform && <span className="text-xs bg-muted px-2 py-1 rounded">{idea.platform}</span>}
                          {idea.format && <span className="text-xs bg-muted px-2 py-1 rounded">{idea.format}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StrategicAnalysis;
