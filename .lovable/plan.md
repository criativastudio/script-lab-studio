

# Adaptação 100% ao Nicho do Cliente — Regra Anti-Genérico

## Resumo

Adicionar uma diretiva obrigatória de **fidelidade ao nicho** em todos os system prompts das Edge Functions que geram conteúdo. A regra instrui a IA a usar exclusivamente vocabulário, metáforas e referências nativas do nicho do cliente, proibindo analogias genéricas ou de outros mercados.

## Bloco de regra (padrão para todas as functions)

Será inserido um bloco consistente em todos os system prompts:

```text
REGRA DE FIDELIDADE AO NICHO (OBRIGATÓRIA):
- Use EXCLUSIVAMENTE vocabulário, termos técnicos e expressões nativas do nicho "${nicho}" do cliente.
- PROIBIDO misturar metáforas, analogias ou estilos de comunicação de outros mercados ou nichos.
- Toda referência, exemplo, caso e linguagem deve fazer sentido 100% dentro do contexto profissional do cliente.
- Antes de finalizar, valide internamente: "Este conteúdo soaria natural vindo de um profissional deste nicho específico?" Se não, reescreva.
- Evite analogias genéricas que servem para qualquer nicho (ex: "transforme sua vida", "destaque-se da multidão").
- Mantenha coerência absoluta entre posicionamento, tom de voz e vocabulário do nicho.
```

## Funções afetadas (6 edge functions)

| Função | Local da inserção |
|---|---|
| `generate-script/index.ts` | System prompt do modo enhanced (linha ~186) e do modo legacy (linha ~370) |
| `manual-generate/index.ts` | System prompt (linha ~74) |
| `generate-carousel/index.ts` | System prompt (linha ~79) |
| `generate-ideas/index.ts` | System prompt (linha ~119) |
| `generate-hooks/index.ts` | System prompt (linha ~89) |
| `process-briefing/index.ts` | System prompt (linha ~67) |

## Implementação

Em cada função, o bloco de nicho será dinâmico, extraindo o nicho do contexto estratégico disponível (`ctx.business_niche`, `context.business_niche`, `bNiche`, etc.). A variável do nicho já existe em todas as functions — basta referenciá-la no bloco inserido.

Nenhuma alteração de frontend, banco de dados ou rotas é necessária. Apenas edição dos prompts de sistema nas 6 edge functions.

