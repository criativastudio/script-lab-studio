import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScriptViewer } from "@/components/ScriptViewer";
import { ClientListView } from "@/components/crm/ClientListView";
import { ClientDetailView } from "@/components/crm/ClientDetailView";
import { StrategicContextTab } from "@/components/crm/StrategicContextTab";
import { ProjectsTab } from "@/components/crm/ProjectsTab";
import { ContentIdeasTab } from "@/components/crm/ContentIdeasTab";
import { ContentCalendarTab } from "@/components/crm/ContentCalendarTab";

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

  // New project dialog
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

  // ── Derived data ──────────────────────────────────────────
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
    if (data) setContextForm(data as StrategicContext);
    setContextLoading(false);
  }, [user]);

  const fetchContentIdeas = useCallback(async (businessName: string) => {
    if (!user) return;
    setIdeasLoading(true);
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
      if (selectedGroup) fetchStrategicContext(selectedGroup.business_name);
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

  // Strategic Context handlers
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

  // Content Ideas handlers
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
        const ideaProjectId = idea.project_id || selectedGroup?.projects.find(p => p.project_id)?.project_id;
        const { data, error } = await supabase.functions.invoke("generate-script", {
          body: {
            context_id: strategicContext.id,
            idea_id: idea.id,
            idea_title: idea.title,
            project_id: ideaProjectId,
            platform: "Instagram Reels",
            video_duration: "60s",
            user_id: user.id,
          },
        });
        if (error || data?.error) {
          console.error("Script gen error for idea:", idea.title, error || data?.error);
          continue;
        }
        const projectId = ideaProjectId;
        if (projectId) {
          const { data: scriptData } = await supabase.from("scripts").insert({
            user_id: user.id,
            project_id: projectId,
            title: data.title || idea.title,
            script: data.script,
          }).select("id").single();

          // Update memory entry with script_id if it was created by the edge function
          if (scriptData?.id && strategicContext?.id) {
            await supabase.from("client_content_memory")
              .update({ script_id: scriptData.id } as any)
              .eq("context_id", strategicContext.id)
              .eq("idea_id", idea.id)
              .is("script_id", null);
          }
        }
        successCount++;
      }
      setSelectedIdeas(new Set());
      if (selectedGroup) {
        fetchContentIdeas(selectedGroup.business_name);
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

  // PDF handlers
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

  // Quick action from list view
  const handleQuickAction = (group: ClientGroup, action: "context" | "projects" | "ideas") => {
    setSelectedBusinessName(group.business_name.trim().toLowerCase());
    setActiveTab(action);
  };

  // ── Detail View ──────────────────────────────────────────────
  if (selectedGroup) {
    return (
      <DashboardLayout>
        <ClientDetailView
          selectedGroup={selectedGroup}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onBack={() => { setSelectedBusinessName(null); setOpenProjects(new Set()); setActiveTab("context"); }}
          isGroupInactive={isGroupInactive}
          handleToggleActive={handleToggleActive}
          handleDeleteClient={handleDeleteClient}
          downloadAllPdf={downloadAllPdf}
          contentIdeasCount={contentIdeas.length}
          strategicContextCompleted={!!strategicContext?.is_completed}
        >
          {{
            contextTab: (
              <StrategicContextTab
                strategicContext={strategicContext}
                contextLoading={contextLoading}
                editingContext={editingContext}
                setEditingContext={setEditingContext}
                contextForm={contextForm}
                setContextForm={setContextForm}
                saveStrategicContext={saveStrategicContext}
                businessName={selectedGroup.projects[0].business_name}
                firstToken={selectedGroup.projects[0].token}
                toast={toast}
              />
            ),
            projectsTab: (
              <ProjectsTab
                projects={selectedGroup.projects}
                businessName={selectedGroup.projects[0].business_name}
                openProjects={openProjects}
                toggleProject={toggleProject}
                projectBriefings={projectBriefings}
                projectScripts={projectScripts}
                generatingProject={generatingProject}
                handleGenerateWithAgent={handleGenerateWithAgent}
                setManualCreateProjectId={setManualCreateProjectId}
                manualGenerating={manualGenerating}
                downloadProjectPdf={downloadProjectPdf}
                downloadPdf={downloadPdf}
                openEditBriefing={openEditBriefing}
                openEditScript={openEditScript}
                deleteItem={deleteItem}
                setViewingScript={setViewingScript}
                setViewingProject={setViewingProject}
                newProjectOpen={newProjectOpen}
                setNewProjectOpen={setNewProjectOpen}
                newProjectForm={newProjectForm}
                setNewProjectForm={setNewProjectForm}
                newProjectLink={newProjectLink}
                setNewProjectLink={setNewProjectLink}
                handleCreateProject={handleCreateProject}
                toast={toast}
              />
            ),
            ideasTab: (
              <ContentIdeasTab
                projects={selectedGroup.projects}
                contentIdeas={contentIdeas}
                ideasLoading={ideasLoading}
                ideasProjectFilter={ideasProjectFilter}
                setIdeasProjectFilter={setIdeasProjectFilter}
                generatingIdeas={generatingIdeas}
                handleGenerateIdeas={handleGenerateIdeas}
                selectedIdeas={selectedIdeas}
                handleToggleIdeaSelection={handleToggleIdeaSelection}
                generatingScriptsFromIdeas={generatingScriptsFromIdeas}
                handleGenerateScriptsFromIdeas={handleGenerateScriptsFromIdeas}
                newIdeaTitle={newIdeaTitle}
                setNewIdeaTitle={setNewIdeaTitle}
                handleAddCustomIdea={handleAddCustomIdea}
                editingIdea={editingIdea}
                setEditingIdea={setEditingIdea}
                editIdeaText={editIdeaText}
                setEditIdeaText={setEditIdeaText}
                handleUpdateIdea={handleUpdateIdea}
                handleDeleteIdea={handleDeleteIdea}
                strategicContextId={strategicContext?.id}
              />
            ),
            calendarTab: (
              <ContentCalendarTab contentIdeas={contentIdeas} />
            ),
          }}
        </ClientDetailView>

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
          onOpenChange={(open) => {
            if (!open) {
              if (viewingScript?.id && strategicContext?.id) {
                supabase.from("client_content_memory")
                  .update({ was_selected: true } as any)
                  .eq("script_id", viewingScript.id)
                  .then(() => {});
              }
              setViewingScript(null);
              setViewingProject(null);
            }
          }}
          strategicContextId={strategicContext?.id}
          audience={strategicContext?.target_audience || undefined}
          tone={strategicContext?.tone_of_voice || strategicContext?.communication_style || undefined}
          platform={viewingProject ? undefined : strategicContext?.main_platforms?.[0] || undefined}
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
      <ClientListView
        filteredGroups={filteredGroups}
        clientGroups={clientGroups}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterCity={filterCity}
        setFilterCity={setFilterCity}
        filterNiche={filterNiche}
        setFilterNiche={setFilterNiche}
        showInactive={showInactive}
        setShowInactive={setShowInactive}
        uniqueCities={uniqueCities}
        uniqueNiches={uniqueNiches}
        hasActiveFilters={!!hasActiveFilters}
        isGroupInactive={isGroupInactive}
        setSelectedBusinessName={(v) => setSelectedBusinessName(v)}
        briefingOpen={briefingOpen}
        setBriefingOpen={setBriefingOpen}
        briefingForm={briefingForm}
        setBriefingFormState={setBriefingFormState}
        generatedLink={generatedLink}
        setGeneratedLink={setGeneratedLink}
        handleCreateClient={handleCreateClient}
        toast={toast}
        onQuickAction={handleQuickAction}
      />
    </DashboardLayout>
  );
};

export default CRM;
