import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { getPlan, getUpgradePlan, type PlanId } from "@/config/plans";

interface UpgradePromptProps {
  message: string;
  className?: string;
  /** Current plan id (used to determine upgrade target). Defaults to starter. */
  currentPlan?: PlanId | string | null;
  /** Override the upgrade target plan. */
  targetPlan?: PlanId;
}

export function UpgradePrompt({ message, className, currentPlan, targetPlan }: UpgradePromptProps) {
  const navigate = useNavigate();

  const target = targetPlan
    ? getPlan(targetPlan)
    : getUpgradePlan(currentPlan ?? "starter") ?? getPlan("creator_pro");

  return (
    <Alert className={className}>
      <Zap className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <Button
          size="sm"
          onClick={() => navigate(`/checkout/${target.checkoutSlug}`)}
          className="shrink-0"
        >
          Upgrade para {target.name}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
