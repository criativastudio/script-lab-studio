import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles, CheckCircle2, Loader2 } from "lucide-react";

type Phase = "briefing" | "processing" | "script";

const briefingFields = [
  { label: "Contexto do Negócio", value: "Clínica odontológica premium focada em lentes de contato dental e harmonização facial..." },
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

const HeroAnimation = () => {
  const [phase, setPhase] = useState<Phase>("briefing");
  const [typingField, setTypingField] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [visibleScenes, setVisibleScenes] = useState(0);

  // Phase cycling
  useEffect(() => {
    const durations: Record<Phase, number> = {
      briefing: BRIEFING_DURATION,
      processing: PROCESSING_DURATION,
      script: SCRIPT_DURATION,
    };
    const next: Record<Phase, Phase> = {
      briefing: "processing",
      processing: "script",
      script: "briefing",
    };
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
  }, [phase]);

  // Briefing typing effect
  useEffect(() => {
    if (phase !== "briefing") return;
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
  }, [phase, typingField]);

  // Script scenes reveal
  useEffect(() => {
    if (phase !== "script") return;
    setVisibleScenes(0);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setVisibleScenes(count);
      if (count >= scriptScenes.length) clearInterval(interval);
    }, 800);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-foreground/[0.04] to-transparent pointer-events-none z-10 rounded-t-2xl" />

      <div className="p-4 md:p-6 h-full relative">
        {/* Window chrome */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
          <span className="ml-3 text-[10px] text-muted-foreground/50 font-mono">scriptlab.studio</span>
        </div>

        {/* Phase indicator */}
        <div className="flex items-center gap-3 mb-4">
          {(["briefing", "processing", "script"] as Phase[]).map((p, i) => (
            <div key={p} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium transition-colors duration-300 ${
                phase === p ? "bg-primary text-primary-foreground" : i < (["briefing", "processing", "script"].indexOf(phase)) ? "bg-primary/30 text-primary" : "bg-muted/30 text-muted-foreground"
              }`}>
                {i + 1}
              </div>
              <span className={`text-[9px] font-mono transition-colors duration-300 ${phase === p ? "text-foreground" : "text-muted-foreground/50"}`}>
                {p === "briefing" ? "Briefing" : p === "processing" ? "IA" : "Roteiro"}
              </span>
              {i < 2 && <div className="w-6 h-px bg-border/30 mx-1" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* PHASE 1: Briefing */}
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
                <div key={i} className={`rounded-lg border p-2.5 transition-all duration-300 ${
                  i === typingField ? "border-primary/40 bg-primary/5" : i < typingField ? "border-border/30 bg-muted/5" : "border-border/15 bg-transparent"
                }`}>
                  <div className="text-[9px] text-muted-foreground mb-1 font-medium">{field.label}</div>
                  <div className="text-[10px] md:text-[11px] text-foreground/80 font-mono min-h-[14px]">
                    {i < typingField ? (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5 text-green-400 shrink-0" />
                        <span className="truncate">{field.value}</span>
                      </span>
                    ) : i === typingField ? (
                      <>
                        {typedText}
                        <span className="inline-block w-[2px] h-3 bg-primary/80 ml-0.5 animate-typing-cursor" />
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* PHASE 2: Processing */}
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
                <p className="text-[10px] text-muted-foreground">Analisando contexto e criando roteiro personalizado</p>
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

          {/* PHASE 3: Script output */}
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
      </div>
    </div>
  );
};

export default HeroAnimation;
