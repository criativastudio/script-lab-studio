

# Ajustes de tipografia e dark mode na Landing Page

## Problemas

1. **Headline do hero preto no dark mode**: linha 242 usa `text-zinc-900` (cor fixa) em vez de `text-foreground`. Por isso o texto principal "Roteiros estratégicos que geram resultado..." continua preto quando o tema escuro é ativado.
2. **Títulos das seções pequenos**: hoje `text-3xl md:text-4xl` deixa as seções (Problema, Solução, Exemplo, Benefícios, Planos, CTA Final) com cabeçalhos muito tímidos no desktop e mobile.
3. **Descrições pouco legíveis**: hoje `text-base md:text-lg font-light` — fonte fina e tamanho médio dificultam leitura, principalmente no mobile.

## Correções (somente em `src/pages/LandingPage.tsx`)

### A. Hero headline — corrigir cor no dark mode
- Linha 242: trocar `text-zinc-900` → `text-foreground`.
- Resultado: a palavra principal acompanha o tema (preto no claro, branco no escuro), enquanto o `<span class="text-gradient-primary">` permanece colorido.

### B. Títulos principais de cada seção — aumentar
Aplicar nos `<h2>` das seções (linhas 331, 364, 406, 455, 504, 552, 626):
- De: `text-3xl md:text-4xl`
- Para: `text-4xl sm:text-5xl md:text-6xl`
- Mantém `font-display`, `font-light`, `tracking-tight` e `leading-[1.1]`.

### C. Descrições de cada seção — aumentar e melhorar leitura
Aplicar nos `<p>` de descrição logo abaixo dos títulos (linhas 334, 367, 409, 458, 555, 629):
- De: `text-base md:text-lg font-light`
- Para: `text-lg md:text-xl font-normal leading-relaxed`
- Mantém `text-muted-foreground` e largura máxima atual.

### D. Pequenos refinamentos coerentes
- Aumentar margem inferior dos títulos de `mb-6` → `mb-8` para dar respiro com a fonte maior.
- Hero description (linha 252) também sobe de `text-sm md:text-base` → `text-base md:text-lg` para coerência visual.

## O que NÃO muda

- Estrutura, ordem das seções, animações, ícones, dados.
- Cores de gradiente, badges, cards de problemas/benefícios/planos.
- Componentes auxiliares (`AIInputDemo`, `FeatureTabs`, `SocialProof`, `HeroAnimation`).
- `index.css`, tokens de tema, `tailwind.config.ts`.

## Resultado esperado

1. Texto principal do hero muda corretamente para branco no dark mode.
2. Títulos das seções ocupam mais espaço visual (mais impactantes em desktop e mobile).
3. Descrições maiores e com peso normal — leitura confortável em qualquer dispositivo.

