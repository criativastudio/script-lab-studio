

# Corrigir Layout Mobile — Eliminar Rolagem Horizontal

## Diagnóstico

Identifiquei as causas da rolagem horizontal no mobile (390px):

1. **`App.css`** — `#root { padding: 2rem; max-width: 1280px; }` aplica padding de 32px em todos os lados do root, empurrando o conteúdo para fora da tela. Este arquivo é o template padrão do Vite e não deveria estar estilizando o root.

2. **Seção de Planos** — O card destacado com `scale-[1.03]` ultrapassa o container no mobile. A section não tem `overflow-hidden`.

3. **`glow-orb` na seção de Planos** — Elemento de 350px absolutamente posicionado sem `overflow-hidden` no parent.

4. **`ContainerScroll`** — O container com `p-2 md:p-20` e largura `max-w-5xl` pode ultrapassar em telas pequenas.

## Alterações

### `src/App.css`
- Remover as regras `max-width`, `padding` e `text-align` do `#root` que estão causando o overflow global.

### `src/pages/LandingPage.tsx`
- Adicionar `overflow-hidden` na seção de planos (`#planos`).
- Remover `scale-[1.03]` do card destacado no mobile (aplicar apenas em `md:`).

### `src/components/ui/container-scroll-animation.tsx`
- Garantir que o container principal tenha `overflow-hidden` e não exceda `100vw`.

| Arquivo | Alteração |
|---|---|
| `src/App.css` | Remover padding/max-width do #root |
| `src/pages/LandingPage.tsx` | overflow-hidden na seção planos + scale condicional |
| `src/components/ui/container-scroll-animation.tsx` | max-w e overflow seguro |

