import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

interface BriefingRequest {
  id: string;
  business_name: string;
  project_name: string;
  video_quantity: number;
  status: string;
  form_answers: any;
}

interface AISuggestions {
  audience_chips: string[];
  outcome_chips: string[];
  voice_chips: string[];
}

const DEFAULT_CHIPS = {
  business_context: [
    "Serviço local",
    "Negócio online",
    "Loja física",
    "Clínica ou consultório",
    "Restaurante ou alimentação",
    "Educação ou treinamento",
    "Produtos digitais",
  ],
  ideal_audience: [
    "Mulheres 25-45 anos",
    "Homens 30-50 anos",
    "Jovens profissionais",
    "Empresários",
    "Famílias",
    "Estudantes",
  ],
  desired_outcome: [
    "Seguir o perfil",
    "Enviar mensagem",
    "Comprar um produto",
    "Construir autoridade",
    "Educar a audiência",
  ],
  brand_voice: [
    "Especialista e autoritário",
    "Educativo e útil",
    "Amigável e próximo",
    "Provocativo e ousado",
    "Inspiracional",
  ],
};

interface Question {
  key: string;
  title: string;
  question: string;
  example: string;
  chips: string[];
  type: "textarea" | "multi";
}

const ClientBriefingForm = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<BriefingRequest | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

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

  const questions: Question[] = [
    {
      key: "business_context",
      title: "Contexto do Negócio",
      question: "O que seu negócio faz, para quem vende e qual o principal problema que resolve?",
      example:
        "Exemplo: Somos uma clínica odontológica em Porto Velho especializada em estética dental. Atendemos mulheres que querem um sorriso mais bonito e confiante.",
      chips: DEFAULT_CHIPS.business_context,
      type: "textarea",
    },
    {
      key: "ideal_audience",
      title: "Público Ideal",
      question: "Quem é o público ideal que você quer atrair com seus vídeos?",
      example: "Exemplo: Mulheres entre 25 e 45 anos que se preocupam com aparência e autoestima.",
      chips: aiSuggestions?.audience_chips || DEFAULT_CHIPS.ideal_audience,
      type: "textarea",
    },
    {
      key: "desired_outcome",
      title: "Resultado Desejado",
      question: "Qual ação você quer que os espectadores tomem após assistir seus vídeos?",
      example: "",
      chips: aiSuggestions?.outcome_chips || DEFAULT_CHIPS.desired_outcome,
      type: "multi",
    },
    {
      key: "brand_voice",
      title: "Voz da Marca",
      question: "Como sua marca deve soar nos vídeos?",
      example: "",
      chips: aiSuggestions?.voice_chips || DEFAULT_CHIPS.brand_voice,
      type: "multi",
    },
  ];

  const currentQ = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  const fetchAISuggestions = async (currentStep: number) => {
    const businessContext = answers.business_context?.trim();
    if (!businessContext) return;

    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-briefing", {
        body: {
          business_context: businessContext,
          previous_answers: answers,
          current_step: currentStep,
        },
      });
      if (!error && data && !data.error) {
        setAiSuggestions((prev) => ({
          audience_chips: data.audience_chips || prev?.audience_chips || [],
          outcome_chips: data.outcome_chips || prev?.outcome_chips || [],
          voice_chips: data.voice_chips || prev?.voice_chips || [],
        }));
      }
    } catch (e) {
      console.error("Failed to fetch AI suggestions:", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleNext = () => {
    const nextStep = step + 1;
    if (answers.business_context?.trim() && nextStep < questions.length) {
      fetchAISuggestions(step);
    }
    setStep(nextStep);
  };

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

    // 1. Persist raw answers FIRST — guarantees nothing is lost even if everything else fails
    const { error: updateErr } = await supabase
      .from("briefing_requests")
      .update({ form_answers: answers, status: "submitted" })
      .eq("token", token);

    if (updateErr) {
      setError("Erro ao enviar respostas. Tente novamente.");
      setSubmitting(false);
      return;
    }

    // 2. Fire-and-forget the AI processing — don't block the UI on a 30-60s call.
    // The edge function continues server-side even if the client closes the tab.
    // The retry-pending-briefings function picks up anything that falls through.
    supabase.functions
      .invoke("process-briefing", { body: { token } })
      .catch((e) => console.error("Process error (background):", e));

    // 3. Show success immediately
    setSubmitted(true);
    setSubmitting(false);
  };

  const canProceed = () => {
    const key = currentQ?.key;
    if (!key) return false;
    if (currentQ.type === "multi") {
      return ((answers[key] as string[]) || []).length > 0;
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
              Suas respostas foram enviadas com sucesso. Sua estratégia de conteúdo e roteiros estão sendo gerados
              automaticamente.
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
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Planejamento Estratégico da Sua Comunicação</h1>
          </div>
          <p className="text-muted-foreground">
            {briefing?.business_name} — {briefing?.project_name}
          </p>
          <div className="flex items-center gap-3 justify-center">
            <span className="text-sm text-muted-foreground">
              Pergunta {step + 1} de {questions.length}
            </span>
            <Badge variant="secondary">{briefing?.video_quantity} vídeos</Badge>
          </div>
          <Progress value={progress} className="h-2 mt-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQ.title}</CardTitle>
            <p className="text-foreground font-medium">{currentQ.question}</p>
            {currentQ.example && <p className="text-sm text-muted-foreground italic">{currentQ.example}</p>}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading suggestions indicator */}
            {loadingSuggestions && step > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Gerando sugestões personalizadas com IA...</span>
              </div>
            )}

            {/* AI badge for dynamic chips */}
            {aiSuggestions && step > 0 && !loadingSuggestions && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Sugestões personalizadas pela IA</span>
              </div>
            )}

            {/* Helper chips */}
            <div className="flex flex-wrap gap-2">
              {currentQ.chips.map((chip) => {
                const isSelected =
                  currentQ.type === "multi" ? ((answers[currentQ.key] as string[]) || []).includes(chip) : false;
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
            {currentQ.type === "multi" && ((answers[currentQ.key] as string[]) || []).length > 0 && (
              <p className="text-sm text-muted-foreground">
                Selecionados: {(answers[currentQ.key] as string[]).join(", ")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {step < questions.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
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
