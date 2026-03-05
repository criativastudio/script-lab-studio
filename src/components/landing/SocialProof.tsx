import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Ana Clara",
    role: "Criadora de conteúdo",
    quote:
      "Com o ScriptLab, reduzi meu tempo de planejamento de 4 horas para 20 minutos. Os roteiros saem prontos para gravar.",
    avatar: "AC",
  },
  {
    name: "Roberto Silva",
    role: "Agência de marketing",
    quote:
      "Nossa agência produz 3x mais conteúdo desde que adotamos a plataforma. A geração em lote é game-changer.",
    avatar: "RS",
  },
  {
    name: "Juliana Mendes",
    role: "Advogada e influencer",
    quote:
      "Finalmente consigo criar conteúdo estratégico para meu nicho jurídico sem depender de copywriter externo.",
    avatar: "JM",
  },
];

export default function SocialProof() {
  return (
    <section className="relative py-24 md:py-32 px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Quem usa, <span className="text-gradient-primary">recomenda</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Veja o que nossos usuários estão dizendo.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-6 transition-shadow duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                "{t.quote}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
