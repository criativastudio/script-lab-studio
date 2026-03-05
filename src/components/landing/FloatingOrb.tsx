import { motion } from "framer-motion";

export default function FloatingOrb() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full opacity-60"
        style={{
          background:
            "radial-gradient(circle at 40% 40%, hsl(var(--hero-blue) / 0.35), hsl(var(--hero-violet) / 0.25) 40%, hsl(var(--hero-pink) / 0.15) 70%, transparent 100%)",
          filter: "blur(80px)",
        }}
        animate={{
          y: [0, -20, 0, 15, 0],
          x: [0, 10, 0, -10, 0],
          scale: [1, 1.04, 1, 0.97, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Secondary smaller orb */}
      <motion.div
        className="absolute top-[30%] right-[15%] w-[200px] h-[200px] md:w-[300px] md:h-[300px] rounded-full opacity-40"
        style={{
          background:
            "radial-gradient(circle, hsl(var(--hero-pink) / 0.4), hsl(var(--hero-violet) / 0.2) 60%, transparent 100%)",
          filter: "blur(60px)",
        }}
        animate={{
          y: [0, 15, 0, -10, 0],
          x: [0, -15, 0, 10, 0],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </div>
  );
}
