import type { PdfSettings } from "@/hooks/usePdfSettings";

export const DEFAULT_PDF_SETTINGS: PdfSettings = {
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
