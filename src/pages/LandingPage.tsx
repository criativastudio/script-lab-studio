import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  Sun, Moon, Lightbulb, ThumbsDown, FileX, Target,
  FileText, Users, Mic, Clock, Brain, TrendingUp,
  Award, Layers, Check, ArrowRight, Menu, X,
  Instagram, Twitter, Youtube
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeroAnimation from "@/components/landing/HeroAnimation";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { HeroSection } from "@/components/ui/hero-section-dark";

/* ── scroll-reveal hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <section
      id={id}
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
    >
      {children}
    </section>
  );
}

const problems = [
  { icon: Lightbulb, title: "Falta de ideias", desc: "Fica travado sem saber qual conteúdo criar ou como começar." },
  { icon: ThumbsDown, title: "Vídeos sem engajamento", desc: "Grava vídeos que ninguém assiste porque falta estratégia." },
  { icon: FileX, title: "Sem roteiro definido", desc: "Começa a gravar sem saber o que dizer e perde tempo editando." },
  { icon: Target, title: "Sem posicionamento", desc: "Conteúdos genéricos que não conectam com o público certo." },
];

const steps = [
  { icon: FileText, num: "01", title: "Crie seu briefing", desc: "Defina o escopo do vídeo: objetivo, público e estilo de conteúdo." },
  { icon: Users, num: "02", title: "Defina persona e estratégia", desc: "Público-alvo, persona, tom de voz, posicionamento e funil." },
  { icon: Mic, num: "03", title: "Gere roteiros prontos", desc: "Roteiros estruturados cena a cena, prontos para gravação." },
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
      "25 briefings/mês", "Até 10 roteiros por briefing", "Definição de persona", "Tom de voz",
      "Estratégia de funil", "Ganchos virais", "Templates de roteiro",
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
      "Briefings ilimitados", "Roteiros ilimitados", "Geração em lote",
      "Biblioteca de persona", "Biblioteca de marca", "Calendário de conteúdo",
      "Workspace para equipes", "Organização por campanhas",
    ],
    highlight: false,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Problema", href: "#problema" },
    { label: "Solução", href: "#solucao" },
    { label: "Planos", href: "#planos" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0" />

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <span className="text-lg font-bold tracking-tight">
            Script<span className="text-gradient-primary">Lab</span>
          </span>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
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

            <Button size="sm" className="hidden md:inline-flex gap-1.5" onClick={() => navigate("/auth")}>
              Começar grátis <ArrowRight className="h-3.5 w-3.5" />
            </Button>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-2xl px-4 pb-4 pt-2 space-y-3">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground">
                {l.label}
              </a>
            ))}
            <Button size="sm" className="w-full" onClick={() => navigate("/auth")}>
              Começar grátis
            </Button>
          </div>
        )}
      </nav>

      {/* ── HERO SECTION (NEW) ── */}
      <HeroSection
        title="Plataforma de roteiros com IA"
        subtitle={{
          regular: "Crie briefings e roteiros de vídeo ",
          gradient: "em minutos",
        }}
        description="Transforme ideias em vídeos estratégicos com briefing inteligente, definição de persona e roteiros prontos para gravação."
        ctaText="Começar gratuitamente"
        onCtaClick={() => navigate("/auth")}
        gridOptions={{
          angle: 65,
          opacity: 0.4,
          cellSize: 50,
          lightLineColor: "hsl(280 30% 60% / 0.15)",
          darkLineColor: "hsl(280 30% 60% / 0.1)",
        }}
      />

      {/* ── 3D SCROLL SHOWCASE ── */}
      <section className="relative overflow-hidden">
        {/* Glow orbs */}
        <div className="glow-orb w-[500px] h-[500px] bg-primary/10 -top-20 -left-40" />
        <div className="glow-orb w-[400px] h-[400px] bg-[hsl(330_60%_65%/0.08)] -bottom-20 right-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.06)_0%,transparent_50%)]" />

        <div className="relative z-10" style={{ perspective: "1400px", transformStyle: "preserve-3d" }}>
          <ContainerScroll
            titleComponent={
              <div className="flex flex-col items-center gap-4">
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight">
                  Veja a plataforma <span className="text-gradient-primary">em ação</span>
                </h2>
                <p className="max-w-lg text-base text-muted-foreground">
                  Interface intuitiva para criar roteiros profissionais.
                </p>
              </div>
            }
          >
            <HeroAnimation />
          </ContainerScroll>
        </div>

        {/* Gradient divider */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </section>

      {/* ── PROBLEMA ── */}
      <Section id="problema" className="relative py-24 md:py-32 px-4">
        <div className="glow-orb w-[300px] h-[300px] bg-primary/8 top-0 right-20" />
        <div className="mx-auto max-w-6xl text-center relative z-10">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase shadow-[0_0_10px_hsl(var(--primary)/0.15)]">O problema</Badge>
          <h2 className="text-3xl font-bold md:text-5xl mb-4">
            Por que seus vídeos <span className="text-gradient-primary">não performam?</span>
          </h2>
          <p className="mx-auto mb-14 max-w-2xl text-muted-foreground text-lg">
            A maioria das pessoas grava vídeos sem estratégia, sem roteiro e sem persona definida.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {problems.map((p) => (
              <div key={p.title} className="group/card relative min-h-[14rem] rounded-2xl border border-border/40 bg-card/50 p-2">
                <GlowingEffect spread={40} glow proximity={64} inactiveZone={0.01} borderWidth={2} disabled={false} />
                <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border border-border/30 bg-card p-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                      <p.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{p.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Gradient divider */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </Section>

      {/* ── SOLUÇÃO ── */}
      <Section id="solucao" className="relative py-24 md:py-32 px-4">
        <div className="glow-orb w-[350px] h-[350px] bg-[hsl(260_80%_65%/0.06)] bottom-10 left-10" />
        <div className="mx-auto max-w-5xl text-center relative z-10">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase shadow-[0_0_10px_hsl(var(--primary)/0.15)]">A solução</Badge>
          <h2 className="text-3xl font-bold md:text-5xl mb-4">
            Como <span className="text-gradient-primary">funciona</span>
          </h2>
          <p className="mx-auto mb-16 max-w-2xl text-muted-foreground text-lg">
            Em três passos simples, você sai da ideia ao roteiro pronto.
          </p>
          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Connecting gradient line */}
            <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-[2px] shimmer-border" />
            {steps.map((s) => (
              <div key={s.num} className="relative flex flex-col items-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/8 border border-primary/20 text-primary font-bold text-xl shadow-[0_0_25px_hsl(var(--primary)/0.15)] transition-shadow hover:shadow-[0_0_40px_hsl(var(--primary)/0.25)]">
                  {s.num}
                </div>
                <h3 className="mb-2 font-semibold text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </Section>

      {/* ── EXEMPLO DE ROTEIRO ── */}
      <Section className="relative py-24 md:py-32 px-4">
        <div className="glow-orb w-[250px] h-[250px] bg-primary/6 top-20 right-0" />
        <div className="mx-auto max-w-3xl text-center relative z-10">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase shadow-[0_0_10px_hsl(var(--primary)/0.15)]">Exemplo</Badge>
          <h2 className="text-3xl font-bold md:text-5xl mb-4">
            Roteiro gerado <span className="text-gradient-primary">pela plataforma</span>
          </h2>
          <p className="mx-auto mb-14 max-w-xl text-muted-foreground text-lg">
            Veja como um roteiro é estruturado cena a cena.
          </p>
        </div>
        <div className="mx-auto max-w-2xl space-y-0 relative z-10">
          {scenes.map((s, i) => (
            <div key={s.num} className="relative flex gap-4 pb-8">
              {i < scenes.length - 1 && (
                <div className="absolute left-[18px] top-10 bottom-0 w-px bg-gradient-to-b from-primary/40 to-border/20" />
              )}
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-[0_0_20px_hsl(var(--primary)/0.3)]">
                {s.num}
              </div>
              <div className="glass-card rounded-xl p-4 flex-1 transition-all duration-300 hover:-translate-y-0.5">
                <h4 className="font-semibold mb-1">{s.title}</h4>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </Section>

      {/* ── BENEFÍCIOS ── */}
      <Section className="relative py-24 md:py-32 px-4">
        <div className="glow-orb w-[400px] h-[400px] bg-primary/6 -bottom-20 left-1/2 -translate-x-1/2" />
        <div className="mx-auto max-w-6xl text-center relative z-10">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase shadow-[0_0_10px_hsl(var(--primary)/0.15)]">Benefícios</Badge>
          <h2 className="text-3xl font-bold md:text-5xl mb-14">
            Tudo que você precisa para criar <span className="text-gradient-primary">conteúdo estratégico</span>
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="group flex flex-col items-center text-center p-6 rounded-2xl transition-all duration-300 hover:bg-card/30">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 text-primary ring-1 ring-primary/20 group-hover:ring-primary/40 group-hover:shadow-[0_0_25px_hsl(var(--primary)/0.2)] transition-all">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold text-lg">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      </Section>

      {/* ── PLANOS ── */}
      <Section id="planos" className="relative py-24 md:py-32 px-4">
        <div className="glow-orb w-[350px] h-[350px] bg-primary/8 top-20 left-1/2 -translate-x-1/2" />
        <div className="mx-auto max-w-6xl text-center relative z-10">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase shadow-[0_0_10px_hsl(var(--primary)/0.15)]">Planos</Badge>
          <h2 className="text-3xl font-bold md:text-5xl mb-4">
            Escolha o <span className="text-gradient-primary">plano ideal</span>
          </h2>
          <p className="mx-auto mb-16 max-w-xl text-muted-foreground text-lg">
            Do criador solo à agência, temos o plano certo.
          </p>
          <div className="grid gap-6 md:grid-cols-3 items-start">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl p-8 text-left transition-all duration-300 hover:-translate-y-1 ${
                  p.highlight
                    ? "border border-primary/40 bg-primary/5 shadow-[0_0_50px_hsl(var(--primary)/0.15)] scale-[1.03] animate-border-glow"
                    : "glass-card"
                }`}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">Mais popular</Badge>
                )}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
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
                <Button
                  className={`w-full ${p.highlight ? "shadow-[0_0_20px_hsl(var(--primary)/0.3)]" : ""}`}
                  variant={p.highlight ? "default" : "outline"}
                  onClick={() => navigate("/auth")}
                >
                  {p.price === "Grátis" ? "Começar grátis" : "Assinar agora"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── CTA FINAL ── */}
      <Section className="py-24 md:py-32 px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-primary/5 p-10 md:p-20 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
          <h2 className="relative z-10 text-3xl font-bold md:text-5xl mb-4">
            Pare de gravar vídeos <span className="text-gradient-primary">sem estratégia</span>
          </h2>
          <p className="relative z-10 text-muted-foreground mb-8 max-w-md mx-auto text-lg">
            Comece agora e tenha roteiros profissionais prontos para gravação.
          </p>
          <Button size="lg" className="relative z-10 gap-2 text-base shadow-[0_0_30px_hsl(var(--primary)/0.3)]" onClick={() => navigate("/auth")}>
            Começar gratuitamente <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/30 py-14 px-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between">
          <span className="text-sm font-bold">
            Script<span className="text-gradient-primary">Lab</span> Studio
          </span>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Contato</a>
          </div>
          <div className="flex gap-4 text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors"><Instagram className="h-4 w-4" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Twitter className="h-4 w-4" /></a>
            <a href="#" className="hover:text-foreground transition-colors"><Youtube className="h-4 w-4" /></a>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} ScriptLab Studio. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
