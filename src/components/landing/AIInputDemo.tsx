import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

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

export default function AIInputDemo() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManual, setIsManual] = useState(false);

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

  return (
    <section className="relative py-28 md:py-36 overflow-hidden">
      {/* Holographic mesh gradient background */}
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

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            Qual nicho você quer{" "}
            <span className="text-gradient-primary">transformar?</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-4 max-w-2xl mx-auto">
            Diga à IA o seu segmento e receba roteiros sob medida.
          </p>
          <p className="text-sm text-muted-foreground mb-12">
            Descreva seu nicho e a IA gera o roteiro ideal.
          </p>
        </motion.div>

        {/* Glassmorphism input */}
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
            <button className="ml-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-200 hover:scale-110 hover:shadow-[0_0_24px_hsl(var(--primary)/0.4)] active:scale-95">
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Suggestion chips */}
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

        {/* Preview hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-6 text-xs text-muted-foreground/60"
        >
          ↓ Veja um exemplo de roteiro gerado abaixo
        </motion.p>
      </div>
      <div className="section-fade-bottom" />
    </section>
  );
}
