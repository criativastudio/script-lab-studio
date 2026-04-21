import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Link as LinkIcon, Copy, Users, FileText, Video,
  Search, X, Filter, Brain, Hash, Lightbulb, Sparkle,
} from "lucide-react";
import { EDITORIAL_LINES, CONTENT_STYLES, VIDEO_QUANTITIES } from "@/lib/editorial-lines";

interface BriefingRequest {
  id: string; business_name: string; contact_name: string | null; contact_email: string | null;
  contact_whatsapp: string | null; project_name: string; video_quantity: number;
  status: string; token: string; created_at: string; persona: string | null;
  positioning: string | null; tone_of_voice: string | null; content_strategy: string | null;
  project_id: string | null; form_answers: any; city: string | null; niche: string | null;
  is_active: boolean;
}

interface ClientGroup {
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  projects: BriefingRequest[];
}

const briefingStatusLabels: Record<string, string> = { pending: "Pendente", submitted: "Enviado", processing: "Processando", completed: "Concluído" };
const briefingStatusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  submitted: "bg-accent text-accent-foreground",
  processing: "bg-primary text-primary-foreground",
  completed: "bg-primary text-primary-foreground",
};

interface ClientListViewProps {
  filteredGroups: ClientGroup[];
  clientGroups: ClientGroup[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterCity: string;
  setFilterCity: (v: string) => void;
  filterNiche: string;
  setFilterNiche: (v: string) => void;
  showInactive: boolean;
  setShowInactive: (v: boolean) => void;
  uniqueCities: string[];
  uniqueNiches: string[];
  hasActiveFilters: boolean;
  isGroupInactive: (g: ClientGroup) => boolean;
  setSelectedBusinessName: (v: string) => void;
  // New client dialog
  briefingOpen: boolean;
  setBriefingOpen: (v: boolean) => void;
  briefingForm: {
    business_name: string; contact_name: string; contact_email: string; contact_whatsapp: string;
    project_name: string; video_quantity: string; city: string; niche: string;
  };
  setBriefingFormState: (v: any) => void;
  generatedLink: string | null;
  setGeneratedLink: (v: string | null) => void;
  handleCreateClient: () => void;
  toast: (opts: any) => void;
  onQuickAction?: (group: ClientGroup, action: "context" | "projects" | "ideas") => void;
  maxVideos?: number;
  onVideoLimitExceeded?: () => void;
}

export function ClientListView({
  filteredGroups, clientGroups, searchTerm, setSearchTerm,
  filterCity, setFilterCity, filterNiche, setFilterNiche,
  showInactive, setShowInactive, uniqueCities, uniqueNiches,
  hasActiveFilters, isGroupInactive, setSelectedBusinessName,
  briefingOpen, setBriefingOpen, briefingForm, setBriefingFormState,
  generatedLink, setGeneratedLink, handleCreateClient, toast, onQuickAction,
  maxVideos, onVideoLimitExceeded,
}: ClientListViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus clientes e produções</p>
        </div>
        <Dialog open={briefingOpen} onOpenChange={(v) => { setBriefingOpen(v); if (!v) setGeneratedLink(null); }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Adicionar Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Cliente</DialogTitle></DialogHeader>
            {generatedLink ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Cliente registrado! Envie o link para o cliente preencher o briefing:</p>
                <div className="flex gap-2">
                  <Input value={generatedLink} readOnly className="flex-1 text-xs" />
                  <Button size="sm" onClick={() => { navigator.clipboard.writeText(generatedLink); toast({ title: "Link copiado!" }); }}><Copy className="h-4 w-4" /></Button>
                </div>
                <Button className="w-full" variant="outline" onClick={() => { setBriefingOpen(false); setGeneratedLink(null); setBriefingFormState({ business_name: "", contact_name: "", contact_email: "", contact_whatsapp: "", project_name: "", video_quantity: "3", city: "", niche: "" }); }}>Fechar</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div><Label>Nome da Empresa *</Label><Input value={briefingForm.business_name} onChange={(e) => setBriefingFormState({ ...briefingForm, business_name: e.target.value })} /></div>
                <div><Label>Nome do Contato</Label><Input value={briefingForm.contact_name} onChange={(e) => setBriefingFormState({ ...briefingForm, contact_name: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Email</Label><Input type="email" value={briefingForm.contact_email} onChange={(e) => setBriefingFormState({ ...briefingForm, contact_email: e.target.value })} /></div>
                  <div><Label>WhatsApp</Label><Input value={briefingForm.contact_whatsapp} onChange={(e) => setBriefingFormState({ ...briefingForm, contact_whatsapp: e.target.value })} /></div>
                </div>
                <div><Label>Nome do Projeto *</Label><Input value={briefingForm.project_name} onChange={(e) => setBriefingFormState({ ...briefingForm, project_name: e.target.value })} /></div>
                <div>
                  <Label>Quantidade de Vídeos</Label>
                  <Select value={briefingForm.video_quantity} onValueChange={(v) => {
                    if (maxVideos && parseInt(v) > maxVideos) {
                      setBriefingFormState({ ...briefingForm, video_quantity: String(maxVideos) });
                      onVideoLimitExceeded?.();
                      return;
                    }
                    setBriefingFormState({ ...briefingForm, video_quantity: v });
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["1","3","5","10","15"].map(v => <SelectItem key={v} value={v}>{v} vídeo{v !== "1" ? "s" : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Cidade</Label><Input value={briefingForm.city} onChange={(e) => setBriefingFormState({ ...briefingForm, city: e.target.value })} placeholder="Ex: São Paulo" /></div>
                  <div><Label>Nicho</Label><Input value={briefingForm.niche} onChange={(e) => setBriefingFormState({ ...briefingForm, niche: e.target.value })} placeholder="Ex: Advocacia" /></div>
                </div>
                <Button className="w-full" onClick={handleCreateClient} disabled={!briefingForm.business_name || !briefingForm.project_name}>
                  <LinkIcon className="h-4 w-4 mr-2" />Registrar e Gerar Link
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        {uniqueCities.length > 0 && (
          <Select value={filterCity} onValueChange={setFilterCity}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Cidade" /></SelectTrigger>
            <SelectContent>{uniqueCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        )}
        {uniqueNiches.length > 0 && (
          <Select value={filterNiche} onValueChange={setFilterNiche}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Nicho" /></SelectTrigger>
            <SelectContent>{uniqueNiches.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
          </Select>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={() => { setSearchTerm(""); setFilterCity(""); setFilterNiche(""); }}><X className="h-4 w-4" /></Button>
        )}
        <div className="flex items-center gap-2">
          <Switch checked={showInactive} onCheckedChange={setShowInactive} id="show-inactive" />
          <Label htmlFor="show-inactive" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">Mostrar inativos</Label>
        </div>
      </div>

      {/* Client Cards Grid */}
      {filteredGroups.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-40" />
            {clientGroups.length === 0 ? (
              <><p className="text-lg font-medium">Nenhum cliente registrado</p><p className="text-sm mt-1">Clique em "Adicionar Novo Cliente" para começar.</p></>
            ) : (
              <><p className="text-lg font-medium">Nenhum resultado encontrado</p><p className="text-sm mt-1">Tente ajustar os filtros.</p></>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGroups.map((group) => {
            const hasProjects = group.projects.length > 0;
            const totalVideos = group.projects.reduce((sum, p) => sum + p.video_quantity, 0);
            const inactive = isGroupInactive(group);
            const niche = group.projects.find(p => p.niche)?.niche;
            const lastScriptDate = group.projects[0]?.created_at;

            return (
              <Card
                key={group.business_name}
                className={`cursor-pointer rounded-2xl border-border/50 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 group ${inactive ? "opacity-60" : ""}`}
                onClick={() => setSelectedBusinessName(group.business_name.trim().toLowerCase())}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 mt-0.5">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {group.business_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-200">{group.business_name}</h3>
                        {inactive && <Badge variant="outline" className="text-[10px] shrink-0">Inativo</Badge>}
                      </div>
                      {group.contact_name && <p className="text-xs text-muted-foreground truncate mt-0.5">{group.contact_name}</p>}

                      {/* Niche badge */}
                      {niche && (
                        <Badge variant="secondary" className="text-[10px] mt-2">{niche}</Badge>
                      )}

                      <div className="flex items-center gap-3 mt-3">
                        {hasProjects ? (
                          <>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Hash className="h-3 w-3 text-primary/60" />{group.projects.length} projeto{group.projects.length !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Video className="h-3 w-3 text-primary/60" />{totalVideos} vídeos
                            </span>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Sem projetos</Badge>
                        )}
                      </div>

                      {hasProjects && lastScriptDate && (
                        <p className="text-[11px] text-muted-foreground mt-2">
                          Último: {new Date(lastScriptDate).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quick actions on hover */}
                  {onQuickAction && (
                    <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={(e) => { e.stopPropagation(); onQuickAction(group, "context"); }}>
                        <Brain className="h-3 w-3 mr-1" />Contexto
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={(e) => { e.stopPropagation(); onQuickAction(group, "projects"); }}>
                        <Hash className="h-3 w-3 mr-1" />Projetos
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={(e) => { e.stopPropagation(); onQuickAction(group, "ideas"); }}>
                        <Lightbulb className="h-3 w-3 mr-1" />Ideias
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
