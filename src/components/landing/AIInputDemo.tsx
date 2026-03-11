import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

const placeholderExamples = [
  "Meu nicho é odontologia",
  "Meu nicho é advocacia",
  "Meu nicho é confeitaria",
  "Meu nicho é loja de carros",
  "Meu nicho é médico dermatologista",
  "Meu nicho é imobiliária",
  "Meu nicho é personal trainer",
  "Meu nicho é marketing digital",
];

const chips = [
  "Reels para Instagram",
  "Vídeos para YouTube",
  "TikTok virais",
  "Ads para Meta",
  "Conteúdo educacional",
  "Storytelling de marca",
];

interface AIInputDemoProps {
  onChipSelected?: (chip: string) => void;
}

export default function AIInputDemo({ onChipSelected }: AIInputDemoProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animatedText, setAnimatedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Animated placeholder cycling (only when input is empty and not focused)
  const showAnimation = !isFocused && inputValue === "";

  useEffect(() => {
    if (!showAnimation) return;

    const word = placeholderExamples[currentIndex];

    if (!isDeleting && animatedText === word) {
      const timeout = setTimeout(() => setIsDeleting(true), 1800);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && animatedText === "") {
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % placeholderExamples.length);
      return;
    }

    const speed = isDeleting ? 30 : 60;
    const timeout = setTimeout(() => {
      setAnimatedText(
        isDeleting
          ? word.substring(0, animatedText.length - 1)
          : word.substring(0, animatedText.length + 1)
      );
    }, speed);

    return () => clearTimeout(timeout);
  }, [animatedText, isDeleting, currentIndex, showAnimation]);

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    onChipSelected?.(inputValue.trim());
  };

  const handleChipClick = (chip: string) => {
    setInputValue(chip);
    onChipSelected?.(chip);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

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
        <div className="text-center">
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
              <div className="flex-1 relative">
                {showAnimation && (
                  <div className="absolute inset-0 flex items-center pointer-events-none">
                    <span className="text-muted-foreground/60">{animatedText}</span>
                    <span className="inline-block w-0.5 h-5 bg-primary ml-0.5 animate-typing-cursor" />
                  </div>
                )}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent text-foreground outline-none text-sm md:text-base placeholder:text-transparent"
                  placeholder="Digite seu nicho..."
                />
              </div>
              <button
                onClick={handleSubmit}
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
        </div>
      </div>
      <div className="section-fade-bottom" />
    </section>
  );
}
