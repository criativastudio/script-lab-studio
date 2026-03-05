import { useEffect, useState } from "react";

const scriptLines = [
  "Cena 1 — Gancho inicial...",
  "Cena 2 — Apresentar problema...",
  "Cena 3 — Desenvolvimento...",
  "Cena 4 — Prova de autoridade...",
  "Cena 5 — Call to Action...",
];

const HeroAnimation = () => {
  const [typedIndex, setTypedIndex] = useState(0);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    const line = scriptLines[typedIndex];
    let charIdx = 0;
    setTypedText("");
    const interval = setInterval(() => {
      if (charIdx <= line.length) {
        setTypedText(line.slice(0, charIdx));
        charIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setTypedIndex((prev) => (prev + 1) % scriptLines.length);
        }, 1200);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [typedIndex]);

  return (
    <div className="w-full h-full relative">
      {/* Glass reflection overlay */}
      <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none z-10 rounded-t-2xl" />

      <div className="p-4 md:p-6 space-y-3 h-full relative">
        {/* Window dots */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          <span className="ml-3 text-[10px] text-muted-foreground/50 font-mono">scriptlab.studio</span>
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded bg-primary/30" />
          <div className="flex gap-1.5">
            <div className="h-3 w-12 rounded bg-muted/25" />
            <div className="h-3 w-8 rounded bg-primary/35" />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="h-14 md:h-16 rounded-lg bg-primary/8 border border-primary/15 p-2">
            <div className="h-2 w-8 rounded bg-primary/35 mb-2" />
            <div className="h-4 w-10 rounded bg-primary/25" />
          </div>
          <div className="h-14 md:h-16 rounded-lg bg-[hsl(260_80%_65%/0.06)] border border-[hsl(260_80%_65%/0.15)] p-2">
            <div className="h-2 w-8 rounded bg-[hsl(260_80%_65%/0.35)] mb-2" />
            <div className="h-4 w-10 rounded bg-[hsl(260_80%_65%/0.25)]" />
          </div>
          <div className="h-14 md:h-16 rounded-lg bg-accent/6 border border-accent/15 p-2">
            <div className="h-2 w-8 rounded bg-accent/35 mb-2" />
            <div className="h-4 w-10 rounded bg-accent/25" />
          </div>
        </div>

        {/* Typing script area */}
        <div className="mt-3 rounded-lg bg-background/10 border border-border/20 p-3">
          <div className="text-[10px] md:text-xs text-primary/70 font-mono mb-2">Roteiro gerado:</div>
          <div className="font-mono text-[10px] md:text-xs text-foreground/70 min-h-[20px]">
            {typedText}
            <span className="inline-block w-[2px] h-3 bg-primary/80 ml-0.5 animate-typing-cursor" />
          </div>
        </div>

        {/* Bottom skeleton lines */}
        <div className="space-y-1.5 mt-2">
          <div className="h-2 w-full rounded bg-muted/12" />
          <div className="h-2 w-4/5 rounded bg-muted/10" />
          <div className="h-2 w-3/5 rounded bg-muted/8" />
        </div>

        {/* Extra content rows for larger card */}
        <div className="hidden md:block space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 rounded-lg bg-primary/5 border border-primary/10 p-3">
              <div className="h-2 w-16 rounded bg-primary/25 mb-2" />
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded bg-muted/10" />
                <div className="h-2 w-3/4 rounded bg-muted/8" />
              </div>
            </div>
            <div className="h-20 rounded-lg bg-[hsl(260_80%_65%/0.04)] border border-[hsl(260_80%_65%/0.1)] p-3">
              <div className="h-2 w-16 rounded bg-[hsl(260_80%_65%/0.25)] mb-2" />
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded bg-muted/10" />
                <div className="h-2 w-2/3 rounded bg-muted/8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroAnimation;
