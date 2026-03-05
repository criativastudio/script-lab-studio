

# Corrigir cores do RainbowButton no modo claro

## Problema

O `RainbowButton` usa fundo escuro (`#121213`) no modo claro e fundo branco (`#fff`) no modo escuro — o contrário do esperado. O texto interno fica ilegível no modo claro.

## Solução

Inverter os gradientes de fundo e ajustar a cor do texto:

### `src/components/ui/rainbow-button.tsx`

| Propriedade | Antes (light) | Depois (light) |
|-------------|---------------|-----------------|
| Background | `#121213` (preto) | `#fff` (branco) |
| Background overlay | `rgba(18,18,19,...)` | `rgba(255,255,255,...)` |
| Text color | `text-primary-foreground` | `text-foreground dark:text-background` |

| Propriedade | Antes (dark) | Depois (dark) |
|-------------|--------------|----------------|
| Background | `#fff` (branco) | `#121213` (preto) |
| Background overlay | `rgba(255,255,255,...)` | `rgba(18,18,19,...)` |

Ou seja, trocar as linhas de light e dark mode entre si, e ajustar o texto para ter contraste adequado em ambos os modos.

| Arquivo | Mudança |
|---------|---------|
| `src/components/ui/rainbow-button.tsx` | Inverter gradientes light/dark e ajustar cor do texto |

