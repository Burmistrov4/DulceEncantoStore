import type { TestimonialsSection } from "@/lib/site-content";
import type { ReviewDTO } from "@/lib/types";
import ReviewForm from "../store/ReviewForm";

// Rotación de estilos para los badges de confianza (se ven más ricos variados)
const BADGE_STYLES = [
  "bg-leaf/10 text-leaf ring-leaf/25",
  "bg-honey/15 text-caramel-deep ring-honey/40",
  "bg-berry/10 text-berry ring-berry/25",
] as const;

function Stars({ n }: { n: number }) {
  const count = Math.max(0, Math.min(5, Math.round(n)));
  return (
    <span className="text-honey" role="img" aria-label={`${count} de 5 estrellas`}>
      {"★".repeat(count)}
    </span>
  );
}

export default function Testimonials({ content, reviews }: { content: TestimonialsSection; reviews: ReviewDTO[] }) {
  return (
    <section id="opiniones" className="scroll-mt-20 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="overline-caps text-center text-caramel">{content.eyebrow}</p>
        <h2 className="mt-2 text-center font-display text-3xl font-black sm:text-4xl">
          {content.title}
        </h2>

        {/* Badges de confianza */}
        {content.badges.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {content.badges.map((badge, i) => (
              <span
                key={badge}
                className={`rounded-full px-4 py-2 text-sm font-bold ring-1 ${BADGE_STYLES[i % BADGE_STYLES.length]}`}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <figure
              key={review.id}
              data-spotlight
              className="relative flex flex-col overflow-hidden rounded-3xl bg-white p-6 pt-7 shadow-card ring-1 ring-choco/5 transition duration-300 hover:-translate-y-1.5 hover:shadow-pop"
            >
              {/* Comilla decorativa gigante */}
              <span
                className="pointer-events-none absolute -top-1 right-4 select-none font-display text-7xl leading-none text-caramel/10"
                aria-hidden="true"
              >
                ”
              </span>
              <Stars n={review.stars} />
              <blockquote className="relative mt-3 flex-1 text-sm leading-relaxed text-choco/80">
                “{review.text}”
              </blockquote>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-choco/10 pt-4">
                <span className="grid size-10 place-items-center rounded-full bg-caramel/15 font-display text-lg font-black text-caramel-deep">
                  {review.name.charAt(0)}
                </span>
                <div>
                  <div className="text-sm font-bold">{review.name}</div>
                  <div className="text-xs text-choco/55">📍 {review.zone}, Valencia</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* Reseñas nuevas: moderadas por el dueño antes de publicarse */}
        <ReviewForm />
      </div>
    </section>
  );
}
