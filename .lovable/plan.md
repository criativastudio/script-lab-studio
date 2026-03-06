

# Plan-Based Usage Limits and Upgrade Prompts

## Overview

Add client-side plan detection and limit enforcement across the CRM page. All validations happen before actions (create client, create briefing/project, generate ideas, generate scripts). Limit messages include an "Upgrade agora" button linking to `/checkout/creator_pro`.

## Plan Limits (client-side constants)

Create a shared hook `src/hooks/usePlanLimits.ts` that:
- Queries `subscriptions` table for the user's active plan (same logic as `getUserPlan` in usage-guard.ts)
- Returns plan name + limits object
- Caches result in state, re-fetches on user change

```text
Plan Constants:
starter:      { clients: 3, briefings: 3, ideasPerBriefing: 3, scriptsPerBriefing: 3, scriptsPerMonth: 9 }
creator_pro:  { clients: 25, briefings: 25, ideasPerBriefing: 10, scriptsPerBriefing: 10, scriptsPerMonth: 250 }
scale_studio: { clients: 9999, briefings: 9999, ideasPerBriefing: 9999, scriptsPerBriefing: 9999, scriptsPerMonth: 9999 }
```

## Reusable Upgrade Prompt Component

Create `src/components/UpgradePrompt.tsx` — a small inline alert with message + "Upgrade agora" button that navigates to `/checkout/creator_pro`.

## Changes to `src/pages/CRM.tsx`

### 1. Client Limit (handleCreateClient)
Before inserting, count distinct `business_name` values from `clients` state. If `>= limits.clients`, show toast with upgrade message and return.

### 2. Briefing/Project Limit (handleCreateProject, handleCreateClient)
Before creating, query `briefing_requests` count for current month. If `>= limits.briefings`, block with toast + upgrade.

### 3. Video Ideas Limit (handleGenerateIdeas)
Pass `Math.min(count, limits.ideasPerBriefing)` to the edge function. If user requested more, show toast explaining the cap.

### 4. Script Generation Limit (handleGenerateScriptsFromIdeas)
Before generating:
- Query monthly script count from `scripts` table
- Cap selected ideas to `min(selectedIdeas.size, limits.scriptsPerBriefing, remainingMonthlyScripts)`
- If capped, show toast with explanation + upgrade button
- If monthly limit reached, block entirely

### 5. Manual Generate (handleManualGenerate)
Same monthly script check before proceeding.

## Files Modified

| File | Change |
|---|---|
| `src/hooks/usePlanLimits.ts` | New hook: fetch user plan + return limits |
| `src/components/UpgradePrompt.tsx` | New reusable upgrade message component |
| `src/pages/CRM.tsx` | Import hook, add limit checks before create/generate actions |
| `src/components/crm/ContentIdeasTab.tsx` | Pass max ideas limit for UI display |

## What Does NOT Change
- No changes to edge functions (they already have their own guards)
- No changes to the briefing form flow
- No database schema changes
- No changes to existing UI layout — only adding validation gates and toast messages

