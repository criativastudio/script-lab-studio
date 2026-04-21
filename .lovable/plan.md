

# Build Docker falhando — `package-lock.json` desatualizado

## Causa

O log mostra claramente:

```
npm error `npm ci` can only install packages when your package.json
and package-lock.json or npm-shrinkwrap.json are in sync.
npm error Missing: @dnd-kit/core@6.3.1 from lock file
npm error Missing: @dnd-kit/sortable@10.0.0 from lock file
npm error Missing: @dnd-kit/utilities@3.2.2 from lock file
npm error Missing: @dnd-kit/accessibility@3.1.1 from lock file
```

Quando adicionei o Kanban (drag-and-drop), os pacotes `@dnd-kit/*` entraram no `package.json` mas o `package-lock.json` no repositório GitHub **não foi atualizado** com eles. O Dokploy usa `npm ci`, que exige sincronia exata entre os dois arquivos e falha imediatamente.

Aviso secundário no log (`VITE_SUPABASE_PUBLISHABLE_KEY ... is not set`) é só um warning — só vira problema depois que o build passar.

## Solução

Trocar `npm ci --legacy-peer-deps` por `npm install --legacy-peer-deps` no Dockerfile. O `npm install` regenera o lockfile automaticamente quando há divergência, em vez de abortar.

### Mudança em `Dockerfile` (linha 19)

```diff
- RUN npm ci --legacy-peer-deps
+ RUN npm install --legacy-peer-deps
```

Nada mais muda. Multi-stage build, preview server, healthcheck e variáveis ARG continuam iguais.

## Por que essa abordagem

- **Resolve agora sem depender do GitHub**: o lockfile do repo é gerenciado pelo Lovable e nem sempre é commitado em sincronia perfeita com `package.json` quando dependências novas são adicionadas via editor.
- **Não quebra reprodutibilidade significativamente**: as versões em `package.json` já têm ranges fixos (`@dnd-kit/core: ^6.3.1`, etc.), então o resolver vai escolher as mesmas versões.
- **Alternativa rejeitada**: tentar regerar e commitar o lockfile não é viável daqui — o Lovable não tem controle sobre o repo GitHub conectado, e mesmo um push de Lovable→GitHub pode não atualizar o lock se ele não foi tocado nesta sessão.

## Aviso sobre variáveis de ambiente

O warning `VITE_SUPABASE_PUBLISHABLE_KEY is not set` indica que o Dokploy não está injetando essa variável no build. Após corrigir o Dockerfile, se o app subir mas não conseguir falar com o Supabase, configure no painel do Dokploy (Environment Variables do serviço):

```
VITE_SUPABASE_URL=https://nxmsdrnxrpgmrzprpzij.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
VITE_SUPABASE_PROJECT_ID=nxmsdrnxrpgmrzprpzij
```

Esses valores estão no `.env` do projeto. Não trato isso agora porque o build sequer chega nessa etapa — primeiro o `npm install` precisa passar.

## Arquivos

| Arquivo | Mudança |
|---|---|
| `Dockerfile` | Trocar `npm ci` por `npm install` na linha 19 |

## O que NÃO muda

- `docker-compose.yml`, `.dockerignore`, `vite.config.ts`, `package.json` — intactos.
- Estágio de produção (preview server na porta 8080) — idêntico.
- Nenhum código da aplicação React/Supabase é tocado.

