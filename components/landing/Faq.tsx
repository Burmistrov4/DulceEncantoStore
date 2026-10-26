import type { FaqSection } from "@/lib/site-content";

export default function Faq({ content }: { content: FaqSection }) {
  return (
    <section id="faq" className="scroll-mt-20 pb-16">
      <div className="mx-auto max-w-3xl px-4">
        <p className="overline-caps text-center text-caramel">{content.eyebrow}</p>
        <h2 className="mt-2 text-center font-display text-3xl font-black sm:text-4xl">
          {content.title}
        </h2>

        <div className="mt-8 space-y-3">
          {content.faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl bg-white/80 p-5 shadow-card ring-1 ring-choco/5 transition hover:ring-choco/15"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold marker:hidden focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                {faq.q}
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-cream-deep text-xl font-black text-caramel transition group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-choco/75">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
