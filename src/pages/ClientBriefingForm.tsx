import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, ArrowRight, ArrowLeft, Sparkles, Check, CloudUpload } from "lucide-react";

interface BriefingRequest {
  id: string;
  business_name: string;
  project_name: string;
  video_quantity: number;
  status: string;
  form_answers: any;
  niche: string | null;
}

type QuestionKey =
  | "business_context"
  | "ideal_audience"
  | "pain_points"
  | "differentiators"
  | "marketing_objective"
  | "content_type"
  | "brand_voice";

interface Question {
  key: QuestionKey;
  title: string;
  question: string;
  example: string;
  defaultChips: string[];
  minLength: number;
}

const QUESTIONS: Question[] = [
  {
    key: "business_context",
    title: "Contexto do Negócio",
    question: "O que seu negócio faz, para quem vende e qual o principal problema que resolve?",
    example: "Ex: Clínica odontológica em Porto Velho especializada em estética dental para mulheres que querem mais autoestima.",
    defaultChips: ["Serviço local", "Negócio online", "Clínica/consultório", "Loja física", "Produtos digitais", "Educação/treinamento"],
    minLength: 30,
  },
  {
    key: "ideal_audience",
    title: "Público Ideal",
    question: "Quem é o público ideal que você quer atrair com seus vídeos?",
    example: "Ex: Mulheres entre 25 e 45 anos preocupadas com aparência e autoestima.",
    defaultChips: [],
    minLength: 15,
  },
  {
    key: "pain_points",
    title: "Dores do Cliente",
    question: "Quais são as principais dores, dúvidas ou frustrações do seu cliente?",
    example: "Ex: Vergonha de sorrir, medo de dor no tratamento, insegurança sobre preço.",
    defaultChips: [],
    minLength: 15,
  },
  {
    key: "differentiators",
    title: "Diferencial da Empresa",
    question: "O que torna sua empresa diferente da concorrência?",
    example: "Ex: Atendimento humanizado, tecnologia de ponta, parcelamento facilitado.",
    defaultChips: [],
    minLength: 15,
  },
  {
    key: "marketing_objective",
    title: "Objetivo Principal",
    question: "Qual o principal objetivo do seu conteúdo?",
    example: "Ex: Gerar mais vendas, construir autoridade no nicho, engajar e fidelizar.",
    defaultChips: ["Mais vendas", "Autoridade no nicho", "Engajamento", "Geração de leads", "Fidelizar clientes"],
    minLength: 10,
  },
  {
    key: "content_type",
    title: "Tipo de Conteúdo Desejado",
    question: "Que tipos de conteúdo você gostaria de produzir?",
    example: "Ex: Reels educativos, bastidores, depoimentos de clientes, antes e depois.",
    defaultChips: ["Reels educativos", "Bastidores", "Depoimentos", "Antes e depois", "Tutoriais", "Tendências"],
    minLength: 10,
  },
  {
    key: "brand_voice",
    title: "Voz da Marca",
    question: "Como sua marca deve soar nos vídeos? Que tom transmite?",
    example: "Ex: Próximo e acolhedor, mas com autoridade técnica.",
    defaultChips: ["Próximo e acolhedor", "Especialista e técnico", "Educativo", "Inspiracional", "Divertido", "Profissional"],
    minLength: 10,
  },
];

type SaveStatus = "idle" | "saving" | "saved" | "error";

