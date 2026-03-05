import { cn } from "@/lib/utils";
import { Users, Brain, Hash, Lightbulb, FileText, Download } from "lucide-react";

const steps = [
  { key: "clients", label: "Clientes", icon: Users },
  { key: "context", label: "Contexto", icon: Brain },
  { key: "projects", label: "Projetos", icon: Hash },
  { key: "ideas", label: "Ideias", icon: Lightbulb },
  { key: "scripts", label: "Roteiros", icon: FileText },
  { key: "export", label: "Exportar", icon: Download },
];

const tabToStep: Record<string, number> = {
  context: 1,
  projects: 2,
  ideas: 3,
  calendar: 4,
};

interface StepIndicatorProps {
  activeTab: string;
}

export function StepIndicator({ activeTab }: StepIndicatorProps) {
  const activeStep = tabToStep[activeTab] ?? 0;

  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto py-4">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = idx <= activeStep;
        const isCurrent = idx === activeStep;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-full border-2 transition-all duration-200",
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : isActive
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors duration-200",
                  isCurrent ? "text-primary" : isActive ? "text-primary/70" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2 mt-[-18px] rounded-full transition-colors duration-200",
                  idx < activeStep ? "bg-primary/40" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
