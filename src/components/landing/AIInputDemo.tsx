import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ArrowLeft, User, Target, Mic2, Filter, FileText, Clapperboard, ClipboardList } from "lucide-react";

const industries = [
  "Saúde e Bem-estar",
  "Educação Online",
  "E-commerce de Moda",
  "Mercado Financeiro",
  "Marketing Digital",
  "Gastronomia",
  "Advocacia",
  "Imobiliário",
];

const chips = [
  "Reels para Instagram",
  "Vídeos para YouTube",
  "TikTok virais",
  "Ads para Meta",
  "Conteúdo educacional",
  "Storytelling de marca",
];

interface DemoStepData {
  persona: string;
  posicionamento: string;
  tomDeVoz: string[];
  funil: string[];
  briefing: { objetivo: string; publico: string; estilo: string };
  roteiro: { gancho: string; desenvolvimento: string; cta: string };
}

const defaultDemo: DemoStepData = {
  persona: "Empreendedor(a) digital, 25-45 anos, busca crescimento orgânico e autoridade no nicho.",
  posicionamento: "Referência em conteúdo estratégico que gera resultados reais e mensuráveis.",
  tomDeVoz: ["Educativo", "Próximo", "Autoridade"],
  funil: ["Topo — Awareness", "Meio — Consideração", "Fundo — Conversão"],
  briefing: {
    objetivo: "Gerar leads qualificados via conteúdo orgânico",
    publico: "Empreendedores digitais em fase de crescimento",
    estilo: "Direto, com dados e storytelling",
  },
  roteiro: {
    gancho: "Você está perdendo clientes todos os dias sem saber…",
    desenvolvimento: "A maioria dos empreendedores cria conteúdo sem estratégia. O resultado? Likes, mas zero vendas. O segredo está em alinhar cada vídeo ao funil de conversão.",
    cta: "Comece agora: link na bio para sua análise gratuita.",
  },
};

const demoDataMap: Record<string, Partial<DemoStepData>> = {
  "Reels para Instagram": {
    persona: "Mulher, 28-40, criadora de conteúdo e empreendedora digital que busca engajamento real.",
    posicionamento: "Especialista em Reels que convertem seguidores em clientes.",
    tomDeVoz: ["Dinâmico", "Inspirador", "Próximo"],
    roteiro: {
      gancho: "Para de fazer Reels bonitos que não vendem nada.",
      desenvolvimento: "O algoritmo prioriza retenção. Use ganchos nos primeiros 0,5s, entregue valor no meio e feche com CTA claro. Cada Reel é um mini funil.",
      cta: "Salva esse vídeo e aplica no seu próximo Reel.",
    },
  },
  "TikTok virais": {
    persona: "Jovem criador(a), 20-35, quer viralizar com conteúdo autêntico e monetizar a audiência.",
    posicionamento: "Fábrica de virais com método replicável baseado em dados.",
    tomDeVoz: ["Ousado", "Descontraído", "Provocador"],
    roteiro: {
      gancho: "Esse formato fez 2 milhões de views em 48 horas.",
      desenvolvimento: "TikTok recompensa originalidade e ritmo. O segredo: pattern interrupt nos primeiros 2s, loop visual, e texto que complementa o áudio.",
      cta: "Segue pra mais formatos que viralizam.",
    },
  },
  "Storytelling de marca": {
    persona: "Fundador(a) de marca, 30-50, quer construir conexão emocional com a audiência.",
    posicionamento: "Marca que inspira através de histórias reais e propósito genuíno.",
    tomDeVoz: ["Emocional", "Autêntico", "Inspirador"],
    roteiro: {
      gancho: "Tudo começou com um 'não' que mudou tudo.",
      desenvolvimento: "As marcas que as pessoas amam não vendem produtos — elas contam histórias. Compartilhe a jornada, os erros, as viradas. Vulnerabilidade gera conexão.",
      cta: "Conta nos comentários: qual foi o 'não' que te transformou?",
    },
  },
  "Vídeos para YouTube": {
    persona: "Criador(a) de conteúdo, 25-45, quer construir canal com autoridade e monetização.",
    posicionamento: "Canal referência que educa e entretém com profundidade.",
    tomDeVoz: ["Educativo", "Profundo", "Cativante"],
    roteiro: {
      gancho: "O maior erro dos canais pequenos é esse (e você está cometendo).",
      desenvolvimento: "YouTube é um mecanismo de busca. Títulos com curiosidade, thumbnails com contraste, e os primeiros 30s decidem se o viewer fica. Entregue valor antes de pedir o like.",
      cta: "Se inscreve e ativa o sino pra não perder o próximo vídeo da série.",
    },
  },
  "Ads para Meta": {
    persona: "Gestor(a) de tráfego ou empresário(a), 28-50, quer ROAS positivo e escala previsível.",
    posicionamento: "Performance criativa que transforma investimento em retorno mensurável.",
    tomDeVoz: ["Direto", "Técnico", "Persuasivo"],
    roteiro: {
      gancho: "Seu anúncio não vende? O problema não é o público.",
      desenvolvimento: "80% da performance de um ad está no criativo. Hook visual em 1s, proposta de valor clara, prova social, e urgência real. Teste 5 variações por semana.",
      cta: "Clique no link e receba o template de criativo que mais converte.",
    },
  },
  "Conteúdo educacional": {
    persona: "Professor(a) ou mentor(a), 30-55, quer transformar conhecimento em autoridade digital.",
    posicionamento: "Educador(a) digital que simplifica o complexo e inspira ação.",
    tomDeVoz: ["Didático", "Acessível", "Motivador"],
    roteiro: {
      gancho: "Se você ainda ensina assim, está perdendo alunos.",
      desenvolvimento: "Conteúdo educacional que engaja usa a regra dos 3: conceito, exemplo prático, e aplicação imediata. Ninguém quer teoria pura — mostre o caminho.",
      cta: "Salva pra aplicar na sua próxima aula ou conteúdo.",
    },
  },
};

