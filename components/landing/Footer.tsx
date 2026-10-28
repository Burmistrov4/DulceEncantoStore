import Link from "next/link";
import type { StoreConfigDTO } from "@/lib/types";
import type { FooterContent } from "@/lib/site-content";
import WhatsAppIcon from "../WhatsAppIcon";

export default function Footer({
  config,
  content,
}: {
  config: StoreConfigDTO;
  content: FooterContent;
}) {
  return (
    <footer className="bg-choco pb-10 pt-12 text-cream/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-caramel text-lg" aria-hidden="true">🍰</span>
            <span className="font-display text-lg font-bold text-cream">{config.storeName}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">{content.about}</p>
        </div>

        <div>
          <h3 className="overline-caps text-honey">Encuéntranos</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>📍 {content.address}</li>
            <li>🕐 {content.hours}</li>
            <li>
              <a
                href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-bold text-wa hover:text-white"
              >
                <WhatsAppIcon className="size-4" /> +{config.whatsappNumber.replace(/\D/g, "")}
              </a>
            </li>
            <li>
              <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="font-bold hover:text-cream">
                📸 Síguenos en Instagram
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="overline-caps text-honey">Atajos</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><a href="#menu" className="hover:text-cream">Menú de hoy</a></li>
            <li><a href="#disponible-hoy" className="hover:text-cream">Fotos de lo disponible</a></li>
            <li><Link href="/mis-pedidos" className="hover:text-cream">Mis pedidos (rastrear)</Link></li>
            <li><Link href="/bio" className="hover:text-cream">Bio link (para Instagram)</Link></li>
            <li><a href="#faq" className="hover:text-cream">Preguntas frecuentes</a></li>
          </ul>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-cream/40">
        © {new Date().getFullYear()} {config.storeName} · Hecho con amor en Valencia, Carabobo
      </p>
    </footer>
  );
}
