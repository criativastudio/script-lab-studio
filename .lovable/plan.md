## Diagnóstico

Verifiquei o banco de dados e confirmei o problema:

| Cliente | Data | Status | Persona | Project |
|---|---|---|---|---|
| **Vonixx** | 2026-04-25 | `submitted` | ❌ | ❌ |
| **Criativa Studio** | 2026-04-24 | `submitted` | ❌ | ❌ |
| Vitoria Motoparts | 2026-04-23 | `completed` | ✅ | ✅ |

Os 2 briefings mais recentes ficaram travados em `submitted` — respostas salvas, mas IA nunca rodou. **Logs do `process-briefing` estão vazios**, ou seja, a Edge Function nem chegou a ser invocada.

## Causa raiz

No `ClientBriefingForm.tsx` (linhas 233–238), o submit faz:

```ts
supabase.functions
  .invoke("process-briefing", { body: { token } })
  .catch((e) => console.error(...));   // sem await
setSubmitted(true);                     // re-renderiza imediatamente
```

Como `setSubmitted(true)` desmonta o componente do formulário antes do `fetch` ser concluído, o navegador **cancela a requisição em voo**. Resultado: o servidor nunca recebe o gatilho, o briefing fica em `submitted` para sempre, e o erro é engolido silenciosamente pelo `.catch()`.

## Plano de correção

### 1. `src/pages/ClientBriefingForm.tsx` — submit confiável
- **Aguardar** o invoke antes de marcar como enviado (com timeout de segurança).
- Mostrar estado "processando" enquanto a IA roda (em vez de marcar como "submitted" e abandonar).
- Capturar e exibir erros reais (não apenas logar no console).
- Adicionar retry manual caso a chamada falhe.

### 2. `supabase/functions/process-briefing/index.ts` — robustez
- Atualizar `status='processing'` **antes** de chamar a IA (já faz, mas mover para mais cedo).
- Em qualquer caminho de erro, garantir reverter para `submitted` (já faz na maioria — auditar todos os returns).
- Adicionar `console.log` no início (token + business_name) para rastreamento.
- Garantir que `briefings` e `scripts` insert tenham seus erros logados (atualmente são silenciosos).

### 3. Reprocessar os 2 briefings travados
- Disparar manualmente o `process-briefing` para `Vonixx` e `Criativa Studio` para destravar os clientes existentes (via SQL/insert tool ou retry-pending).

### 4. Hook de fallback no CRM
- O CRM já tem botão "Reprocessar pending" (`handleRetryPending`). Verificar que ele aparece sempre que houver briefings com `status in ('submitted','processing')` e `persona IS NULL` há mais de 30s.

### 5. Validação de exibição na dashboard
- Confirmar que `StrategicContextTab` renderiza corretamente quando o contexto existe (já testado em clientes completos).

## Arquivos afetados
- `src/pages/ClientBriefingForm.tsx` (mudança principal: aguardar invoke)
- `supabase/functions/process-briefing/index.ts` (logs + auditoria de error paths)
- `src/pages/CRM.tsx` (verificar visibilidade do botão de retry)
- Reprocessamento manual dos 2 briefings travados

Nenhuma mudança de schema necessária — toda infraestrutura (RLS, tabelas, retry function) já existe.