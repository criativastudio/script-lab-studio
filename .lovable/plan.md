# Ativar Input Real na Sessão 2 + Demo Somente Visualização

## Problema Atual

A barra de pesquisa na Sessão 2 (`AIInputDemo`) usa um `<span>` para exibir texto — não é editável pelo usuário. O fluxo chip → Sessão 3 já funciona, mas o usuário não consegue digitar seu próprio nicho.

## Alterações

### 1. `src/components/landing/AIInputDemo.tsx`

- Substituir o `<span>` por um `<input>` real editável
- Quando o usuário digitar, parar a animação de typing automático (`isManual = true`)
- Manter o placeholder animado quando o input estiver vazio e não focado
- O placeholder animado deve instruir o usuario a preencher de forma correto sugerindo oque colocar, exemplo: (Meu nicho é, odontologia, médico, advogado, loja de carros, confeitaria, etc.)
- na animação da tela 3d deve mostrar de forma rapida que o cliente preenche um formulario com as 4 perguntas estrategicas e depois tras o briefing completo com roteiro, demostre também a criação de carrosseis estrategicos.
- Permitir envio com Enter além do clique na seta
- Chips continuam funcionando: ao clicar, preenchem o input

### 2. `src/components/landing/HeroAnimation.tsx`

- Quando `selectedChip` não corresponder a nenhum item do `demoDataMap`, usar o texto digitado como nome do nicho no `defaultDemo` (substituindo "Nicho:" pelo valor real)
- Adicionar `select-none` e `onCopy={e => e.preventDefault()}` em todo o container do demo mode para impedir cópia de textos
- Remover qualquer botão de copiar (se existente)

## Resultado

O usuário digita qualquer nicho no input → clica na seta ou Enter → scroll suave até Sessão 3 → tutorial 3D exibe briefing → roteiro → carrossel com o nicho informado → textos são somente visualização, sem opção de copiar.