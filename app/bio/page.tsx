import type { Metadata } from "next";
import { getStoreConfig } from "@/lib/store";
import { waLink } from "@/lib/whatsapp";
import WhatsAppIcon from "@/components/WhatsAppIcon";

// Bio link para la descripción de Instagram: HTML mínimo, cero JS, carga instantánea
export const metadata: Metadata = {
  title: "Enlaces",
  description: "Menú, pedidos y redes de postres artesanales en Valencia, Carabobo.",
  robots: { index: false, follow: true },
};

export default function BioPage() {
  const config = getStoreConfig();
  const waHref = waLink(
    config.whatsappNumber,
    `¡Hola ${config.storeName}! 👋 Vengo de Instagram y quiero hacer un pedido.`
  );

  const links = [
    { href: "/#menu", emoji: "🛒", label: "Ver menú de hoy + precios $/Bs", primary: true },
    { href: waHref, emoji: "📲", label: "Pedir directo por WhatsApp", wa: true },
    { href: config.instagramUrl, emoji: "📸", label: "Síguenos en Instagram" },
    { href: "https://maps.google.com/?q=Flor+Amarillo,+Valencia,+Carabobo", emoji: "📍", label: "Taller en Flor Amarillo, Valencia" },
  ];

  return (
    <main className="min-h-dvh bg-choco px-5 py-12 text-cream">
      <div className="mx-auto flex max-w-sm flex-col items-center">
        <div className="grid size-24 place-items-center rounded-full bg-honey text-5xl shadow-pop" aria-hidden="true">
          🍰
        </div>
        <h1 className="mt-5 font-display text-3xl font-black">{config.storeName}</h1>
        <p className="mt-2 text-center text-sm text-cream/70">
          Postres artesanales recién hechos · Leche 100% fresca · Valencia, Carabobo 🇻🇪
        </p>

        <nav className="mt-8 flex w-full flex-col gap-3.5" aria-label="Enlaces">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target={l.href.startsWith("/") ? undefined : "_blank"}
              rel={l.href.startsWith("/") ? undefined : "noopener noreferrer"}
              className={`flex items-center gap-3 rounded-2xl px-5 py-4 font-bold transition hover:-translate-y-0.5 ${
                l.wa
                  ? "bg-wa text-white shadow-pop hover:bg-wa-deep"
                  : l.primary
                    ? "bg-honey text-choco shadow-pop"
                    : "bg-white/10 text-cream ring-1 ring-white/15 hover:bg-white/15"
              }`}
            >
              <span className="text-xl" aria-hidden="true">{l.emoji}</span>
              <span className="flex-1">{l.label}</span>
              {l.wa ? <WhatsAppIcon className="size-5" /> : <span aria-hidden="true">→</span>}
            </a>
          ))}
        </nav>

        <p className="mt-10 text-xs text-cream/45">Lun a Sáb · 8:00 am – 6:00 pm · Delivery en Valencia 🚗</p>
      </div>
    </main>
  );
}
