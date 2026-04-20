

# Reorganizar acesso ao Diagnóstico

## Mudanças

### 1. Remover "Diagnóstico" do menu lateral
Em `src/components/DashboardLayout.tsx`, remover o item `{ href: "/diagnostico", label: "Diagnóstico", icon: Target }` do array `navItems`. A rota pública `/diagnostico` continua funcionando normalmente (continua registrada em `App.tsx` como rota pública).

### 2. Adicionar link público compartilhável dentro de "Diagnóstico CRM"
Em `src/pages/AdminDiagnostic.tsx`, adicionar no topo da página (logo abaixo do header "CRM de Diagnósticos") um **card de "Link Público do Diagnóstico"** contendo:

- Título: "Link público para divulgação"
- Descrição curta: "Compartilhe este link para que leads façam o diagnóstico gratuito."
- Campo `Input` readonly com a URL completa: `${window.location.origin}/diagnostico`
- Botão **"Copiar link"** (ícone `Copy`) — usa `navigator.clipboard.writeText` + toast de confirmação
- Botão **"Abrir"** (ícone `ExternalLink`) — abre `/diagnostico` em nova aba

## Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/components/DashboardLayout.tsx` | Remover item "Diagnóstico" de `navItems` (e import `Target` se não usado em outro lugar) |
| `src/pages/AdminDiagnostic.tsx` | Adicionar card com link público + botões copiar/abrir |

## O que NÃO muda

- Rota pública `/diagnostico` e `/diagnostico/:type` continuam ativas em `App.tsx`
- Funcionamento do quiz, edge function, tabela `diagnostic_leads`
- Item "Diagnóstico CRM" no menu admin (já existe)

