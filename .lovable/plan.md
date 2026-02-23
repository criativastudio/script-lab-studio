
# Criacao de Usuarios via Admin (Multi-Tenant)

## Resumo

Implementar um fluxo seguro onde apenas admins podem criar usuarios. A criacao acontece via uma Edge Function que usa a Service Role Key do Supabase para criar o usuario no Auth, vincular ao cliente (empresa), definir o perfil e atribuir a role "client".

## O que sera criado

### 1. Edge Function: `create-user`

Uma funcao backend segura em `supabase/functions/create-user/index.ts` que:

- Valida que o chamador e admin (via `getClaims` + consulta `user_roles`)
- Recebe: `email`, `password`, `full_name`, `office_name`, `client_name`, `plan` (basic/premium), e opcionalmente `client_id` (empresa existente)
- Cria a empresa na tabela `clients` se `client_id` nao for informado
- Cria o usuario no Supabase Auth via `supabase.auth.admin.createUser()` com `email_confirm: true` (ja confirmado)
- Insere o perfil em `profiles` vinculando `user_id` ao `client_id`
- Insere a role "client" em `user_roles`
- Retorna os dados do usuario criado

### 2. Atualizacao do Painel Admin (`src/pages/Admin.tsx`)

Adicionar um novo dialog "Criar Usuario" com formulario contendo:

- Select para escolher empresa existente OU campos para criar nova (nome da empresa)
- Nome do usuario
- Email
- Senha
- Plano (basic / premium) -- armazenado como campo extra, mas como a instrucao diz "nao alterar estrutura do banco", o plano sera salvo no `raw_user_meta_data` do Auth ou ignorado por enquanto

### 3. Configuracao do config.toml

Adicionar a entrada da edge function com `verify_jwt = false` (validacao manual no codigo).

## Fluxo de Seguranca

```text
Admin (frontend)
  |
  v
Edge Function (create-user)
  |-- Valida JWT do chamador
  |-- Verifica role "admin" na tabela user_roles
  |-- Cria empresa (se necessario) via Service Role
  |-- Cria usuario via auth.admin.createUser()
  |-- Insere profile + role via Service Role
  |
  v
Usuario criado, pronto para login
```

## Detalhes Tecnicos

**Edge Function** (`supabase/functions/create-user/index.ts`):
- Usa CORS headers padrao
- Usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (ja configurados como secrets)
- Valida inputs com checagens basicas (email, senha minima 6 chars, nome obrigatorio)
- Usa `createClient` com service role para operacoes admin
- Usa outro client com o token do chamador para verificar a role

**Frontend** (`src/pages/Admin.tsx`):
- Novo botao "Criar Usuario" ao lado do "Novo Cliente"
- Dialog com formulario: select de empresa existente, nome, email, senha, plano
- Chama `supabase.functions.invoke("create-user", { body: ... })`
- Feedback via toast de sucesso/erro

**config.toml**:
- Adicionar `[functions.create-user]` com `verify_jwt = false`

**Nota sobre o campo "Plano"**: Como a instrucao pede para nao alterar a estrutura do banco, o plano sera armazenado no `raw_user_meta_data` do usuario Auth, acessivel via `user.user_metadata.plan`. Futuramente pode ser migrado para uma coluna dedicada.
