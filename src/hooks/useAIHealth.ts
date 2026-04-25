import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AIHealth {
  lovable_gateway: {
    status: "ok" | "rate_limited" | "credits_exhausted" | "error";
    latency_ms: number;
    last_402_at: string | null;
    error_count_24h: number;
  };
  openai_direct: {
    configured: boolean;
    status: "ok" | "invalid_key" | "error" | "not_configured";
    organization: string | null;
  };
  usage: {
    tokens_this_month: number;
    requests_this_month: number;
    quota_tokens: number | null;
    percent_used: number | null;
    threshold_warning: number;
  };
  alerts: Array<{ level: "warning" | "critical"; message: string }>;
  checked_at: string;
}

export function useAIHealth(autoRefreshMs = 5 * 60 * 1000) {
  const [data, setData] = useState<AIHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: fnErr } = await supabase.functions.invoke("ai-health-check");
      if (fnErr) throw fnErr;
      if (res?.error) throw new Error(res.error);
      setData(res as AIHealth);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (autoRefreshMs > 0) {
      const id = setInterval(refresh, autoRefreshMs);
      return () => clearInterval(id);
    }
  }, [refresh, autoRefreshMs]);

  return { data, loading, error, refresh };
}
