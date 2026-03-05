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
        width: 340,
        height: 340,
        left: pos.x - 170,
        top: pos.y - 170,
        background:
          "radial-gradient(circle, hsl(var(--primary) / 0.12) 0%, hsl(217 91% 60% / 0.06) 40%, transparent 70%)",
        filter: "blur(30px)",
        transition: "left 0.15s ease-out, top 0.15s ease-out",
      }}
    />
  );
}
