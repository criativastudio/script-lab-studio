import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: {
    regular: string;
    gradient: string;
  };
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  bottomImage?: {
    light: string;
    dark: string;
  };
  gridOptions?: {
    angle?: number;
    cellSize?: number;
    opacity?: number;
    lightLineColor?: string;
    darkLineColor?: string;
  };
  onCtaClick?: () => void;
}

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
}: {
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lightLineColor?: string;
  darkLineColor?: string;
}) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as React.CSSProperties;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden [perspective:200px]"
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div
          className={cn(
            "animate-grid",
            "[background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)]",
            "[height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw]",
            "dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]",
            "[background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)]"
          )}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent to-90%" />
    </div>
  );
};

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      className,
      title = "Build products for everyone",
      subtitle = {
        regular: "Designing your projects faster with ",
        gradient: "the largest figma UI kit.",
      },
      description = "Sed ut perspiciatis unde omnis iste natus voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.",
      ctaText = "Browse courses",
      ctaHref = "#",
      bottomImage,
      gridOptions,
      onCtaClick,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={cn(
          "relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background pt-20",
          className
        )}
        ref={ref}
        {...props}
      >
        <RetroGrid
          angle={gridOptions?.angle ?? 65}
          cellSize={gridOptions?.cellSize ?? 60}
          opacity={gridOptions?.opacity ?? 0.5}
          lightLineColor={gridOptions?.lightLineColor ?? "hsl(var(--border) / 0.3)"}
          darkLineColor={gridOptions?.darkLineColor ?? "hsl(var(--border) / 0.2)"}
        />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full border border-border/40 bg-muted/30 px-3 py-1 text-sm text-muted-foreground backdrop-blur-sm">
            <span>{title}</span>
            <ChevronRight className="ml-1 h-4 w-4" />
          </div>

          {/* Heading */}
          <h1 className="font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            {subtitle.regular}
            <span className="text-gradient-primary">{subtitle.gradient}</span>
          </h1>

          {/* Description */}
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            {description}
          </p>

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={onCtaClick}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_0_30px_hsl(var(--primary)/0.3)] transition-all hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] hover:scale-105"
            >
              <span>{ctaText}</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Bottom image */}
          {bottomImage && (
            <div className="relative mt-10 w-full max-w-4xl">
              <img
                src={bottomImage.light}
                alt="Dashboard preview"
                className="w-full rounded-xl border border-border/20 shadow-2xl dark:hidden"
              />
              <img
                src={bottomImage.dark}
                alt="Dashboard preview"
                className="hidden w-full rounded-xl border border-border/20 shadow-2xl dark:block"
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);
HeroSection.displayName = "HeroSection";

export { HeroSection };
