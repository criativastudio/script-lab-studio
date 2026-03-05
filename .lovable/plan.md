

# Substituir botões restantes por RainbowButton

O componente `RainbowButton` e toda a configuração (CSS vars, tailwind) já existem. Só falta trocar os botões.

## Mudanças em `src/pages/LandingPage.tsx`

### 1. Navbar desktop (linha 126-128)
Trocar `<Button>` por `<RainbowButton>` com classes para manter tamanho pequeno:
```tsx
<RainbowButton className="hidden md:inline-flex gap-1.5 h-9 px-4 text-sm rounded-full" onClick={() => navigate("/auth")}>
  Começar grátis <ArrowRight className="h-3.5 w-3.5" />
</RainbowButton>
```

### 2. Menu mobile (linha 143-145)
```tsx
<RainbowButton className="w-full rounded-full h-9 text-sm" onClick={() => navigate("/auth")}>
  Começar grátis
</RainbowButton>
```

### 3. Botões dos planos (linha 500-506)
```tsx
<RainbowButton
  className="w-full rounded-full"
  onClick={() => navigate("/auth")}
>
  {p.price === "Grátis" ? "Começar grátis" : "Assinar agora"}
</RainbowButton>
```

### 4. Final CTA "Garantir meu acesso grátis" (linha 533-539)
```tsx
<RainbowButton
  className="gap-2 text-base rounded-full"
  onClick={() => navigate("/auth")}
>
  Garantir meu acesso grátis <ArrowRight className="h-4 w-4" />
</RainbowButton>
```

Nenhum outro arquivo precisa ser alterado — o componente e configuração já estão prontos.

