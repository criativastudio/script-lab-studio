

# Checkout Transparente com Asaas

## Overview

Create a transparent checkout page integrated with Asaas payment gateway for credit card subscriptions. Update plan limits to match new pricing. Add billing fields to the `users` table, create a `payments` table, and build two edge functions (`process-payment`, `check-payment-status`). The checkout page follows the landing page's visual identity.

## Plan Limit Updates

The usage-guard plan limits need updating to match the new plan tiers:

| Plan | Briefings/mo | Scripts/briefing |
|------|-------------|-----------------|
| starter | 3 | 3 |
| creator_pro | 25 | 10 |
| scale_studio | unlimited (9999) | unlimited (9999) |

## Database Changes

### 1. Alter `users` table -- add billing fields
Add columns: `whatsapp`, `cpf`, `billing_name`, `cep`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `plano_ativo`, `data_expiracao`, `asaas_customer_id`, `status_assinatura`.

### 2. Create `payments` table
Columns: `id`, `user_id`, `plan`, `amount`, `status`, `asaas_payment_id`, `asaas_subscription_id`, `paid_at`, `created_at`. RLS: users read own, service role writes.

## Secrets Required

- `ASAAS_API_KEY` -- Asaas API key
- `ASAAS_BASE_URL` -- `https://sandbox.asaas.com/api/v3` (sandbox) or production URL

These must be added before the edge functions work.

## Edge Functions

### `process-payment` (verify_jwt = true)
1. Validate JWT, extract userId, verify it matches request
2. Sanitize CPF (digits only), card number (remove spaces)
3. Create or find Asaas customer (`POST /customers`)
4. For paid plans: create Asaas subscription (`POST /subscriptions`) with `billingType: CREDIT_CARD`, `cycle: MONTHLY`, card tokenization via `creditCard` + `creditCardHolderInfo` fields
5. Save to `payments` table and update `users` billing fields + `subscriptions` table
6. Rollback on failure (delete Asaas subscription if DB write fails)
7. Never log full card numbers or CVV

### `check-payment-status` (verify_jwt = true)
1. Validate JWT
2. Query `payments` table for latest payment by user
3. If has `asaas_subscription_id`, fetch status from Asaas (`GET /subscriptions/{id}`)
4. Return mapped status: ACTIVE, PENDING, APPROVED, REJECTED

## Frontend

### New page: `src/pages/Checkout.tsx`
Route: `/checkout/:plan` (protected)

Follows the landing page visual identity (dark theme, lavender/peach palette, Blauer Nue font, glass-card styling).

**Form sections:**
1. **Plan summary** -- shows selected plan name, price, features
2. **Personal data** -- CPF (mask + Luhn-like digit validation), billing name
3. **Address** -- CEP (mask, auto-fill via ViaCEP `https://viacep.com.br/ws/{cep}/json/`), logradouro, numero, complemento, bairro, cidade, estado
4. **Card data** -- card holder name, card number (mask + Luhn validation), expiry MM/YY, CVV (3-4 digits)

**Behavior:**
- Real-time field validation with error messages
- Input masks for CPF (`999.999.999-99`), card (`9999 9999 9999 9999`), CEP (`99999-999`)
- On submit: call `process-payment` edge function, show loading state
- After success: poll `check-payment-status` every 2s for up to 60s
- On confirmed: redirect to `/dashboard` with success toast
- On error: show friendly error message, allow retry

### Update `src/pages/LandingPage.tsx`
Change plan button `onClick` to navigate to `/checkout/starter`, `/checkout/creator-pro`, `/checkout/scale-studio` (Starter goes to `/auth` for free signup).

### Update `src/App.tsx`
Add route: `<Route path="/checkout/:plan" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />`

## Update Usage Guards

Update `supabase/functions/_shared/usage-guard.ts` PLAN_LIMITS to match new plan values (3/3, 25/10, 9999/9999).

## Files

| File | Change |
|---|---|
| Migration SQL | Add billing columns to `users`, create `payments` table |
| `supabase/functions/process-payment/index.ts` | New -- Asaas payment processing |
| `supabase/functions/check-payment-status/index.ts` | New -- payment status polling |
| `supabase/config.toml` | Register both new functions with `verify_jwt = true` |
| `src/pages/Checkout.tsx` | New -- checkout page with form |
| `src/App.tsx` | Add checkout route |
| `src/pages/LandingPage.tsx` | Update plan button navigation |
| `supabase/functions/_shared/usage-guard.ts` | Update plan limits |

