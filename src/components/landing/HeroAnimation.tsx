const HeroAnimation = () => {
  return (
    <div className="relative w-72 h-72 md:w-96 md:h-96" style={{ perspective: "1200px" }}>
      {/* Glow base */}
      <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl animate-glow-pulse" />
      
      {/* Rotating platform */}
      <div
        className="relative w-full h-full animate-rotate-3d"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front panel */}
        <div
          className="absolute inset-4 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
          style={{ transform: "translateZ(40px)" }}
        >
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-3/4 rounded bg-primary/30" />
              <div className="h-3 w-1/2 rounded bg-primary/20" />
              <div className="h-3 w-5/6 rounded bg-primary/15" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="h-16 rounded-lg bg-primary/10 border border-primary/20" />
              <div className="h-16 rounded-lg bg-accent/10 border border-accent/20" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-2 w-full rounded bg-white/10" />
              <div className="h-2 w-2/3 rounded bg-white/10" />
              <div className="h-2 w-4/5 rounded bg-white/10" />
            </div>
          </div>
        </div>

        {/* Back panel */}
        <div
          className="absolute inset-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-lg"
          style={{ transform: "translateZ(-30px)" }}
        >
          <div className="p-4 space-y-3">
            <div className="h-4 w-1/2 rounded bg-accent/20" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex-shrink-0" />
                  <div className="h-2 flex-1 rounded bg-white/8" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side accent */}
        <div
          className="absolute top-12 right-0 w-32 h-48 rounded-xl border border-primary/20 bg-primary/5 backdrop-blur-md"
          style={{ transform: "rotateY(70deg) translateZ(60px)" }}
        />
      </div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/60 animate-float"
          style={{
            top: `${20 + i * 12}%`,
            left: `${10 + i * 15}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + i * 0.5}s`,
          }}
        />
      ))}
    </div>
  );
};

export default HeroAnimation;
