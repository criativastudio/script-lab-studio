import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { buildPdfHtml, openPdfWindow } from "@/lib/pdf-builder";
import { DEFAULT_PDF_SETTINGS } from "@/lib/pdf-defaults";
import {
  Target,
  FileText,
  Award,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Star,
  Copy,
  MessageCircle,
  Sparkles,
  Download,
} from "lucide-react";

// ── Quiz definitions ──

interface Question {
  key: string;
  title: string;
  question: string;
  placeholder: string;
  chips: string[];
}

interface QuizDef {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  questions: Question[];
}

const QUIZZES: QuizDef[] = [
  {
    id: "posicionamento",
    title: "Diagnóstico de Posicionamento",
    subtitle: "Descubra como sua marca é percebida e como se destacar nas redes sociais",
    icon: Target,
    color: "from-primary/80 to-primary",
    questions: [
      {
        key: "niche",
        title: "Seu Nicho",
        question: "Qual é o nicho ou segmento do seu negócio?",
        placeholder: "Ex: Nutrição esportiva, Advocacia trabalhista...",
        chips: [
          "Saúde e Bem-estar",
          "Educação",
          "Tecnologia",
          "Moda e Beleza",
          "Finanças",
          "Gastronomia",
          "Direito",
          "Marketing Digital",
        ],
      },
      {
        key: "audience",
        title: "Público Ideal",
        question: "Quem é seu público ideal nas redes sociais?",
        placeholder: "Ex: Mulheres 25-40 que buscam emagrecimento saudável...",
        chips: [
          "Empreendedores",
          "Profissionais liberais",
          "Jovens adultos",
          "Mães",
          "Executivos",
          "Estudantes universitários",
        ],
      },
      {
        key: "differentiator",
        title: "Diferencial",
        question: "Qual é o maior diferencial do seu negócio?",
        placeholder: "Ex: Método exclusivo, atendimento personalizado...",
        chips: [
          "Método próprio",
          "Experiência comprovada",
          "Preço acessível",
          "Atendimento premium",
          "Resultados rápidos",
          "Inovação tecnológica",
        ],
      },
      {
        key: "presence",
        title: "Presença Atual",
        question: "Como você se apresenta nas redes hoje?",
        placeholder: "Ex: Posto conteúdo educativo 3x por semana no Instagram...",
        chips: [
          "Posts esporádicos",
          "Conteúdo diário",
          "Apenas stories",
          "Não tenho presença",
          "Vídeos no Reels/TikTok",
          "Conteúdo educativo",
        ],
      },
    ],
  },
  {
    id: "conteudo",
    title: "Diagnóstico de Conteúdo",
    subtitle: "Analise sua estratégia de conteúdo e descubra oportunidades de crescimento",
    icon: FileText,
    color: "from-accent/80 to-accent",
    questions: [
      {
        key: "content_type",
        title: "Tipo de Conteúdo",
        question: "Que tipo de conteúdo você publica atualmente?",
        placeholder: "Ex: Dicas rápidas, tutoriais, bastidores...",
        chips: [
          "Dicas e tutoriais",
          "Bastidores",
          "Depoimentos",
          "Conteúdo educativo",
          "Entretenimento",
          "Cases de sucesso",
          "Não publico ainda",
        ],
      },
      {
        key: "frequency",
        title: "Frequência",
        question: "Com que frequência você publica conteúdo?",
        placeholder: "Ex: 3 vezes por semana...",
        chips: ["Diariamente", "3-5x por semana", "1-2x por semana", "Quinzenalmente", "Mensalmente", "Irregularmente"],
      },
      {
        key: "formats",
        title: "Formatos",
        question: "Quais formatos de conteúdo você utiliza?",
        placeholder: "Ex: Reels, carrosséis, stories...",
        chips: ["Reels/Shorts", "Carrosséis", "Stories", "Lives", "Posts estáticos", "Podcasts", "Blog/Artigos"],
      },
      {
        key: "challenge",
        title: "Desafio Principal",
        question: "Qual é seu maior desafio com conteúdo nas redes?",
        placeholder: "Ex: Não tenho ideias, falta consistência...",
        chips: [
          "Falta de ideias",
          "Sem tempo",
          "Baixo engajamento",
          "Não converte em vendas",
          "Não sei o que postar",
          "Falta de consistência",
        ],
      },
    ],
  },
  {
    id: "autoridade",
    title: "Diagnóstico de Autoridade",
    subtitle: "Meça seu nível de autoridade digital e descubra como ser referência no seu mercado",
    icon: Award,
    color: "from-ring/80 to-ring",
    questions: [
      {
        key: "time_online",
        title: "Tempo de Presença",
        question: "Há quanto tempo você está ativo nas redes sociais profissionalmente?",
        placeholder: "Ex: Comecei há 2 anos...",
        chips: [
          "Menos de 6 meses",
          "6 meses a 1 ano",
          "1 a 3 anos",
          "3 a 5 anos",
          "Mais de 5 anos",
          "Ainda não comecei",
        ],
      },
      {
        key: "social_proof",
        title: "Prova Social",
        question: "Que tipo de prova social você possui?",
        placeholder: "Ex: Depoimentos de clientes, certificações...",
        chips: [
          "Depoimentos de clientes",
          "Certificações",
          "Mídia/imprensa",
          "Seguidores engajados",
          "Cases publicados",
          "Nenhuma ainda",
        ],
      },
      {
        key: "results",
        title: "Resultados",
        question: "Que resultados você já entregou para clientes ou audiência?",
        placeholder: "Ex: +100 clientes atendidos, R$1M em vendas geradas...",
        chips: [
          "Transformação de clientes",
          "Vendas geradas",
          "Seguidores crescendo",
          "Engajamento alto",
          "Resultados mensuráveis",
          "Ainda estou construindo",
        ],
      },
      {
        key: "education",
        title: "Educação da Audiência",
        question: "Como você educa e entrega valor para sua audiência?",
        placeholder: "Ex: Faço lives semanais, tenho um e-book gratuito...",
        chips: [
          "Lives e webinars",
          "E-books/materiais",
          "Mini-cursos gratuitos",
          "Newsletter",
          "Conteúdo aprofundado",
          "Não educo ainda",
        ],
      },
    ],
  },
];

