import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface FormSettings {
  id?: string;
  user_id?: string;
  field_bg_color: string;
  field_border_color: string;
  label_color: string;
  input_radius: number;
  show_field_icons: boolean;
  compact_mode: boolean;
}

const DEFAULT_SETTINGS: FormSettings = {
  field_bg_color: "#1a1a1c",
  field_border_color: "#2a2a2d",
  label_color: "#cbacef",
  input_radius: 8,
  show_field_icons: true,
  compact_mode: false,
};

export function useFormSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<FormSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSettings(DEFAULT_SETTINGS); setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("form_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        const d = data as any;
        setSettings({
          id: d.id,
          user_id: d.user_id,
          field_bg_color: d.field_bg_color || DEFAULT_SETTINGS.field_bg_color,
          field_border_color: d.field_border_color || DEFAULT_SETTINGS.field_border_color,
          label_color: d.label_color || DEFAULT_SETTINGS.label_color,
          input_radius: d.input_radius ?? DEFAULT_SETTINGS.input_radius,
          show_field_icons: d.show_field_icons ?? DEFAULT_SETTINGS.show_field_icons,
          compact_mode: d.compact_mode ?? DEFAULT_SETTINGS.compact_mode,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  const updateSettings = useCallback(async (partial: Partial<FormSettings>) => {
    if (!user) return;
    const updated = { ...settings, ...partial };
    setSettings(updated);
    const payload = {
      user_id: user.id,
      field_bg_color: updated.field_bg_color,
      field_border_color: updated.field_border_color,
      label_color: updated.label_color,
      input_radius: updated.input_radius,
      show_field_icons: updated.show_field_icons,
      compact_mode: updated.compact_mode,
      updated_at: new Date().toISOString(),
    };
    if (settings.id) {
      await supabase.from("form_settings" as any).update(payload).eq("id", settings.id);
    } else {
      const { data } = await supabase.from("form_settings" as any).insert(payload).select("id").single();
      if (data) setSettings(prev => ({ ...prev, id: (data as any).id }));
    }
  }, [user, settings]);

  return { settings, loading, updateSettings, DEFAULT_SETTINGS };
}
