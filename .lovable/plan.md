

# Tutorial 3D com Auto-preenchimento do Formulário

## Problema Atual

No demo mode, os dados aparecem todos de uma vez em cards estáticos. Falta a sensação de "formulário sendo preenchido automaticamente" antes de mostrar os resultados (briefing → roteiro → carrossel).

## Alterações

### `src/components/landing/HeroAnimation.tsx`

Refatorar o demo mode para seguir 5 fases sequenciais com auto-transição:

1. **Fase 1 — Formulário (3s)**: Exibir as 4 perguntas estratégicas em campos de formulário com efeito de typing automático, preenchendo cada campo sequencialmente com base no nicho informado. Campos: Contexto do Negócio, Público Ideal, Resultado Desejado, Voz da Marca.

2. **Fase 2 — Processando (2s)**: Animação de loading com texto "Gerando estratégia completa..."

3. **Fase 3 — Briefing Completo (3s)**: Exibir o briefing gerado com Persona, Posicionamento, Tom de Voz e Funil — revelados sequencialmente com animação.

4. **Fase 4 — Roteiro (3s)**: Exibir Gancho, Desenvolvimento e CTA do roteiro gerado, aparecendo um a um.

5. **Fase 5 — Carrossel Estratégico (4s)**: Grid 3x2 com os 6 slides aparecendo sequencialmente.

**Implementação:**
- Novo estado `demoPhase: "form" | "processing" | "briefing" | "script" | "carousel"` com auto-transição via `useEffect`
- Na fase "form": reutilizar o efeito de typing existente, adaptado para os 4 campos do formulário com valores dinâmicos do `getDemoData()`
- Indicador de progresso no topo mostrando as 5 etapas (1-2-3-4-5)
- Manter `select-none` e bloqueio de copy em todo o container
- O `getDemoData` já gera dados dinâmicos para nichos customizados — será reaproveitado

### Dados do formulário por fase

Para a fase "form", adicionar ao `DemoStepData` um campo `formAnswers` com os 4 valores que serão "digitados":
```
formAnswers: {
  contexto: "Clínica de {nicho} premium focada em...",
  publico: "Mulheres 25-45 anos que buscam...",
  resultado: "Agendar avaliação gratuita",
  voz: "Especialista e inspiradora"
}
```

Estes valores já existem distribuídos em `persona`, `briefing.publico`, `briefing.objetivo` — serão mapeados para os campos do formulário.

## Arquivos

| Arquivo | Alteração |
|---|---|
| `src/components/landing/HeroAnimation.tsx` | Refatorar demo mode com 5 fases sequenciais + auto-preenchimento do formulário |

