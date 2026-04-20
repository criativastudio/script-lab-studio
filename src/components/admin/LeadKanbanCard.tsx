import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Phone, Mail, Building2, MapPin, Trash2, CheckCircle2, GripVertical } from "lucide-react";

export type PipelineStage = "cold" | "warm" | "hot" | "contacted";

export interface KanbanLead {
  id: string;
  name: string;
  business_name: string;
  city: string;
  email: string;
  phone: string;
  diagnostic_type: string;
  score: number | null;
  created_at: string;
  pipeline_stage: PipelineStage;
}

const TYPE_LABELS: Record<string, string> = {
  posicionamento: "Posicionamento",
  conteudo: "Conteúdo",
  autoridade: "Autoridade",
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months}m`;
  return `há ${Math.floor(months / 12)}a`;
}

function scoreVariant(score: number | null): "default" | "secondary" | "destructive" | "outline" {
  if (score == null) return "outline";
  if (score >= 8) return "default";
  if (score >= 5) return "secondary";
  return "destructive";
}

function digitsOnly(s: string) {
  return (s || "").replace(/\D/g, "");
}

interface Props {
  lead: KanbanLead;
  onView: (lead: KanbanLead) => void;
  onMarkContacted: (lead: KanbanLead) => void;
  onDelete: (lead: KanbanLead) => void;
}

function LeadKanbanCardImpl({ lead, onView, onMarkContacted, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { stage: lead.pipeline_stage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const phone = digitsOnly(lead.phone);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative rounded-lg border bg-card p-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
      onClick={() => onView(lead)}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 -ml-1 p-1 rounded text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted touch-none cursor-grab active:cursor-grabbing"
          aria-label="Arrastar"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm leading-tight truncate">{lead.name}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 -mr-1 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                {lead.pipeline_stage !== "contacted" && (
                  <DropdownMenuItem onClick={() => onMarkContacted(lead)}>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Marcar contatado
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(lead)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
              {TYPE_LABELS[lead.diagnostic_type] || lead.diagnostic_type}
            </Badge>
            {lead.score != null && (
              <Badge variant={scoreVariant(lead.score)} className="text-[10px] px-1.5 py-0 h-4">
                {lead.score}/10
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground ml-auto">{relativeTime(lead.created_at)}</span>
          </div>

          {(lead.business_name || lead.city) && (
            <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
              {lead.business_name && (
                <div className="flex items-center gap-1 truncate">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{lead.business_name}</span>
                </div>
              )}
              {lead.city && (
                <div className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{lead.city}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center gap-1 pt-2 border-t border-border/50">
            {phone && (
              <a
                href={`https://wa.me/55${phone}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                aria-label="WhatsApp"
              >
                <Phone className="w-3 h-3" />
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                aria-label="Email"
              >
                <Mail className="w-3 h-3" />
              </a>
            )}
            <span className="ml-auto text-[10px] text-muted-foreground/70 truncate max-w-[60%]">
              {lead.email || lead.phone}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const LeadKanbanCard = memo(LeadKanbanCardImpl);
