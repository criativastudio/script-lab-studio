

# Usage Limits & Abuse Protection

## Overview

Add backend-only usage tracking, rate limiting, caching, and token budgets to all AI generation edge functions. No UI changes. Uses two new DB tables and a shared helper module.

## Database Changes

### New table: `usage_logs`
Tracks every AI generation call per user for monthly/daily counting and token budget tracking.

```sql
CREATE TABLE public.usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,        -- 'process-briefing', 'generate-script', 'manual-generate', etc.
  generation_type text NOT NULL,      -- 'briefing' or 'script'
  tokens_used integer DEFAULT 0,
  prompt_hash text,                   -- SHA-256 hash for cache lookups
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_usage_logs_user_month ON public.usage_logs (user_id, created_at);
CREATE INDEX idx_usage_logs_prompt_hash ON public.usage_logs (prompt_hash);
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
-- Only service role writes; users can read own
CREATE POLICY "Users can view own usage" ON public.usage_logs FOR SELECT USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));
```

### New table: `generation_cache`
Stores cached AI responses keyed by prompt hash.

```sql
CREATE TABLE public.generation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash text UNIQUE NOT NULL,
  function_name text NOT NULL,
  response_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);
CREATE INDEX idx_cache_hash ON public.generation_cache (prompt_hash);
ALTER TABLE public.generation_cache ENABLE ROW LEVEL SECURITY;
-- No public access; only service role reads/writes
```

## Plan Configuration (constant in edge functions)

```typescript
const PLAN_LIMITS = {
  starter:      { briefings: 5,   scriptsPerBriefing: 4,  ratePerMin: 2,  dailyLimit: 10,  monthlyTokens: 120000 },
  basic:        { briefings: 5,   scriptsPerBriefing: 4,  ratePerMin: 2,  dailyLimit: 10,  monthlyTokens: 120000 },
  creator_pro:  { briefings: 60,  scriptsPerBriefing: 6,  ratePerMin: 5,  dailyLimit: 80,  monthlyTokens: 900000 },
  premium:      { briefings: 60,  scriptsPerBriefing: 6,  ratePerMin: 5,  dailyLimit: 80,  monthlyTokens: 900000 },
  scale_studio: { briefings: 250, scriptsPerBriefing: 10, ratePerMin: 10, dailyLimit: 400, monthlyTokens: 4000000 },
};
// Map existing plan names (basic/premium) to new tiers
```

## Shared Helper: `supabase/functions/_shared/usage-guard.ts`

A shared module imported by all AI edge functions with these functions:

1. **`getUserPlan(supabase, userId)`** -- queries `subscriptions` table, returns plan name (defaults to `starter`)
2. **`checkRateLimit(supabase, userId, plan, functionName)`** -- counts `usage_logs` in last 60 seconds; rejects if over `ratePerMin`
3. **`checkDailyLimit(supabase, userId, plan)`** -- counts today's logs; rejects if over `dailyLimit`
4. **`checkMonthlyBriefings(supabase, userId, plan)`** -- counts this month's briefing-type logs; rejects if over `briefings` limit
5. **`checkMonthlyTokenBudget(supabase, userId, plan)`** -- sums `tokens_used` this month; rejects if over `monthlyTokens`
6. **`checkCache(supabase, promptHash)`** -- looks up `generation_cache` by hash; returns cached response or null
7. **`saveCache(supabase, promptHash, functionName, responseData)`** -- inserts into `generation_cache`
8. **`logUsage(supabase, userId, functionName, generationType, tokensUsed, promptHash)`** -- inserts into `usage_logs`
9. **`hashPrompt(content)`** -- SHA-256 hash of prompt string
10. **`validateInputLength(fields, maxLen)`** -- checks each field is under character limit

## Edge Function Changes

### All AI functions (`process-briefing`, `generate-script`, `manual-generate`, `generate-ideas`, `generate-hooks`, `score-script`)

Add at the top of each handler (after auth/setup, before AI call):

1. Import shared helper
2. Resolve `userId` and `plan`
3. Validate input lengths (2000 chars per field, 4000 for descriptions)
4. Check rate limit → 429 if exceeded
5. Check daily limit → 429 if exceeded  
6. Check monthly briefings/scripts limit → 403 with user-friendly message
7. Check monthly token budget → 403 with generic "limit reached" message
8. Check cache → return cached result if found
9. Add `max_tokens: 3700` to AI gateway request body (1500 for briefing-only, 2200 for script-only)
10. After successful AI response: log usage with estimated tokens, save to cache

Error messages shown to users reference briefing/script limits only, never tokens.

## Files

| File | Change |
|---|---|
| Migration SQL | Create `usage_logs` and `generation_cache` tables |
| `supabase/functions/_shared/usage-guard.ts` | New shared helper module |
| `supabase/functions/process-briefing/index.ts` | Add guards, caching, token limits, usage logging |
| `supabase/functions/generate-script/index.ts` | Add guards, caching, token limits, usage logging |
| `supabase/functions/manual-generate/index.ts` | Add guards, caching, token limits, usage logging |
| `supabase/functions/generate-ideas/index.ts` | Add guards, caching, token limits, usage logging |
| `supabase/functions/generate-hooks/index.ts` | Add guards, caching, token limits, usage logging |
| `supabase/functions/score-script/index.ts` | Add guards, caching, token limits, usage logging |

No UI changes. No flow changes. Backend-only protection.

