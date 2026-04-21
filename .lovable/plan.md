

# Adicionar preferências estratégicas no cadastro inicial de cliente (CRM)

Replicar no diálogo **"Adicionar Novo Cliente"** (CRM) os campos estratégicos já existentes em **"Novo Projeto"**, garantindo consistência total e reaproveitando o módulo `editorial-lines.ts`. Tudo é salvo no primeiro `briefing_request` do cliente, em `form_answers`, exatamente como já é feito em projetos subsequentes.

## Campos novos no diálogo "Novo Cliente"

Adicionados após o bloco existente (após Cidade/Nicho), na mesma ordem visual de "Novo Projeto":

| Campo | Tipo | Obrigatório | Comportamento |
|---|---|---|---|
| **Quantidade de Conteúdos** | Select com `VIDEO_QUANTITIES` | — | Substitui o select limitado atual `["1","3","5","10","15"]`. Mantém respeito ao `maxVideos` do plano. |
| **Tipo de Conteúdo** | Select (`Roteiro` / `Carrossel`) | **Sim** | Mesma lista do `ProjectsTab`. Botão "Registrar" desabilitado se vazio. |
| **Linha Editorial** | Multi-select com botão "Automático (IA define)" | — | Reutiliza `EDITORIAL_LINES` + lógica `editorial_mode: "auto" \| "manual"` (auto quando vazio). Visual idêntico ao de projetos. |
| **Estilo de Conteúdo** | Select com `CONTENT_STYLES` | — | Mesma lista. |

Removido: nada. Os campos atuais (Empresa, Contato, Email, WhatsApp, Nome do Projeto, Cidade, Nicho) permanecem.

## Estado e propagação (`src/pages/CRM.tsx`)

Expandir `briefingForm`:

```ts
{
  business_name, contact_name, contact_email, contact_whatsapp,
  project_name, video_quantity, city, niche,
  // novos:
  content_type: "",
  content_style: "",
  editorial_lines: [] as string[],
  editorial_mode: "auto" as "auto" | "manual",
}
```

Em `handleCreateClient`, ao inserir o `briefing_request` inicial, popular `form_answers` com a mesma estrutura usada em `handleCreateProject`:

```ts
form_answers: {
  content_type: briefingForm.content_type,
  content_style: briefingForm.content_style,
  editorial_lines: briefingForm.editorial_lines,
  editorial_mode: briefingForm.editorial_mode,
  funnel_stage: deriveFunnelStage(briefingForm.editorial_lines),
}
```

Reset do form ao fechar o diálogo inclui os novos campos.

## Componente `ClientListView.tsx`

- Importar `EDITORIAL_LINES`, `CONTENT_STYLES`, `VIDEO_QUANTITIES` de `@/lib/editorial-lines` e o ícone `Sparkle`.
- Atualizar a interface `ClientListViewProps['briefingForm']` com os 4 novos campos.
- Renderizar os blocos copiados do padrão visual de `ProjectsTab` (mesmas classes Tailwind, mesmo botão "Automático", mesma grade `grid-cols-2 md:grid-cols-3` para linhas editoriais).
- Botão "Registrar e Gerar Link" exige agora `business_name`, `project_name` **e** `content_type`.
- Adicionar `className="max-h-[90vh] overflow-y-auto"` ao `DialogContent` (igual ao Novo Projeto) para acomodar a altura extra.

## Reuso e consistência

- **Zero duplicação**: usa o mesmo `editorial-lines.ts` (constantes + `deriveFunnelStage`).
- **Mesma UX**: botão "Automático", contador de selecionadas, marcação visual idêntica.
- **Mesma persistência**: `form_answers` no `briefing_requests`, lido pelas mesmas edge functions (`process-briefing`, `manual-generate`) — sem mudanças de backend.
- **Sem migration**: `form_answers` é `jsonb` nullable que já recebe esses campos hoje em projetos subsequentes.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `src/components/crm/ClientListView.tsx` | Adicionar 4 campos no diálogo "Novo Cliente" + ampliar tipo `briefingForm` + scroll no DialogContent |
| `src/pages/CRM.tsx` | Estender `briefingForm` state, popular `form_answers` em `handleCreateClient`, atualizar resets |

## O que NÃO muda

- Edge functions (`process-briefing`, `manual-generate`) — já leem esses campos de `form_answers`.
- Schema do banco / RLS.
- Diálogo de "Novo Projeto" em `ProjectsTab` — permanece idêntico.
- Limites de plano (`usePlanLimits`) — `maxVideos` continua aplicado no select de quantidade.
- Fluxo do briefing público (`/briefing/:token`) — o cliente final ainda preenche o briefing completo; esses campos atuam como pré-configuração estratégica do agente.

