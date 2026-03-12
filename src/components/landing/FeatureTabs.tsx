import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, BarChart3, BrainCircuit, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "builder",
    icon: Code2,
    title: "Gerador No-Code",
    desc: "Crie roteiros completos sem escrever uma linha sequer.",
    content: {
      headline: "Arraste, configure, publique.",
      body: "Monte roteiros profissionais em segundos com uma interface visual. Defina persona, tom de voz e estrutura — sem complicação.",
      metrics: ["5x mais rápido", "Zero código", "Templates prontos"],
    },
  },
  {
    id: "data",
    icon: BarChart3,
    title: "Dados em Tempo Real",
    desc: "Saiba quais roteiros geram mais resultado.",
    content: {
      headline: "Decisões baseadas em dados.",
      body: "Descubra quais conteúdos performam melhor e otimize sua estratégia de forma contínua e automatizada.",
      metrics: ["Analytics integrado", "Insights de IA", "Relatórios automáticos"],
    },
  },
  {
    id: "ai",
    icon: BrainCircuit,
    title: "IA Multimodal",
    desc: "Gere ganchos virais e CTAs que convertem.",
    content: {
      headline: "IA que entende vídeo.",
      body: "Receba ganchos, storytelling e CTAs otimizados por modelos treinados para maximizar engajamento em vídeo.",
      metrics: ["GPT-4 integrado", "Análise de tendências", "Ganchos virais"],
    },
  },
  {
    id: "automation",
    icon: Zap,
    title: "Automação",
    desc: "Produza dezenas de roteiros de uma vez.",
    content: {
      headline: "Escale sua produção.",
      body: "Gere roteiros em lote, organize por campanha e mantenha um calendário editorial consistente sem esforço.",
      metrics: ["Geração em lote", "Calendário editorial", "Workflows"],
    },
  },
  {
    id: "security",
    icon: ShieldCheck,
    title: "Segurança",
    desc: "Seus roteiros e estratégias 100% privados.",
    content: {
      headline: "Seus dados, sua propriedade.",
      body: "Criptografia em repouso e trânsito. Ninguém além de você tem acesso aos seus conteúdos e estratégias.",
      metrics: ["Criptografia E2E", "LGPD compliant", "Backup automático"],
    },
  },
];

export default function FeatureTabs() {
  const [active, setActive] = useState(0);
  const current = features[active];

  return (
    <section className="relative py-16 md:py-24 px-4">
      <div className="section-fade-top" />
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-2xl md:text-4xl font-light tracking-tight mb-6">
            Tudo em <span className="text-gradient-primary">uma plataforma</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg font-light max-w-2xl mx-auto">
            Ferramentas profissionais para criadores que levam conteúdo a sério.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 lg:gap-10">
          {/* Left: Tabs */}
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 lg:sticky lg:top-24 lg:self-start scrollbar-none">
            {features.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setActive(i)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-all duration-200 whitespace-nowrap lg:whitespace-normal min-w-[180px] lg:min-w-0",
                  active === i
                    ? "bg-primary/10 border border-primary/30 border-l-[3px] border-l-primary text-foreground shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
                    : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-card/50",
                )}
              >
                <f.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", active === i ? "text-primary" : "")} />
                <div>
                  <div className="font-medium">{f.title}</div>
                  <div className="hidden lg:block text-xs text-muted-foreground mt-0.5">{f.desc}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Right: Content panel */}
          <div className="relative min-h-[320px] rounded-2xl glass-surface p-8 md:p-10 overflow-hidden">
            {/* Inner top shine */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-foreground/[0.03] to-transparent rounded-t-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.05)_0%,transparent_60%)]" />
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative z-10"
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <current.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-2xl font-bold">{current.content.headline}</h3>
                </div>
                <p className="text-muted-foreground text-sm font-light mb-8 max-w-lg leading-relaxed">
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
      <div className="section-fade-bottom" />
    </section>
  );
}
