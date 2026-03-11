import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, CheckCircle2, Loader2, ArrowLeft, User, Target, Mic2, Filter, ClipboardList, Clapperboard, LayoutGrid } from "lucide-react";

// ── Default animation data ──

type Phase = "briefing" | "processing" | "script";

const briefingFields = [
  { label: "Contexto do Negócio", value: "Clínica odontológica premium focada em lentes de contato dental e harmonização facial..." },
  { label: "Público Ideal", value: "Mulheres 25-45 anos, classe A/B, que buscam autoestima e sorriso perfeito..." },
  { label: "Resultado Desejado", value: "Agendar avaliação gratuita" },
  { label: "Voz da Marca", value: "Especialista e inspiradora" },
];

const scriptScenes = [
  { tag: "Gancho", text: "Você sabia que 80% das pessoas escondem o sorriso nas fotos?" },
  { tag: "Problema", text: "Dentes amarelados e desalinhados afetam a autoestima..." },
  { tag: "Desenvolvimento", text: "Com lentes de contato dental, o resultado é imediato..." },
  { tag: "Autoridade", text: "Mais de 2.000 sorrisos transformados na nossa clínica." },
  { tag: "CTA", text: "Agende sua avaliação gratuita. Link na bio." },
];

const BRIEFING_DURATION = 5000;
const PROCESSING_DURATION = 2500;
const SCRIPT_DURATION = 6000;

// ── Demo data for chip-selected mode ──

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
      desenvolvimento: "O algoritmo prioriza retenção. Use ganchos nos primeiros 0,5s, entregue valor no meio e feche com CTA claro.",
      cta: "Salva esse vídeo e aplica no seu próximo Reel.",
    },
  },
  "TikTok virais": {
    persona: "Jovem criador(a), 20-35, quer viralizar com conteúdo autêntico e monetizar a audiência.",
    posicionamento: "Fábrica de virais com método replicável baseado em dados.",
    tomDeVoz: ["Ousado", "Descontraído", "Provocador"],
    roteiro: {
      gancho: "Esse formato fez 2 milhões de views em 48 horas.",
      desenvolvimento: "TikTok recompensa originalidade e ritmo. Pattern interrupt nos primeiros 2s, loop visual, e texto que complementa o áudio.",
      cta: "Segue pra mais formatos que viralizam.",
    },
  },
  "Storytelling de marca": {
    persona: "Fundador(a) de marca, 30-50, quer construir conexão emocional com a audiência.",
    posicionamento: "Marca que inspira através de histórias reais e propósito genuíno.",
    tomDeVoz: ["Emocional", "Autêntico", "Inspirador"],
    roteiro: {
      gancho: "Tudo começou com um 'não' que mudou tudo.",
      desenvolvimento: "As marcas que as pessoas amam não vendem produtos — elas contam histórias. Vulnerabilidade gera conexão.",
      cta: "Conta nos comentários: qual foi o 'não' que te transformou?",
    },
  },
  "Vídeos para YouTube": {
    persona: "Criador(a) de conteúdo, 25-45, quer construir canal com autoridade e monetização.",
    posicionamento: "Canal referência que educa e entretém com profundidade.",
    tomDeVoz: ["Educativo", "Profundo", "Cativante"],
    roteiro: {
      gancho: "O maior erro dos canais pequenos é esse.",
      desenvolvimento: "YouTube é um mecanismo de busca. Títulos com curiosidade, thumbnails com contraste, e os primeiros 30s decidem tudo.",
      cta: "Se inscreve e ativa o sino pra não perder o próximo vídeo.",
    },
  },
  "Ads para Meta": {
    persona: "Gestor(a) de tráfego, 28-50, quer ROAS positivo e escala previsível.",
    posicionamento: "Performance criativa que transforma investimento em retorno mensurável.",
    tomDeVoz: ["Direto", "Técnico", "Persuasivo"],
    roteiro: {
      gancho: "Seu anúncio não vende? O problema não é o público.",
      desenvolvimento: "80% da performance de um ad está no criativo. Hook visual em 1s, proposta de valor clara, prova social, e urgência real.",
      cta: "Clique no link e receba o template de criativo que mais converte.",
    },
  },
  "Conteúdo educacional": {
    persona: "Professor(a) ou mentor(a), 30-55, quer transformar conhecimento em autoridade digital.",
    posicionamento: "Educador(a) digital que simplifica o complexo e inspira ação.",
    tomDeVoz: ["Didático", "Acessível", "Motivador"],
    roteiro: {
      gancho: "Se você ainda ensina assim, está perdendo alunos.",
      desenvolvimento: "Conteúdo educacional que engaja usa a regra dos 3: conceito, exemplo prático, e aplicação imediata.",
      cta: "Salva pra aplicar na sua próxima aula ou conteúdo.",
    },
  },
};

