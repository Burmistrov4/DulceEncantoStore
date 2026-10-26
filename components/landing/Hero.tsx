import Image from "next/image";
import type { HeroContent } from "@/lib/site-content";
import WhatsAppIcon from "../WhatsAppIcon";

export default function Hero({ content, waHref }: { content: HeroContent; waHref: string }) {
  return (
    <section className="relative overflow-hidden">
      {/* Atmósfera dramática: blobs flotantes de miel, fresa y caramelo */}
      <div
        className="pointer-events-none absolute -right-28 -top-28 size-[28rem] animate-float rounded-full bg-honey/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-36 top-1/3 size-96 animate-float-slow rounded-full bg-berry/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-10 right-1/4 size-80 animate-float-slow rounded-full bg-caramel/15 blur-3xl"
        aria-hidden="true"
      />

      {/* Columnas con minmax(0,·): el span inline-block del título es un átomo de
          línea y su contribución min-content (~430px) hincharía el track implícito
          del grid (grid blowout) generando scroll horizontal en móvil. */}
      <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-14 px-4 pb-20 pt-12 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:pb-28">
        {/* min-w-0 evita el "grid blowout": sin él, el span inline-block del título
            (átomo de línea) expande la columna y genera scroll horizontal en móvil */}
        <div className="min-w-0">
          {/* Eyebrow como chip pill con pulso */}
          <p className="inline-flex max-w-full animate-rise items-center gap-2.5 rounded-full border-2 border-caramel/30 bg-white/70 px-4 py-2 shadow-card">
            <span className="size-2 shrink-0 animate-pulse-dot rounded-full bg-honey" aria-hidden="true" />
            <span className="overline-caps text-caramel">{content.eyebrow}</span>
          </p>

          <h1 className="mt-5 animate-rise-1 font-display text-5xl font-black leading-[1.05] sm:text-6xl lg:text-7xl">
            {content.titleTop}{" "}
            <span className="relative inline-block max-w-full">
              <em className="relative font-display italic text-caramel">{content.titleHighlight}</em>
              {/* Subrayado ondulado decorativo detrás del highlight */}
              <svg
                className="absolute -bottom-2 left-0 h-3 w-full text-honey"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8 Q 25 2 50 7 T 100 7 T 150 7 T 198 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            {content.titleBottom}
          </h1>

          <p className="mt-6 max-w-xl animate-rise-2 text-base leading-relaxed text-choco/75 sm:text-lg">
            {content.subtitle}
          </p>

          <div className="mt-9 flex animate-rise-2 flex-wrap items-center gap-3.5">
            <a
              href="#menu"
              className="group flex items-center gap-2.5 rounded-full bg-caramel px-8 py-4 font-display text-lg font-bold text-cream shadow-pop transition hover:-translate-y-0.5 hover:bg-caramel-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel focus-visible:ring-offset-2"
            >
              {content.primaryCta}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-full border-2 border-wa bg-white/60 px-6 py-3.5 font-bold text-wa-deep transition hover:-translate-y-0.5 hover:bg-wa hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wa focus-visible:ring-offset-2"
            >
              <WhatsAppIcon className="size-5" />
              {content.secondaryCta}
            </a>
          </div>

          <ul className="mt-8 flex animate-rise-3 flex-wrap gap-2.5">
            {content.badges.map((badge) => (
              <li
                key={badge}
                className="rounded-full bg-white/70 px-3.5 py-1.5 text-xs font-bold text-choco/75 ring-1 ring-choco/10 sm:text-sm"
              >
                <span className="text-leaf" aria-hidden="true">
                  ✓
                </span>{" "}
                {badge}
              </li>
            ))}
          </ul>
        </div>

        {/* Composición de fotos: principal rotada + secundaria superpuesta + sticker flotante */}
        <div className="relative mx-auto w-full max-w-md animate-rise-2 lg:max-w-none">
          <div className="relative rotate-2 overflow-hidden rounded-[2.25rem] border-8 border-white shadow-pop">
            <Image
              src={content.photos.main.src}
              alt={content.photos.main.alt}
              width={1200}
              height={900}
              priority
              className="h-auto w-full object-cover"
              sizes="(max-width: 1024px) 90vw, 45vw"
            />
          </div>
          <div className="absolute -bottom-10 -left-3 w-36 rotate-[-7deg] overflow-hidden rounded-2xl border-4 border-white shadow-card sm:-left-10 sm:w-48">
            <Image
              src={content.photos.secondary.src}
              alt={content.photos.secondary.alt}
              width={900}
              height={900}
              className="h-auto w-full object-cover"
              sizes="200px"
            />
          </div>
          <div className="absolute -top-7 right-1 flex flex-col items-end gap-2.5">
            <span className="animate-float rotate-6 rounded-2xl bg-honey px-4 py-2.5 font-display text-sm font-black text-choco shadow-card ring-2 ring-choco/10 sm:text-base">
              {content.sticker}
            </span>
            <span className="rotate-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-choco shadow-card ring-1 ring-choco/10">
              <span className="text-honey" aria-hidden="true">
                ★
              </span>{" "}
              4,9 · +100 pedidos
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
