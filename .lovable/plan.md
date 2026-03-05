

# Reduzir textos secundários em 5% e aplicar fonte mais fina

## Mudanças em `src/pages/LandingPage.tsx`

Todos os textos secundários (parágrafos descritivos com `text-muted-foreground`) serão reduzidos um nível de tamanho e receberão `font-light` (peso 300):

| Local | Antes | Depois |
|-------|-------|--------|
| Hero subtitle (linha 185) | `text-base md:text-lg` | `text-sm md:text-base font-light` |
| "Ver como funciona" (linha 206) | `text-sm font-medium` | `text-xs font-light` |
| "Sem cartão" (linha 217) | `text-xs` | `text-xs font-light` |
| Plataforma em ação (linha 261) | `text-base` | `text-sm font-light` |
| Como funciona desc (linha 292) | `text-lg` | `text-base font-light` |
| Steps desc (linha 311) | `text-sm` | `text-xs font-light` |
| Problemas desc (linha 332) | `text-lg` | `text-base font-light` |
| Problema items (linha 355) | `text-sm` | `text-xs font-light` |
| Roteiro desc (linha 379) | `text-lg` | `text-base font-light` |
| Roteiro scene desc (linha 402) | `text-sm` | `text-xs font-light` |
| Benefits desc (linha 446) | `text-sm` | `text-xs font-light` |
| Planos desc (linha 472) | `text-lg` | `text-base font-light` |
| Plan item desc (linha 495) | `text-sm` | `text-xs font-light` |

Mesma lógica aplicada aos componentes filhos:

### `src/components/landing/AIInputDemo.tsx`
Textos descritivos: reduzir tamanho + adicionar `font-light`.

### `src/components/landing/FeatureTabs.tsx`
Textos descritivos: reduzir tamanho + adicionar `font-light`.

### `src/components/landing/SocialProof.tsx`
Textos descritivos: reduzir tamanho + adicionar `font-light`.

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/LandingPage.tsx` | Reduzir tamanho e adicionar font-light em todos os textos secundários |
| `src/components/landing/AIInputDemo.tsx` | Idem |
| `src/components/landing/FeatureTabs.tsx` | Idem |
| `src/components/landing/SocialProof.tsx` | Idem |

