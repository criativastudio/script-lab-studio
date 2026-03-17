import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Pencil } from "lucide-react";

interface ChangePlanDialogProps {
  userId: string;
  email: string | null;
  currentPlan: string;
  onPlanChanged: () => void;
}

const PLAN_OPTIONS = [
  { value: "starter", label: "Starter" },
  { value: "creator_pro", label: "Creator Pro" },
  { value: "scale_studio", label: "Scale Studio" },
];

export const ChangePlanDialog = ({ userId, email, currentPlan, onPlanChanged }: ChangePlanDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(currentPlan);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (selectedPlan === currentPlan) {
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const { error: userError } = await supabase
        .from("users")
        .update({ plano_ativo: selectedPlan, status_assinatura: "active" })
        .eq("id", userId);
      if (userError) throw userError;

      await supabase
        .from("subscriptions")
        .update({ status: "inactive" })
        .eq("user_id", userId)
        .eq("status", "active");

      const { error: subError } = await supabase
        .from("subscriptions")
        .insert({ user_id: userId, plan: selectedPlan, status: "active" });
      if (subError) throw subError;

      toast({ title: "Plano alterado", description: `${email || userId} → ${selectedPlan}` });
      setOpen(false);
      onPlanChanged();
    } catch (err: any) {
      toast({ title: "Erro ao alterar plano", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) setSelectedPlan(currentPlan); }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Alterar Plano</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{email || userId}</p>
        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLAN_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Salvando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
