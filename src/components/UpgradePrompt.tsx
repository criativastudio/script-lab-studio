import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface UpgradePromptProps {
  message: string;
  className?: string;
}

export function UpgradePrompt({ message, className }: UpgradePromptProps) {
  const navigate = useNavigate();

  return (
    <Alert className={className}>
      <Zap className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{message}</span>
        <Button size="sm" onClick={() => navigate("/checkout/creator_pro")} className="shrink-0">
          Upgrade agora
        </Button>
      </AlertDescription>
    </Alert>
  );
}
