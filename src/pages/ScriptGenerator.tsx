import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Save, Loader2 } from "lucide-react";

interface Project {
  id: string;
  name: string | null;
}

const ScriptGenerator = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [briefing, setBriefing] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState("");
  const [videoDuration, setVideoDuration] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setProjects((data as Project[]) || []));
  }, [user]);

  const handleGenerate = async () => {
    if (!briefing || !targetAudience || !platform || !videoDuration) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setGeneratedScript("");

    const { data, error } = await supabase.functions.invoke("generate-script", {
      body: { briefing, target_audience: targetAudience, platform, video_duration: videoDuration },
    });

    setIsGenerating(false);

    if (error || data?.error) {
      toast({ title: "Erro ao gerar roteiro", description: data?.error || error?.message, variant: "destructive" });
      return;
    }

    setGeneratedScript(data.script || "");
    toast({ title: "Roteiro gerado com sucesso!" });
  };

  const handleSave = async () => {
    if (!user || !generatedScript) return;
    setIsSaving(true);

    const title = `Roteiro: ${briefing.substring(0, 60)}${briefing.length > 60 ? "..." : ""}`;
    const { error } = await supabase.from("scripts").insert({
      title,
      script: generatedScript,
      project_id: projectId || null,
      user_id: user.id,
    });

    setIsSaving(false);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Roteiro salvo com sucesso!" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gerador de Roteiros IA</h1>
          <p className="text-muted-foreground">Crie roteiros de vídeo otimizados para redes sociais</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Briefing *</Label>
                <Textarea
                  placeholder="Descreva o objetivo do vídeo, produto/serviço, mensagem principal..."
                  value={briefing}
                  onChange={(e) => setBriefing(e.target.value)}
                  rows={4}
                />
              </div>
              <div>
                <Label>Público-alvo *</Label>
                <Input
                  placeholder="Ex: Mulheres 25-35 anos, empreendedoras"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
              <div>
                <Label>Plataforma *</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram Reels">Instagram Reels</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="YouTube Shorts">YouTube Shorts</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Duração do Vídeo *</Label>
                <Select value={videoDuration} onValueChange={setVideoDuration}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 segundos">15 segundos</SelectItem>
                    <SelectItem value="30 segundos">30 segundos</SelectItem>
                    <SelectItem value="60 segundos">60 segundos</SelectItem>
                    <SelectItem value="3 minutos">3 minutos</SelectItem>
                    <SelectItem value="5+ minutos">5+ minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vincular a Projeto (opcional)</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name || "Sem nome"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {isGenerating ? "Gerando..." : "Gerar Roteiro"}
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Roteiro Gerado
                {generatedScript && (
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Salvar
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Gerando roteiro com IA...
                </div>
              ) : generatedScript ? (
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm leading-relaxed">
                  {generatedScript}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-12">
                  Preencha os campos e clique em "Gerar Roteiro" para começar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ScriptGenerator;
