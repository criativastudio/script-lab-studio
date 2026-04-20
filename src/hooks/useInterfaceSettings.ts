import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface InterfaceSettings {
  id?: string;
  user_id?: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  font_family: string;
  font_size_base: number;
  border_radius: number;
  density: "compact" | "comfortable" | "spacious";
}

const DEFAULT_SETTINGS: InterfaceSettings = {
  primary_color: "#cbacef",
  accent_color: "#f5cea5",
  background_color: "#121213",
  font_family: "Inter",
  font_size_base: 14,
  border_radius: 8,
  density: "comfortable",
};

export function useInterfaceSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<InterfaceSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSettings(DEFAULT_SETTINGS); setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("interface_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const d = data as any;
        setSettings({
          id: d.id,
          user_id: d.user_id,
          primary_color: d.primary_color || DEFAULT_SETTINGS.primary_color,
          accent_color: d.accent_color || DEFAULT_SETTINGS.accent_color,
          background_color: d.background_color || DEFAULT_SETTINGS.background_color,
          font_family: d.font_family || DEFAULT_SETTINGS.font_family,
          font_size_base: d.font_size_base ?? DEFAULT_SETTINGS.font_size_base,
          border_radius: d.border_radius ?? DEFAULT_SETTINGS.border_radius,
          density: d.density || DEFAULT_SETTINGS.density,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  const updateSettings = useCallback(async (partial: Partial<InterfaceSettings>) => {
    if (!user) return;
    const updated = { ...settings, ...partial };
    setSettings(updated);
    const payload = {
      user_id: user.id,
      primary_color: updated.primary_color,
      accent_color: updated.accent_color,
      background_color: updated.background_color,
      font_family: updated.font_family,
      font_size_base: updated.font_size_base,
      border_radius: updated.border_radius,
      density: updated.density,
      updated_at: new Date().toISOString(),
    };
    if (settings.id) {
      await supabase.from("interface_settings" as any).update(payload).eq("id", settings.id);
    } else {
      const { data } = await supabase.from("interface_settings" as any).insert(payload).select("id").single();
      if (data) setSettings(prev => ({ ...prev, id: (data as any).id }));
    }
  }, [user, settings]);

  return { settings, loading, updateSettings, DEFAULT_SETTINGS };
}
