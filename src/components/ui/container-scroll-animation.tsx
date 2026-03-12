import React, { useRef } from "react";
import { useScroll, useTransform, motion, MotionValue } from "framer-motion";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 25%", "center center"],
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {};

  const rotate = useTransform(scrollYProgress, [0, 0.5, 1], [75, 5, -5]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], isMobile ? [0.75, 0.92, 0.85] : [0.9, 1, 0.95]);
  const translate = useTransform(scrollYProgress, [0, 0.5, 1], [80, 0, -80]);

  return (
    <div className="h-[40rem] md:h-[55rem] flex items-center justify-center relative p-2 md:p-20" ref={containerRef}>
      <div
        className="py-10 md:py-40 w-full relative"
        style={{
          perspective: "3000px",
        }}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({
  translate,
  titleComponent,
}: {
  translate: MotionValue<number>;
  titleComponent: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-5xl mx-auto text-center relative z-20"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow: "0 40px 80px rgba(0,0,0,0.25), 0 16px 32px rgba(0,0,0,0.18), 0 4px 8px rgba(0,0,0,0.1)",
      }}
      className="max-w-5xl mt-8 mx-auto h-[30rem] md:h-[40rem] w-full border border-white/[0.08] p-2 md:p-6 bg-background/80 rounded-[30px] transition-shadow duration-700 relative overflow-hidden"
    >
      {/* Glass reflection overlay */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/[0.04] to-transparent rounded-t-[30px] pointer-events-none z-10" />
      <div className="h-full w-full overflow-hidden rounded-2xl bg-background/50 md:rounded-2xl md:p-4 relative">
        {children}
      </div>
    </motion.div>
  );
};
