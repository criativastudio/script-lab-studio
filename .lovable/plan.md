## Objetivo

Refinar APENAS a versão mobile da `LandingPage` (`src/pages/LandingPage.tsx`) — densidade visual, headlines maiores e blocos mais robustos — sem tocar em nada acima de `md:`. Ajustar também o `ContainerScroll` (`src/components/ui/container-scroll-animation.tsx`) para que o "modal 3D" da Sessão 3 termine de abrir (rotação chega a 0°) quando o usuário rolar ~85% do viewport, antes do card ficar totalmente centralizado.

---

## Mudanças

### 1. `src/components/ui/container-scroll-animation.tsx` — Sessão 3 (modal 3D)

Hoje o modal só fica 100% aberto (rotateX = 0) quando `scrollYProgress = 0.5`, ou seja, exatamente quando o card está centralizado. No mobile isso atrasa demais a abertura.

- Trocar o `offset` do `useScroll` por `["start end", "center center"]` para começar a animar assim que a seção entra na tela.
- Reescalar os keyframes apenas no mobile para que a rotação chegue a 0 muito antes da centralização (≈ ponto 0.85 do progresso visível, equivalente a ~85% da rolagem da tela):

```ts
// mobile  → abre rápido e estabiliza antes do centro
const rotate = useTransform(scrollYProgress, [0, 0.55, 1], isMobile ? [70, 0, 0] : [75, 0, -5]);
const scale  = useTransform(scrollYProgress, [0, 0.55, 1], isMobile ? [0.85, 1, 1] : [0.9, 1, 0.95]);
const translate = useTransform(scrollYProgress, [0, 0.55, 1], isMobile ? [40, 0, 0] : [80, 0, -80]);
```

- Reduzir altura do wrapper no mobile (`h-[40rem]` → `h-[44rem]`) e o padding vertical interno (`py-10` → `py-6`) para o card ocupar mais área útil.
- Aumentar a altura do `Card` no mobile (`h-[30rem]` → `h-[34rem]`) para um look mais "app".

Desktop permanece intocado (todos os valores `md:` e o branch `!isMobile` ficam idênticos).

### 2. `src/pages/LandingPage.tsx` — densidade e tipografia mobile

Todas as alterações usam classes base (mobile) e mantêm os breakpoints `sm:` / `md:` / `lg:` existentes intactos.

**Hero (Sessão 1)**
- Headline: `text-2xl` → `text-4xl` no mobile (mantém `sm:text-4xl md:text-4xl lg:text-7xl`).
- Reduzir `min-h-screen` para `min-h-[88vh]` no mobile (`min-h-[88vh] md:min-h-screen`) e `mb-8` da headline para `mb-6`, eliminando vazio acima do CTA.
- Descrição: `text-base` → `text-lg` mobile; `mb-12` → `mb-8`.
- CTAs: empilhar em coluna full-width no mobile (`flex-col w-full max-w-xs mx-auto`), botões `h-12` para padrão app.
- Reduzir `mt-8` dos ícones de plataformas para `mt-6`.

**Seções com headline `text-4xl sm:text-5xl ...`** (Sessões "Como funciona", "Problema", "Exemplo de roteiro", "Benefícios", "Planos", "CTA final"):
- Mobile sobe de `text-4xl` → `text-[2.75rem] leading-[1.05]` para preencher melhor a largura do iPhone, mantendo `sm:text-5xl md:text-6xl lg:text-7xl`.
- Padding vertical da seção: `py-16` → `py-12` no mobile (`py-12 md:py-24`).
- Parágrafo descritivo: `text-lg` → `text-base` para hierarquia mais clara abaixo das headlines maiores.

**Cards "Problema" (4 cards)**
- Grid: `grid-cols-1` → `grid-cols-2` no mobile (mantém `sm:grid-cols-2 lg:grid-cols-4`), eliminando a coluna única "vazia".
- `min-h-[14rem]` → `min-h-[11rem]` no mobile.
- Padding interno do card: `p-6` → `p-4` mobile; ícone `h-12 w-12` → `h-10 w-10`; título `text-lg` → `text-base`.

**Steps "Como funciona" (3 itens)**
- No mobile, virar layout horizontal compacto: usar `flex-row items-start gap-4 text-left` (em vez de `flex-col items-center text-center`) via `flex-row md:flex-col items-start md:items-center text-left md:text-center`.
- Bola do número: `h-20 w-20` → `h-14 w-14` mobile, mantendo `md:h-20 md:w-20`.
- Descrição: `text-xs` → `text-sm` mobile.

**Cards "Benefícios"**
- `min-h-[14rem]` → `min-h-[12rem]` mobile.
- Padding interno `p-6` → `p-5` mobile.
- Descrição `text-xs` → `text-sm` mobile.

**Cards "Planos"**
- Padding `p-8` → `p-6` mobile (`p-6 md:p-8`).
- `space-y-3 mb-8` da feature list → `space-y-2 mb-6` mobile.
- Garantir destaque do plano em mobile: remover `scale-[1.03]` no mobile (vira `md:scale-[1.03]`) para não ultrapassar a viewport.

**CTA final**
- Padding `p-10` → `p-8` mobile; headline `text-4xl` → `text-[2.5rem] leading-[1.05]`.
- Botões empilhados full-width já funciona via `flex-col sm:flex-row`; apenas adicionar `w-full sm:w-auto` em ambos para preencher.

**Exemplo de roteiro (timeline)**
- Padding do card: `p-4` → `p-5` mobile e descrição `text-xs` → `text-sm` para look mais robusto.

### 3. Sem mudanças em desktop

Todas as classes acima de `md:` permanecem exatamente como estão hoje. O QA visual deve confirmar isso comparando antes/depois em ≥ 768px.

---

## Detalhes técnicos

- Detecção mobile no `ContainerScroll` já usa `window.innerWidth <= 768` — reutilizada.
- Nenhum novo dependency. Sem alterações em rotas, edge functions, RLS ou banco.
- Sem alterações em `Auth.tsx`, `ContentGenerator`, etc. — escopo restrito a `LandingPage.tsx` e `container-scroll-animation.tsx`.
- Acessibilidade: contraste e tamanhos de toque mantidos (botões mobile passam para `h-12`, ≥ 48px).

## Critérios de aceite

1. Em viewport 390×844 (iPhone 12/13/14): hero ocupa quase toda a tela sem grandes vazios; headlines visivelmente maiores; cards de problema em 2 colunas; steps horizontais compactos.
2. Sessão 3: ao rolar do topo da seção, o card 3D termina a rotação (chapado) antes de chegar ao centro vertical da tela — perceptível por volta de ~85% da rolagem do viewport.
3. Em viewport ≥ 1024px: layout idêntico ao atual (visual diff zero).