const ClientBriefingForm = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<BriefingRequest | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chipsByKey, setChipsByKey] = useState<Record<string, string[]>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { data, error } = await supabase
        .from("briefing_requests")
        .select("id, business_name, project_name, video_quantity, status, form_answers, niche")
        .eq("token", token)
        .single();
      if (error || !data) {
        setError("Link inválido ou expirado.");
        setLoading(false);
        return;
      }
      setBriefing(data as BriefingRequest);
      if (data.status !== "pending" && data.status !== "submitted") {
        setSubmitted(true);
      }
      if (data.form_answers && typeof data.form_answers === "object") {
        // Migrate legacy array values to strings
        const migrated: Record<string, string> = {};
        for (const [k, v] of Object.entries(data.form_answers as Record<string, any>)) {
          migrated[k] = Array.isArray(v) ? v.join(", ") : (v || "");
        }
        setAnswers(migrated);
      }
      setLoading(false);
    };
    load();
  }, [token]);

  const currentQ = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  // ---------- Auto-save ----------
  const persistAnswers = useCallback(
    async (next: Record<string, string>) => {
      if (!token) return;
      setSaveStatus("saving");
      const { error } = await supabase
        .from("briefing_requests")
        .update({ form_answers: next })
        .eq("token", token);
      setSaveStatus(error ? "error" : "saved");
    },
    [token]
  );

  const updateAnswer = (key: string, value: string) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => persistAnswers(next), 1500);
  };

  // ---------- AI suggestions ----------
  const fetchSuggestions = async (questionKey: QuestionKey) => {
    if (questionKey === "business_context") return;
    if (chipsByKey[questionKey]?.length) return; // cache
    const businessContext = answers.business_context?.trim();
    if (!businessContext) return;

    setLoadingSuggestions(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-briefing", {
        body: {
          business_context: businessContext,
          niche: briefing?.niche || null,
          question_key: questionKey,
        },
      });
      if (!error && data?.chips && Array.isArray(data.chips)) {
        setChipsByKey((prev) => ({ ...prev, [questionKey]: data.chips }));
      }
    } catch (e) {
      console.error("Failed to fetch AI suggestions:", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleNext = async () => {
    // Persist immediately before moving on
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    await persistAnswers(answers);
    const nextStep = step + 1;
    if (nextStep < QUESTIONS.length) {
      fetchSuggestions(QUESTIONS[nextStep].key);
    }
    setStep(nextStep);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleChipClick = (chip: string) => {
    const key = currentQ.key;
    const current = answers[key] || "";
    const separator = current.trim() ? ", " : "";
    updateAnswer(key, current + separator + chip);
  };

  const handleSubmit = async () => {
    if (!briefing || !token) return;
    setSubmitting(true);
    setError(null);

    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    // 1. Persistir respostas finais + marcar como submitted (garantia de não perder dados)
    const { error: updateErr } = await supabase
      .from("briefing_requests")
      .update({ form_answers: answers, status: "submitted" })
      .eq("token", token);

    if (updateErr) {
      console.error("[Briefing] Erro ao salvar respostas finais:", updateErr);
      setError("Erro ao salvar respostas. Tente novamente.");
      setSubmitting(false);
      return;
    }

    // 2. Mostrar tela de sucesso ANTES de chamar a IA (respostas já salvas, pipeline garantido por retry-pending)
    setSubmitted(true);

    // 3. Disparar IA aguardando resposta (não fire-and-forget — evita cancelamento)
    try {
      const { error: invokeErr } = await supabase.functions.invoke("process-briefing", {
        body: { token },
      });
      if (invokeErr) {
        console.error("[Briefing] Erro ao processar IA (será reprocessado automaticamente):", invokeErr);
      } else {
        console.log("[Briefing] Processamento iniciado com sucesso");
      }
    } catch (e) {
      console.error("[Briefing] Falha ao invocar process-briefing:", e);
      // Não trava o usuário — retry-pending-briefings cuidará disso
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    const v = (answers[currentQ.key] || "").trim();
    return v.length >= currentQ.minLength;
  };

  const currentChips = chipsByKey[currentQ.key] || currentQ.defaultChips;

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
            <h2 className="text-2xl font-bold text-foreground">Recebemos seu briefing!</h2>
            <p className="text-muted-foreground">
              Suas respostas foram salvas com sucesso. Sua estratégia de conteúdo e roteiros estão sendo gerados
              automaticamente — esse processo leva alguns minutos e continua mesmo se você fechar esta página.
            </p>
            <p className="text-sm text-muted-foreground">
              A equipe de produção entrará em contato com os próximos passos.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentLength = (answers[currentQ.key] || "").trim().length;

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
          <div className="flex items-center gap-3 justify-center flex-wrap">
            <span className="text-sm text-muted-foreground">
              Pergunta {step + 1} de {QUESTIONS.length}
            </span>
            <Badge variant="secondary">{briefing?.video_quantity} vídeos</Badge>
            {/* Save status pill */}
            {saveStatus === "saving" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CloudUpload className="h-3 w-3 animate-pulse" /> Salvando…
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-accent flex items-center gap-1">
                <Check className="h-3 w-3" /> Salvo
              </span>
            )}
            {saveStatus === "error" && (
              <button
                type="button"
                onClick={() => persistAnswers(answers)}
                className="text-xs text-destructive underline"
              >
                Erro ao salvar — tentar novamente
              </button>
            )}
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
            {/* Loading suggestions */}
            {loadingSuggestions && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Gerando sugestões personalizadas com IA…</span>
              </div>
            )}

            {/* AI badge */}
            {!loadingSuggestions && chipsByKey[currentQ.key]?.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3 text-primary" />
                <span>Sugestões personalizadas para o seu nicho — clique para adicionar</span>
              </div>
            )}

            {/* Chips */}
            {currentChips.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {currentChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className="px-3 py-1.5 text-sm rounded-full border bg-secondary text-secondary-foreground border-border hover:bg-muted transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Mandatory textarea for ALL questions */}
            <div className="space-y-1">
              <Textarea
                placeholder="Digite sua resposta aqui (campo obrigatório)…"
                value={answers[currentQ.key] || ""}
                onChange={(e) => updateAnswer(currentQ.key, e.target.value)}
                rows={5}
                required
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {currentLength < currentQ.minLength
                    ? `Mínimo ${currentQ.minLength} caracteres (faltam ${currentQ.minLength - currentLength})`
                    : "✓ Resposta válida"}
                </span>
                <span>{currentLength} caracteres</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {step < QUESTIONS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canProceed() || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Enviando…
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
