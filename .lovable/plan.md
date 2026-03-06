

# Fix: Briefing Link "Link inválido ou expirado"

## Root Cause

The `briefing_requests` table RLS policies are inconsistent:
- **Anon SELECT**: `qual: true` — any unauthenticated user can read all rows
- **Authenticated SELECT**: `user_id = auth.uid() OR has_role(admin)` — only the creator or admin can read

When the admin (or any logged-in user) opens the briefing link in the same browser where they're authenticated, the Supabase client sends the auth token. The request uses the `authenticated` role, and since the briefing's `user_id` doesn't match `auth.uid()` (and the user may not be admin), the query returns no results → "Link inválido ou expirado."

## Fix

**Database migration**: Drop the existing authenticated SELECT policy and recreate it to also allow token-based access. Since anon already allows `true` (no security regression), the simplest fix is to also allow authenticated users unrestricted SELECT on `briefing_requests`.

```sql
DROP POLICY "Users can view own briefing_requests" ON public.briefing_requests;

CREATE POLICY "Users can view own briefing_requests"
ON public.briefing_requests
FOR SELECT
TO authenticated
USING (true);
```

This aligns the authenticated SELECT policy with the existing anon SELECT policy. No other files need changes.

## Files

| File | Change |
|---|---|
| Migration SQL | Update authenticated SELECT policy on `briefing_requests` |

