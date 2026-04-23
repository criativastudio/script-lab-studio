import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft, Trash2, Download, Power, Users, Mail, Phone,
  Brain, Hash, Lightbulb, Calendar, LayoutList, Pencil,
} from "lucide-react";
import { StepIndicator } from "./StepIndicator";

interface BriefingRequest {
  id: string; business_name: string; contact_name: string | null; contact_email: string | null;
  contact_whatsapp: string | null; project_name: string; video_quantity: number;
  status: string; token: string; created_at: string; is_active: boolean;
  [key: string]: any;
}
interface ClientGroup {
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  projects: BriefingRequest[];
}

interface ClientDetailViewProps {
  selectedGroup: ClientGroup;
  activeTab: string;
  setActiveTab: (v: string) => void;
  onBack: () => void;
  isGroupInactive: (g: ClientGroup) => boolean;
  handleToggleActive: (g: ClientGroup) => void;
  handleDeleteClient: (g: ClientGroup) => void;
  handleRenameClient: (g: ClientGroup, newName: string) => void | Promise<void>;
  downloadAllPdf: () => void;
  contentIdeasCount: number;
  carouselsCount: number;
  strategicContextCompleted: boolean;
  children: {
    contextTab: React.ReactNode;
    projectsTab: React.ReactNode;
    ideasTab: React.ReactNode;
    calendarTab: React.ReactNode;
    carouselsTab: React.ReactNode;
  };
}

export function ClientDetailView({
  selectedGroup, activeTab, setActiveTab, onBack,
  isGroupInactive, handleToggleActive, handleDeleteClient, handleRenameClient, downloadAllPdf,
  contentIdeasCount, carouselsCount, strategicContextCompleted, children,
}: ClientDetailViewProps) {
  const first = selectedGroup.projects[0];
  const [renameOpen, setRenameOpen] = useState(false);
  const [newName, setNewName] = useState(selectedGroup.business_name);

  const openRename = () => {
    setNewName(selectedGroup.business_name);
    setRenameOpen(true);
  };

  const submitRename = async () => {
    await handleRenameClient(selectedGroup, newName);
    setRenameOpen(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Step Indicator */}
      <StepIndicator activeTab={activeTab} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
            {first.business_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{first.business_name}</h1>
          <p className="text-sm text-muted-foreground">{selectedGroup.projects.length} projeto{selectedGroup.projects.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Client info bar */}
      <Card className="rounded-2xl border-border/50 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {first.contact_name && <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary/60" />{first.contact_name}</span>}
              {first.contact_email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-primary/60" />{first.contact_email}</span>}
              {first.contact_whatsapp && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-primary/60" />{first.contact_whatsapp}</span>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={downloadAllPdf}>
                <Download className="h-4 w-4 mr-1.5" />PDF
              </Button>
              <Button
                variant={isGroupInactive(selectedGroup) ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleActive(selectedGroup)}
              >
                <Power className="h-4 w-4 mr-1.5" />
                {isGroupInactive(selectedGroup) ? "Reativar" : "Desativar"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1.5" />Excluir</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso removerá permanentemente todos os projetos, briefings e roteiros de <strong>{first.business_name}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteClient(selectedGroup)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-muted/50 rounded-xl p-1">
          <TabsTrigger value="context" className="flex items-center gap-1.5 rounded-lg">
            <Brain className="h-4 w-4" />Contexto
            {strategicContextCompleted && <Badge variant="secondary" className="ml-1 text-[10px] py-0">✓</Badge>}
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-1.5 rounded-lg">
            <Hash className="h-4 w-4" />Projetos
            <Badge variant="secondary" className="ml-1 text-[10px] py-0">{selectedGroup.projects.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="ideas" className="flex items-center gap-1.5 rounded-lg">
            <Lightbulb className="h-4 w-4" />Ideias
            <Badge variant="secondary" className="ml-1 text-[10px] py-0">{contentIdeasCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1.5 rounded-lg">
            <Calendar className="h-4 w-4" />Calendário
          </TabsTrigger>
          <TabsTrigger value="carousels" className="flex items-center gap-1.5 rounded-lg">
            <LayoutList className="h-4 w-4" />Carrosséis
            <Badge variant="secondary" className="ml-1 text-[10px] py-0">{carouselsCount}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="context" className="space-y-4 mt-4">{children.contextTab}</TabsContent>
        <TabsContent value="projects" className="space-y-4 mt-4">{children.projectsTab}</TabsContent>
        <TabsContent value="ideas" className="space-y-4 mt-4">{children.ideasTab}</TabsContent>
        <TabsContent value="calendar" className="space-y-4 mt-4">{children.calendarTab}</TabsContent>
        <TabsContent value="carousels" className="space-y-4 mt-4">{children.carouselsTab}</TabsContent>
      </Tabs>
    </div>
  );
}
