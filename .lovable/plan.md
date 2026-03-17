

# Editor de Personalização de PDFs — Scale Studio

## Resumo

Criar uma página de configurações acessível na sidebar (apenas para Scale Studio) onde o usuário pode personalizar o layout dos PDFs exportados: upload de logo, cores, fontes, tamanhos e posicionamento. As configurações são salvas no Supabase e aplicadas dinamicamente na geração dos PDFs.

## Arquitetura

```text
┌─────────────────────────────────────┐
│  pdf_settings (nova tabela)         │
│  user_id, logo_url, primary_color,  │
│  secondary_color, font_family,      │
│  font_size_title, font_size_body,   │
│  logo_position, header_text,        │
│  footer_text, show_cover_page       │
└─────────────────────────────────────┘
         ↓ lido por
┌─────────────────────────────────────┐
│  usePdfSettings() hook              │
│  carrega settings do user logado    │
└─────────────────────────────────────┘
         ↓ usado em
┌─────────────────────────────────────┐
│  ContentGenerator / CRM PDF export  │
│  aplica cores, logo, fontes         │
└─────────────────────────────────────┘
```

## Alterações

### 1. Migration SQL — Tabela `pdf_settings` + Storage bucket

- Criar tabela `pdf_settings` com campos: `user_id`, `logo_url`, `primary_color` (#2563eb default), `secondary_color` (#0f172a), `font_family` ('Inter'), `font_size_title` (32), `font_size_body` (10), `logo_position` ('center'), `header_text`, `footer_text`, `show_cover_page` (true).
- RLS: user pode CRUD próprios settings, admin pode tudo.
- Criar storage bucket `pdf-logos` (público) para upload de logos.

### 2. `src/hooks/usePdfSettings.ts` (novo)

Hook que carrega/salva as configurações de PDF do usuário logado. Expõe `settings`, `updateSettings()`, `uploadLogo()`.

### 3. `src/pages/PdfSettings.tsx` (novo)

Página com editor visual:
- **Upload de logo**: Drag/drop ou click, preview em tempo real. Upload para bucket `pdf-logos`.
- **Cores**: Color pickers para cor primária (bordas, badges) e secundária (títulos).
- **Fonte**: Select com opções (Inter, Helvetica, Georgia, Times New Roman).
- **Tamanhos**: Sliders para título (16-48pt) e corpo (8-14pt).
- **Posicionamento do logo**: Radio group (esquerda, centro, direita).
- **Textos**: Header e footer personalizáveis.
- **Capa**: Toggle para mostrar/ocultar página de capa.
- **Preview ao vivo**: Miniatura simplificada mostrando como o PDF ficará.
- **Botão Salvar**: Persiste no Supabase.

### 4. `src/components/DashboardLayout.tsx`

- Adicionar item "Personalizar PDF" na sidebar, visível apenas quando o plano é `scale_studio` (verificar via `usePlanLimits`).

### 5. `src/App.tsx`

- Adicionar rota `/pdf-settings` protegida.

### 6. `src/components/dashboard/ContentGenerator.tsx` + `src/pages/CRM.tsx`

- Importar `usePdfSettings` e aplicar as configurações (cores, fontes, logo, textos) nos templates HTML dos PDFs gerados via `window.open` e `window.print`.

## Fluxo do Usuário

1. Usuário Scale Studio vê "Personalizar PDF" na sidebar
2. Abre a página, faz upload do logo, escolhe cores/fontes
3. Salva configurações
4. Ao exportar qualquer PDF (briefing, roteiro, carrossel), o template usa as configurações salvas

## Arquivos

| Arquivo | Alteração |
|---|---|
| Migration SQL | Criar `pdf_settings` + bucket `pdf-logos` |
| `src/hooks/usePdfSettings.ts` | Novo hook para carregar/salvar settings |
| `src/pages/PdfSettings.tsx` | Nova página de editor de personalização |
| `src/components/DashboardLayout.tsx` | Novo item sidebar (Scale Studio only) |
| `src/App.tsx` | Nova rota `/pdf-settings` |
| `src/components/dashboard/ContentGenerator.tsx` | Aplicar settings nos PDFs |

