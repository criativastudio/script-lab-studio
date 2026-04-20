

# Diagnóstico: PDF, novos campos obrigatórios e CRM de leads no Admin

## 1. Novos campos obrigatórios no formulário de contato

Em `src/pages/DiagnosticQuiz.tsx`, a etapa "contact" passa a ter 5 campos obrigatórios:

- Nome completo *
- Telefone (WhatsApp) *
- E-mail *
- Nome da empresa/negócio * (novo)
- Cidade * (novo)

`canProceed()` valida todos. `handleSubmit` envia os 5 no payload da edge function.

## 2. Nova tabela `diagnostic_leads`

Migration cria tabela para armazenar todos os leads do diagnóstico:

```sql
create table public.diagnostic_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  diagnostic_type text not null,         -- posicionamento | conteudo | autoridade
  name text not null,
  phone text not null,
  email text not null,
  business_name text not null,
  city text not null,
  answers jsonb not null default '{}',
  result jsonb,                          -- score, summary, strengths, weaknesses, recommendations
  score numeric
);
alter table public.diagnostic_leads enable row level security;

-- Inserção pública (formulário aberto)
create policy "Anyone can insert leads" on public.diagnostic_leads
  for insert to anon, authenticated with check (true);

-- Apenas admins veem/gerenciam
create policy "Admins view all leads" on public.diagnostic_leads
  for select using (has_role(auth.uid(), 'admin'));
create policy "Admins delete leads" on public.diagnostic_leads
  for delete using (has_role(auth.uid(), 'admin'));
```

## 3. Edge function `generate-diagnostic` — salvar lead

Após gerar o resultado da IA (e antes de retornar ao cliente), inserir uma linha em `diagnostic_leads` usando o **service role key** (independe de RLS) com: `diagnostic_type`, `name`, `phone`, `email`, `business_name`, `city`, `answers`, `result`, `score`. Validar os 5 campos obrigatórios; retornar 400 se faltar algum.

## 4. Download em PDF dos resultados

Em `src/pages/DiagnosticQuiz.tsx`, na tela "result", adicionar botão **"Baixar PDF do diagnóstico"** ao lado dos botões de compartilhamento. Usa `buildPdfHtml` (já existente em `src/lib/pdf-builder.ts`) com:

- `coverTitle`: título do quiz
- `coverSubtitle`: nome da empresa + cidade
- `coverBadge`: "Diagnóstico Gratuito"
- `metaGrid`: nome, e-mail, telefone, empresa, cidade, data
- `sections`: Resumo, Pontos Fortes, Pontos de Atenção, Recomendações (cada lista vira texto com bullets) + a nota final no resumo

Como o quiz é público e não há `usePdfSettings` (requer login), usamos `DEFAULT_SETTINGS` direto do hook (objeto exportado) para evitar quebrar o fluxo anônimo. Em seguida `openPdfWindow(html)`.

## 5. Nova página admin: CRM de Diagnósticos

Nova rota protegida `/admin/diagnostico` (admin only), arquivo `src/pages/AdminDiagnostic.tsx`:

- Lista todos os registros de `diagnostic_leads` ordenados por `created_at desc`.
- Filtros: busca por nome/email/empresa, filtro por tipo de diagnóstico (posicionamento/conteúdo/autoridade).
- Tabela com colunas: Data, Tipo, Nome, Empresa, Cidade, Email, Telefone, Score, Ações.
- Ação "Ver respostas" abre `Dialog` com `answers` formatadas + bloco do `result` da IA.
- Ação "Excluir" com `AlertDialog` de confirmação.
- Card de stats no topo: total de leads, leads do mês, distribuição por tipo.

Adicionar link **"Diagnóstico"** no menu lateral admin (`src/components/DashboardLayout.tsx` → `adminItems`) com ícone `ClipboardCheck`.

Registrar rota em `src/App.tsx` dentro de `<ProtectedRoute adminOnly>`.

## Arquivos modificados / criados

| Arquivo | Mudança |
|---|---|
| Nova migration | Criar tabela `diagnostic_leads` + policies |
| `supabase/functions/generate-diagnostic/index.ts` | Validar `business_name`/`city`, inserir lead via service role |
| `src/pages/DiagnosticQuiz.tsx` | Campos `business_name`/`city`, envio no payload, botão "Baixar PDF" |
| `src/pages/AdminDiagnostic.tsx` | **Novo** — CRM de leads do diagnóstico |
| `src/components/DashboardLayout.tsx` | Adicionar item "Diagnóstico" em `adminItems` |
| `src/App.tsx` | Rota `/admin/diagnostico` (adminOnly) |

## O que NÃO muda

- Lógica do quiz (perguntas, chips, fluxo de etapas).
- Demais módulos do Admin (usuários, planos, assinaturas).
- Outras edge functions.

