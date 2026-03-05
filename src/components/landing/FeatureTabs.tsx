import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  BarChart3,
  BrainCircuit,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "builder",
    icon: Code2,
    title: "Gerador No-Code",
    desc: "Crie roteiros completos sem escrever uma única linha de código.",
    content: {
      headline: "Arraste, configure, publique.",
      body: "Interface visual intuitiva para montar roteiros profissionais em minutos. Defina persona, tom de voz e estrutura com cliques.",
      metrics: ["3x mais rápido", "Zero código", "Templates prontos"],
    },
  },
  {
    id: "data",
    icon: BarChart3,
    title: "Dados em Tempo Real",
    desc: "Métricas de performance dos seus conteúdos.",
    content: {
      headline: "Decisões baseadas em dados.",
      body: "Acompanhe quais roteiros geram mais engajamento e otimize sua estratégia de conteúdo continuamente.",
      metrics: ["Analytics integrado", "Insights de IA", "Relatórios automáticos"],
    },
  },
  {
    id: "ai",
    icon: BrainCircuit,
    title: "IA Multimodal",
    desc: "Modelos de IA treinados para conteúdo de vídeo.",
    content: {
      headline: "IA que entende vídeo.",
      body: "Gere ganchos virais, storytelling e CTAs otimizados com modelos treinados especificamente para performance em vídeo.",
      metrics: ["GPT-4 integrado", "Análise de tendências", "Ganchos virais"],
    },
  },
  {
    id: "automation",
    icon: Zap,
    title: "Automação",
    desc: "Geração em lote e calendário de conteúdo.",
    content: {
      headline: "Escale sua produção.",
      body: "Gere dezenas de roteiros de uma vez, organize por campanha e mantenha um calendário editorial consistente.",
      metrics: ["Geração em lote", "Calendário editorial", "Workflows"],
    },
  },
  {
    id: "security",
    icon: ShieldCheck,
    title: "Segurança",
    desc: "Dados protegidos com criptografia de ponta.",
    content: {
      headline: "Seus dados, sua propriedade.",
      body: "Infraestrutura segura com criptografia em repouso e trânsito. Seus roteiros e estratégias são 100% privados.",
      metrics: ["Criptografia E2E", "LGPD compliant", "Backup automático"],
    },
  },
];

export default function FeatureTabs() {
  const [active, setActive] = useState(0);
  const current = features[active];

  return (
    <section className="relative py-24 md:py-32 px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Tudo em <span className="text-gradient-primary">uma plataforma</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Ferramentas profissionais para criadores que levam conteúdo a sério.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-10">
          {/* Left: Tabs - sticky on desktop, horizontal scroll on mobile */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-24 lg:self-start scrollbar-none">
            {features.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setActive(i)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all duration-300 whitespace-nowrap lg:whitespace-normal min-w-[180px] lg:min-w-0",
                  active === i
                    ? "bg-primary/10 border border-primary/30 text-foreground shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
                    : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
              >
                <f.icon
                  className={cn(
                    "h-5 w-5 flex-shrink-0 transition-colors",
                    active === i ? "text-primary" : ""
                  )}
                />
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="hidden lg:block text-xs text-muted-foreground mt-0.5">
                    {f.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Content panel */}
          <div className="relative min-h-[320px] rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-8 md:p-10 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.05)_0%,transparent_60%)]" />
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <current.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold">{current.content.headline}</h3>
                </div>
                <p className="text-muted-foreground text-base mb-8 max-w-lg">
                  {current.content.body}
                </p>
                <div className="flex flex-wrap gap-3">
                  {current.content.metrics.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
