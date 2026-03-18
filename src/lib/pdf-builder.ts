import type { PdfSettings } from "@/hooks/usePdfSettings";

interface PdfSection {
  title: string;
  content: string;
}

interface PdfMetaItem {
  label: string;
  value: string;
}

interface PdfBuildOptions {
  settings: PdfSettings;
  documentTitle: string;
  coverTitle: string;
  coverSubtitle?: string;
  coverBadge?: string;
  coverMeta?: string[];
  sections?: PdfSection[];
  metaGrid?: PdfMetaItem[];
  scripts?: { index: number; title: string; content: string }[];
  rawHtml?: string;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildPdfHtml(opts: PdfBuildOptions): string {
  const ps = opts.settings;
  const logoJustify = ps.logo_position === "left" ? "flex-start" : ps.logo_position === "right" ? "flex-end" : "center";
  const logoHtml = ps.logo_url
    ? `<div style="display:flex;justify-content:${logoJustify};margin-bottom:16px;"><img src="${ps.logo_url}" style="max-height:60px;" /></div>`
    : "";

  const coverHtml = ps.show_cover_page
    ? `<div class="cover">
        ${logoHtml}
        ${opts.coverBadge ? `<div class="badge">${escapeHtml(opts.coverBadge)}</div>` : ""}
        <h1>${escapeHtml(opts.coverTitle)}</h1>
        ${opts.coverSubtitle ? `<p class="subtitle">${escapeHtml(opts.coverSubtitle)}</p>` : ""}
        ${opts.coverMeta?.length ? `<div class="cover-meta">${opts.coverMeta.map(m => `<span>${escapeHtml(m)}</span>`).join("")}</div>` : ""}
        ${ps.header_text ? `<p class="header-text">${escapeHtml(ps.header_text)}</p>` : ""}
      </div>`
    : "";

  let bodyHtml = "";

  if (opts.metaGrid?.length) {
    bodyHtml += `<div class="section"><div class="section-title">Briefing Estratégico</div><div class="card"><dl class="meta-grid">${opts.metaGrid.map(m => `<dt>${escapeHtml(m.label)}</dt><dd>${escapeHtml(m.value)}</dd>`).join("")}</dl></div></div>`;
  }

  if (opts.sections?.length) {
    for (const s of opts.sections) {
      bodyHtml += `<div class="section"><div class="section-title">${escapeHtml(s.title)}</div><div class="card"><div class="content">${escapeHtml(s.content)}</div></div></div>`;
    }
  }

  if (opts.scripts?.length) {
    bodyHtml += `<div class="section" style="page-break-before:always;"><div class="section-title">Roteiros (${opts.scripts.length})</div>`;
    for (const s of opts.scripts) {
      bodyHtml += `<div class="script-card"><div class="script-number">Roteiro ${s.index}</div><h3>${escapeHtml(s.title)}</h3><div class="content">${escapeHtml(s.content)}</div></div>`;
    }
    bodyHtml += `</div>`;
  }

  if (opts.rawHtml) {
    bodyHtml += opts.rawHtml;
  }

  const footerHtml = ps.footer_text
    ? `<div class="footer">${escapeHtml(ps.footer_text)}</div>`
    : "";

  return `<html><head><title>${escapeHtml(opts.documentTitle)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: '${ps.font_family}', 'Inter', system-ui, sans-serif; color: ${ps.secondary_color}; background: #fff; font-size: ${ps.font_size_body + 4}px; line-height: 1.65; }
  .cover { text-align: center; padding: 80px 40px 60px; page-break-after: always; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; }
  .cover .badge { display: inline-block; padding: 4px 16px; border-radius: 20px; font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; background: ${ps.primary_color}; color: white; margin-bottom: 24px; }
  .cover h1 { font-size: ${ps.font_size_title}px; font-weight: 800; color: ${ps.secondary_color}; margin-bottom: 8px; letter-spacing: -0.5px; }
  .cover .subtitle { font-size: ${ps.font_size_title * 0.5}px; font-weight: 400; color: #475569; margin-bottom: 32px; }
  .cover-meta { display: flex; justify-content: center; gap: 24px; font-size: ${ps.font_size_body - 1}px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; }
  .cover .header-text { font-size: ${ps.font_size_body}px; color: #9ca3af; margin-top: 8px; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px 24px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: ${ps.font_size_body + 3}px; font-weight: 700; color: ${ps.secondary_color}; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid ${ps.primary_color}; letter-spacing: -0.2px; }
  .card { border: 1px solid #e2e8f0; border-left: 3px solid ${ps.primary_color}; border-radius: 6px; padding: 14px 16px; margin-bottom: 12px; page-break-inside: avoid; background: #fafbfc; }
  .content { white-space: pre-wrap; font-size: ${ps.font_size_body}px; line-height: 1.7; color: #334155; }
  .meta-grid { display: grid; grid-template-columns: 120px 1fr; gap: 6px 16px; font-size: ${ps.font_size_body}px; }
  .meta-grid dt { font-weight: 600; color: #475569; }
  .meta-grid dd { margin: 0; color: #1e293b; }
  .script-card { border: 1px solid #e2e8f0; border-left: 3px solid ${ps.primary_color}; border-radius: 6px; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; background: #fafbfc; }
  .script-number { font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: ${ps.primary_color}; margin-bottom: 4px; }
  .script-card h3 { font-size: 12px; font-weight: 700; color: ${ps.secondary_color}; margin: 0 0 10px; }
  .footer { text-align: center; font-size: ${ps.font_size_body}px; color: #9ca3af; margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  @media print { .cover { page-break-after: always; } }
</style></head><body>
${coverHtml}
<div class="page">
${bodyHtml}
${footerHtml}
</div>
</body></html>`;
}

export function openPdfWindow(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}
