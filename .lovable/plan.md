# Monitoramento de Créditos da IA + Status no Admin

## ⚠️ Esclarecimento técnico importante

O projeto **não chama a API da OpenAI diretamente** — todas as 10 edge functions de IA (`generate-script`, `generate-carousel`, `generate-hooks`, `generate-ideas`, `score-script`, `strategic-analysis`, `manual-generate`, `process-briefing`, `generate-diagnostic`, `suggest-briefing`) usam o **Lovable AI Gateway** (`ai.gateway.lovable.dev`), autenticado com `LOVABLE_API_KEY`.

O gateway:
- **Não expõe endpoint público de saldo/billing** — saldo é gerenciado em Settings → Workspace → Usage da Lovable.
- **Sinaliza créditos esgotados** com HTTP `402 Payment Required`.
- **Sinaliza limite de taxa** com HTTP `429 Too Many Requests`.

Como você escolheu **"Ambos"**, o plano cobre os dois caminhos: monitorar o gateway atual + permitir cadastrar uma chave OpenAI própria (fallback opcional, com validação real contra `api.openai.com`).

---

## 1. Nova edge function `ai-health-check`

`supabase/functions/ai-health-check/index.ts` — restrita a admins (valida `has_role(user, 'admin')`).

**Retorna em uma única resposta:**

```ts
{
  lovable_gateway: {
    status: "ok" | "rate_limited" | "credits_low" | "credits_exhausted" | "error",
    latency_ms: number,
    last_402_at: string | null,    // último 402 dos últimos 60min em usage_logs
    error_count_24h: number,
  },
  openai_direct: {
    configured: boolean,
    status: "ok" | "invalid_key" | "error" | "not_configured",
    organization: string | null,
  },
  usage: {
    tokens_this_month: number,        // soma de usage_logs (mês corrente)
    requests_this_month: number,
    quota_tokens: number | null,      // configurável
    percent_used: number | null,
    threshold_warning: number,        // default 80
  },
  alerts: Array<{ level: "warning"|"critical", message: string }>,
}
```

**Lógica:**
- **Health do gateway**: faz 1 chamada mínima (`max_tokens: 1`, prompt `"ping"`) com `google/gemini-3-flash-preview`. Mede latência. Se 402 → `credits_exhausted`. Se 429 → `rate_limited`. Se 200 → `ok`.
- **Health da OpenAI direta** (se `OPENAI_API_KEY` estiver definida): chama `GET https://api.openai.com/v1/models` para validar a chave e extrair organização do header.
- **Uso mensal**: agrega `usage_logs` desde o dia 1 do mês.
- **Alertas computados**:
  - Crítico: `last_402_at` nas últimas 24h.
  - Crítico: `percent_used >= 95`.
  - Warning: `percent_used >= threshold_warning` (default 80%, conforme você pediu — "ex: 20% restante").
  - Warning: erros de gateway nas últimas 24h > 5.

## 2. Nova tabela `ai_settings`

Migration:

```sql
CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_token_quota bigint,            -- cota manual configurável (opcional)
  warning_threshold_percent int NOT NULL DEFAULT 80,
  openai_enabled boolean NOT NULL DEFAULT false,
  last_check_at timestamptz,
  last_check_result jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai_settings" ON public.ai_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));
```

Tabela singleton (uma linha). A chave da OpenAI **não fica na tabela** — vai como secret `OPENAI_API_KEY` (via `add_secret` quando o admin clicar em "Adicionar chave OpenAI").

## 3. Cards no topo de `/admin`

Adicionar acima do grid de stats em `src/pages/Admin.tsx` um novo componente `AIStatusCard`:

- **Badge grande de status**: 🟢 Operacional / 🟡 Atenção / 🔴 Crítico
- **3 mini-stats inline**: latência do gateway · tokens/mês (com barra de progresso vs quota) · requests 24h
- **Banner de alerta** colorido quando `alerts.length > 0`:
  - "⚠️ Créditos baixos: 82% da cota mensal usados — adicione fundos em Settings → Workspace → Usage"
  - "🔴 Créditos esgotados detectados há 12min — IA fora do ar"
- **Botão "Verificar agora"** dispara `ai-health-check`.
- **Botão "Configurar"** abre dialog com:
  - Slider de `warning_threshold_percent` (60–95%)
  - Input numérico de `monthly_token_quota`
  - Toggle "Usar chave OpenAI própria como fallback" → ao ativar, abre fluxo `add_secret` para `OPENAI_API_KEY`
  - Status da chave OpenAI (✅ válida / ❌ inválida / ⚪ não configurada)

Auto-refresh do card a cada 5min via `setInterval`.

## 4. Hook `useAIHealth`

`src/hooks/useAIHealth.ts` — invoca `ai-health-check` e cacheia resultado por 60s.

## 5. Detecção passiva de 402 nas funções existentes

Adicionar em `supabase/functions/_shared/usage-guard.ts` uma helper `recordGatewayError(supabase, status, function_name)` que insere em uma nova tabela leve:

```sql
CREATE TABLE public.ai_gateway_errors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  status_code int NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.ai_gateway_errors(occurred_at DESC);
ALTER TABLE public.ai_gateway_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read errors" ON public.ai_gateway_errors
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
```

Cada função que já trata 402/429 (já fazem isso) ganha 1 linha extra: `await recordGatewayError(supabase, response.status, "generate-script")`. Isso alimenta `error_count_24h` e `last_402_at` sem precisar de chamada de teste constante.

## 6. O que NÃO muda

- Nenhuma função de IA existente tem sua lógica de geração alterada.
- `LOVABLE_API_KEY` continua sendo o transport principal — OpenAI direta é opt-in.
- Plans/limites por usuário (`PLAN_LIMITS`) permanecem inalterados.

## Resultado esperado

1. ✅ Admin vê em tempo real se o gateway está respondendo (com latência).
2. ✅ Alerta visual quando atinge 80% da cota OU quando 402 ocorre.
3. ✅ Pode opcionalmente plugar uma chave OpenAI própria, validada de verdade.
4. ✅ Histórico de erros 402/429 das últimas 24h visível.
5. ✅ Threshold configurável pelo próprio admin.

## Arquivos novos / editados

- `supabase/functions/ai-health-check/index.ts` (novo)
- `supabase/functions/_shared/usage-guard.ts` (+ helper `recordGatewayError`)
- Migration: tabelas `ai_settings`, `ai_gateway_errors`
- `src/components/admin/AIStatusCard.tsx` (novo)
- `src/components/admin/AISettingsDialog.tsx` (novo)
- `src/hooks/useAIHealth.ts` (novo)
- `src/pages/Admin.tsx` (montar card no topo)
- Atualização opcional das 10 edge functions existentes para chamar `recordGatewayError` em 402/429 (1 linha cada).
