

# Aplicar RainbowButton nos botões da página Auth

## Contexto

O componente `RainbowButton` já existe em `src/components/ui/rainbow-button.tsx` e as configurações de Tailwind (cores, keyframes, animação rainbow) e CSS (variáveis `--color-1` a `--color-5`) já estão presentes. Não é necessário instalar nada nem modificar configuração.

## Mudanças

### `src/pages/Auth.tsx`

1. Importar `RainbowButton` de `@/components/ui/rainbow-button`
2. Substituir o `<Button type="submit" className="w-full">` (linha 88) por `<RainbowButton type="submit" className="w-full">` com o mesmo conteúdo
3. Remover import de `Button` se não for mais usado

O botão de submit que mostra "Entrar" ou "Criar conta" passará a usar o efeito rainbow animado. Os links de alternância ("Já tem uma conta?" / "Não tem uma conta?") permanecem como estão.

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Auth.tsx` | Trocar Button por RainbowButton no submit |

