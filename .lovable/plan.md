

# Lógica de Conteúdo "Conecta-Entretém-Vende" — Roteiros e Carrosséis

## Objetivo

Adaptar os prompts de IA para gerar conteúdo que **conecta antes de vender**, usando identificação imediata, storytelling fluido e oferta orgânica. Aplicar em todas as gerações de roteiros e ideias de carrosséis sem engessar a estrutura.

## Princípios da nova lógica

1. **Abertura por identificação** — começar com problema/situação/pensamento comum do público (não com "olá" ou apresentação).
2. **Storytelling natural** — narrativa leve e fluida, não bullet points de venda.
3. **Entretenimento antes de venda** — evitar tom de anúncio nos primeiros segundos/slides.
4. **Oferta orgânica** — inserir CTA dentro da história, não como bloco separado.
5. **Experiência prática** — mostrar uso, resultado, bastidores, reação real.
6. **Linguagem simples e envolvente** — profissional mas conversacional.
7. **Flexibilidade** — não obrigar todos os elementos; adaptar tom (divertido/sério) ao nicho.
8. **Anti-engessamento** — proibir estrutura rígida tipo "GANCHO → PROBLEMA → SOLUÇÃO → CTA" visível.

## Arquivos afetados (Edge Functions)

| Arquivo | O que muda |
|---|---|
| `supabase/functions/generate-script/index.ts` | Adicionar bloco "Lógica de Conteúdo" no system prompt (modo estratégico + legado) |
| `supabase/functions/generate-carousel/index.ts` | Adicionar bloco no system prompt para modos `ideas` e `script` |
| `supabase/functions/generate-ideas/index.ts` | Reforçar abertura por identificação e ângulos de storytelling |
| `supabase/functions/manual-generate/index.ts` | Adicionar bloco no system prompt |
| `supabase/functions/process-briefing/index.ts` | Adicionar bloco no system prompt |
| `supabase/functions/generate-hooks/index.ts` | Reforçar hooks por identificação e situação comum |

## Bloco a inserir nos system prompts

```text
LÓGICA DE CONTEÚDO "CONECTA-ENTRETÉM-VENDE" (OBRIGATÓRIA):

1. ABERTURA POR IDENTIFICAÇÃO: Sempre comece com um problema, 
   situação ou pensamento comum do público — nunca com 
   apresentação pessoal, saudação ou anúncio direto.

2. STORYTELLING NATURAL: Use narrativa leve e fluida. 
   Conte como história, não como lista de benefícios.

3. ENTRETENIMENTO ANTES DE VENDA: Os primeiros segundos/slides 
   devem prender atenção e gerar conexão. Tom de anúncio é PROIBIDO 
   na abertura.

4. OFERTA ORGÂNICA: Insira o CTA/oferta dentro da história 
   de forma natural — nunca como bloco isolado tipo "COMPRE AGORA".

5. EXPERIÊNCIA PRÁTICA: Sempre que possível, mostre uso real, 
   resultado, bastidores ou reação concreta — não apenas teoria.

6. LINGUAGEM SIMPLES E PROFISSIONAL: Conversacional, envolvente, 
   sem jargão desnecessário, mas mantendo autoridade do nicho.

7. FLEXIBILIDADE OBRIGATÓRIA: 
   - NÃO use todos os elementos em todo conteúdo.
   - Adapte tom (divertido ou sério) ao contexto do cliente.
   - EVITE estrutura visível tipo "GANCHO/DESENVOLVIMENTO/CTA" 
     escrita literalmente — flua como narrativa contínua.

8. ANTI-PROPAGANDA: Antes de finalizar, valide: "Isso parece 
   anúncio?" Se sim, reescreva para parecer conversa, história 
   ou observação genuína.

OBJETIVO FINAL: Conteúdo que conecta, entretém e vende 
sem parecer venda.
```

## Ajustes específicos por função

- **`generate-carousel` (modo script)**: relaxar o S1=Hook / S2=Problema / S6=CTA rígido — manter os 6 slides mas permitir narrativa contínua entre eles, e CTA do S6 fluindo da história.
- **`generate-ideas`**: orientar títulos por identificação ("Você já passou por...", "Acontece muito...", "O que ninguém te conta...") em vez de fórmulas batidas.
- **`generate-hooks`**: dar mais peso aos triggers `story`, `problem`, `question` e menos a `bold_statement` puro de venda.
- **`generate-script`**: nas instruções de tom, deixar claro que GANCHO/DESENVOLVIMENTO/CTA são camadas internas, não rótulos a aparecer no texto final.

## O que NÃO muda

- Schemas das tool calls (campos `script`, `headline`, `connector`, etc. permanecem).
- Frontend, banco de dados, rotas, UI.
- Regra de Fidelidade ao Nicho já existente — a nova lógica **complementa**, não substitui.

