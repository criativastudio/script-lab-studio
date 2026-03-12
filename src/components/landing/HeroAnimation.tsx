import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  User,
  Target,
  Mic2,
  Filter,
  ClipboardList,
  Clapperboard,
  LayoutGrid,
} from "lucide-react";

// ── Default animation data ──

type Phase = "briefing" | "processing" | "script";
type DemoPhase = "form" | "processing" | "briefing" | "script" | "carousel";

const briefingFields = [
  {
    label: "Contexto do Negócio",
    value: "Clínica odontológica premium focada em lentes de contato dental e harmonização facial...",
  },
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

// ── Demo data ──

interface CarouselSlide {
  label: string;
  text: string;
}

interface DemoStepData {
  persona: string;
  posicionamento: string;
  tomDeVoz: string[];
  funil: string[];
  briefing: { objetivo: string; publico: string; estilo: string };
  roteiro: { gancho: string; desenvolvimento: string; cta: string };
  carrossel: CarouselSlide[];
  formAnswers: { contexto: string; publico: string; resultado: string; voz: string };
}

const defaultDemo: DemoStepData = {
  persona:
    "Empreendedor(a) digital, 25-45 anos, que busca informação, inspiração e soluções práticas nas redes sociais.",
  posicionamento: "Autoridade no nicho que educa e inspira através de conteúdo estratégico.",
  tomDeVoz: ["Educativo", "Inspirador", "Autoridade"],
  funil: ["Topo — Atração", "Meio — Educação", "Fundo — Engajamento"],
  briefing: {
    objetivo: "Criar conteúdo que atraia, eduque e engaje o público do nicho",
    publico: "Pessoas interessadas no nicho, buscam conteúdo útil e inspirador",
    estilo: "Direto, com dados e storytelling",
  },
  roteiro: {
    gancho: "Seu conteúdo não alcança as pessoas certas…",
    desenvolvimento:
      "A maioria cria conteúdo genérico sem estratégia. O resultado? Alcance baixo e zero engajamento. O segredo está em alinhar cada publicação ao funil de conteúdo: atrair com relevância, educar com profundidade e engajar com valor real.",
    cta: "Comece agora: crie conteúdo estratégico para seu nicho.",
  },
  carrossel: [
    { label: "S1 — Hook", text: "Seu conteúdo não engaja? O problema é a estratégia." },
    { label: "S2 — Problema", text: "Conteúdo genérico não atrai o público certo." },
    { label: "S3 — Solução", text: "Alinhe cada post ao funil de conteúdo estratégico." },
    { label: "S4 — Prova", text: "+300% de engajamento com conteúdo alinhado ao funil." },
    { label: "S5 — Método", text: "Topo: atrair. Meio: educar. Fundo: engajar e gerar valor." },
    { label: "S6 — CTA", text: "Crie conteúdo estratégico para o seu nicho →" },
  ],
  formAnswers: {
    contexto: "Criação de conteúdo estratégico para atrair e engajar o público ideal.",
    publico: "Pessoas interessadas no nicho que consomem conteúdo educativo e inspirador.",
    resultado: "Atrair seguidores qualificados e gerar valor com conteúdo estratégico",
    voz: "Educativo, inspirador e com autoridade",
  },
};

const demoDataMap: Record<string, Partial<DemoStepData>> = {
  Advogados: {
    persona: "Homens e mulheres 30-55 anos que buscam orientação jurídica confiável nas redes sociais.",
    posicionamento: "Advogado que educa o público sobre direitos e mostra autoridade no assunto.",
    tomDeVoz: ["Profissional", "Didático", "Confiável"],
    roteiro: {
      gancho: "Você pode estar perdendo dinheiro e nem sabe.",
      desenvolvimento:
        "Muitas pessoas têm direitos que desconhecem. Explicar casos comuns e orientar o público gera autoridade e confiança no advogado.",
      cta: "Compartilhe com alguém que precisa saber disso.",
    },
    carrossel: [
      { label: "S1 — Hook", text: "3 direitos que quase ninguém conhece." },
      { label: "S2 — Problema", text: "Milhares de pessoas deixam de exercer seus direitos." },
      { label: "S3 — Explicação", text: "Entenda quando a lei protege você." },
      { label: "S4 — Exemplo", text: "Casos reais que acontecem todos os dias." },
      { label: "S5 — Orientação", text: "Saiba quando procurar um advogado." },
      { label: "S6 — CTA", text: "Salve para consultar depois." },
    ],
    formAnswers: {
      contexto: "Escritório de advocacia focado em orientar pessoas sobre seus direitos.",
      publico: "Adultos 30-55 que precisam de orientação jurídica.",
      resultado: "Gerar autoridade e atrair novos clientes.",
      voz: "Profissional, didático e confiável",
    },
  },

  Odontologia: {
    persona: "Mulheres e homens 25-45 anos que buscam melhorar o sorriso e autoestima.",
    posicionamento: "Clínica odontológica especialista em estética dental e saúde bucal.",
    tomDeVoz: ["Profissional", "Inspirador", "Acessível"],
    roteiro: {
      gancho: "Você tem vergonha de sorrir nas fotos?",
      desenvolvimento:
        "Problemas como manchas e desalinhamentos são comuns, mas hoje existem soluções rápidas e seguras para transformar o sorriso.",
      cta: "Agende sua avaliação.",
    },
    carrossel: [
      { label: "S1 — Hook", text: "Você esconde o sorriso nas fotos?" },
      { label: "S2 — Problema", text: "Manchas e desalinhamento afetam autoestima." },
      { label: "S3 — Solução", text: "Tratamentos estéticos modernos resolvem isso." },
      { label: "S4 — Resultado", text: "Transformações reais de pacientes." },
      { label: "S5 — Benefício", text: "Mais confiança e autoestima." },
      { label: "S6 — CTA", text: "Agende sua avaliação." },
    ],
    formAnswers: {
      contexto: "Clínica odontológica focada em estética e saúde bucal.",
      publico: "Adultos 25-45 interessados em melhorar o sorriso.",
      resultado: "Gerar consultas e avaliações.",
      voz: "Inspirador e profissional",
    },
  },

  Médicos: {
    persona: "Pacientes 25-60 anos que buscam informação confiável sobre saúde.",
    posicionamento: "Médico que educa o público e constrói autoridade através de conteúdo.",
    tomDeVoz: ["Educativo", "Confiável", "Profissional"],
    roteiro: {
      gancho: "Esse sintoma pode ser mais sério do que parece.",
      desenvolvimento:
        "Muitas pessoas ignoram sinais importantes do corpo. Explicar sintomas e orientar o público gera confiança e autoridade.",
      cta: "Procure avaliação médica se identificar esses sinais.",
    },
    carrossel: [
      { label: "S1 — Hook", text: "Sintomas que você não deve ignorar." },
      { label: "S2 — Alerta", text: "Seu corpo sempre dá sinais." },
      { label: "S3 — Explicação", text: "Entenda o que pode estar acontecendo." },
      { label: "S4 — Prevenção", text: "Diagnóstico precoce faz diferença." },
      { label: "S5 — Orientação", text: "Procure avaliação profissional." },
      { label: "S6 — CTA", text: "Compartilhe essa informação." },
    ],
    formAnswers: {
      contexto: "Conteúdo médico educativo para redes sociais.",
      publico: "Pacientes que buscam informação confiável.",
      resultado: "Construir autoridade e atrair pacientes.",
      voz: "Educativo e confiável",
    },
  },

  "Loja de Carros": {
    persona: "Homens 25-50 interessados em comprar ou trocar de carro.",
    posicionamento: "Loja especializada em carros de qualidade e confiança.",
    tomDeVoz: ["Direto", "Confiante", "Vendedor"],
    roteiro: {
      gancho: "Esse carro custa menos do que você imagina.",
      desenvolvimento: "Mostrar benefícios, diferenciais e condições facilita a decisão do comprador.",
      cta: "Fale conosco e agende um test drive.",
    },
    carrossel: [
      { label: "S1 — Hook", text: "Carro completo por preço surpreendente." },
      { label: "S2 — Destaque", text: "Design, conforto e tecnologia." },
      { label: "S3 — Benefícios", text: "Economia e desempenho." },
      { label: "S4 — Condições", text: "Facilidade no financiamento." },
      { label: "S5 — Confiança", text: "Veículos revisados." },
      { label: "S6 — CTA", text: "Agende um test drive." },
    ],
    formAnswers: {
      contexto: "Loja de veículos seminovos e novos.",
      publico: "Pessoas que desejam comprar ou trocar de carro.",
      resultado: "Gerar visitas na loja.",
      voz: "Confiante e direto",
    },
  },

  Confeitaria: {
    persona: "Mulheres 20-45 que gostam de doces e buscam produtos artesanais.",
    posicionamento: "Confeitaria artesanal especializada em doces premium.",
    tomDeVoz: ["Delicioso", "Acolhedor", "Criativo"],
    roteiro: {
      gancho: "Esse doce está fazendo sucesso na cidade.",
      desenvolvimento: "Mostrar textura, preparo e exclusividade aumenta desejo no público.",
      cta: "Peça agora pelo WhatsApp.",
    },
    carrossel: [
      { label: "S1 — Hook", text: "O doce mais pedido da semana." },
      { label: "S2 — Visual", text: "Feito artesanalmente." },
      { label: "S3 — Ingredientes", text: "Ingredientes selecionados." },
      { label: "S4 — Experiência", text: "Uma explosão de sabor." },
      { label: "S5 — Prova", text: "Clientes apaixonados." },
      { label: "S6 — CTA", text: "Faça seu pedido." },
    ],
    formAnswers: {
      contexto: "Confeitaria artesanal especializada em doces premium.",
      publico: "Pessoas que gostam de doces e sobremesas.",
      resultado: "Aumentar pedidos.",
      voz: "Criativo e acolhedor",
    },
  },

  "Loja de Roupas": {
    persona: "Mulheres 18-40 interessadas em moda e tendências.",
    posicionamento: "Loja que ajuda clientes a se vestir com estilo.",
    tomDeVoz: ["Inspirador", "Moderno", "Estiloso"],
    roteiro: {
      gancho: "Esse look está dominando as tendências.",
      desenvolvimento: "Mostrar combinações e estilo ajuda o cliente a se imaginar usando o produto.",
      cta: "Confira na loja ou no site.",
    },
    carrossel: [
      { label: "S1 — Hook", text: "O look tendência da temporada." },
      { label: "S2 — Estilo", text: "Elegante e moderno." },
      { label: "S3 — Combinação", text: "Perfeito para várias ocasiões." },
      { label: "S4 — Detalhes", text: "Conforto e qualidade." },
      { label: "S5 — Inspiração", text: "Monte seu look." },
      { label: "S6 — CTA", text: "Disponível na loja." },
    ],
    formAnswers: {
      contexto: "Loja de roupas focada em moda e tendências.",
      publico: "Mulheres 18-40 interessadas em estilo.",
      resultado: "Aumentar vendas.",
      voz: "Inspirador e moderno",
    },
  },
};

function getDemoData(chip: string): DemoStepData {
  const override = demoDataMap[chip] || {};
  const base: DemoStepData = {
    ...defaultDemo,
    ...override,
    roteiro: { ...defaultDemo.roteiro, ...override.roteiro },
    briefing: { ...defaultDemo.briefing, ...override.briefing },
    carrossel: override.carrossel || defaultDemo.carrossel,
    formAnswers: override.formAnswers || defaultDemo.formAnswers,
  };
  if (!demoDataMap[chip]) {
    base.persona = `Público de ${chip} que busca informação, inspiração e soluções práticas nas redes sociais.`;
    base.posicionamento = `Autoridade em ${chip} que educa e inspira através de conteúdo estratégico.`;
    base.briefing = {
      objetivo: `Criar conteúdo que atraia, eduque e engaje o público de ${chip}`,
      publico: `Público interessado em ${chip}, busca conteúdo útil e inspirador`,
      estilo: "Direto, com dados e storytelling",
    };
    base.roteiro = {
      gancho: `Seu conteúdo sobre ${chip} não alcança as pessoas certas…`,
      desenvolvimento: `A maioria cria conteúdo genérico sobre ${chip} sem estratégia. O resultado? Alcance baixo e zero engajamento. O segredo está em alinhar cada publicação ao funil de conteúdo: atrair com relevância, educar com profundidade e engajar com valor real.`,
      cta: `Comece agora: crie conteúdo estratégico para ${chip}.`,
    };
    base.carrossel = [
      { label: "S1 — Hook", text: `Seu conteúdo sobre ${chip} não engaja?` },
      { label: "S2 — Problema", text: `Conteúdo genérico sobre ${chip} não atrai o público certo.` },
      { label: "S3 — Solução", text: `Alinhe cada post de ${chip} ao funil de conteúdo.` },
      { label: "S4 — Prova", text: `+300% de engajamento com conteúdo estratégico de ${chip}.` },
      { label: "S5 — Método", text: "Topo: atrair. Meio: educar. Fundo: engajar e gerar valor." },
      { label: "S6 — CTA", text: `Crie conteúdo estratégico para ${chip} →` },
    ];
    base.formAnswers = {
      contexto: `${chip} — criação de conteúdo estratégico para atrair e engajar o público ideal.`,
      publico: `Pessoas interessadas em ${chip} que consomem conteúdo educativo e inspirador.`,
      resultado: `Atrair seguidores qualificados e gerar valor com conteúdo estratégico`,
      voz: "Educativo, inspirador e com autoridade",
    };
  }
  return base;
}

const DEMO_PHASES: DemoPhase[] = ["form", "processing", "briefing", "script", "carousel"];

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

  // Demo states
  const [demoPhase, setDemoPhase] = useState<DemoPhase>("form");
  const [formFieldIdx, setFormFieldIdx] = useState(0);
  const [formTypedText, setFormTypedText] = useState("");
  const [completedFormFields, setCompletedFormFields] = useState<number[]>([]);
  const [visibleBriefingItems, setVisibleBriefingItems] = useState(0);
  const [visibleScriptItems, setVisibleScriptItems] = useState(0);
  const [visibleCarouselItems, setVisibleCarouselItems] = useState(0);

  const isDemo = !!selectedChip;
  const demo = isDemo ? getDemoData(selectedChip) : null;

  // Reset demo on chip change
  useEffect(() => {
    if (isDemo) {
      setDemoPhase("form");
      setFormFieldIdx(0);
      setFormTypedText("");
      setCompletedFormFields([]);
      setVisibleBriefingItems(0);
      setVisibleScriptItems(0);
      setVisibleCarouselItems(0);
    }
  }, [selectedChip, isDemo]);

  const formFields = demo
    ? [
        { label: "Contexto do Negócio", value: demo.formAnswers.contexto },
        { label: "Público Ideal", value: demo.formAnswers.publico },
        { label: "Resultado Desejado", value: demo.formAnswers.resultado },
        { label: "Voz da Marca", value: demo.formAnswers.voz },
      ]
    : [];

  // Demo: form typing
  useEffect(() => {
    if (!isDemo || demoPhase !== "form") return;
    if (formFieldIdx >= formFields.length) {
      const t = setTimeout(() => setDemoPhase("processing"), 600);
      return () => clearTimeout(t);
    }
    const field = formFields[formFieldIdx];
    let charIdx = 0;
    setFormTypedText("");
    const interval = setInterval(() => {
      if (charIdx <= field.value.length) {
        setFormTypedText(field.value.slice(0, charIdx));
        charIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setCompletedFormFields((prev) => [...prev, formFieldIdx]);
          setFormFieldIdx((prev) => prev + 1);
          setFormTypedText("");
        }, 300);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [isDemo, demoPhase, formFieldIdx]);

  // Demo: phase auto-transitions
  useEffect(() => {
    if (!isDemo || demoPhase === "form") return;
    const durations: Partial<Record<DemoPhase, number>> = { processing: 2000, briefing: 3500, script: 3500 };
    const nextMap: Partial<Record<DemoPhase, DemoPhase>> = {
      processing: "briefing",
      briefing: "script",
      script: "carousel",
    };
    const duration = durations[demoPhase];
    const next = nextMap[demoPhase];
    if (duration && next) {
      const t = setTimeout(() => setDemoPhase(next), duration);
      return () => clearTimeout(t);
    }
  }, [isDemo, demoPhase]);

  // Demo: briefing reveal
  useEffect(() => {
    if (!isDemo || demoPhase !== "briefing") return;
    setVisibleBriefingItems(0);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleBriefingItems(count);
      if (count >= 4) clearInterval(interval);
    }, 600);
    return () => clearInterval(interval);
  }, [isDemo, demoPhase]);

  // Demo: script reveal
  useEffect(() => {
    if (!isDemo || demoPhase !== "script") return;
    setVisibleScriptItems(0);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleScriptItems(count);
      if (count >= 3) clearInterval(interval);
    }, 800);
    return () => clearInterval(interval);
  }, [isDemo, demoPhase]);

  // Demo: carousel reveal
  useEffect(() => {
    if (!isDemo || demoPhase !== "carousel") return;
    setVisibleCarouselItems(0);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleCarouselItems(count);
      if (count >= 6) clearInterval(interval);
    }, 400);
    return () => clearInterval(interval);
  }, [isDemo, demoPhase]);

  // Default: phase cycling
  useEffect(() => {
    if (isDemo) return;
    const durations: Record<Phase, number> = {
      briefing: BRIEFING_DURATION,
      processing: PROCESSING_DURATION,
      script: SCRIPT_DURATION,
    };
    const next: Record<Phase, Phase> = { briefing: "processing", processing: "script", script: "briefing" };
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

  // Default: briefing typing
  useEffect(() => {
    if (isDemo || phase !== "briefing") return;
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

  // Default: script reveal
  useEffect(() => {
    if (isDemo || phase !== "script") return;
    setVisibleScenes(0);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleScenes(count);
      if (count >= scriptScenes.length) clearInterval(interval);
    }, 800);
    return () => clearInterval(interval);
  }, [phase, isDemo]);

  return (
    <div className="w-full h-full relative overflow-hidden select-none" onCopy={(e) => e.preventDefault()}>
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
            <motion.div
              key="demo-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="overflow-y-auto max-h-[calc(100%-3rem)] pr-1 scrollbar-thin"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={onReset}
                  className="flex h-5 w-5 items-center justify-center rounded bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <ArrowLeft className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="text-[12px] font-medium text-foreground truncate">{selectedChip}</span>
              </div>

              {/* Progress stepper */}
              <div className="flex items-center gap-1 mb-3">
                {DEMO_PHASES.map((p, i) => {
                  const currentIdx = DEMO_PHASES.indexOf(demoPhase);
                  const isActive = i === currentIdx;
                  const isDone = i < currentIdx;
                  return (
                    <div key={p} className="flex items-center gap-1">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold transition-all duration-300 ${
                          isActive
                            ? "bg-primary text-primary-foreground scale-110"
                            : isDone
                              ? "bg-primary/30 text-primary"
                              : "bg-muted/20 text-muted-foreground/50"
                        }`}
                      >
                        {isDone ? "✓" : i + 1}
                      </div>
                      {i < DEMO_PHASES.length - 1 && (
                        <div
                          className={`w-3 md:w-5 h-px transition-colors duration-300 ${isDone ? "bg-primary/40" : "bg-border/20"}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {/* PHASE 1: Form */}
                {demoPhase === "form" && (
                  <motion.div
                    key="demo-form"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <ClipboardList className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[13px] font-medium text-foreground">
                        Preenchendo formulário estratégico...
                      </span>
                    </div>
                    {formFields.map((field, i) => {
                      const isCompleted = completedFormFields.includes(i);
                      const isTyping = i === formFieldIdx;
                      return (
                        <div
                          key={i}
                          className={`rounded-lg border p-2 transition-all duration-300 ${
                            isTyping
                              ? "border-primary/40 bg-primary/5"
                              : isCompleted
                                ? "border-border/30 bg-muted/5"
                                : "border-border/15 bg-transparent"
                          }`}
                        >
                          <div className="text-[13px] text-muted-foreground mb-0.5 font-medium">{field.label}</div>
                          <div className="text-[14px] text-foreground/80 font-mono min-h-[16px]">
                            {isCompleted ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-green-400 shrink-0" />
                                <span className="truncate">{field.value}</span>
                              </span>
                            ) : isTyping ? (
                              <>
                                {formTypedText}
                                <span className="inline-block w-[2px] h-3 bg-primary/80 ml-0.5 animate-pulse" />
                              </>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                )}

                {/* PHASE 2: Processing */}
                {demoPhase === "processing" && (
                  <motion.div
                    key="demo-processing"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-10 gap-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader2 className="w-8 h-8 text-primary" />
                    </motion.div>
                    <div className="text-center space-y-1.5">
                      <p className="text-sm font-medium text-foreground">Gerando estratégia completa...</p>
                      <p className="text-[10px] text-muted-foreground">
                        Analisando contexto, criando briefing, roteiro e carrossel
                      </p>
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

                {/* PHASE 3: Briefing */}
                {demoPhase === "briefing" && (
                  <motion.div
                    key="demo-briefing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-medium text-foreground">Briefing Estratégico</span>
                      <span className="ml-auto text-[8px] text-green-400 font-mono">✓ Gerado</span>
                    </div>
                    {[
                      { icon: User, title: "Persona", content: demo.persona },
                      { icon: Target, title: "Posicionamento", content: demo.posicionamento },
                      { icon: Mic2, title: "Tom de Voz", badges: demo.tomDeVoz },
                      { icon: Filter, title: "Funil de Conteúdo", badges: demo.funil },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={i < visibleBriefingItems ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-lg border border-border/25 bg-muted/5 p-2 space-y-1"
                      >
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-4 w-4 items-center justify-center rounded bg-primary/10">
                            <item.icon className="h-2.5 w-2.5 text-primary" />
                          </div>
                          <span className="text-[11px] font-medium text-foreground">{item.title}</span>
                        </div>
                        {item.content && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{item.content}</p>
                        )}
                        {item.badges && (
                          <div className="flex flex-wrap gap-1">
                            {item.badges.map((b) => (
                              <span
                                key={b}
                                className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[7px] text-primary font-medium"
                              >
                                {b}
                              </span>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* PHASE 4: Script */}
                {demoPhase === "script" && (
                  <motion.div
                    key="demo-script"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clapperboard className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-medium text-foreground">Roteiro Gerado</span>
                      <span className="ml-auto text-[9px] text-green-400 font-mono">Score: 9.2</span>
                    </div>
                    {[
                      { tag: "Gancho", text: demo.roteiro.gancho, accent: true },
                      { tag: "Desenvolvimento", text: demo.roteiro.desenvolvimento, accent: false },
                      { tag: "CTA", text: demo.roteiro.cta, accent: true },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={i < visibleScriptItems ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                        className={`rounded-lg border p-2 ${item.accent ? "border-primary/25 bg-primary/5" : "border-border/20 bg-muted/10"}`}
                      >
                        <span className="text-[10px] font-bold text-primary uppercase">{item.tag}</span>
                        <p className="mt-0.5 text-[9px] text-foreground/80 leading-relaxed">{item.text}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* PHASE 5: Carousel */}
                {demoPhase === "carousel" && (
                  <motion.div
                    key="demo-carousel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] font-medium text-foreground">Carrossel Estratégico</span>
                      <span className="ml-auto text-[8px] text-primary font-mono bg-primary/10 rounded px-1.5 py-0.5">
                        6 slides
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {demo.carrossel.map((slide, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={i < visibleCarouselItems ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3 }}
                          className={`rounded border p-1.5 ${i === 0 || i === 5 ? "border-primary/25 bg-primary/5" : "border-border/20 bg-muted/10"}`}
                        >
                          <span className="text-[9px] font-bold text-primary block mb-0.5">{slide.label}</span>
                          <p className="text-[10px] text-foreground/70 leading-tight">{slide.text}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* ── DEFAULT MODE ── */
            <>
              <div className="flex items-center gap-3 mb-4">
                {(["briefing", "processing", "script"] as Phase[]).map((p, i) => (
                  <div key={p} className="flex items-center gap-1.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium transition-colors duration-300 ${
                        phase === p
                          ? "bg-primary text-primary-foreground"
                          : i < ["briefing", "processing", "script"].indexOf(phase)
                            ? "bg-primary/30 text-primary"
                            : "bg-muted/30 text-muted-foreground"
                      }`}
                    >
                      {i + 1}
                    </div>
                    <span
                      className={`text-[9px] font-mono transition-colors duration-300 ${phase === p ? "text-foreground" : "text-muted-foreground/50"}`}
                    >
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
                      <div
                        key={i}
                        className={`rounded-lg border p-2.5 transition-all duration-300 ${
                          i === typingField
                            ? "border-primary/40 bg-primary/5"
                            : i < typingField
                              ? "border-border/30 bg-muted/5"
                              : "border-border/15 bg-transparent"
                        }`}
                      >
                        <div className="text-[13px] text-muted-foreground mb-1 font-medium">{field.label}</div>
                        <div className="text-[14px] md:text-[11px] text-foreground/80 font-mono min-h-[14px]">
                          {i < typingField ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-green-400 shrink-0" />
                              <span className="truncate">{field.value}</span>
                            </span>
                          ) : i === typingField ? (
                            <>
                              {typedText}
                              <span className="inline-block w-[2px] h-3 bg-primary/80 ml-0.5 animate-pulse" />
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
                      <p className="text-[10px] text-muted-foreground">
                        Analisando contexto e criando roteiro personalizado
                      </p>
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
