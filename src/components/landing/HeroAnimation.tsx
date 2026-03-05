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
    <div className="relative w-80 h-80 md:w-[480px] md:h-[480px]" style={{ perspective: "1400px" }}>
      {/* Multiple glow orbs */}
      <div className="absolute -top-10 -left-10 w-60 h-60 rounded-full bg-primary/20 blur-[100px] animate-glow-pulse" />
      <div className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full bg-[hsl(260_80%_65%/0.15)] blur-[80px] animate-glow-pulse" style={{ animationDelay: "1.5s" }} />

      {/* Rotating platform */}
      <div
        className="relative w-full h-full animate-rotate-3d"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Main front panel — dashboard mockup */}
        <div
          className="absolute inset-2 md:inset-4 rounded-2xl border border-primary/20 bg-background/5 backdrop-blur-2xl shadow-[0_0_60px_hsl(var(--primary)/0.25)] animate-border-glow"
          style={{ transform: "translateZ(50px)" }}
        >
          <div className="p-4 md:p-6 space-y-3">
            {/* Window dots */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              <span className="ml-3 text-[10px] text-muted-foreground/50 font-mono">scriptlab.studio</span>
            </div>

            {/* Header bar */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-primary/25" />
              <div className="flex gap-1.5">
                <div className="h-3 w-12 rounded bg-muted/20" />
                <div className="h-3 w-8 rounded bg-primary/30" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="h-14 md:h-16 rounded-lg bg-primary/8 border border-primary/15 p-2">
                <div className="h-2 w-8 rounded bg-primary/30 mb-2" />
                <div className="h-4 w-10 rounded bg-primary/20" />
              </div>
              <div className="h-14 md:h-16 rounded-lg bg-[hsl(260_80%_65%/0.06)] border border-[hsl(260_80%_65%/0.15)] p-2">
                <div className="h-2 w-8 rounded bg-[hsl(260_80%_65%/0.3)] mb-2" />
                <div className="h-4 w-10 rounded bg-[hsl(260_80%_65%/0.2)]" />
              </div>
              <div className="h-14 md:h-16 rounded-lg bg-accent/6 border border-accent/15 p-2">
                <div className="h-2 w-8 rounded bg-accent/30 mb-2" />
                <div className="h-4 w-10 rounded bg-accent/20" />
              </div>
            </div>

            {/* Typing script area */}
            <div className="mt-3 rounded-lg bg-background/10 border border-border/20 p-3">
              <div className="text-[10px] md:text-xs text-primary/60 font-mono mb-2">Roteiro gerado:</div>
              <div className="font-mono text-[10px] md:text-xs text-foreground/60 min-h-[20px]">
                {typedText}
                <span className="inline-block w-[2px] h-3 bg-primary/80 ml-0.5 animate-typing-cursor" />
              </div>
            </div>

            {/* Bottom skeleton lines */}
            <div className="space-y-1.5 mt-2">
              <div className="h-2 w-full rounded bg-muted/10" />
              <div className="h-2 w-4/5 rounded bg-muted/8" />
              <div className="h-2 w-3/5 rounded bg-muted/6" />
            </div>
          </div>
        </div>

        {/* Back floating panel */}
        <div
          className="absolute inset-10 md:inset-14 rounded-2xl border border-border/10 bg-background/3 backdrop-blur-lg"
          style={{ transform: "translateZ(-40px)" }}
        >
          <div className="p-4 space-y-3">
            <div className="h-3 w-16 rounded bg-accent/20" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary/15 flex-shrink-0" />
                  <div className="h-2 flex-1 rounded bg-muted/8" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right floating side panel */}
        <div
          className="absolute top-8 md:top-12 right-0 w-28 md:w-36 h-40 md:h-52 rounded-xl border border-primary/15 bg-primary/3 backdrop-blur-md shadow-[0_0_30px_hsl(var(--primary)/0.1)]"
          style={{ transform: "rotateY(65deg) translateZ(70px)" }}
        >
          <div className="p-3 space-y-2">
            <div className="h-2 w-12 rounded bg-primary/25" />
            <div className="h-8 rounded bg-primary/8 border border-primary/10" />
            <div className="h-8 rounded bg-[hsl(260_80%_65%/0.08)] border border-[hsl(260_80%_65%/0.1)]" />
            <div className="h-2 w-10 rounded bg-muted/10" />
          </div>
        </div>
      </div>

      {/* Floating particles — varied sizes */}
      {[...Array(10)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-float"
          style={{
            width: `${2 + (i % 3) * 2}px`,
            height: `${2 + (i % 3) * 2}px`,
            background: i % 2 === 0 ? "hsl(var(--primary) / 0.5)" : "hsl(260 80% 65% / 0.4)",
            top: `${10 + ((i * 17) % 80)}%`,
            left: `${5 + ((i * 13) % 90)}%`,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${3 + (i % 4)}s`,
          }}
        />
      ))}
    </div>
  );
};

export default HeroAnimation;
