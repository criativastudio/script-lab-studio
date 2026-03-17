import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PdfSettings {
  id?: string;
  user_id?: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  font_size_title: number;
  font_size_body: number;
  logo_position: "left" | "center" | "right";
  header_text: string;
  footer_text: string;
  show_cover_page: boolean;
}

const DEFAULT_SETTINGS: PdfSettings = {
  logo_url: null,
  primary_color: "#2563eb",
  secondary_color: "#0f172a",
  font_family: "Inter",
  font_size_title: 32,
  font_size_body: 10,
  logo_position: "center",
  header_text: "",
  footer_text: "",
  show_cover_page: true,
};

export function usePdfSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PdfSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSettings(DEFAULT_SETTINGS); setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("pdf_settings" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setSettings({
          id: (data as any).id,
          user_id: (data as any).user_id,
          logo_url: (data as any).logo_url,
          primary_color: (data as any).primary_color || DEFAULT_SETTINGS.primary_color,
          secondary_color: (data as any).secondary_color || DEFAULT_SETTINGS.secondary_color,
          font_family: (data as any).font_family || DEFAULT_SETTINGS.font_family,
          font_size_title: (data as any).font_size_title ?? DEFAULT_SETTINGS.font_size_title,
          font_size_body: (data as any).font_size_body ?? DEFAULT_SETTINGS.font_size_body,
          logo_position: (data as any).logo_position || DEFAULT_SETTINGS.logo_position,
          header_text: (data as any).header_text || "",
          footer_text: (data as any).footer_text || "",
          show_cover_page: (data as any).show_cover_page ?? true,
        });
      }
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  const updateSettings = useCallback(async (partial: Partial<PdfSettings>) => {
    if (!user) return;
    const updated = { ...settings, ...partial };
    setSettings(updated);

    const payload = {
      user_id: user.id,
      logo_url: updated.logo_url,
      primary_color: updated.primary_color,
      secondary_color: updated.secondary_color,
      font_family: updated.font_family,
      font_size_title: updated.font_size_title,
      font_size_body: updated.font_size_body,
      logo_position: updated.logo_position,
      header_text: updated.header_text,
      footer_text: updated.footer_text,
      show_cover_page: updated.show_cover_page,
      updated_at: new Date().toISOString(),
    };

    if (settings.id) {
      await supabase.from("pdf_settings" as any).update(payload).eq("id", settings.id);
    } else {
      const { data } = await supabase.from("pdf_settings" as any).insert(payload).select("id").single();
      if (data) setSettings(prev => ({ ...prev, id: (data as any).id }));
    }
  }, [user, settings]);

  const uploadLogo = useCallback(async (file: File) => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo.${ext}`;
    const { error } = await supabase.storage.from("pdf-logos").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("pdf-logos").getPublicUrl(path);
    return urlData.publicUrl;
  }, [user]);

  return { settings, loading, updateSettings, uploadLogo, DEFAULT_SETTINGS };
}
