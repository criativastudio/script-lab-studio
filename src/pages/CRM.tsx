import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Plus, ArrowLeft, FileText, BookOpen, Trash2, Loader2,
  Link as LinkIcon, Copy, Users, Download, Eye, Edit2,
  Mail, Phone, Video, Calendar, Bot, ChevronDown, FolderPlus,
  Target, Megaphone, MessageSquare, Lightbulb, Hash,
  Sparkles, Search, X, Power, Filter, Brain, CheckCircle,
  PenLine, Send,
} from "lucide-react";
import { ScriptViewer } from "@/components/ScriptViewer";

// ── Types ──────────────────────────────────────────────────────
interface BriefingRequest {
  id: string; business_name: string; contact_name: string | null; contact_email: string | null;
  contact_whatsapp: string | null; project_name: string; video_quantity: number;
  status: string; token: string; created_at: string; persona: string | null;
  positioning: string | null; tone_of_voice: string | null; content_strategy: string | null;
  project_id: string | null; form_answers: any; city: string | null; niche: string | null;
  is_active: boolean;
}
interface Briefing { id: string; goal: string | null; target_audience: string | null; content_style: string | null; created_at: string | null; project_id: string | null; }
interface Script { id: string; title: string | null; script: string | null; created_at: string | null; project_id: string | null; }
interface StrategicContext {
  id: string; user_id: string; business_name: string;
  business_niche: string | null; products_services: string | null; target_audience: string | null;
  customer_persona: string | null; tone_of_voice: string | null; market_positioning: string | null;
  pain_points: string | null; differentiators: string | null; marketing_objectives: string | null;
  main_platforms: string[] | null; communication_style: string | null; is_completed: boolean;
  created_at: string; updated_at: string;
}
interface ContentIdea {
  id: string; user_id: string; project_id: string | null; context_id: string | null;
  title: string; description: string | null; status: string; created_at: string;
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

const CRM = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [clients, setClients] = useState<BriefingRequest[]>([]);
  const [selectedBusinessName, setSelectedBusinessName] = useState<string | null>(null);

