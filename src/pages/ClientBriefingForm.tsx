import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";

interface BriefingRequest {
  id: string;
  business_name: string;
  project_name: string;
  video_quantity: number;
  status: string;
  form_answers: any;
}

const QUESTIONS = [
  {
    key: "about_business",
    title: "Sobre o seu negócio",
    question: "Descreva brevemente sua empresa, o que vende e a cidade/região onde atua.",
    example: "Exemplo: Somos uma clínica odontológica em Porto Velho especializada em estética dental.",
    chips: [
      "Serviço local", "Negócio online", "Loja física",
      "Clínica ou serviço profissional", "Restaurante ou alimentação",
      "Produtos no varejo", "Produtos digitais", "Educação ou treinamento",
    ],
    type: "textarea" as const,
  },
  {
    key: "typical_customer",
    title: "Cliente típico",
    question: "Descreva o tipo de cliente que geralmente compra de você.",
    example: "Exemplo: Mulheres entre 25 e 45 anos que se preocupam com aparência e autoestima.",
    chips: [
      "Homens", "Mulheres", "Famílias", "Empresários",
      "Jovens profissionais", "Estudantes",
      "Pessoas buscando melhoria estética", "Pessoas buscando economia",
      "Pessoas buscando conveniência",
    ],
    type: "textarea" as const,
  },
  {
    key: "problem_solved",
    title: "Problema resolvido",
    question: "Qual problema seu produto ou serviço resolve para seus clientes?",
    example: "Exemplo: Muitas pessoas se sentem inseguras com o sorriso.",
    chips: [
      "Falta de tempo", "Dor ou desconforto", "Baixa autoconfiança",
      "Dificuldade em encontrar serviços de qualidade",
      "Preços altos no mercado", "Falta de profissionais especializados",
      "Necessidade de conveniência", "Necessidade de melhores resultados",
    ],
    type: "textarea" as const,
  },
  {
    key: "business_objectives",
    title: "Objetivo dos vídeos",
    question: "O que você quer que esses vídeos alcancem?",
    example: "",
    chips: [
      "Atrair novos clientes", "Promover um produto",
      "Apresentar a empresa", "Aumentar vendas",
      "Construir autoridade", "Fortalecer posicionamento da marca",
    ],
    type: "multi" as const,
  },
  {
    key: "content_references",
    title: "Referências de conteúdo",
    question: "Você tem exemplos de vídeos ou criadores que gosta?",
    example: "",
    chips: [
      "Estilo reels do Instagram", "Vídeos educativos",
      "Antes e depois", "Depoimentos",
      "Vídeos de storytelling", "Demonstração de produto",
      "Vídeos de autoridade/especialista",
    ],
    type: "multi" as const,
  },
];

const ClientBriefingForm = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<BriefingRequest | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("briefing_requests")
        .select("id, business_name, project_name, video_quantity, status, form_answers")
        .eq("token", token)
        .single();
      if (error || !data) {
        setError("Link inválido ou expirado.");
        setLoading(false);
        return;
      }
      setBriefing(data as BriefingRequest);
      if (data.status !== "pending") {
        setSubmitted(true);
      }
      if (data.form_answers) {
        setAnswers(data.form_answers as Record<string, any>);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const currentQ = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  const handleChipClick = (chip: string) => {
    const key = currentQ.key;
    if (currentQ.type === "multi") {
      const current: string[] = answers[key] || [];
      if (current.includes(chip)) {
        setAnswers({ ...answers, [key]: current.filter((c) => c !== chip) });
      } else {
        setAnswers({ ...answers, [key]: [...current, chip] });
      }
    } else {
      const current = answers[key] || "";
      const separator = current ? ", " : "";
      setAnswers({ ...answers, [key]: current + separator + chip });
    }
  };

  const handleSubmit = async () => {
    if (!briefing || !token) return;
    setSubmitting(true);

    // Save answers
    const { error: updateErr } = await supabase
      .from("briefing_requests")
      .update({ form_answers: answers, status: "submitted" })
      .eq("token", token);

    if (updateErr) {
      setError("Erro ao enviar respostas. Tente novamente.");
      setSubmitting(false);
      return;
    }

    // Trigger processing
    const { error: fnErr } = await supabase.functions.invoke("process-briefing", {
      body: { token },
    });

    if (fnErr) {
      console.error("Process error:", fnErr);
      // Still mark as submitted even if processing fails - it can be retried
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const canProceed = () => {
    const key = currentQ?.key;
    if (!key) return false;
    if (currentQ.type === "multi") {
      return (answers[key] as string[] || []).length > 0;
    }
    return !!(answers[key] as string)?.trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-destructive font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-accent mx-auto" />
            <h2 className="text-2xl font-bold text-foreground">Obrigado!</h2>
            <p className="text-muted-foreground">
              Suas respostas foram enviadas com sucesso. Sua estratégia de conteúdo e roteiros estão sendo gerados automaticamente.
            </p>
            <p className="text-sm text-muted-foreground">
              A equipe de produção entrará em contato com os próximos passos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Briefing Estratégico
          </h1>
          <p className="text-muted-foreground">
            {briefing?.business_name} — {briefing?.project_name}
          </p>
          <div className="flex items-center gap-3 justify-center">
            <span className="text-sm text-muted-foreground">Pergunta {step + 1} de {QUESTIONS.length}</span>
            <Badge variant="secondary">{briefing?.video_quantity} vídeos</Badge>
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQ.title}</CardTitle>
            <p className="text-foreground font-medium">{currentQ.question}</p>
            {currentQ.example && (
              <p className="text-sm text-muted-foreground italic">{currentQ.example}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Helper chips */}
            <div className="flex flex-wrap gap-2">
              {currentQ.chips.map((chip) => {
                const isSelected = currentQ.type === "multi"
                  ? (answers[currentQ.key] as string[] || []).includes(chip)
                  : false;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-secondary-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>

            {/* Text input for textarea types */}
            {currentQ.type === "textarea" && (
              <Textarea
                placeholder="Digite sua resposta aqui..."
                value={(answers[currentQ.key] as string) || ""}
                onChange={(e) => setAnswers({ ...answers, [currentQ.key]: e.target.value })}
                rows={4}
              />
            )}

            {/* Selected items for multi */}
            {currentQ.type === "multi" && (answers[currentQ.key] as string[] || []).length > 0 && (
              <p className="text-sm text-muted-foreground">
                Selecionados: {(answers[currentQ.key] as string[]).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {step < QUESTIONS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Briefing"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientBriefingForm;
