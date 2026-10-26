import type { StepsSection } from "@/lib/site-content";

export default function Steps({ content }: { content: StepsSection }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:py-16" aria-label="Cómo pedir">
      <p className="overline-caps text-center text-caramel">{content.eyebrow}</p>
      <h2 className="mt-2 text-center font-display text-3xl font-black sm:text-4xl">
        {content.title}
      </h2>

      <ol className="mt-10 grid gap-6 md:grid-cols-3 md:gap-8">
        {content.steps.map((step, i) => (
          <li
            key={`${step.title}-${i}`}
            className={`relative rounded-3xl bg-white/70 p-7 shadow-card ring-1 ring-choco/5 transition duration-300 hover:-translate-y-1.5 hover:shadow-pop ${
              // Línea punteada que conecta un paso con el siguiente (solo desktop)
              i < content.steps.length - 1
                ? "md:after:absolute md:after:left-full md:after:top-1/2 md:after:z-10 md:after:h-0 md:after:w-8 md:after:-translate-y-1/2 md:after:border-t-[3px] md:after:border-dashed md:after:border-honey md:after:content-['']"
                : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-honey font-display text-xl font-black text-choco shadow-card ring-2 ring-white/60">
                {i + 1}
              </span>
              <span className="text-3xl" aria-hidden="true">
                {step.emoji}
              </span>
            </div>
            <h3 className="mt-4 font-display text-xl font-bold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-choco/70">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
