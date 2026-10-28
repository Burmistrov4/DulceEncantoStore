import type { CustomOrdersSection } from "@/lib/site-content";
import { waLink } from "@/lib/whatsapp";
import type { StoreConfigDTO } from "@/lib/types";
import WhatsAppIcon from "../WhatsAppIcon";
import Reveal from "../store/Reveal";

// Banner de encargos especiales (eventos): CTA directo a WhatsApp con mensaje
// precargado de cotización. Editable desde /admin/contenido.
export default function CustomOrders({
  content,
  config,
}: {
  content: CustomOrdersSection;
  config: StoreConfigDTO;
}) {
  if (!content.enabled) return null;

  const href = waLink(
    config.whatsappNumber,
    `¡Hola ${config.storeName}! 🎉 Quiero cotizar un encargo para un evento:`
  );

  return (
    <section className="px-4 py-16" aria-label={content.title}>
      <Reveal className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-choco px-6 py-12 text-center text-cream shadow-pop sm:px-12">
          {/* Atmósfera: resplandores miel y fresa */}
          <div className="pointer-events-none absolute -left-16 -top-16 size-64 rounded-full bg-honey/20 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 size-72 rounded-full bg-berry/25 blur-3xl" aria-hidden="true" />
          <span
            className="pointer-events-none absolute right-6 top-6 animate-float text-4xl opacity-80 sm:text-5xl"
            aria-hidden="true"
          >
            🎂
          </span>

          <p className="overline-caps relative text-honey">{content.eyebrow}</p>
          <h2 className="relative mx-auto mt-3 max-w-2xl font-display text-3xl font-black leading-tight sm:text-4xl">
            {content.title}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-cream/75 sm:text-base">
            {content.text}
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="relative mx-auto mt-8 flex w-fit items-center gap-3 rounded-full bg-wa px-8 py-4 font-display text-lg font-black text-white shadow-pop transition hover:-translate-y-1 hover:bg-wa-deep"
          >
            <WhatsAppIcon className="size-5" />
            {content.button}
          </a>
        </div>
      </Reveal>
    </section>
  );
}
