import { motion } from "framer-motion";

const stats = [
  { value: "10.000+", label: "criadores" },
  { value: "50.000+", label: "roteiros gerados" },
  { value: "4.8/5", label: "avaliação média" },
];

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
    quote: "Nossa agência produz 3x mais conteúdo desde que adotamos a plataforma. A geração em lote é game-changer.",
    avatar: "RS",
  },
  {
    name: "Juliana Mendes",
    role: "Advogada e influencer",
    quote: "Finalmente consigo criar conteúdo estratégico para meu nicho jurídico sem depender de copywriter externo.",
    avatar: "JM",
  },
];

export default function SocialProof() {
  return (
    <section className="relative py-16 md:py-24 px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-3xl md:text-4xl font-light tracking-tight mb-6">
            Quem usa, <span className="text-gradient-primary">recomenda</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg font-light max-w-2xl mx-auto">
            Veja o que nossos usuários estão dizendo.
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center gap-8 md:gap-16 mb-16"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-gradient-primary">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
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
              className="relative rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm p-7 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden"
            >
              {/* Top edge shine */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-foreground/[0.08] to-transparent" />
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
              <p className="text-xs font-light text-muted-foreground leading-relaxed">"{t.quote}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