function getDemoData(chip: string): DemoStepData {
  const override = demoDataMap[chip] || {};
  return {
    ...defaultDemo,
    ...override,
    roteiro: { ...defaultDemo.roteiro, ...override.roteiro },
    briefing: { ...defaultDemo.briefing, ...override.briefing },
  };
}

// ── Step card for demo mode ──

function StepCard({ icon: Icon, title, children, delay }: { icon: React.ElementType; title: string; children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-lg border border-border/25 bg-muted/5 p-2.5 space-y-1.5"
    >
      <div className="flex items-center gap-1.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10">
          <Icon className="h-2.5 w-2.5 text-primary" />
        </div>
        <span className="text-[10px] font-medium text-foreground">{title}</span>
      </div>
      <div className="text-[9px] md:text-[10px] text-muted-foreground leading-relaxed">{children}</div>
    </motion.div>
  );
}

// ── Main component ──

interface HeroAnimationProps {
  selectedChip?: string;
  onReset?: () => void;
}

const HeroAnimation = ({ selectedChip, onReset }: HeroAnimationProps) => {
  const [phase, setPhase] = useState<Phase>("briefing");
  const [typingField, setTypingField] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [visibleScenes, setVisibleScenes] = useState(0);

  const isDemo = !!selectedChip;

  // Phase cycling (only when not in demo mode)
  useEffect(() => {
    if (isDemo) return;
    const durations: Record<Phase, number> = {
      briefing: BRIEFING_DURATION,
      processing: PROCESSING_DURATION,
      script: SCRIPT_DURATION,
    };
    const next: Record<Phase, Phase> = {
      briefing: "processing",
      processing: "script",
      script: "briefing",
    };
    const timer = setTimeout(() => {
      const nextPhase = next[phase];
      setPhase(nextPhase);
      if (nextPhase === "briefing") {
        setTypingField(0);
        setTypedText("");
        setVisibleScenes(0);
      }
    }, durations[phase]);
    return () => clearTimeout(timer);
  }, [phase, isDemo]);

  // Briefing typing effect
  useEffect(() => {
    if (isDemo) return;
    if (phase !== "briefing") return;
    const field = briefingFields[typingField];
    if (!field) return;
    let charIdx = 0;
    setTypedText("");
    const interval = setInterval(() => {
      if (charIdx <= field.value.length) {
        setTypedText(field.value.slice(0, charIdx));
        charIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          if (typingField < briefingFields.length - 1) {
            setTypingField((p) => p + 1);
            setTypedText("");
          }
        }, 400);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [phase, typingField, isDemo]);

  // Script scenes reveal
  useEffect(() => {
    if (isDemo) return;
    if (phase !== "script") return;
    setVisibleScenes(0);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleScenes(count);
      if (count >= scriptScenes.length) clearInterval(interval);
    }, 800);
    return () => clearInterval(interval);
  }, [phase, isDemo]);

  const demo = isDemo ? getDemoData(selectedChip) : null;

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-foreground/[0.04] to-transparent pointer-events-none z-10 rounded-t-2xl" />

      <div className="p-4 md:p-6 h-full relative">
        {/* Window chrome */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          <span className="ml-3 text-[10px] text-muted-foreground/50 font-mono">scriptlab.studio</span>
        </div>

        <AnimatePresence mode="wait">
          {isDemo && demo ? (
            /* ── DEMO MODE: Show selected chip's pipeline ── */
            <motion.div
              key="demo-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-1.5 overflow-y-auto max-h-[calc(100%-3rem)] pr-1 scrollbar-thin"
            >
              {/* Header with back button */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={onReset}
                  className="flex h-5 w-5 items-center justify-center rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <ArrowLeft className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-medium text-foreground truncate">{selectedChip}</span>
                <span className="ml-auto text-[8px] text-primary font-mono bg-primary/10 rounded px-1.5 py-0.5">IA Gerando...</span>
              </div>

              {/* Step cards */}
              <StepCard icon={ClipboardList} title="Formulário do Cliente" delay={0.1}>
                <div className="space-y-0.5">
                  <div><span className="text-foreground/70 font-medium">Nicho:</span> {selectedChip}</div>
                  <div><span className="text-foreground/70 font-medium">Público:</span> {demo.briefing.publico}</div>
                  <div><span className="text-foreground/70 font-medium">Objetivo:</span> {demo.briefing.objetivo}</div>
                </div>
              </StepCard>

              <StepCard icon={User} title="Persona" delay={0.6}>
                <p>{demo.persona}</p>
              </StepCard>

              <StepCard icon={Target} title="Posicionamento" delay={1.1}>
                <p>{demo.posicionamento}</p>
              </StepCard>

              <StepCard icon={Mic2} title="Tom de Voz" delay={1.6}>
                <div className="flex flex-wrap gap-1">
                  {demo.tomDeVoz.map((t) => (
                    <span key={t} className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[8px] text-primary font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </StepCard>

              <StepCard icon={Filter} title="Funil de Conteúdo" delay={2.1}>
                <div className="flex flex-wrap gap-1">
                  {demo.funil.map((f) => (
                    <span key={f} className="inline-flex items-center rounded-full bg-muted/40 border border-border/30 px-1.5 py-0.5 text-[8px] text-foreground/70">
                      {f}
                    </span>
                  ))}
                </div>
              </StepCard>

              <StepCard icon={FileText} title="Briefing Gerado" delay={2.6}>
                <div className="space-y-0.5">
                  <div><span className="text-foreground/70 font-medium">Objetivo:</span> {demo.briefing.objetivo}</div>
                  <div><span className="text-foreground/70 font-medium">Público:</span> {demo.briefing.publico}</div>
                  <div><span className="text-foreground/70 font-medium">Estilo:</span> {demo.briefing.estilo}</div>
                </div>
              </StepCard>

              <StepCard icon={Clapperboard} title="Roteiro Pronto" delay={3.1}>
                <div className="space-y-1">
                  <div className="rounded bg-primary/5 border border-primary/15 p-1.5">
                    <span className="text-[8px] font-bold text-primary uppercase">Gancho</span>
                    <p className="mt-0.5 text-foreground/80">{demo.roteiro.gancho}</p>
                  </div>
                  <div className="rounded bg-muted/20 border border-border/20 p-1.5">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">Desenvolvimento</span>
                    <p className="mt-0.5 text-foreground/80">{demo.roteiro.desenvolvimento}</p>
                  </div>
                  <div className="rounded bg-primary/5 border border-primary/15 p-1.5">
                    <span className="text-[8px] font-bold text-primary uppercase">CTA</span>
                    <p className="mt-0.5 text-foreground/80">{demo.roteiro.cta}</p>
                  </div>
                </div>
              </StepCard>
            </motion.div>
          ) : (
            /* ── DEFAULT MODE: Cycling animation ── */
            <>
              {/* Phase indicator */}
              <div className="flex items-center gap-3 mb-4">
                {(["briefing", "processing", "script"] as Phase[]).map((p, i) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium transition-colors duration-300 ${
                      phase === p ? "bg-primary text-primary-foreground" : i < (["briefing", "processing", "script"].indexOf(phase)) ? "bg-primary/30 text-primary" : "bg-muted/30 text-muted-foreground"
                    }`}>
                      {i + 1}
                    </div>
                    <span className={`text-[9px] font-mono transition-colors duration-300 ${phase === p ? "text-foreground" : "text-muted-foreground/50"}`}>
                      {p === "briefing" ? "Briefing" : p === "processing" ? "IA" : "Roteiro"}
                    </span>
                    {i < 2 && <div className="w-6 h-px bg-border/30 mx-1" />}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {phase === "briefing" && (
                  <motion.div
                    key="briefing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-medium text-foreground">AI Strategic Brief Builder</span>
                    </div>
                    {briefingFields.map((field, i) => (
                      <div key={i} className={`rounded-lg border p-2.5 transition-all duration-300 ${
                        i === typingField ? "border-primary/40 bg-primary/5" : i < typingField ? "border-border/30 bg-muted/5" : "border-border/15 bg-transparent"
                      }`}>
                        <div className="text-[9px] text-muted-foreground mb-1 font-medium">{field.label}</div>
                        <div className="text-[10px] md:text-[11px] text-foreground/80 font-mono min-h-[14px]">
                          {i < typingField ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-green-400 shrink-0" />
                              <span className="truncate">{field.value}</span>
                            </span>
                          ) : i === typingField ? (
                            <>
                              {typedText}
                              <span className="inline-block w-[2px] h-3 bg-primary/80 ml-0.5 animate-typing-cursor" />
                            </>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}

                {phase === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center h-[calc(100%-5rem)] gap-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-8 h-8 text-primary" />
                    </motion.div>
                    <div className="text-center space-y-1.5">
                      <p className="text-sm font-medium text-foreground">Gerando estratégia...</p>
                      <p className="text-[10px] text-muted-foreground">Analisando contexto e criando roteiro personalizado</p>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {phase === "script" && (
                  <motion.div
                    key="script"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-medium text-foreground">Roteiro Gerado</span>
                      <span className="ml-auto text-[9px] text-green-400 font-mono">Score: 9.2</span>
                    </div>
                    {scriptScenes.map((scene, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={i < visibleScenes ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-lg border border-border/25 bg-muted/5 p-2.5"
                      >
                        <div className="flex items-start gap-2">
                          <span className="shrink-0 text-[8px] font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                            {scene.tag}
                          </span>
                          <span className="text-[10px] md:text-[11px] text-foreground/75 leading-relaxed">
                            {scene.text}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HeroAnimation;
