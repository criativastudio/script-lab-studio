# Adicionar secret `OPENAI_API_KEY`

## O que será feito

1. **Solicitar o secret `OPENAI_API_KEY`** via ferramenta de secrets do Lovable Cloud / Supabase.
   - Você receberá um campo seguro para colar a chave (formato `sk-...`).
   - A chave fica armazenada de forma criptografada — **não vai para o código nem para o repositório**.

2. **Disponibilização automática nas edge functions** via `Deno.env.get("OPENAI_API_KEY")`.
   - A função `ai-health-check` (já implementada) já está preparada para detectar a chave e validá-la chamando `GET https://api.openai.com/v1/models`.
   - Assim que a chave for adicionada, o card "Status da IA" no `/admin` vai mostrar:
     - ✅ **Configurada** + organização detectada (se válida)
     - ❌ **Chave inválida** (se a OpenAI rejeitar)

## Onde obter a chave

1. Acesse https://platform.openai.com/api-keys
2. Clique em **Create new secret key**
3. Copie o valor (começa com `sk-proj-...` ou `sk-...`) — só aparece uma vez
4. Cole quando o Lovable solicitar

## O que NÃO muda

- `LOVABLE_API_KEY` continua sendo o transporte principal de IA.
- A chave OpenAI direta funciona como **fallback/validação opcional**, monitorada no painel admin.
- Nenhuma edge function de geração será alterada nesta etapa.

## Próximo passo após aprovação

Saio do modo plano e envio o pedido de secret. Você cola a chave e o status aparece automaticamente no card de IA do Admin.