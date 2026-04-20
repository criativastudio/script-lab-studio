import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { LeadKanbanCard, KanbanLead, PipelineStage } from "./LeadKanbanCard";
import { cn } from "@/lib/utils";

export interface ColumnConfig {
  id: PipelineStage;
  label: string;
  /** Tailwind classes for the colored accent (header dot + top border) */
  accent: string;
}

interface Props {
  column: ColumnConfig;
  leads: KanbanLead[];
  onView: (lead: KanbanLead) => void;
  onMarkContacted: (lead: KanbanLead) => void;
  onDelete: (lead: KanbanLead) => void;
}

export function LeadKanbanColumn({ column, leads, onView, onMarkContacted, onDelete }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { stage: column.id } });

  return (
    <div className="flex flex-col min-w-[280px] w-[280px] bg-muted/30 rounded-xl border border-border/50">
      <div className={cn("px-3 py-2.5 border-b border-border/50 border-t-2 rounded-t-xl", column.accent)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", column.accent.replace(/border-\S+/g, "").trim())} />
            <h3 className="text-sm font-semibold">{column.label}</h3>
          </div>
          <Badge variant="secondary" className="h-5 px-1.5 text-[11px] tabular-nums">
            {leads.length}
          </Badge>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-360px)] overflow-y-auto transition-colors rounded-b-xl",
          isOver && "bg-primary/5 ring-1 ring-primary/30 ring-inset",
        )}
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadKanbanCard
              key={lead.id}
              lead={lead}
              onView={onView}
              onMarkContacted={onMarkContacted}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/60 italic">
            Solte leads aqui
          </div>
        )}
      </div>
    </div>
  );
}
