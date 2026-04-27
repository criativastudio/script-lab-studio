import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getPlan,
  getPlanLimits,
  getUpgradePlan,
  isUnlimited,
  normalizePlanId,
  type PlanLimits as ConfigPlanLimits,
} from "@/config/plans";

export interface PlanLimits {
  clients: number;
  briefings: number;
  ideasPerBriefing: number;
  scriptsPerBriefing: number;
  scriptsPerMonth: number;
  briefingLinks: number;
  leadsBeforeBlock: number;
}

function toLegacyLimits(l: ConfigPlanLimits): PlanLimits {
  return {
    clients: l.clients,
    briefings: l.briefings,
    ideasPerBriefing: l.scriptsPerBriefing,
    scriptsPerBriefing: l.scriptsPerBriefing,
    scriptsPerMonth: l.scriptsPerMonth,
    briefingLinks: l.briefingLinks,
    leadsBeforeBlock: l.leadsBeforeBlock,
  };
}

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
      setPlan(normalizePlanId(data?.plan));
      setLoading(false);
    };
    fetchPlan();
  }, [user?.id]);

  const planConfig = getPlan(plan);
  const limits = toLegacyLimits(getPlanLimits(plan));
  const upgradePlan = getUpgradePlan(plan);

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
      .eq("user_id", user.id)
      .eq("is_active", true);
    const unique = new Set((data || []).map(d => (d.business_name || "").trim().toLowerCase()));
    return unique.size;
  };

  /** Active briefing share-links count */
  const getBriefingLinkCount = async (): Promise<number> => {
    if (!user) return 0;
    const { count } = await supabase
      .from("briefing_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);
    return count || 0;
  };

  /** Filled briefings (status != pending) */
  const getLeadCount = async (): Promise<number> => {
    if (!user) return 0;
    const { count } = await supabase
      .from("briefing_requests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "pending");
    return count || 0;
  };

  return {
    plan,
    planConfig,
    limits,
    upgradePlan,
    loading,
    getMonthlyBriefingCount,
    getMonthlyScriptCount,
    getClientCount,
    getBriefingLinkCount,
    getLeadCount,
  };
}
