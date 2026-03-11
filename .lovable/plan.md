

# Ajustar Conteúdo Demo para Estratégia de Conteúdo do Nicho

## Problema

Quando o usuário digita um nicho customizado (ex: "odontologia"), o `getDemoData()` gera textos genéricos sobre "conectar com empresas" e "captação de clientes". O conteúdo deve focar em **estratégia de conteúdo para atrair, engajar e gerar valor** para o público do nicho — não sobre concorrência ou conexão com empresas.

## Alteração

### `src/components/landing/HeroAnimation.tsx`

Atualizar o bloco `if (!demoDataMap[chip])` na função `getDemoData()` (linhas 178-188) para gerar textos focados em estratégia de conteúdo:

- **persona**: "Público de {nicho} que busca informação, inspiração e soluções práticas nas redes sociais."
- **posicionamento**: "Autoridade em {nicho} que educa e inspira através de conteúdo estratégico."
- **formAnswers.contexto**: "{nicho} — criação de conteúdo estratégico para atrair e engajar o público ideal."
- **formAnswers.publico**: "Pessoas interessadas em {nicho} que consomem conteúdo educativo e inspirador."
- **formAnswers.resultado**: "Atrair seguidores qualificados e gerar valor com conteúdo estratégico"
- **briefing.objetivo**: "Criar conteúdo que atraia, eduque e engaje o público de {nicho}"
- **briefing.publico**: "Público interessado em {nicho}, busca conteúdo útil e inspirador"

Também atualizar `defaultDemo` (roteiro e carrossel) para remover referências a "leads", "vendas" e "clientes" — substituir por linguagem de **atração, educação e valor**.

Atualizar o `defaultDemo.roteiro`:
- gancho: "Seu conteúdo sobre {nicho} não alcança as pessoas certas…"
- desenvolvimento: focado em estratégia de conteúdo (funil de atração, educação, engajamento)
- cta: "Comece agora: crie conteúdo estratégico para seu nicho."

Atualizar `defaultDemo.carrossel` com slides focados em estratégia de conteúdo (hook sobre engajamento, problema de conteúdo genérico, solução com funil de conteúdo, etc.)

## Arquivo

| Arquivo | Alteração |
|---|---|
| `src/components/landing/HeroAnimation.tsx` | Reescrever textos do fallback customizado e defaultDemo para focar em estratégia de conteúdo |

