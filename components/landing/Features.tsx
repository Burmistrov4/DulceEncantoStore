import type { FeaturesSection } from "@/lib/site-content";
import Reveal from "../store/Reveal";

// Diferenciales de la marca: grid de tarjetas con entrada escalonada y
// micro-interacciones en el emoji. Los datos vienen de /admin/contenido.
export default function Features({ content }: { content: FeaturesSection }) {
  if (!content.enabled || content.features.length === 0) return null;

  return (
    <section className="py-16" aria-label={content.title}>
      <div className="mx-auto max-w-6xl px-4">
        <p className="overline-caps text-center text-caramel">{content.eyebrow}</p>
        <h2 className="mt-2 text-center font-display text-3xl font-black sm:text-4xl">{content.title}</h2>
        {content.subtitle && (
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-choco/65 sm:text-base">
            {content.subtitle}
          </p>
        )}

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.features.map((feature, i) => (
            <Reveal key={`${feature.emoji}-${feature.title}`} delay={i * 90}>
              <article
                data-spotlight
                className="group h-full rounded-3xl bg-white p-6 text-center shadow-card ring-1 ring-choco/5 transition duration-300 hover:-translate-y-1.5 hover:shadow-pop"
              >
                <span
                  className="inline-grid size-16 place-items-center rounded-full bg-honey/20 text-3xl transition duration-300 group-hover:rotate-6 group-hover:scale-110"
                  aria-hidden="true"
                >
                  {feature.emoji}
                </span>
                <h3 className="mt-4 font-display text-lg font-bold leading-snug">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-choco/70">{feature.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
