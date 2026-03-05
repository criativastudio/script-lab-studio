import { useEffect, useState } from "react";

export default function CursorGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    const handleLeave = () => setVisible(false);
    window.addEventListener("mousemove", handleMove);
    document.documentElement.addEventListener("mouseleave", handleLeave);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed z-[60] rounded-full mix-blend-screen"
      style={{
        width: 280,
        height: 280,
        left: pos.x - 140,
        top: pos.y - 140,
        background:
          "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, hsl(217 91% 60% / 0.04) 40%, transparent 70%)",
        filter: "blur(30px)",
        willChange: "left, top",
        transition: "left 0.12s ease-out, top 0.12s ease-out",
      }}
    />
  );
}
