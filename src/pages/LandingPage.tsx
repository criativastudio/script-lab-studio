import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  Lightbulb,
  ThumbsDown,
  FileX,
  Target,
  FileText,
  Users,
  Mic,
  Clock,
  Brain,
  TrendingUp,
  Award,
  Layers,
  Check,
  ArrowRight,
  Menu,
  X,
  Instagram,
  Twitter,
  Youtube,
  ChevronRight,
} from "lucide-react";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeroAnimation from "@/components/landing/HeroAnimation";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import CursorGlow from "@/components/landing/CursorGlow";
import FloatingOrb from "@/components/landing/FloatingOrb";
import AIInputDemo from "@/components/landing/AIInputDemo";
import FeatureTabs from "@/components/landing/FeatureTabs";
import SocialProof from "@/components/landing/SocialProof";

const problems = [
  { icon: Lightbulb, title: "Falta de ideias", desc: "Fica travado sem saber qual conteúdo criar ou como começar." },
  {
    icon: ThumbsDown,
    title: "Vídeos sem engajamento",
    desc: "Grava vídeos que ninguém assiste porque falta estratégia.",
  },
  { icon: FileX, title: "Sem roteiro definido", desc: "Começa a gravar sem saber o que dizer e perde tempo editando." },
  { icon: Target, title: "Sem posicionamento", desc: "Conteúdos genéricos que não conectam com o público certo." },
];

const steps = [
  {
    icon: FileText,
    num: "01",
    title: "Cadastre o cliente e colete os dados",
    desc: "Envie um link e receba automaticamente informações como público, objetivo, funil e posicionamento.",
  },
  {
    icon: Users,
    num: "02",
    title: "Estratégia definida automaticamente",
    desc: "Persona, tom de voz e direção de conteúdo são definidos com base nas respostas.",
  },
  {
    icon: Mic,
    num: "03",
    title: "Receba os roteiros prontos para gravação",
    desc: "Roteiros estratégicos, com gancho, narrativa e CTA — prontos para gravar.",
  },
];

const scenes = [
  { num: 1, title: "Gancho", desc: "Frase que prende atenção nos primeiros segundos." },
  { num: 2, title: "Problema", desc: "Apresentar a dor do público de forma direta." },
  { num: 3, title: "Desenvolvimento", desc: "Explicação ou storytelling que conecta." },
  { num: 4, title: "Autoridade", desc: "Prova social, experiência ou dado relevante." },
  { num: 5, title: "Call to Action", desc: "Orientar a próxima ação de forma clara." },
];

const benefits = [
  { icon: Clock, title: "Economize horas", desc: "Planejamento que levaria dias, feito em minutos." },
  { icon: Brain, title: "Gere ideias", desc: "Sugestões inteligentes de conteúdo baseadas no seu nicho." },
  { icon: TrendingUp, title: "Vídeos que convertem", desc: "Estrutura validada de roteiro para máximo engajamento." },
  { icon: Award, title: "Posicione sua marca", desc: "Tom de voz e persona definidos para comunicação consistente." },
  { icon: Layers, title: "Escale produção", desc: "Crie conteúdo em lote sem perder qualidade estratégica." },
];