// ── Types ──

interface DiagnosticResult {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

type Step = "contact" | number | "loading" | "result";

// ── Component ──

export default function DiagnosticQuiz() {
  const { type } = useParams<{ type?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const quiz = QUIZZES.find((q) => q.id === type);

  // Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");

  // Quiz
  const [step, setStep] = useState<Step>("contact");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<DiagnosticResult | null>(null);

  // Reset when type changes
  useEffect(() => {
    setStep("contact");
    setAnswers({});
    setResult(null);
  }, [type]);

  // ── Menu view ──
  if (!type) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-sm">
              <Sparkles className="w-3 h-3 mr-1" /> Diagnóstico Gratuito
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-[Blauer_Nue]">
              Descubra seu nível de
              <br />
              <span className="text-primary">presença digital</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha um dos diagnósticos abaixo e receba uma análise personalizada em menos de 2 minutos.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {QUIZZES.map((q, i) => {
              const Icon = q.icon;
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 border-border/50 group"
                    onClick={() => navigate(`/diagnostico/${q.id}`)}
                  >
                    <CardHeader className="text-center pb-3">
                      <div
                        className={`w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br ${q.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <CardTitle className="text-lg">{q.title}</CardTitle>
                      <CardDescription className="text-sm">{q.subtitle}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Button className="w-full" variant="outline">
                        Iniciar diagnóstico <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Diagnóstico não encontrado.</p>
            <Button onClick={() => navigate("/diagnostico")}>Voltar ao menu</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Helpers ──

  const totalSteps = quiz.questions.length + 1; // contact + questions
  const progressValue =
    step === "contact" ? 0 : step === "loading" || step === "result" ? 100 : ((step as number) / totalSteps) * 100;

  const currentQuestion = typeof step === "number" ? quiz.questions[step] : null;

  const handleChipClick = (chip: string) => {
    if (!currentQuestion) return;
    const current = answers[currentQuestion.key] || "";
    const updated = current ? `${current}, ${chip}` : chip;
    setAnswers({ ...answers, [currentQuestion.key]: updated });
  };

  const canProceed = () => {
    if (step === "contact")
      return (
        name.trim() && email.trim() && whatsapp.trim() && businessName.trim() && city.trim()
      );
    if (typeof step === "number" && currentQuestion) return !!answers[currentQuestion.key]?.trim();
    return false;
  };

  const handleNext = () => {
    if (step === "contact") {
      setStep(0);
    } else if (typeof step === "number") {
      if (step < quiz.questions.length - 1) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (typeof step === "number" && step > 0) setStep(step - 1);
    else if (step === 0) setStep("contact");
  };

  const handleSubmit = async () => {
    setStep("loading");
    try {
      const { data, error } = await supabase.functions.invoke("generate-diagnostic", {
        body: {
          type: quiz.id,
          contact: {
            name: name.trim(),
            email: email.trim(),
            whatsapp: whatsapp.trim(),
            business_name: businessName.trim(),
            city: city.trim(),
          },
          answers,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data as DiagnosticResult);
      setStep("result");
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Erro ao gerar diagnóstico",
        description: e.message || "Tente novamente.",
        variant: "destructive",
      });
      setStep(quiz.questions.length - 1);
    }
  };

  const shareUrl = `${window.location.origin}/diagnostico/${quiz.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copiado!" });
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Fiz o ${quiz.title} e descobri minha nota! Faça o seu também: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleDownloadPdf = () => {
    if (!result) return;
    const html = buildPdfHtml({
      settings: DEFAULT_PDF_SETTINGS,
      documentTitle: `Diagnóstico - ${quiz.title}`,
      coverTitle: quiz.title,
      coverSubtitle: `${businessName.trim()} • ${city.trim()}`,
      coverBadge: "Diagnóstico Gratuito",
      coverMeta: [
        `Lead: ${name.trim()}`,
        `Data: ${new Date().toLocaleDateString("pt-BR")}`,
      ],
      metaGrid: [
        { label: "Nome", value: name.trim() },
        { label: "E-mail", value: email.trim() },
        { label: "WhatsApp", value: whatsapp.trim() },
        { label: "Empresa", value: businessName.trim() },
        { label: "Cidade", value: city.trim() },
        { label: "Nota Geral", value: `${result.score}/10` },
      ],
      sections: [
        { title: "Resumo", content: result.summary },
        { title: "Pontos Fortes", content: result.strengths.map((s) => `• ${s}`).join("\n") },
        { title: "Pontos de Atenção", content: result.weaknesses.map((w) => `• ${w}`).join("\n") },
        { title: "Recomendações", content: result.recommendations.map((r) => `• ${r}`).join("\n") },
      ],
    });
    openPdfWindow(html);
  };

  // ── Render ──

  const Icon = quiz.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/diagnostico")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${quiz.color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">{quiz.title}</h2>
          </div>
        </div>

        {step !== "loading" && step !== "result" && <Progress value={progressValue} className="mb-8 h-2" />}

        <AnimatePresence mode="wait">
          {/* ── Contact Step ── */}
          {step === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Seus dados de contato</CardTitle>
                  <CardDescription>Para enviar seu diagnóstico personalizado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Nome completo *</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">E-mail *</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">WhatsApp *</label>
                    <Input
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <Button className="w-full mt-2" disabled={!canProceed()} onClick={handleNext}>
                    Começar diagnóstico <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Question Steps ── */}
          {typeof step === "number" && currentQuestion && (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
            >
              <Card>
                <CardHeader>
                  <Badge variant="outline" className="w-fit mb-2">
                    Pergunta {step + 1} de {quiz.questions.length}
                  </Badge>
                  <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
                  <CardDescription className="text-base">{currentQuestion.question}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.chips.map((chip) => (
                      <Badge
                        key={chip}
                        variant={answers[currentQuestion.key]?.includes(chip) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/20 transition-colors py-1.5 px-3 text-sm"
                        onClick={() => handleChipClick(chip)}
                      >
                        {chip}
                      </Badge>
                    ))}
                  </div>
                  <Textarea
                    value={answers[currentQuestion.key] || ""}
                    onChange={(e) => setAnswers({ ...answers, [currentQuestion.key]: e.target.value })}
                    placeholder={currentQuestion.placeholder}
                    rows={3}
                  />
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleBack}>
                      <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
                    </Button>
                    <Button className="flex-1" disabled={!canProceed()} onClick={handleNext}>
                      {step < quiz.questions.length - 1 ? "Próxima" : "Gerar diagnóstico"}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── Loading ── */}
          {step === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-foreground">Analisando suas respostas...</p>
              <p className="text-sm text-muted-foreground">Isso leva menos de 30 segundos</p>
            </motion.div>
          )}

          {/* ── Result ── */}
          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Score */}
              <Card className="border-primary/30">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Sua nota geral</p>
                  <div className="text-6xl font-bold text-primary mb-1">
                    {result.score}
                    <span className="text-2xl text-muted-foreground">/10</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-3">{result.summary}</p>
                </CardContent>
              </Card>

              {/* Strengths */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" /> Pontos Fortes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <Star className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Weaknesses */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" /> Pontos de Atenção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" /> {w}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" /> Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {r}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Share */}
              <Card className="border-dashed">
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-foreground mb-3 text-center">Compartilhe com sua rede</p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      <Copy className="w-4 h-4 mr-1" /> Copiar link
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleShareWhatsApp}>
                      <MessageCircle className="w-4 h-4 mr-1" /> WhatsApp
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* CTA sutil */}
              <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Quer aprofundar esse diagnóstico?</p>
                  <p className="text-foreground font-medium mb-4">
                    Fale com um especialista e receba um plano de ação personalizado para suas redes sociais.
                  </p>
                  <Button onClick={() => navigate("/auth")}>
                    Falar com especialista <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <div className="text-center">
                <Button variant="ghost" onClick={() => navigate("/diagnostico")}>
                  Fazer outro diagnóstico
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