function getDemoData(chip: string): DemoStepData {
  const override = demoDataMap[chip] || {};
  return { ...defaultDemo, ...override, roteiro: { ...defaultDemo.roteiro, ...override.roteiro }, briefing: { ...defaultDemo.briefing, ...override.briefing } };
}

interface StepCardProps {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay: number;
}

function StepCard({ icon: Icon, title, children, delay }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4 space-y-2"
    >
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">{children}</div>
    </motion.div>
  );
}

export default function AIInputDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [selectedChip, setSelectedChip] = useState("");

  useEffect(() => {
    if (isManual) return;

    const word = industries[currentIndex];

    if (!isDeleting && typed === word) {
      const timeout = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && typed === "") {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % industries.length);
      return;
    }

    const speed = isDeleting ? 30 : 60;
    const timeout = setTimeout(() => {
      setTyped(
        isDeleting
          ? word.substring(0, typed.length - 1)
          : word.substring(0, typed.length + 1)
      );
    }, speed);

    return () => clearTimeout(timeout);
  }, [typed, isDeleting, currentIndex, isManual]);

  const handleChipClick = (chip: string) => {
    setIsManual(true);
    setTyped(chip);
  };

  const handleArrowClick = () => {
    if (!typed.trim()) return;
    setSelectedChip(typed);
    setShowDemo(true);
  };

  const handleBack = () => {
    setShowDemo(false);
    setSelectedChip("");
    setIsManual(false);
    setTyped("");
    setIsDeleting(false);
    setCurrentIndex(0);
  };

  const demo = getDemoData(selectedChip);

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--holo-blue)) 0%, hsl(var(--holo-violet)) 40%, hsl(var(--holo-pink)) 80%, hsl(var(--holo-blue)) 100%)",
          opacity: 0.35,
        }}
      />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="section-fade-top" />

      <div className="relative z-10 mx-auto max-w-3xl px-4">
        <AnimatePresence mode="wait">
          {!showDemo ? (
            <motion.div
              key="input-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="font-display text-2xl md:text-4xl font-light mb-6 tracking-tight">
                  Qual nicho você quer{" "}
                  <span className="text-gradient-primary">transformar?</span>
                </h2>
                <p className="text-muted-foreground text-base md:text-lg font-light mb-4 max-w-2xl mx-auto">
                  Diga à IA o seu segmento e receba roteiros sob medida.
                </p>
                <p className="text-xs font-light text-muted-foreground mb-12">
                  Descreva seu nicho e a IA gera o roteiro ideal.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative mx-auto max-w-xl"
              >
                <div className="relative flex items-center rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-[0_8px_40px_hsl(var(--primary)/0.06),0_2px_12px_rgba(0,0,0,0.08)] px-5 py-4 transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-[0_8px_60px_hsl(var(--primary)/0.12),0_0_0_1px_hsl(var(--primary)/0.15)]">
                  <Sparkles className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <span className="text-foreground">{typed}</span>
                    <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-typing-cursor align-middle" />
                  </div>
                  <button
                    onClick={handleArrowClick}
                    className="ml-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-200 hover:scale-110 hover:shadow-[0_0_24px_hsl(var(--primary)/0.4)] active:scale-95"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-8 flex flex-wrap justify-center gap-2"
              >
                {chips.map((chip) => (
                  <span
                    key={chip}
                    onClick={() => handleChipClick(chip)}
                    className="inline-flex items-center rounded-full border border-border/40 bg-card/40 backdrop-blur-sm px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:scale-105 transition-all duration-200 cursor-pointer"
                  >
                    {chip}
                  </span>
                ))}
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-6 text-xs text-muted-foreground/60"
              >
                ↓ Veja um exemplo de roteiro gerado abaixo
              </motion.p>
            </motion.div>
          ) : (
            <motion.div
              key="demo-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Back button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="text-center mb-8"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary font-medium mb-3">
                  <Sparkles className="h-3.5 w-3.5" />
                  {selectedChip}
                </span>
                <h3 className="font-display text-xl md:text-2xl font-light text-foreground tracking-tight">
                  Veja como a IA gera seu roteiro
                </h3>
              </motion.div>

              {/* Animated step cards */}
              <div className="space-y-3 max-w-xl mx-auto">
                <StepCard icon={ClipboardList} title="Formulário do Cliente" delay={0.2}>
                  <div className="space-y-1.5">
                    <div className="flex gap-2"><span className="text-foreground/70 font-medium">Nicho:</span> {selectedChip}</div>
                    <div className="flex gap-2"><span className="text-foreground/70 font-medium">Público:</span> {demo.briefing.publico}</div>
                    <div className="flex gap-2"><span className="text-foreground/70 font-medium">Objetivo:</span> {demo.briefing.objetivo}</div>
                  </div>
                </StepCard>

                <StepCard icon={User} title="Persona" delay={1.0}>
                  <p>{demo.persona}</p>
                </StepCard>

                <StepCard icon={Target} title="Posicionamento" delay={1.8}>
                  <p>{demo.posicionamento}</p>
                </StepCard>

                <StepCard icon={Mic2} title="Tom de Voz" delay={2.6}>
                  <div className="flex flex-wrap gap-1.5">
                    {demo.tomDeVoz.map((t) => (
                      <span key={t} className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] text-primary font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                </StepCard>

                <StepCard icon={Filter} title="Funil de Conteúdo" delay={3.4}>
                  <div className="flex flex-wrap gap-1.5">
                    {demo.funil.map((f) => (
                      <span key={f} className="inline-flex items-center rounded-full bg-muted/40 border border-border/30 px-2.5 py-0.5 text-[11px] text-foreground/70">
                        {f}
                      </span>
                    ))}
                  </div>
                </StepCard>

                <StepCard icon={FileText} title="Briefing Gerado" delay={4.2}>
                  <div className="space-y-1.5">
                    <div><span className="text-foreground/70 font-medium">Objetivo:</span> {demo.briefing.objetivo}</div>
                    <div><span className="text-foreground/70 font-medium">Público:</span> {demo.briefing.publico}</div>
                    <div><span className="text-foreground/70 font-medium">Estilo:</span> {demo.briefing.estilo}</div>
                  </div>
                </StepCard>

                <StepCard icon={Clapperboard} title="Roteiro Pronto" delay={5.0}>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Gancho</span>
                      <p className="mt-1 text-foreground/80">{demo.roteiro.gancho}</p>
                    </div>
                    <div className="rounded-lg bg-muted/20 border border-border/20 p-2.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Desenvolvimento</span>
                      <p className="mt-1 text-foreground/80">{demo.roteiro.desenvolvimento}</p>
                    </div>
                    <div className="rounded-lg bg-primary/5 border border-primary/15 p-2.5">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wide">CTA</span>
                      <p className="mt-1 text-foreground/80">{demo.roteiro.cta}</p>
                    </div>
                  </div>
                </StepCard>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="section-fade-bottom" />
    </section>
  );
}
