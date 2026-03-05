import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain, Target, Megaphone, MessageSquare, Lightbulb, Users,
  Video, Sparkles, PenLine, Send, Edit2, Loader2,
} from "lucide-react";

interface StrategicContext {
  id: string; user_id: string; business_name: string;
  business_niche: string | null; products_services: string | null; target_audience: string | null;
  customer_persona: string | null; tone_of_voice: string | null; market_positioning: string | null;
  pain_points: string | null; differentiators: string | null; marketing_objectives: string | null;
  main_platforms: string[] | null; communication_style: string | null; is_completed: boolean;
  created_at: string; updated_at: string;
}

interface StrategicContextTabProps {
  strategicContext: StrategicContext | null;
  contextLoading: boolean;
  editingContext: boolean;
  setEditingContext: (v: boolean) => void;
  contextForm: Partial<StrategicContext>;
  setContextForm: (v: Partial<StrategicContext>) => void;
  saveStrategicContext: () => void;
  businessName: string;
  firstToken: string;
  toast: (opts: any) => void;
}

function StrategicCard({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-2 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary/60" />
        {title}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}

export function StrategicContextTab({
  strategicContext, contextLoading, editingContext, setEditingContext,
  contextForm, setContextForm, saveStrategicContext, businessName, firstToken, toast,
}: StrategicContextTabProps) {
  if (contextLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!strategicContext && !editingContext) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-8 text-center space-y-4">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
          <div>
            <p className="font-medium text-foreground">Contexto estratégico não preenchido</p>
            <p className="text-sm text-muted-foreground mt-1">O contexto será preenchido automaticamente quando o cliente responder o formulário de briefing, ou você pode preenchê-lo manualmente.</p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => { setContextForm({ business_name: businessName }); setEditingContext(true); }}>
              <PenLine className="h-4 w-4 mr-1.5" />Preencher Manualmente
            </Button>
            <Button variant="outline" onClick={() => {
              const link = `${window.location.origin}/briefing/${firstToken}`;
              navigator.clipboard.writeText(link);
              toast({ title: "Link copiado!" });
            }}>
              <Send className="h-4 w-4 mr-1.5" />Copiar Link do Formulário
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (editingContext) {
    return (
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><Brain className="h-5 w-5 text-primary" />Editar Contexto Estratégico</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nicho do Negócio</Label><Input value={contextForm.business_niche || ""} onChange={e => setContextForm({ ...contextForm, business_niche: e.target.value })} placeholder="Ex: Advocacia empresarial" /></div>
            <div><Label>Produtos/Serviços</Label><Input value={contextForm.products_services || ""} onChange={e => setContextForm({ ...contextForm, products_services: e.target.value })} placeholder="Principais ofertas" /></div>
            <div className="md:col-span-2"><Label>Público-alvo</Label><Textarea value={contextForm.target_audience || ""} onChange={e => setContextForm({ ...contextForm, target_audience: e.target.value })} placeholder="Quem são seus clientes ideais?" rows={2} /></div>
            <div className="md:col-span-2"><Label>Persona do Cliente</Label><Textarea value={contextForm.customer_persona || ""} onChange={e => setContextForm({ ...contextForm, customer_persona: e.target.value })} placeholder="Perfil detalhado do cliente ideal" rows={2} /></div>
            <div><Label>Tom de Voz</Label><Input value={contextForm.tone_of_voice || ""} onChange={e => setContextForm({ ...contextForm, tone_of_voice: e.target.value })} placeholder="Ex: Profissional e acessível" /></div>
            <div><Label>Estilo de Comunicação</Label><Input value={contextForm.communication_style || ""} onChange={e => setContextForm({ ...contextForm, communication_style: e.target.value })} placeholder="Ex: Educativo, autoridade" /></div>
            <div className="md:col-span-2"><Label>Posicionamento de Mercado</Label><Textarea value={contextForm.market_positioning || ""} onChange={e => setContextForm({ ...contextForm, market_positioning: e.target.value })} rows={2} /></div>
            <div className="md:col-span-2"><Label>Dores do Cliente</Label><Textarea value={contextForm.pain_points || ""} onChange={e => setContextForm({ ...contextForm, pain_points: e.target.value })} rows={2} /></div>
            <div className="md:col-span-2"><Label>Diferenciais</Label><Textarea value={contextForm.differentiators || ""} onChange={e => setContextForm({ ...contextForm, differentiators: e.target.value })} rows={2} /></div>
            <div className="md:col-span-2"><Label>Objetivos de Marketing</Label><Textarea value={contextForm.marketing_objectives || ""} onChange={e => setContextForm({ ...contextForm, marketing_objectives: e.target.value })} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEditingContext(false)}>Cancelar</Button>
            <Button onClick={saveStrategicContext}><Brain className="h-4 w-4 mr-1.5" />Salvar Contexto</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (strategicContext) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={strategicContext.is_completed ? "default" : "secondary"}>
              {strategicContext.is_completed ? "Preenchido" : "Pendente"}
            </Badge>
            {strategicContext.updated_at && (
              <span className="text-xs text-muted-foreground">Atualizado: {new Date(strategicContext.updated_at).toLocaleDateString("pt-BR")}</span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => { setContextForm(strategicContext); setEditingContext(true); }}>
            <Edit2 className="h-3.5 w-3.5 mr-1.5" />Editar
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategicContext.business_niche && <StrategicCard icon={Target} title="Nicho" content={strategicContext.business_niche} />}
          {strategicContext.products_services && <StrategicCard icon={Megaphone} title="Produtos/Serviços" content={strategicContext.products_services} />}
          {strategicContext.target_audience && <StrategicCard icon={Users} title="Público-alvo" content={strategicContext.target_audience} />}
          {strategicContext.customer_persona && <StrategicCard icon={Target} title="Persona" content={strategicContext.customer_persona} />}
          {strategicContext.tone_of_voice && <StrategicCard icon={MessageSquare} title="Tom de Voz" content={strategicContext.tone_of_voice} />}
          {strategicContext.market_positioning && <StrategicCard icon={Megaphone} title="Posicionamento" content={strategicContext.market_positioning} />}
          {strategicContext.pain_points && <StrategicCard icon={Target} title="Dores do Cliente" content={strategicContext.pain_points} />}
          {strategicContext.differentiators && <StrategicCard icon={Sparkles} title="Diferenciais" content={strategicContext.differentiators} />}
          {strategicContext.marketing_objectives && <StrategicCard icon={Lightbulb} title="Objetivos de Marketing" content={strategicContext.marketing_objectives} />}
          {strategicContext.communication_style && <StrategicCard icon={MessageSquare} title="Estilo de Comunicação" content={strategicContext.communication_style} />}
          {(strategicContext.main_platforms || []).length > 0 && (
            <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Video className="h-4 w-4 text-primary/60" />Plataformas
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(strategicContext.main_platforms || []).map(p => (
                  <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
