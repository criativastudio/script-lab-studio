

# Aplicar GlowingEffect nos cards de Benefícios

## Mudanças

### 1. `src/components/ui/glowing-effect.tsx` — Já existe
O componente já está no projeto e é idêntico ao fornecido. Nenhuma alteração necessária.

### 2. `src/pages/LandingPage.tsx` — Refatorar a grid de benefícios (linhas 427-445)

Substituir o grid atual por um layout com `GlowingEffect` dentro de cada card, seguindo o padrão do demo:

```tsx
<ul className="grid grid-cols-1 grid-rows-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {benefits.map((b, i) => (
    <motion.li
      key={b.title}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: i * 0.08 }}
      className="min-h-[14rem] list-none"
    >
      <div className="relative h-full rounded-2xl border p-2 md:rounded-3xl md:p-3">
        <GlowingEffect spread={40} glow proximity={64} disabled={false} />
        <div className="relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl border-0.75 p-6 dark:shadow-[0px_0px_27px_0px_#2D2D2D] md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-primary/20 p-2">
              <b.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">{b.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{b.desc}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.li>
  ))}
</ul>
```

Adicionar import de `GlowingEffect` no topo do arquivo.

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/LandingPage.tsx` | Importar GlowingEffect + refatorar grid de benefícios com efeito glow interativo |

