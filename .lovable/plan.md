

# Headlines em duas linhas, gradiente animado e espaçamento reduzido

## Mudanças

### 1. `src/index.css` — Gradiente animado alternando cores

Atualizar `.text-gradient-primary` para usar uma animação suave que alterna entre #cbacef e #f5cea5:

```css
.text-gradient-primary {
  background: linear-gradient(90deg, #cbacef, #f5cea5, #cbacef, #f5cea5);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-text-shift 6s ease infinite;
}

@keyframes gradient-text-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
```

### 2. `src/pages/LandingPage.tsx` — Headlines em duas linhas + espaçamento

**Hero headline (linha 174):** Adicionar `max-w-3xl mx-auto` para forçar quebra em duas linhas e reduzir `leading` para mínimo:
```tsx
className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light leading-[1.05] tracking-tight text-foreground mb-8 max-w-3xl mx-auto"
```
Quebrar o texto com `<br className="hidden md:block" />` ou usar `max-w` para forçar a quebra natural.

**Todas as seções com `py-28 md:py-36`** → reduzir para `py-16 md:py-24`:
- Seção AI Workflow Steps (linha 280): `py-28 md:py-36` → `py-16 md:py-24`
- Seção Problema (linha 320): `py-28 md:py-36` → `py-16 md:py-24`
- Seção Exemplo de Roteiro (linha 367): `py-28 md:py-36` → `py-16 md:py-24`
- Seção Benefícios (linha 414): `py-28 md:py-36` → `py-16 md:py-24`
- Seção Planos (linha 451): `py-28 md:py-36` → `py-16 md:py-24`
- Seção Final CTA (linha 517): `py-28 md:py-36` → `py-16 md:py-24`

**Headlines longas — forçar duas linhas com max-width:**
- Hero: "Roteiros Profissionais com IA em Minutos" → adicionar `max-w-2xl mx-auto`
- Benefícios (linha 423): "Tudo que você precisa para criar conteúdo estratégico" → adicionar `max-w-xl mx-auto`
- Final CTA (linha 526): "Comece a Criar Roteiros com IA Hoje" → adicionar `max-w-md mx-auto`

### 3. Componentes filhos — Reduzir espaçamento

- `AIInputDemo.tsx` (linha 65): `py-28 md:py-36` → `py-16 md:py-24`
- `FeatureTabs.tsx` (linha 75): `py-28 md:py-36` → `py-16 md:py-24`, e `mb-20` → `mb-12`
- `SocialProof.tsx` (linha 35): `py-28 md:py-36` → `py-16 md:py-24`

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/index.css` | Gradiente animado alternando cores |
| `src/pages/LandingPage.tsx` | Headlines com max-w para duas linhas + reduzir py em todas as seções |
| `src/components/landing/AIInputDemo.tsx` | Reduzir padding vertical |
| `src/components/landing/FeatureTabs.tsx` | Reduzir padding vertical |
| `src/components/landing/SocialProof.tsx` | Reduzir padding vertical |

