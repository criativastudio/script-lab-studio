import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Eye, Pencil, Download, Trash2, LayoutList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { usePdfSettings } from "@/hooks/usePdfSettings";
import { buildPdfHtml, openPdfWindow } from "@/lib/pdf-builder";

interface Script {
  id: string;
  title: string | null;
  script: string | null;
  created_at: string | null;
  project_id: string | null;
}

interface CarouselsTabProps {
  carousels: Script[];
  onRefresh: () => void;
  toast: any;
}

export function CarouselsTab({ carousels, onRefresh, toast }: CarouselsTabProps) {
  const [viewing, setViewing] = useState<Script | null>(null);
  const [editing, setEditing] = useState<Script | null>(null);
  const [editForm, setEditForm] = useState({ title: "", script: "" });
  const [saving, setSaving] = useState(false);

  const openEdit = (c: Script) => {
    setEditForm({ title: c.title || "", script: c.script || "" });
    setEditing(c);
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("scripts")
      .update({ title: editForm.title, script: editForm.script })
      .eq("id", editing.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Carrossel atualizado" });
      setEditing(null);
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("scripts").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Carrossel excluído" });
      onRefresh();
    }
  };

  const handleDownloadPDF = (c: Script) => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${c.title || "Carrossel"}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 22px; margin-bottom: 8px; }
        .meta { color: #666; font-size: 13px; margin-bottom: 24px; }
        .content { white-space: pre-wrap; line-height: 1.7; font-size: 14px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>${c.title || "Carrossel"}</h1>
      <div class="meta">${c.created_at ? format(new Date(c.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ""}</div>
      <div class="content">${(c.script || "").replace(/</g, "&lt;")}</div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  if (carousels.length === 0) {
    return (
      <Card className="rounded-2xl border-border/50">
        <CardContent className="p-8 text-center">
          <LayoutList className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">Nenhum carrossel gerado para este cliente.</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Gere carrosséis na página de Gerador de Carrossel.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {carousels.map((c) => (
        <Card key={c.id} className="rounded-2xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{c.title || "Sem título"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.created_at ? format(new Date(c.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "—"}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setViewing(c)} title="Visualizar">
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Editar">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(c)} title="Baixar PDF">
                <Download className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" title="Excluir">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir carrossel?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(c.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* View modal */}
      <Dialog open={!!viewing} onOpenChange={(v) => { if (!v) setViewing(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.title || "Carrossel"}</DialogTitle>
          </DialogHeader>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 mt-2">
            {viewing?.script}
          </pre>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editing} onOpenChange={(v) => { if (!v) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Carrossel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground">Título</label>
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Conteúdo</label>
              <Textarea
                value={editForm.script}
                onChange={(e) => setEditForm({ ...editForm, script: e.target.value })}
                className="min-h-[300px] font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
