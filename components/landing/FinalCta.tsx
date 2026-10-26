import type { FinalCtaContent } from "@/lib/site-content";
import WhatsAppIcon from "../WhatsAppIcon";
import Scallop from "./Scallop";

export default function FinalCta({ content, waHref }: { content: FinalCtaContent; waHref: string }) {
  return (
    <section className="relative bg-choco pb-20 pt-4 text-cream sm:pb-24">
      <Scallop />
      <div className="mx-auto mt-12 max-w-4xl px-4 text-center">
        <p className="overline-caps animate-rise text-honey">{content.eyebrow}</p>
        <h2 className="mt-3 animate-rise-1 font-display text-4xl font-black leading-[1.08] sm:text-5xl lg:text-6xl">
          {content.title}
        </h2>
        <p className="mx-auto mt-5 max-w-xl animate-rise-2 text-cream/75">{content.subtitle}</p>

        <div className="relative mt-10 inline-block animate-rise-3">
          {/* Glow radial de miel detrás del botón */}
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 size-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-honey/30 blur-3xl"
            aria-hidden="true"
          />
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex w-fit items-center gap-3 rounded-full bg-wa px-10 py-5 font-display text-xl font-black text-white shadow-pop transition hover:-translate-y-1 hover:bg-wa-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey focus-visible:ring-offset-2 focus-visible:ring-offset-choco sm:text-2xl"
          >
            <WhatsAppIcon className="size-7" />
            {content.button}
          </a>
        </div>

        <p className="mt-6 animate-rise-3 text-xs font-semibold uppercase tracking-widest text-cream/50">
          {content.hours}
        </p>
      </div>
    </section>
  );
}
