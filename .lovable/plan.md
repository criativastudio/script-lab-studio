

# Aumentar headlines (+10%) e textos descritivos (+5%) nas seções 2-11

## Lógica

- **Headlines** atuais: `text-xl md:text-3xl` → **`text-2xl md:text-4xl`** (+10%)
- **Textos descritivos** abaixo das headlines atuais: `text-base font-light` → **`text-base md:text-lg font-light`** (+5%); onde é `text-sm` → **`text-sm md:text-base font-light`**

## Mudanças por arquivo

### `src/pages/LandingPage.tsx`

| Seção | Linha | Elemento | Antes | Depois |
|-------|-------|----------|-------|--------|
| 3 - Product Scroll | 258 | h2 | `text-xl sm:text-2xl md:text-3xl` | `text-2xl sm:text-3xl md:text-4xl` |
| 3 | 261 | p | `text-sm font-light` | `text-sm md:text-base font-light` |
| 5 - Workflow | 289 | h2 | `text-xl md:text-3xl` | `text-2xl md:text-4xl` |
| 5 | 292 | p | `text-base font-light` | `text-base md:text-lg font-light` |
| 6 - Problema | 329 | h2 | `text-xl md:text-3xl` | `text-2xl md:text-4xl` |
| 6 | 332 | p | `text-base font-light` | `text-base md:text-lg font-light` |
| 7 - Roteiro | 376 | h2 | `text-xl md:text-3xl` | `text-2xl md:text-4xl` |
| 7 | 379 | p | `text-base font-light` | `text-base md:text-lg font-light` |
| 8 - Benefícios | 423 | h2 | `text-xl md:text-3xl` | `text-2xl md:text-4xl` |
| 9 - Planos | 469 | h2 | `text-xl md:text-3xl` | `text-2xl md:text-4xl` |
| 9 | 472 | p | `text-base font-light` | `text-base md:text-lg font-light` |
| 10 - Final CTA | 533 | h2 | `text-xl md:text-3xl` | `text-2xl md:text-4xl` |
| 10 | 536 | p | `text-base font-light` | `text-base md:text-lg font-light` |

### `src/components/landing/AIInputDemo.tsx`
- h2 (linha 85): `text-xl md:text-3xl` → `text-2xl md:text-4xl`
- p desc (linha 88): `text-base font-light` → `text-base md:text-lg font-light`

### `src/components/landing/FeatureTabs.tsx`
- h2 (linha 77): `text-xl md:text-3xl` → `text-2xl md:text-4xl`
- p desc (linha 80): `text-base font-light` → `text-base md:text-lg font-light`

### `src/components/landing/SocialProof.tsx`
- h2 (linha 43): `text-xl md:text-3xl` → `text-2xl md:text-4xl`
- p desc (linha 46): `text-base font-light` → `text-base md:text-lg font-light`

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/LandingPage.tsx` | Headlines +10%, desc +5% em 8 seções |
| `src/components/landing/AIInputDemo.tsx` | Headline +10%, desc +5% |
| `src/components/landing/FeatureTabs.tsx` | Headline +10%, desc +5% |
| `src/components/landing/SocialProof.tsx` | Headline +10%, desc +5% |

