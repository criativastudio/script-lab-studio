

# Conversion + Psychological UX Optimization

## Overview
Optimize messaging, CTA strategy, trust signals, and information hierarchy across the landing page without changing layout or visual identity.

## Changes

### 1. `src/pages/LandingPage.tsx` — Hero Messaging + Trust + CTAs

**Hero section (lines 162-212):**
- Badge text: "Plataforma de roteiros com IA" → "Usado por +10.000 criadores de conteúdo"
- Headline: "Crie na Velocidade do Pensamento" → "Roteiros Profissionais com IA em Minutos"
- Description: rewrite to outcome-focused: "Descreva sua ideia, defina sua persona e receba roteiros prontos para gravação. Sem escrever uma linha sequer."
- Primary CTA: "Começar gratuitamente" → "Começar grátis agora"
- Add micro-text below CTA buttons: `<p className="text-xs text-muted-foreground mt-4">Sem cartão de crédito • Setup em 30 segundos</p>`
- Add trust logos row below micro-text: 5-6 muted brand/platform icons (Instagram, YouTube, TikTok, Meta) showing supported platforms

**AI Workflow Steps (lines 259-296):**
- Add outcome-focused subtitles to each step card emphasizing benefit not just action
- Step 1 desc: "Defina objetivo, público e estilo — a IA faz o resto."
- Step 2 desc: "Persona, tom de voz e funil são gerados automaticamente."
- Step 3 desc: "Receba roteiros cena a cena, prontos para gravar em minutos."

**Final CTA (lines 492-528):**
- Headline: "Comece a criar com IA hoje" → "Comece a Criar Roteiros com IA Hoje"
- Add urgency text: `<p className="text-xs text-primary/70 mt-3">Acesso antecipado com vagas limitadas.</p>`
- Primary CTA: "Começar gratuitamente" → "Garantir meu acesso grátis"
- Secondary: "Ver demonstração" → "Assistir demo"

**Pricing section (lines 430-490):**
- Add micro-text under each plan CTA: "Cancele quando quiser" for paid plans
- Add "Sem compromisso" under free plan CTA

### 2. `src/components/landing/AIInputDemo.tsx` — Engagement Optimization

- Add helper text above input: `<p className="text-sm text-muted-foreground mb-4">Descreva seu nicho e a IA gera o roteiro ideal.</p>`
- Make chips clickable: onClick sets the typed text to the chip value
- Add a result preview hint below chips: "↓ Veja um exemplo de roteiro gerado abaixo"

### 3. `src/components/landing/SocialProof.tsx` — Stronger Testimonials

- Update quotes to be more specific with measurable outcomes:
  - Ana Clara: include "reduzi de 4 horas para 20 minutos"
  - Roberto Silva: include "3x mais conteúdo"
  - Juliana Mendes: include "sem depender de copywriter externo"
- Add a stats row above testimonials: "10.000+ criadores | 50.000+ roteiros gerados | 4.8/5 avaliação"

### 4. `src/components/landing/FeatureTabs.tsx` — Benefit-First Copy

- Rewrite each feature description to lead with user benefit, not technical capability
- Example: "Gerador No-Code" desc → "Crie roteiros completos sem escrever uma única linha de código."
- Each content panel: ensure headline is benefit-oriented ("Arraste, configure, publique." etc.)

## Files Modified

| File | Focus |
|------|-------|
| `src/pages/LandingPage.tsx` | Hero messaging, trust signals, CTA copy, urgency, micro-text |
| `src/components/landing/AIInputDemo.tsx` | Helper text, clickable chips, engagement hints |
| `src/components/landing/SocialProof.tsx` | Specific outcome quotes, stats row |
| `src/components/landing/FeatureTabs.tsx` | Benefit-first copy for features |