  // New client dialog
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [briefingForm, setBriefingFormState] = useState({
    business_name: "", contact_name: "", contact_email: "", contact_whatsapp: "",
    project_name: "", video_quantity: "3", city: "", niche: "",
  });
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterNiche, setFilterNiche] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // New project dialog (for existing client)
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    project_name: "", video_quantity: "3",
    campaign_objective: "", funnel_stage: "", content_style: "", publishing_frequency: "",
  });
  const [newProjectLink, setNewProjectLink] = useState<string | null>(null);

  // Per-project data cache
  const [projectBriefings, setProjectBriefings] = useState<Record<string, Briefing[]>>({});
  const [projectScripts, setProjectScripts] = useState<Record<string, Script[]>>({});
  const [generatingProject, setGeneratingProject] = useState<string | null>(null);
  const [openProjects, setOpenProjects] = useState<Set<string>>(new Set());

  const [viewingScript, setViewingScript] = useState<Script | null>(null);
  const [viewingProject, setViewingProject] = useState<BriefingRequest | null>(null);

  // Manual create dialog
  const [manualCreateProjectId, setManualCreateProjectId] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({ objective: "", target_audience: "", platform: "", hook: "", duration: "30s", notes: "" });
  const [manualGenerating, setManualGenerating] = useState(false);

  // Edit dialogs
  const [editingBriefing, setEditingBriefing] = useState<Briefing | null>(null);
  const [editBriefingForm, setEditBriefingForm] = useState({ goal: "", target_audience: "", content_style: "" });
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [editScriptForm, setEditScriptForm] = useState({ title: "", script: "" });

  // PDF state
  const [pdfData, setPdfData] = useState<{ client: BriefingRequest; briefing?: Briefing; scripts: Script[] } | null>(null);

  // Strategic context
  const [strategicContext, setStrategicContext] = useState<StrategicContext | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [editingContext, setEditingContext] = useState(false);
  const [contextForm, setContextForm] = useState<Partial<StrategicContext>>({});

  // Content ideas
  const [contentIdeas, setContentIdeas] = useState<ContentIdea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [generatingIdeas, setGeneratingIdeas] = useState(false);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [generatingScriptsFromIdeas, setGeneratingScriptsFromIdeas] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState("");
  const [editingIdea, setEditingIdea] = useState<string | null>(null);
  const [editIdeaText, setEditIdeaText] = useState("");
  const [ideasProjectFilter, setIdeasProjectFilter] = useState<string>("all");

  // Tab state
  const [activeTab, setActiveTab] = useState("context");

  // Group clients by business_name
  const clientGroups = useMemo<ClientGroup[]>(() => {
    const map = new Map<string, BriefingRequest[]>();
    clients.forEach((c) => {
      const key = c.business_name.trim().toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    });
    return Array.from(map.values()).map((projects) => {
      const first = projects[0];
      return {
        business_name: first.business_name,
        contact_name: first.contact_name,
        contact_email: first.contact_email,
        contact_whatsapp: first.contact_whatsapp,
        projects: projects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      };
    });
  }, [clients]);

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => { if (c.city) set.add(c.city); });
    return Array.from(set).sort();
  }, [clients]);

  const uniqueNiches = useMemo(() => {
    const set = new Set<string>();
    clients.forEach(c => { if (c.niche) set.add(c.niche); });
    return Array.from(set).sort();
  }, [clients]);

  const filteredGroups = useMemo(() => {
    return clientGroups.filter((group) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        group.business_name.toLowerCase().includes(term) ||
        (group.contact_name && group.contact_name.toLowerCase().includes(term));
      const matchesCity = !filterCity || group.projects.some(p => p.city === filterCity);
      const matchesNiche = !filterNiche || group.projects.some(p => p.niche === filterNiche);
      const matchesActive = showInactive || group.projects.some(p => p.is_active !== false);
      return matchesSearch && matchesCity && matchesNiche && matchesActive;
    });
  }, [clientGroups, searchTerm, filterCity, filterNiche, showInactive]);

  const hasActiveFilters = searchTerm || filterCity || filterNiche;
  const isGroupInactive = (group: ClientGroup) => group.projects.every(p => p.is_active === false);

  const selectedGroup = useMemo(() => {
    if (!selectedBusinessName) return null;
    return clientGroups.find((g) => g.business_name.trim().toLowerCase() === selectedBusinessName) || null;
  }, [selectedBusinessName, clientGroups]);

  // ── Data fetching ──────────────────────────────────────────
  const fetchClients = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("briefing_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setClients((data as BriefingRequest[]) || []);
  };

  const fetchProjectDetails = async (project: BriefingRequest) => {
    if (!user || !project.project_id) return;
    const [b, s] = await Promise.all([
      supabase.from("briefings").select("*").eq("project_id", project.project_id).eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("scripts").select("*").eq("project_id", project.project_id).eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProjectBriefings((prev) => ({ ...prev, [project.id]: (b.data as Briefing[]) || [] }));
    setProjectScripts((prev) => ({ ...prev, [project.id]: (s.data as Script[]) || [] }));
  };

  const fetchStrategicContext = useCallback(async (businessName: string) => {
    if (!user) return;
    setContextLoading(true);
    const { data } = await supabase
      .from("client_strategic_contexts")
      .select("*")
      .eq("user_id", user.id)
      .eq("business_name", businessName)
      .single();
    setStrategicContext(data as StrategicContext | null);
    if (data) {
      setContextForm(data as StrategicContext);
    }
    setContextLoading(false);
  }, [user]);

  const fetchContentIdeas = useCallback(async (businessName: string) => {
    if (!user) return;
    setIdeasLoading(true);
    // Get context id for this business
    const { data: ctx } = await supabase
      .from("client_strategic_contexts")
      .select("id")
      .eq("user_id", user.id)
      .eq("business_name", businessName)
      .single();

    if (ctx) {
      const { data } = await supabase
        .from("content_ideas")
        .select("*")
        .eq("user_id", user.id)
        .eq("context_id", ctx.id)
        .order("created_at", { ascending: false });
      setContentIdeas((data as ContentIdea[]) || []);
    } else {
      setContentIdeas([]);
    }
    setIdeasLoading(false);
  }, [user]);

  useEffect(() => { fetchClients(); }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchStrategicContext(selectedGroup.business_name);
      fetchContentIdeas(selectedGroup.business_name);
    }
  }, [selectedGroup?.business_name, fetchStrategicContext, fetchContentIdeas]);

  const toggleProject = (project: BriefingRequest) => {
    setOpenProjects((prev) => {
      const next = new Set(prev);
      if (next.has(project.id)) {
        next.delete(project.id);
      } else {
        next.add(project.id);
        if (!projectBriefings[project.id]) fetchProjectDetails(project);
      }
      return next;
    });
  };

  // ── Handlers ──────────────────────────────────────────────
  const handleCreateClient = async () => {
    if (!user || !briefingForm.business_name || !briefingForm.project_name) return;
    const { data, error } = await supabase.from("briefing_requests").insert({
      user_id: user.id, business_name: briefingForm.business_name,
      contact_name: briefingForm.contact_name || null, contact_email: briefingForm.contact_email || null,
      contact_whatsapp: briefingForm.contact_whatsapp || null, project_name: briefingForm.project_name,
      video_quantity: parseInt(briefingForm.video_quantity),
      city: briefingForm.city || null, niche: briefingForm.niche || null,
    } as any).select("token").single();
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    const link = `${window.location.origin}/briefing/${data.token}`;
    setGeneratedLink(link);
    fetchClients();
    toast({ title: "Cliente registrado!" });
  };

  const handleCreateProject = async () => {
    if (!user || !selectedGroup || !newProjectForm.project_name) return;
    const first = selectedGroup.projects[0];
    const { data, error } = await supabase.from("briefing_requests").insert({
      user_id: user.id, business_name: first.business_name,
      contact_name: first.contact_name, contact_email: first.contact_email,
      contact_whatsapp: first.contact_whatsapp, project_name: newProjectForm.project_name,
      video_quantity: parseInt(newProjectForm.video_quantity),
      form_answers: first.form_answers,
    }).select("token").single();
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    const link = `${window.location.origin}/briefing/${data.token}`;
    setNewProjectLink(link);
    fetchClients();
    toast({ title: "Projeto criado!" });
  };

  const handleGenerateWithAgent = async (project: BriefingRequest) => {
    if (!project.form_answers) {
      toast({ title: "Briefing pendente", description: "O cliente ainda não preencheu o formulário de briefing.", variant: "destructive" });
      return;
    }
    setGeneratingProject(project.id);
    try {
      const { error } = await supabase.functions.invoke("process-briefing", { body: { token: project.token } });
      if (error) throw error;
      await fetchClients();
      await fetchProjectDetails(project);
      if (selectedGroup) {
        fetchStrategicContext(selectedGroup.business_name);
      }
      toast({ title: "Conteúdo gerado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingProject(null);
    }
  };

  const handleManualGenerate = async (project: BriefingRequest) => {
    if (!user || !manualForm.objective || !manualForm.target_audience || !manualForm.platform) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    setManualGenerating(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("manual-generate", {
        body: {
          objective: manualForm.objective, target_audience: manualForm.target_audience,
          platform: manualForm.platform, hook: manualForm.hook,
          duration: manualForm.duration, notes: manualForm.notes,
          video_quantity: project.video_quantity,
        },
      });
      if (fnError) throw fnError;
      if (fnData?.error) throw new Error(fnData.error);
      let projectId = project.project_id;
      if (!projectId) {
        const { data: pData, error: pErr } = await supabase.from("projects").insert({
          user_id: user.id, name: project.project_name, client_name: project.business_name,
          platform: manualForm.platform, objective: manualForm.objective,
        }).select("id").single();
        if (pErr) throw pErr;
        projectId = pData.id;
        await supabase.from("briefing_requests").update({ project_id: projectId }).eq("id", project.id);
      }
      await supabase.from("briefings").insert({
        user_id: user.id, project_id: projectId,
        goal: fnData.goal, target_audience: fnData.target_audience, content_style: fnData.content_style,
      });
      if (fnData.scripts?.length) {
        await supabase.from("scripts").insert(
          fnData.scripts.map((s: any) => ({ user_id: user.id, project_id: projectId, title: s.title, script: s.script }))
        );
      }
      setManualCreateProjectId(null);
      setManualForm({ objective: "", target_audience: "", platform: "", hook: "", duration: "30s", notes: "" });
      await fetchClients();
      const updatedProject = { ...project, project_id: projectId };
      await fetchProjectDetails(updatedProject);
      toast({ title: "Briefing e roteiros gerados com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
    } finally {
      setManualGenerating(false);
    }
  };

  // Edit handlers
  const openEditBriefing = (b: Briefing) => {
    setEditBriefingForm({ goal: b.goal || "", target_audience: b.target_audience || "", content_style: b.content_style || "" });
    setEditingBriefing(b);
  };
  const saveEditBriefing = async () => {
    if (!editingBriefing) return;
    const { error } = await supabase.from("briefings").update({
      goal: editBriefingForm.goal, target_audience: editBriefingForm.target_audience, content_style: editBriefingForm.content_style,
    }).eq("id", editingBriefing.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setEditingBriefing(null);
    if (selectedGroup) {
      const ownerProject = selectedGroup.projects.find(p => p.project_id && projectBriefings[p.id]?.some(b => b.id === editingBriefing.id));
      if (ownerProject) fetchProjectDetails(ownerProject);
    }
    toast({ title: "Briefing atualizado!" });
  };

  const openEditScript = (s: Script) => {
    setEditScriptForm({ title: s.title || "", script: s.script || "" });
    setEditingScript(s);
  };
  const saveEditScript = async () => {
    if (!editingScript) return;
    const { error } = await supabase.from("scripts").update({ title: editScriptForm.title, script: editScriptForm.script }).eq("id", editingScript.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setEditingScript(null);
    if (selectedGroup) {
      const ownerProject = selectedGroup.projects.find(p => p.project_id && projectScripts[p.id]?.some(s => s.id === editingScript.id));
      if (ownerProject) fetchProjectDetails(ownerProject);
    }
    toast({ title: "Roteiro atualizado!" });
  };

  const deleteItem = async (table: "briefings" | "scripts", id: string, project: BriefingRequest) => {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    fetchProjectDetails(project);
    toast({ title: "Item removido!" });
  };

  const handleToggleActive = async (group: ClientGroup) => {
    const allInactive = group.projects.every(p => p.is_active === false);
    const newValue = allInactive;
    const ids = group.projects.map(p => p.id);
    const { error } = await supabase.from("briefing_requests").update({ is_active: newValue } as any).in("id", ids);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    await fetchClients();
    toast({ title: newValue ? "Cliente reativado!" : "Cliente desativado!" });
    if (!newValue) { setSelectedBusinessName(null); setOpenProjects(new Set()); }
  };

  const handleDeleteClient = async (group: ClientGroup) => {
    try {
      for (const project of group.projects) {
        if (project.project_id) {
          await supabase.from("scripts").delete().eq("project_id", project.project_id);
          await supabase.from("briefings").delete().eq("project_id", project.project_id);
        }
      }
      const ids = group.projects.map(p => p.id);
      await supabase.from("briefing_requests").delete().in("id", ids);
      // Also delete strategic context
      if (user) {
        await supabase.from("client_strategic_contexts").delete()
          .eq("user_id", user.id).eq("business_name", group.business_name);
      }
      await fetchClients();
      setSelectedBusinessName(null);
      setOpenProjects(new Set());
      toast({ title: "Cliente excluído com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    }
  };

  // ── Strategic Context handlers ──────────────────────────────
  const saveStrategicContext = async () => {
    if (!user || !selectedGroup) return;
    const payload = {
      user_id: user.id,
      business_name: selectedGroup.business_name,
      business_niche: contextForm.business_niche || null,
      products_services: contextForm.products_services || null,
      target_audience: contextForm.target_audience || null,
      customer_persona: contextForm.customer_persona || null,
      tone_of_voice: contextForm.tone_of_voice || null,
      market_positioning: contextForm.market_positioning || null,
      pain_points: contextForm.pain_points || null,
      differentiators: contextForm.differentiators || null,
      marketing_objectives: contextForm.marketing_objectives || null,
      main_platforms: contextForm.main_platforms || [],
      communication_style: contextForm.communication_style || null,
      is_completed: true,
    };
    if (strategicContext?.id) {
      const { error } = await supabase.from("client_strategic_contexts").update(payload as any).eq("id", strategicContext.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("client_strategic_contexts").insert(payload as any);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    }
    setEditingContext(false);
    fetchStrategicContext(selectedGroup.business_name);
    toast({ title: "Contexto estratégico salvo!" });
  };

  // ── Content Ideas handlers ──────────────────────────────────
  const handleGenerateIdeas = async (count: number = 10) => {
    if (!user || !strategicContext?.id) {
      toast({ title: "Preencha o contexto estratégico primeiro", variant: "destructive" });
      return;
    }
    setGeneratingIdeas(true);
    try {
      const projectId = ideasProjectFilter !== "all" ? ideasProjectFilter : undefined;
      const { data, error } = await supabase.functions.invoke("generate-ideas", {
        body: { context_id: strategicContext.id, project_id: projectId, count, user_id: user.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (selectedGroup) fetchContentIdeas(selectedGroup.business_name);
      toast({ title: `${data.count} ideias geradas!` });
    } catch (err: any) {
      toast({ title: "Erro ao gerar ideias", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingIdeas(false);
    }
  };

  const handleAddCustomIdea = async () => {
    if (!user || !newIdeaTitle.trim() || !strategicContext?.id) return;
    const { error } = await supabase.from("content_ideas").insert({
      user_id: user.id,
      context_id: strategicContext.id,
      project_id: ideasProjectFilter !== "all" ? ideasProjectFilter : null,
      title: newIdeaTitle.trim(),
      status: "pending",
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setNewIdeaTitle("");
    if (selectedGroup) fetchContentIdeas(selectedGroup.business_name);
  };

  const handleUpdateIdea = async (id: string, title: string) => {
    const { error } = await supabase.from("content_ideas").update({ title } as any).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setEditingIdea(null);
    if (selectedGroup) fetchContentIdeas(selectedGroup.business_name);
  };

  const handleDeleteIdea = async (id: string) => {
    await supabase.from("content_ideas").delete().eq("id", id);
    setSelectedIdeas(prev => { const n = new Set(prev); n.delete(id); return n; });
    if (selectedGroup) fetchContentIdeas(selectedGroup.business_name);
  };

  const handleToggleIdeaSelection = (id: string) => {
    setSelectedIdeas(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const handleGenerateScriptsFromIdeas = async () => {
    if (!user || selectedIdeas.size === 0 || !strategicContext?.id) return;
    setGeneratingScriptsFromIdeas(true);
    try {
      const ideas = contentIdeas.filter(i => selectedIdeas.has(i.id));
      let successCount = 0;
      for (const idea of ideas) {
        const { data, error } = await supabase.functions.invoke("generate-script", {
          body: {
            context_id: strategicContext.id,
            idea_id: idea.id,
            idea_title: idea.title,
            platform: "Instagram Reels",
            video_duration: "60s",
            user_id: user.id,
          },
        });
        if (error || data?.error) {
          console.error("Script gen error for idea:", idea.title, error || data?.error);
          continue;
        }
        // Save the script
        const projectId = idea.project_id || selectedGroup?.projects.find(p => p.project_id)?.project_id;
        if (projectId) {
          await supabase.from("scripts").insert({
            user_id: user.id,
            project_id: projectId,
            title: data.title || idea.title,
            script: data.script,
          });
        }
        successCount++;
      }
      setSelectedIdeas(new Set());
      if (selectedGroup) {
        fetchContentIdeas(selectedGroup.business_name);
        // Refresh all open project details
        for (const p of selectedGroup.projects) {
          if (openProjects.has(p.id)) fetchProjectDetails(p);
        }
      }
      toast({ title: `${successCount} roteiro(s) gerado(s) com sucesso!` });
    } catch (err: any) {
      toast({ title: "Erro ao gerar roteiros", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingScriptsFromIdeas(false);
    }
  };

  // PDF
  const downloadPdf = (type: "briefing" | "script", item: Briefing | Script, project: BriefingRequest) => {
    const allScripts = type === "script" ? [item as Script] : [];
    const briefing = type === "briefing" ? item as Briefing : undefined;
    setPdfData({ client: project, briefing, scripts: allScripts });
    setTimeout(() => window.print(), 400);
  };

  const downloadProjectPdf = (project: BriefingRequest) => {
    const briefs = projectBriefings[project.id] || [];
    const scrpts = projectScripts[project.id] || [];
    setPdfData({ client: project, briefing: briefs[0], scripts: scrpts });
    setTimeout(() => window.print(), 400);
  };

  const downloadAllPdf = () => {
    if (!selectedGroup) return;
    const allBriefings = selectedGroup.projects.flatMap(p => projectBriefings[p.id] || []);
    const allScripts = selectedGroup.projects.flatMap(p => projectScripts[p.id] || []);
    setPdfData({ client: selectedGroup.projects[0], briefing: allBriefings[0], scripts: allScripts });
    setTimeout(() => window.print(), 400);
  };

  const StrategicCard = ({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) => (
    <div className="rounded-lg border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );

  // ── Detail View ──────────────────────────────────────────────
  if (selectedGroup) {
    const first = selectedGroup.projects[0];

    const filteredIdeas = ideasProjectFilter === "all"
      ? contentIdeas
      : contentIdeas.filter(i => i.project_id === ideasProjectFilter);

    return (
      <DashboardLayout>
        <div className="space-y-6 max-w-5xl">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => { setSelectedBusinessName(null); setOpenProjects(new Set()); setActiveTab("context"); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                {first.business_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">{first.business_name}</h1>
              <p className="text-sm text-muted-foreground">{selectedGroup.projects.length} projeto{selectedGroup.projects.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Client info bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-6 items-center justify-between">
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {first.contact_name && <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{first.contact_name}</span>}
                  {first.contact_email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{first.contact_email}</span>}
                  {first.contact_whatsapp && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{first.contact_whatsapp}</span>}
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
            <TabsList className="w-full justify-start">
              <TabsTrigger value="context" className="flex items-center gap-1.5">
                <Brain className="h-4 w-4" />Contexto Estratégico
                {strategicContext?.is_completed && <Badge variant="secondary" className="ml-1 text-[10px] py-0">✓</Badge>}
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-1.5">
                <Hash className="h-4 w-4" />Projetos
                <Badge variant="secondary" className="ml-1 text-[10px] py-0">{selectedGroup.projects.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="ideas" className="flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4" />Ideias
                <Badge variant="secondary" className="ml-1 text-[10px] py-0">{contentIdeas.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {/* ── Tab: Strategic Context ── */}
            <TabsContent value="context" className="space-y-4">
              {contextLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : !strategicContext && !editingContext ? (
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <Brain className="h-12 w-12 mx-auto text-muted-foreground opacity-40" />
                    <div>
                      <p className="font-medium text-foreground">Contexto estratégico não preenchido</p>
                      <p className="text-sm text-muted-foreground mt-1">O contexto será preenchido automaticamente quando o cliente responder o formulário de briefing, ou você pode preenchê-lo manualmente.</p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => { setContextForm({ business_name: first.business_name }); setEditingContext(true); }}>
                        <PenLine className="h-4 w-4 mr-1.5" />Preencher Manualmente
                      </Button>
                      <Button variant="outline" onClick={() => {
                        const link = `${window.location.origin}/briefing/${first.token}`;
                        navigator.clipboard.writeText(link);
                        toast({ title: "Link copiado!" });
                      }}>
                        <Send className="h-4 w-4 mr-1.5" />Copiar Link do Formulário
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : editingContext ? (
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-foreground">Editar Contexto Estratégico</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><Label>Nicho do Negócio</Label><Input value={contextForm.business_niche || ""} onChange={e => setContextForm({ ...contextForm, business_niche: e.target.value })} placeholder="Ex: Odontologia estética" /></div>
                      <div><Label>Produtos/Serviços</Label><Input value={contextForm.products_services || ""} onChange={e => setContextForm({ ...contextForm, products_services: e.target.value })} placeholder="Ex: Lentes de contato, clareamento" /></div>
                      <div><Label>Público-alvo</Label><Textarea value={contextForm.target_audience || ""} onChange={e => setContextForm({ ...contextForm, target_audience: e.target.value })} rows={2} /></div>
                      <div><Label>Persona do Cliente</Label><Textarea value={contextForm.customer_persona || ""} onChange={e => setContextForm({ ...contextForm, customer_persona: e.target.value })} rows={2} /></div>
                      <div><Label>Tom de Voz</Label><Input value={contextForm.tone_of_voice || ""} onChange={e => setContextForm({ ...contextForm, tone_of_voice: e.target.value })} placeholder="Ex: Profissional e acolhedor" /></div>
                      <div><Label>Posicionamento de Mercado</Label><Input value={contextForm.market_positioning || ""} onChange={e => setContextForm({ ...contextForm, market_positioning: e.target.value })} /></div>
                      <div><Label>Dores do Cliente</Label><Textarea value={contextForm.pain_points || ""} onChange={e => setContextForm({ ...contextForm, pain_points: e.target.value })} rows={2} /></div>
                      <div><Label>Diferenciais</Label><Textarea value={contextForm.differentiators || ""} onChange={e => setContextForm({ ...contextForm, differentiators: e.target.value })} rows={2} /></div>
                      <div><Label>Objetivos de Marketing</Label><Textarea value={contextForm.marketing_objectives || ""} onChange={e => setContextForm({ ...contextForm, marketing_objectives: e.target.value })} rows={2} /></div>
                      <div>
                        <Label>Estilo de Comunicação</Label>
                        <Select value={contextForm.communication_style || ""} onValueChange={v => setContextForm({ ...contextForm, communication_style: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {["Educativo", "Autoridade", "Profissional", "Casual", "Influencer", "Storytelling", "Venda direta", "Motivacional"].map(s => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Plataformas Principais</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {["Instagram Reels", "Instagram Stories", "TikTok", "YouTube", "YouTube Shorts", "Facebook", "LinkedIn", "WhatsApp Status"].map(p => {
                          const selected = (contextForm.main_platforms || []).includes(p);
                          return (
                            <button key={p} type="button" onClick={() => {
                              const current = contextForm.main_platforms || [];
                              setContextForm({
                                ...contextForm,
                                main_platforms: selected ? current.filter(x => x !== p) : [...current, p],
                              });
                            }} className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-secondary-foreground border-border hover:bg-muted"}`}>
                              {p}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveStrategicContext}>Salvar Contexto</Button>
                      <Button variant="outline" onClick={() => setEditingContext(false)}>Cancelar</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : strategicContext ? (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                      <div className="rounded-lg border border-border bg-card p-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <Video className="h-4 w-4 text-primary" />Plataformas
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
              ) : null}
            </TabsContent>

            {/* ── Tab: Projects ── */}
            <TabsContent value="projects" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={newProjectOpen} onOpenChange={(v) => { setNewProjectOpen(v); if (!v) { setNewProjectLink(null); setNewProjectForm({ project_name: "", video_quantity: "3", campaign_objective: "", funnel_stage: "", content_style: "", publishing_frequency: "" }); } }}>
                  <DialogTrigger asChild>
                    <Button size="sm"><FolderPlus className="h-4 w-4 mr-1.5" />Novo Projeto</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Novo Projeto para {first.business_name}</DialogTitle></DialogHeader>
                    {newProjectLink ? (
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">Projeto criado! Link do briefing:</p>
                        <div className="flex gap-2">
                          <Input value={newProjectLink} readOnly className="flex-1 text-xs" />
                          <Button size="sm" onClick={() => { navigator.clipboard.writeText(newProjectLink); toast({ title: "Link copiado!" }); }}><Copy className="h-4 w-4" /></Button>
                        </div>
                        <Button className="w-full" variant="outline" onClick={() => { setNewProjectOpen(false); setNewProjectLink(null); }}>Fechar</Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div><Label>Nome do Projeto *</Label><Input value={newProjectForm.project_name} onChange={(e) => setNewProjectForm({ ...newProjectForm, project_name: e.target.value })} placeholder="Ex: Campanha Abril 2026" /></div>
                        <div>
                          <Label>Quantidade de Vídeos</Label>
                          <Select value={newProjectForm.video_quantity} onValueChange={(v) => setNewProjectForm({ ...newProjectForm, video_quantity: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["1","3","5","10","15"].map(v => <SelectItem key={v} value={v}>{v} vídeo{v !== "1" ? "s" : ""}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Objetivo da Campanha</Label><Input value={newProjectForm.campaign_objective} onChange={(e) => setNewProjectForm({ ...newProjectForm, campaign_objective: e.target.value })} placeholder="Ex: Lançar novo serviço" /></div>
                        <div>
                          <Label>Etapa do Funil</Label>
                          <Select value={newProjectForm.funnel_stage} onValueChange={(v) => setNewProjectForm({ ...newProjectForm, funnel_stage: v })}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="top">Topo (Descoberta)</SelectItem>
                              <SelectItem value="middle">Meio (Consideração)</SelectItem>
                              <SelectItem value="bottom">Fundo (Decisão)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Estilo de Conteúdo</Label><Input value={newProjectForm.content_style} onChange={(e) => setNewProjectForm({ ...newProjectForm, content_style: e.target.value })} placeholder="Ex: Educativo e leve" /></div>
                        <div><Label>Frequência de Publicação</Label><Input value={newProjectForm.publishing_frequency} onChange={(e) => setNewProjectForm({ ...newProjectForm, publishing_frequency: e.target.value })} placeholder="Ex: 3x por semana" /></div>
                        <p className="text-xs text-muted-foreground">O contexto estratégico do cliente será herdado automaticamente.</p>
                        <Button className="w-full" onClick={handleCreateProject} disabled={!newProjectForm.project_name}>
                          <FolderPlus className="h-4 w-4 mr-2" />Criar Projeto
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {selectedGroup.projects.map((project) => {
                  const isOpen = openProjects.has(project.id);
                  const briefs = projectBriefings[project.id] || [];
                  const scrpts = projectScripts[project.id] || [];
                  const isGen = generatingProject === project.id;

                  return (
                    <Collapsible key={project.id} open={isOpen} onOpenChange={() => toggleProject(project)}>
                      <Card className={`transition-all ${isOpen ? "border-primary/40 shadow-md" : "hover:border-primary/20"}`}>
                        <CollapsibleTrigger asChild>
                          <button className="w-full text-left p-4 flex items-center gap-3 group">
                            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-sm shrink-0">
                              <Hash className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground truncate">{project.project_name}</h3>
                                <Badge variant="secondary" className={`text-[10px] shrink-0 ${briefingStatusColors[project.status] || ""}`}>
                                  {briefingStatusLabels[project.status] || project.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><Video className="h-3 w-3" />{project.video_quantity} vídeos</span>
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(project.created_at).toLocaleDateString("pt-BR")}</span>
                              </div>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t border-border px-4 pb-4 pt-3 space-y-5">
                            <div className="flex gap-2 flex-wrap">
                              <Button variant="outline" size="sm" onClick={() => downloadProjectPdf(project)}>
                                <Download className="h-3.5 w-3.5 mr-1.5" />PDF
                              </Button>
                              <Button size="sm" onClick={() => handleGenerateWithAgent(project)} disabled={isGen}>
                                {isGen ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Bot className="h-3.5 w-3.5 mr-1.5" />}
                                {isGen ? "Gerando..." : "Gerar com Agente"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setManualCreateProjectId(project.id)} disabled={manualGenerating}>
                                <Sparkles className="h-3.5 w-3.5 mr-1.5" />Criar Manual + IA
                              </Button>
                            </div>

                            {(project.persona || project.positioning || project.tone_of_voice || project.content_strategy) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {project.persona && <StrategicCard icon={Target} title="Persona" content={project.persona} />}
                                {project.positioning && <StrategicCard icon={Megaphone} title="Posicionamento" content={project.positioning} />}
                                {project.tone_of_voice && <StrategicCard icon={MessageSquare} title="Tom de Voz" content={project.tone_of_voice} />}
                                {project.content_strategy && <StrategicCard icon={Lightbulb} title="Funil de Conteúdo" content={project.content_strategy} />}
                              </div>
                            )}

                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4 text-primary" />Briefings ({briefs.length})
                              </h4>
                              {briefs.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">Nenhum briefing gerado.</p>
                              ) : (
                                <div className="space-y-2">
                                  {briefs.map((b) => (
                                    <div key={b.id} className="rounded-lg border border-border bg-background p-3 flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0 space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">{b.goal || "Sem objetivo"}</p>
                                        <p className="text-xs text-muted-foreground">Público: {b.target_audience || "—"} · Estilo: {b.content_style || "—"}</p>
                                      </div>
                                      <div className="flex gap-0.5 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditBriefing(b)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadPdf("briefing", b, project)}><Download className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteItem("briefings", b.id, project)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                <FileText className="h-4 w-4 text-primary" />Roteiros ({scrpts.length})
                              </h4>
                              {scrpts.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">Nenhum roteiro gerado.</p>
                              ) : (
                                <div className="space-y-2">
                                  {scrpts.map((s) => (
                                    <div key={s.id} className="rounded-lg border border-border bg-background p-3 flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0 space-y-0.5">
                                        <p className="text-sm font-medium text-foreground">{s.title || "Sem título"}</p>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{s.script || "—"}</p>
                                      </div>
                                      <div className="flex gap-0.5 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewingScript(s); setViewingProject(project); }}><Eye className="h-3.5 w-3.5 text-primary" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditScript(s)}><Edit2 className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadPdf("script", s, project)}><Download className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteItem("scripts", s.id, project)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            </TabsContent>

            {/* ── Tab: Content Ideas ── */}
            <TabsContent value="ideas" className="space-y-4">
              {/* Actions bar */}
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2 items-center">
                  <Select value={ideasProjectFilter} onValueChange={setIdeasProjectFilter}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todos os projetos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os projetos</SelectItem>
                      {selectedGroup.projects.filter(p => p.project_id).map(p => (
                        <SelectItem key={p.project_id!} value={p.project_id!}>{p.project_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Select onValueChange={(v) => handleGenerateIdeas(parseInt(v))} disabled={generatingIdeas || !strategicContext?.id}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder={generatingIdeas ? "Gerando..." : "Gerar Ideias"} />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} ideias</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedIdeas.size > 0 && (
                    <Button onClick={handleGenerateScriptsFromIdeas} disabled={generatingScriptsFromIdeas}>
                      {generatingScriptsFromIdeas ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <FileText className="h-4 w-4 mr-1.5" />}
                      Gerar {selectedIdeas.size} Roteiro{selectedIdeas.size !== 1 ? "s" : ""}
                    </Button>
                  )}
                </div>
              </div>

              {/* Add custom idea */}
              <div className="flex gap-2">
                <Input
                  placeholder="Adicionar ideia personalizada..."
                  value={newIdeaTitle}
                  onChange={e => setNewIdeaTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAddCustomIdea(); }}
                />
                <Button variant="outline" onClick={handleAddCustomIdea} disabled={!newIdeaTitle.trim() || !strategicContext?.id}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {!strategicContext?.id && (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Brain className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Preencha o Contexto Estratégico primeiro para gerar ideias de conteúdo.</p>
                  </CardContent>
                </Card>
              )}

              {ideasLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : filteredIdeas.length === 0 && strategicContext?.id ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Lightbulb className="h-10 w-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Nenhuma ideia ainda. Clique em "Gerar Ideias" para começar.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {filteredIdeas.map((idea) => (
                    <div key={idea.id} className={`rounded-lg border p-3 flex items-start gap-3 transition-colors ${
                      selectedIdeas.has(idea.id) ? "border-primary bg-primary/5" : "border-border bg-background"
                    } ${idea.status === "used" ? "opacity-60" : ""}`}>
                      <Checkbox
                        checked={selectedIdeas.has(idea.id)}
                        onCheckedChange={() => handleToggleIdeaSelection(idea.id)}
                        disabled={idea.status === "used"}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        {editingIdea === idea.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editIdeaText}
                              onChange={e => setEditIdeaText(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") handleUpdateIdea(idea.id, editIdeaText); }}
                              className="flex-1"
                              autoFocus
                            />
                            <Button size="sm" onClick={() => handleUpdateIdea(idea.id, editIdeaText)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-foreground">{idea.title}</p>
                            {idea.description && <p className="text-xs text-muted-foreground mt-0.5">{idea.description}</p>}
                          </>
                        )}
                      </div>
                      <div className="flex gap-0.5 shrink-0">
                        {idea.status === "used" && <Badge variant="secondary" className="text-[10px]">Usado</Badge>}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingIdea(idea.id); setEditIdeaText(idea.title); }}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteIdea(idea.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Manual Create Dialog */}
        <Dialog open={!!manualCreateProjectId} onOpenChange={(v) => { if (!v) { setManualCreateProjectId(null); setManualForm({ objective: "", target_audience: "", platform: "", hook: "", duration: "30s", notes: "" }); } }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Criar Manual + IA</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Objetivo do Cliente *</Label><Textarea placeholder="Descreva o objetivo..." value={manualForm.objective} onChange={(e) => setManualForm({ ...manualForm, objective: e.target.value })} /></div>
              <div><Label>Público-alvo *</Label><Input placeholder="Ex: Mulheres 25-40" value={manualForm.target_audience} onChange={(e) => setManualForm({ ...manualForm, target_audience: e.target.value })} /></div>
              <div>
                <Label>Plataforma *</Label>
                <Select value={manualForm.platform} onValueChange={(v) => setManualForm({ ...manualForm, platform: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {["Instagram Reels", "TikTok", "YouTube Shorts", "YouTube", "Facebook", "LinkedIn"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Gancho</Label><Textarea placeholder="Mensagem principal" value={manualForm.hook} onChange={(e) => setManualForm({ ...manualForm, hook: e.target.value })} /></div>
              <div>
                <Label>Duração</Label>
                <Select value={manualForm.duration} onValueChange={(v) => setManualForm({ ...manualForm, duration: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["15s", "30s", "60s", "3min", "5min+"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notas (opcional)</Label><Textarea value={manualForm.notes} onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })} /></div>
              <Button
                className="w-full"
                onClick={() => {
                  const project = selectedGroup?.projects.find(p => p.id === manualCreateProjectId);
                  if (project) handleManualGenerate(project);
                }}
                disabled={manualGenerating || !manualForm.objective || !manualForm.target_audience || !manualForm.platform}
              >
                {manualGenerating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando...</> : <><Sparkles className="h-4 w-4 mr-2" />Gerar Briefing + Roteiros</>}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Briefing Dialog */}
        <Dialog open={!!editingBriefing} onOpenChange={(v) => { if (!v) setEditingBriefing(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Briefing</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Objetivo</Label><Input value={editBriefingForm.goal} onChange={(e) => setEditBriefingForm({ ...editBriefingForm, goal: e.target.value })} /></div>
              <div><Label>Público-alvo</Label><Input value={editBriefingForm.target_audience} onChange={(e) => setEditBriefingForm({ ...editBriefingForm, target_audience: e.target.value })} /></div>
              <div><Label>Estilo</Label><Input value={editBriefingForm.content_style} onChange={(e) => setEditBriefingForm({ ...editBriefingForm, content_style: e.target.value })} /></div>
              <Button className="w-full" onClick={saveEditBriefing}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Script Dialog */}
        <Dialog open={!!editingScript} onOpenChange={(v) => { if (!v) setEditingScript(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Editar Roteiro</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título</Label><Input value={editScriptForm.title} onChange={(e) => setEditScriptForm({ ...editScriptForm, title: e.target.value })} /></div>
              <div><Label>Conteúdo</Label><Textarea value={editScriptForm.script} onChange={(e) => setEditScriptForm({ ...editScriptForm, script: e.target.value })} rows={12} /></div>
              <Button className="w-full" onClick={saveEditScript}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>

        <ScriptViewer
          script={viewingScript}
          project={viewingProject ? { id: viewingProject.project_id || "", name: viewingProject.project_name, client_name: viewingProject.business_name, objective: null, platform: null, status: viewingProject.status, created_at: viewingProject.created_at } : null}
          open={!!viewingScript}
          onOpenChange={(open) => { if (!open) { setViewingScript(null); setViewingProject(null); } }}
        />

        {/* Hidden PDF print container */}
        <div id="pdf-print-container" ref={printRef} className="hidden print:block">
          {pdfData && (
            <>
              <div className="pdf-cover">
                <div className="pdf-cover-badge">{briefingStatusLabels[pdfData.client.status] || pdfData.client.status}</div>
                <h1 className="pdf-cover-title">{pdfData.client.business_name}</h1>
                <p className="pdf-cover-subtitle">{pdfData.client.project_name}</p>
                <div className="pdf-cover-meta">
                  {pdfData.client.contact_name && <span>Contato: {pdfData.client.contact_name}</span>}
                  <span>Data: {new Date(pdfData.client.created_at).toLocaleDateString("pt-BR")}</span>
                  <span>{pdfData.client.video_quantity} vídeos</span>
                </div>
              </div>
              {pdfData.briefing && (
                <div className="pdf-section">
                  <div className="pdf-section-title">Briefing Estratégico</div>
                  <div className="pdf-card">
                    <dl className="pdf-meta-grid">
                      <dt>Objetivo</dt><dd>{pdfData.briefing.goal || "—"}</dd>
                      <dt>Público-alvo</dt><dd>{pdfData.briefing.target_audience || "—"}</dd>
                      <dt>Estilo de Conteúdo</dt><dd>{pdfData.briefing.content_style || "—"}</dd>
                    </dl>
                  </div>
                </div>
              )}
              {pdfData.client.persona && (
                <div className="pdf-section"><div className="pdf-section-title">Persona</div><div className="pdf-card"><div className="pdf-content">{pdfData.client.persona}</div></div></div>
              )}
              {pdfData.client.positioning && (
                <div className="pdf-section"><div className="pdf-section-title">Posicionamento</div><div className="pdf-card"><div className="pdf-content">{pdfData.client.positioning}</div></div></div>
              )}
              {pdfData.client.tone_of_voice && (
                <div className="pdf-section"><div className="pdf-section-title">Tom de Voz</div><div className="pdf-card"><div className="pdf-content">{pdfData.client.tone_of_voice}</div></div></div>
              )}
              {pdfData.client.content_strategy && (
                <div className="pdf-section"><div className="pdf-section-title">Funil de Conteúdo</div><div className="pdf-card"><div className="pdf-content">{pdfData.client.content_strategy}</div></div></div>
              )}
              {pdfData.scripts.length > 0 && (
                <div className="pdf-section pdf-page-break">
                  <div className="pdf-section-title">Roteiros ({pdfData.scripts.length})</div>
                  {pdfData.scripts.map((s, idx) => (
                    <div key={s.id} className="pdf-script-card">
                      <div className="pdf-script-number">Roteiro {idx + 1}</div>
                      <h3>{s.title || "Sem título"}</h3>
                      <div className="pdf-content">{s.script || "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ── List View ──────────────────────────────────────────────
  return (
    <DashboardLayout>
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
                    <Select value={briefingForm.video_quantity} onValueChange={(v) => setBriefingFormState({ ...briefingForm, video_quantity: v })}>
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
          <Card>
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
              const latestStatus = group.projects[0].status;
              const totalVideos = group.projects.reduce((sum, p) => sum + p.video_quantity, 0);
              const inactive = isGroupInactive(group);
              const funnelStrategy = group.projects.find(p => p.content_strategy)?.content_strategy;
              return (
                <Card
                  key={group.business_name}
                  className={`cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all group ${inactive ? "opacity-60" : ""}`}
                  onClick={() => setSelectedBusinessName(group.business_name.trim().toLowerCase())}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11 mt-0.5">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-base">
                          {group.business_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{group.business_name}</h3>
                          {inactive && <Badge variant="outline" className="text-[10px] shrink-0">Inativo</Badge>}
                        </div>
                        {group.contact_name && <p className="text-xs text-muted-foreground truncate">{group.contact_name}</p>}
                        <div className="flex items-center gap-2 mt-2.5">
                          <Badge variant="secondary" className={`text-[10px] ${briefingStatusColors[latestStatus] || ""}`}>
                            {briefingStatusLabels[latestStatus] || latestStatus}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" />{group.projects.length}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Video className="h-3 w-3" />{totalVideos}</span>
                        </div>
                        {funnelStrategy && (
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 truncate">
                            <Filter className="h-3 w-3 shrink-0 text-primary" />
                            <span className="truncate">{funnelStrategy}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default CRM;
