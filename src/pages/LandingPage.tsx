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

/* ── scroll-reveal hook ── */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
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
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
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
      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <span className="text-lg font-bold tracking-tight">
            Script<span className="text-primary">Lab</span>
          </span>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
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

            <Button size="sm" className="hidden md:inline-flex" onClick={() => navigate("/auth")}>
              Começar grátis
            </Button>

            {/* Mobile hamburger */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 pb-4 pt-2 space-y-3">
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

      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 pt-20 pb-16 text-center overflow-hidden">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.12)_0%,transparent_70%)]" />

        <Badge variant="secondary" className="relative z-10 text-xs tracking-widest uppercase">
          Plataforma de roteiros com IA
        </Badge>

        <h1 className="relative z-10 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Crie Briefings e Roteiros de Vídeo{" "}
          <span className="text-primary">em Minutos</span>
        </h1>

        <p className="relative z-10 max-w-xl text-base text-muted-foreground md:text-lg">
          Transforme ideias em vídeos estratégicos com briefing inteligente, definição de persona e roteiros prontos para gravação.
        </p>

        <Button size="lg" className="relative z-10 gap-2 text-base" onClick={() => navigate("/auth")}>
          Começar grátis <ArrowRight className="h-4 w-4" />
        </Button>

        <div className="relative z-10 mt-4">
          <HeroAnimation />
        </div>
      </section>

      {/* ── PROBLEMA ── */}
      <Section id="problema" className="py-20 md:py-28 px-4">
        <div className="mx-auto max-w-6xl text-center">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">O problema</Badge>
          <h2 className="text-3xl font-bold md:text-4xl mb-4">Por que seus vídeos não performam?</h2>
          <p className="mx-auto mb-12 max-w-2xl text-muted-foreground">
            A maioria das pessoas grava vídeos sem estratégia, sem roteiro e sem persona definida.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {problems.map((p) => (
              <div
                key={p.title}
                className="group rounded-2xl border border-border/50 bg-card/50 p-6 text-left backdrop-blur-xl transition-all hover:border-primary/30 hover:shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── SOLUÇÃO ── */}
      <Section id="solucao" className="py-20 md:py-28 px-4">
        <div className="mx-auto max-w-5xl text-center">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">A solução</Badge>
          <h2 className="text-3xl font-bold md:text-4xl mb-4">Como funciona</h2>
          <p className="mx-auto mb-14 max-w-2xl text-muted-foreground">
            Em três passos simples, você sai da ideia ao roteiro pronto.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.num} className="relative flex flex-col items-center text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-border" />
                )}
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-lg">
                  {s.num}
                </div>
                <h3 className="mb-2 font-semibold text-lg">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── EXEMPLO DE ROTEIRO ── */}
      <Section className="py-20 md:py-28 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">Exemplo</Badge>
          <h2 className="text-3xl font-bold md:text-4xl mb-4">Roteiro gerado pela plataforma</h2>
          <p className="mx-auto mb-12 max-w-xl text-muted-foreground">
            Veja como um roteiro é estruturado cena a cena.
          </p>
        </div>
        <div className="mx-auto max-w-2xl space-y-0">
          {scenes.map((s, i) => (
            <div key={s.num} className="relative flex gap-4 pb-8">
              {/* Timeline line */}
              {i < scenes.length - 1 && (
                <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
              )}
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {s.num}
              </div>
              <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-xl p-4 flex-1">
                <h4 className="font-semibold mb-1">{s.title}</h4>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── BENEFÍCIOS ── */}
      <Section className="py-20 md:py-28 px-4">
        <div className="mx-auto max-w-6xl text-center">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">Benefícios</Badge>
          <h2 className="text-3xl font-bold md:text-4xl mb-12">Tudo que você precisa para criar conteúdo estratégico</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="flex flex-col items-center text-center p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-semibold">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── PLANOS ── */}
      <Section id="planos" className="py-20 md:py-28 px-4">
        <div className="mx-auto max-w-6xl text-center">
          <Badge variant="outline" className="mb-4 text-xs tracking-widest uppercase">Planos</Badge>
          <h2 className="text-3xl font-bold md:text-4xl mb-4">Escolha o plano ideal</h2>
          <p className="mx-auto mb-14 max-w-xl text-muted-foreground">
            Do criador solo à agência, temos o plano certo.
          </p>
          <div className="grid gap-6 md:grid-cols-3 items-start">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border p-8 text-left transition-all ${
                  p.highlight
                    ? "border-primary bg-primary/5 shadow-[0_0_40px_hsl(var(--primary)/0.15)] scale-[1.02]"
                    : "border-border/50 bg-card/50"
                }`}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Mais popular</Badge>
                )}
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{p.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-extrabold">{p.price}</span>
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
                  className="w-full"
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
      <Section className="py-20 md:py-28 px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary/20 bg-primary/5 p-10 md:p-16 text-center relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.1)_0%,transparent_70%)]" />
          <h2 className="relative z-10 text-3xl font-bold md:text-4xl mb-4">
            Pare de gravar vídeos sem estratégia
          </h2>
          <p className="relative z-10 text-muted-foreground mb-8 max-w-md mx-auto">
            Comece agora e tenha roteiros profissionais prontos para gravação.
          </p>
          <Button size="lg" className="relative z-10 gap-2 text-base" onClick={() => navigate("/auth")}>
            Começar gratuitamente <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 md:flex-row md:justify-between">
          <span className="text-sm font-bold">
            Script<span className="text-primary">Lab</span> Studio
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
