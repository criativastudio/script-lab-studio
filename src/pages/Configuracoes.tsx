import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Palette, FormInput, FileText, ChevronRight, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { toast } from "sonner";
import {
  hasFeatureAccess,
  requiredPlanFor,
  requiredPlanLabel,
  type Feature,
} from "@/lib/plan-features";

interface SettingCard {
  title: string;
  description: string;
  icon: typeof Users;
  href: string;
  adminOnly?: boolean;
  feature?: Feature;
}

const Configuracoes = () => {
  const { isAdmin } = useAuth();
  const { plan } = usePlanLimits();
  const navigate = useNavigate();

  const cards: SettingCard[] = [
    {
      title: "Gerenciar Usuários & Planos",
      description: "Cadastre usuários, altere planos e acompanhe assinaturas e uso da plataforma.",
      icon: Users,
      href: "/configuracoes/usuarios",
      adminOnly: true,
    },
    {
      title: "Ajustes da Interface",
      description: "Personalize cores, tipografia, tamanho de texto e densidade visual do app.",
      icon: Palette,
      href: "/configuracoes/interface",
      feature: "interface_settings",
    },
    {
      title: "Personalização de Formulários",
      description: "Ajuste cores, bordas, ícones e aparência dos campos de formulário.",
      icon: FormInput,
      href: "/configuracoes/formularios",
      feature: "form_settings",
    },
    {
      title: "Personalização de PDFs",
      description: "Configure logo, cores, fontes, cabeçalhos e layout dos PDFs exportados.",
      icon: FileText,
      href: "/configuracoes/pdf",
      feature: "pdf_settings",
    },
  ];

  const visible = cards.filter((c) => !c.adminOnly || isAdmin);

  const handleClick = (card: SettingCard) => {
    if (card.feature && !hasFeatureAccess(plan, card.feature, isAdmin)) {
      const required = requiredPlanFor(card.feature);
      toast.info(`Disponível no plano ${requiredPlanLabel(card.feature)}`);
      navigate(`/checkout/${required}`);
      return;
    }
    navigate(card.href);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Configurações</p>
          <h1 className="text-3xl font-semibold tracking-tight">Central de Configurações</h1>
          <p className="text-muted-foreground max-w-2xl">
            Gerencie sua conta, aparência da plataforma e exportações em um só lugar.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((card) => {
            const Icon = card.icon;
            const locked = !!card.feature && !hasFeatureAccess(plan, card.feature, isAdmin);
            const badge = locked && card.feature ? requiredPlanLabel(card.feature) : undefined;

            return (
              <button
                key={card.href}
                type="button"
                onClick={() => handleClick(card)}
                className="group text-left"
              >
                <Card
                  className={`h-full transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer ${
                    locked ? "opacity-80" : ""
                  }`}
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        {badge && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Lock className="h-3 w-3" />
                            {badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-lg leading-tight flex items-center gap-1 group-hover:text-primary transition-colors">
                        {card.title}
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
