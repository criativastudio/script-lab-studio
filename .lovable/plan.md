

# Corrigir Navegação Sessão 2 → Sessão 3 + Tutorial 3D

## Problema

1. `AIInputDemo` (Sessão 2) tem `onChipSelected` mas `LandingPage` não passa a prop — chips não fazem nada
2. `HeroAnimation` (Sessão 3) não recebe `selectedChip` — nunca entra em demo mode
3. O demo mode mostra fluxo antigo (briefing → roteiro simples), precisa mostrar: **briefing → roteiro → carrossel estratégico**

## Alterações

### 1. `src/pages/LandingPage.tsx`
- Adicionar estado `selectedChip` e `sectionRef` para Sessão 3
- Passar `onChipSelected` ao `AIInputDemo` que: seta o chip, faz scroll suave até Sessão 3
- Passar `selectedChip` e `onReset` ao `HeroAnimation`

### 2. `src/components/landing/HeroAnimation.tsx`
- Atualizar demo mode para mostrar 3 etapas do fluxo real:
  1. **Briefing do Cliente** — campos preenchidos (nicho, público, objetivo)
  2. **Roteiro Gerado** — gancho, desenvolvimento, CTA
  3. **Carrossel Estratégico** — 6 slides (S1 Hook, S2-S5 Desenvolvimento, S6 CTA) com preview visual
- Manter animação sequencial com delays entre etapas
- Atualizar `demoDataMap` para incluir dados de carrossel por nicho

## Arquivos

| Arquivo | Alteração |
|---|---|
| `src/pages/LandingPage.tsx` | State + scroll + props para conectar Sessão 2 → 3 |
| `src/components/landing/HeroAnimation.tsx` | Demo mode com fluxo briefing → roteiro → carrossel |