const plans = [
  {
    name: "Starter",
    price: "Grátis",
    period: "",
    desc: "Para iniciantes que querem experimentar.",
    features: ["3 briefings/mês", "Até 3 roteiros por briefing", "Briefing básico", "Geração de roteiro simples"],
    highlight: false,
  },
  {
    name: "Creator Pro",
    price: "R$49",
    period: "/mês",
    desc: "Para criadores e pequenas empresas.",
    features: [
      "25 briefings/mês",
      "Até 10 roteiros por briefing",
      "Definição de persona",
      "Tom de voz",
      "Estratégia de funil",
      "Ganchos virais",
      "Templates de roteiro",
      "Suporte para Reels, TikTok, YouTube e Ads",
    ],
    highlight: true,
  },
  {
    name: "Scale Studio",
    price: "R$197",
    period: "/mês",
    desc: "Para agências e produtoras.",
    features: [
      "Briefings ilimitados",
      "Roteiros ilimitados",
      "Geração em lote",
      "Biblioteca de persona",
      "Biblioteca de marca",
      "Calendário de conteúdo",
      "Workspace para equipes",
      "Organização por campanhas",
    ],
    highlight: false,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedChip, setSelectedChip] = useState<string | undefined>();
  const section3Ref = useRef<HTMLDivElement>(null);

  const handleChipSelected = (chip: string) => {
    setSelectedChip(chip);
    setTimeout(() => {
      section3Ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const navLinks = [
    { label: "Problema", href: "#problema" },
    { label: "Solução", href: "#solucao" },
    { label: "Features", href: "#features" },
    { label: "Planos", href: "#planos" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/20 bg-background/60 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <span className="text-lg font-bold tracking-tight">
            Script<span className="text-gradient-primary">Lab</span>
          </span>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Alternar tema"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <RainbowButton
              className="hidden md:inline-flex gap-1.5 h-9 px-4 text-sm rounded-full"
              onClick={() => navigate("/auth")}
            >
              Acessar <ArrowRight className="h-3.5 w-3.5" />
            </RainbowButton>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-2xl px-4 pb-4 pt-2 space-y-3">
            {navLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="block text-sm text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <RainbowButton className="w-full rounded-full h-9 text-sm" onClick={() => navigate("/auth")}>
              Logar
            </RainbowButton>
          </div>
        )}
      </nav>

      {/* ── 1. CINEMATIC HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden pt-16">
        <CursorGlow />
        <FloatingOrb />

        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <span className="inline-flex items-center rounded-full border border-[hsl(var(--hero-blue)/0.3)] bg-[hsl(var(--hero-blue)/0.08)] px-4 py-1.5 text-xs font-medium text-[hsl(var(--hero-blue))]">
              Usado por +10.000 criadores de conteúdo
              <ChevronRight className="ml-1 h-3 w-3" />
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display text-2xl sm:text-4xl md:text-4xl lg:text-6xl font-light leading-[1.05] tracking-tight text-foreground mb-8 max-w-3xl mx-auto"
          >
            Roteiros estratégicos que geram resultado, <span className="text-gradient-primary"> em Segundos</span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-2xl text-sm md:text-base font-light text-muted-foreground mb-12"
          >
            Crie conteudos de forma rápida e pronto para gravação, alinhados ao posicionamento do seu negócio.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-center gap-4"
          >
            <RainbowButton onClick={() => navigate("/auth")}>
              Começar
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </RainbowButton>
            <button
              onClick={() => {
                section3Ref.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-xs font-light text-muted-foreground transition-all duration-300 hover:border-primary/40 hover:text-foreground"
            >
              Ver como funciona
            </button>
          </motion.div>

          {/* Micro-text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xs font-light text-muted-foreground mt-6"
          >
            Cadastro rápido • Setup em 30 segundos
          </motion.p>

          {/* Trust platform icons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex items-center justify-center gap-6 mt-8 text-muted-foreground"
          >
            <Instagram className="h-4 w-4" />
            <Youtube className="h-4 w-4" />
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.525.02c1.31-.02 2.61.01 3.91.02.09 1.46.56 2.95 1.54 4.02.98 1.08 2.34 1.66 3.7 1.93v3.89c-1.28-.07-2.56-.4-3.7-.97-.54-.27-1.04-.59-1.51-.95-.01 2.09.01 4.18-.01 6.27-.11 1.33-.58 2.64-1.37 3.72-.94 1.31-2.31 2.28-3.84 2.73-1.02.3-2.1.4-3.15.27-1.53-.19-2.98-.89-4.09-1.97-1.28-1.22-2.05-2.93-2.15-4.7-.02-.52-.01-1.04.03-1.55.2-1.67 1.02-3.24 2.25-4.35 1.39-1.27 3.28-2.02 5.19-1.95.02 1.42-.01 2.84-.02 4.26-.74-.14-1.55-.05-2.2.36-.52.3-.93.76-1.18 1.29-.17.36-.25.76-.26 1.16.04.98.5 1.93 1.26 2.53.72.59 1.69.87 2.6.75.74-.09 1.44-.46 1.92-1.03.3-.36.52-.79.59-1.25.09-.75.07-1.5.07-2.26V.02h3.32z" />
            </svg>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </motion.div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── 2. AI INTERACTION DEMO ── */}
      <AIInputDemo onChipSelected={handleChipSelected} />

      {/* ── 3. 3D PRODUCT SCROLL ── */}
      <section ref={section3Ref} className="relative overflow-hidden">
        <div className="glow-orb w-[500px] h-[500px] bg-primary/10 -top-20 -left-40" />
        <div className="glow-orb w-[400px] h-[400px] bg-[hsl(var(--hero-pink)/0.08)] -bottom-20 right-0" />

        <div className="relative z-10">
          <ContainerScroll
            titleComponent={
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center gap-4"
              >
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-light leading-[1.1] tracking-tight">
                  Veja a plataforma <span className="text-gradient-primary">em ação</span>
                </h2>
                <p className="max-w-lg text-sm md:text-base font-light text-muted-foreground">
                  Interface intuitiva para criar roteiros profissionais.
                </p>
              </motion.div>
            }
          >
            <HeroAnimation selectedChip={selectedChip} onReset={() => setSelectedChip(undefined)} />
          </ContainerScroll>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── 4. INTERACTIVE FEATURES ── */}
      <div id="features">
        <FeatureTabs />
      </div>

      {/* ── 5. AI WORKFLOW STEPS ── */}
      <section id="solucao" className="relative py-16 md:py-24 px-4">
        <div className="mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">
              A solução
            </Badge>
            <h2 className="font-display text-3xl font-light md:text-4xl mb-6 tracking-tight">
              Como <span className="text-gradient-primary">funciona</span>
            </h2>
            <p className="mx-auto mb-10 max-w-2xl text-muted-foreground text-base md:text-lg font-light leading-relaxed">
              Transforme informações do cliente em conteúdo estratégico em segundos.
            </p>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-3 relative">
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-[2px] shimmer-border" />
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/8 border border-primary/20 text-primary font-bold text-xl shadow-[0_0_25px_hsl(var(--primary)/0.15)] transition-shadow hover:shadow-[0_0_40px_hsl(var(--primary)/0.25)]">
                  {s.num}
                </div>
                <h3 className="mb-2 font-semibold text-lg">{s.title}</h3>
                <p className="text-xs font-light text-muted-foreground max-w-xs">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── 6. PROBLEMA ── */}
      <section id="problema" className="relative py-16 md:py-24 px-4">
        <div className="mx-auto max-w-6xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">
              O problema
            </Badge>
            <h2 className="font-display text-3xl font-light md:text-4xl mb-6 tracking-tight">
              Por que seus vídeos <span className="text-gradient-primary">não performam?</span>
            </h2>
            <p className="mx-auto mb-14 max-w-2xl text-muted-foreground text-base md:text-lg font-light leading-relaxed">
              A maioria das pessoas grava vídeos sem estratégia, sem roteiro e sem persona definida.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {problems.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="group/card relative min-h-[14rem] rounded-2xl border border-border/40 bg-card/50 p-2"
              >
                <GlowingEffect spread={40} glow proximity={64} inactiveZone={0.01} borderWidth={2} disabled={false} />
                <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border border-border/30 bg-card p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <p.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{p.title}</h3>
                      <p className="mt-1 text-xs font-light text-muted-foreground">{p.desc}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── EXEMPLO DE ROTEIRO ── */}
      <section className="relative py-16 md:py-24 px-4">
        <div className="mx-auto max-w-3xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">
              Exemplo
            </Badge>
            <h2 className="font-display text-3xl font-light md:text-4xl mb-6 tracking-tight">
              Roteiro gerado <span className="text-gradient-primary">pela plataforma</span>
            </h2>
            <p className="mx-auto mb-14 max-w-xl text-muted-foreground text-base md:text-lg font-light">
              Veja como um roteiro é estruturado cena a cena.
            </p>
          </motion.div>
        </div>
        <div className="mx-auto max-w-2xl space-y-0 relative z-10">
          {scenes.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative flex gap-4 pb-8"
            >
              {i < scenes.length - 1 && (
                <div className="absolute left-[18px] top-10 bottom-0 w-px bg-gradient-to-b from-primary/40 to-border/20" />
              )}
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                {s.num}
              </div>
              <div className="glass-card rounded-xl p-4 flex-1 transition-all duration-300 hover:-translate-y-0.5">
                <h4 className="font-semibold mb-1">{s.title}</h4>
                <p className="text-xs font-light text-muted-foreground">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── 7. SOCIAL PROOF ── */}
      <SocialProof />

      {/* ── BENEFÍCIOS ── */}
      <section className="relative py-16 md:py-24 px-4">
        <div className="mx-auto max-w-6xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">
              Benefícios
            </Badge>
            <h2 className="font-display text-3xl font-light md:text-4xl mb-14 tracking-tight max-w-xl mx-auto">
              Tudo que você precisa para criar <span className="text-gradient-primary">conteúdo estratégico</span>
            </h2>
          </motion.div>
          <ul className="grid grid-cols-1 grid-rows-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <motion.li
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="min-h-[14rem] list-none"
              >
                <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
                  <GlowingEffect spread={40} glow proximity={64} disabled={false} />
                  <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D] md:p-6">
                    <div className="relative flex flex-1 flex-col justify-between gap-3">
                      <div className="w-fit rounded-lg border border-primary/20 p-2">
                        <b.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{b.title}</h3>
                        <p className="text-xs font-light text-muted-foreground mt-2">{b.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" className="relative py-16 md:py-24 px-4">
        <div className="glow-orb w-[350px] h-[350px] bg-primary/8 top-20 left-1/2 -translate-x-1/2" />
        <div className="mx-auto max-w-6xl text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">
              Planos
            </Badge>
            <h2 className="font-display text-3xl font-light md:text-4xl mb-6 tracking-tight">
              Escolha o <span className="text-gradient-primary">plano ideal</span>
            </h2>
            <p className="mx-auto mb-14 max-w-xl text-muted-foreground text-base md:text-lg font-light">
              Do criador solo à agência, temos o plano certo.
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3 items-start">
            {plans.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className={`relative rounded-2xl p-8 text-left transition-all duration-300 ${
                  p.highlight
                    ? "border border-primary/40 bg-primary/5 shadow-[0_0_50px_hsl(var(--primary)/0.15),inset_0_1px_0_hsl(var(--primary)/0.1)] scale-[1.03]"
                    : "glass-card"
                }`}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
                    Mais popular
                  </Badge>
                )}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <p className="text-xs font-light text-muted-foreground mb-4">{p.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{p.price}</span>
                  <span className="text-muted-foreground text-sm">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <RainbowButton
                  className="w-full rounded-full"
                  onClick={() => {
                    if (p.price === "Grátis") {
                      navigate("/auth");
                    } else if (p.name === "Creator Pro") {
                      navigate("/checkout/creator-pro");
                    } else {
                      navigate("/checkout/scale-studio");
                    }
                  }}
                >
                  {p.price === "Grátis" ? "Começar grátis" : "Assinar agora"}
                </RainbowButton>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {p.price === "Grátis" ? "Sem compromisso" : "Cancele quando quiser"}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. FINAL CTA ── */}
      <section className="py-16 md:py-24 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl rounded-3xl bg-card border border-border p-10 md:p-20 text-center relative overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12)_0%,transparent_70%)]" />
          <h2 className="relative z-10 font-display text-2xl font-light md:text-4xl mb-6 text-foreground tracking-tight max-w-md mx-auto">
            Comece a Criar Roteiros Estratégicos <span className="text-gradient-primary">Hoje</span>
          </h2>
          <p className="relative z-10 text-muted-foreground mb-8 max-w-md mx-auto text-base md:text-lg font-light">
            Roteiros profissionais prontos para gravação em segundos.
          </p>
          <div className="relative z-10 flex flex-col sm:flex-row justify-center gap-3">
            <RainbowButton className="gap-2 text-base rounded-full" onClick={() => navigate("/auth")}>
              Começar grátis 4 <ArrowRight className="h-4 w-4" />
            </RainbowButton>
            <Button
              size="lg"
              variant="outline"
              className="gap-2 text-base rounded-full border-border text-foreground hover:bg-muted"
              onClick={() => {
                document.getElementById("solucao")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Assistir demo
            </Button>
          </div>
          <p className="relative z-10 text-xs text-primary/70 mt-4">Acesso antecipado com vagas limitadas.</p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/30 py-14 px-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between">
          <span className="text-sm font-bold">
            Script<span className="text-gradient-primary">Lab</span> Studio
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Termos
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Privacidade
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Contato
            </a>
          </div>
          <div className="flex gap-4 text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              <Youtube className="h-4 w-4" />
            </a>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ScriptLab Studio. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
