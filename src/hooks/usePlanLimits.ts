import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PlanLimits {
  clients: number;
  briefings: number;
  ideasPerBriefing: number;
  scriptsPerBriefing: number;
  scriptsPerMonth: number;
}

const PLAN_CONFIGS: Record<string, PlanLimits> = {
  starter: { clients: 3, briefings: 3, ideasPerBriefing: 3, scriptsPerBriefing: 3, scriptsPerMonth: 9 },
  basic: { clients: 3, briefings: 3, ideasPerBriefing: 3, scriptsPerBriefing: 3, scriptsPerMonth: 9 },
  creator_pro: { clients: 25, briefings: 25, ideasPerBriefing: 10, scriptsPerBriefing: 10, scriptsPerMonth: 250 },
  premium: { clients: 25, briefings: 25, ideasPerBriefing: 10, scriptsPerBriefing: 10, scriptsPerMonth: 250 },
  scale_studio: { clients: 9999, briefings: 9999, ideasPerBriefing: 9999, scriptsPerBriefing: 9999, scriptsPerMonth: 9999 },
};

export function usePlanLimits() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<string>("starter");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPlan("starter"); setLoading(false); return; }
    
    const fetchPlan = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      setPlan(data?.plan || "starter");
      setLoading(false);
    };
    fetchPlan();
  }, [user?.id]);

  const limits = PLAN_CONFIGS[plan] || PLAN_CONFIGS.starter;

  const getMonthlyBriefingCount = async (): Promise<number> => {
    if (!user) return 0;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("briefing_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString());
    return count || 0;
  };

  const getMonthlyScriptCount = async (): Promise<number> => {
    if (!user) return 0;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("scripts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", monthStart.toISOString());
    return count || 0;
  };

  const getClientCount = async (): Promise<number> => {
    if (!user) return 0;
    const { data } = await supabase
      .from("briefing_requests")
      .select("business_name")
      .eq("user_id", user.id);
    const unique = new Set((data || []).map(d => d.business_name.trim().toLowerCase()));
    return unique.size;
  };

  return { plan, limits, loading, getMonthlyBriefingCount, getMonthlyScriptCount, getClientCount };
}
