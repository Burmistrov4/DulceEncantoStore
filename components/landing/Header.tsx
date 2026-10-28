"use client";

import Link from "next/link";
import { useCart } from "../StoreProvider";
import { rateFmt } from "@/lib/format";

// Desplazamiento suave a las secciones (#menu, #opiniones, #faq).
// Se usa scrollIntoView en vez de depender solo del hash del navegador:
// si la URL ya traía un hash (ej: /#faq), algunos navegadores no re-disparan
// el scroll al cambiar solo el fragmento — por eso "Ver menú de hoy" parecía no hacer nada.
export function scrollToSection(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return; // deja el comportamiento por defecto si no existe la sección
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

export default function Header({ storeName, rate }: { storeName: string; rate: number }) {
  const { count, openCart } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-choco/10 bg-cream/90 backdrop-blur">
      {/* Cinta informativa con la Tasa Euro BCV del día */}
      <div className="border-b border-choco/5 bg-honey/15">
        <div className="mx-auto flex h-7 max-w-6xl items-center justify-center gap-1.5 px-4 text-[11px] font-bold text-choco/70 sm:text-xs">
          <span aria-hidden="true">💶</span>
          <span className="overline-caps tracking-wide">Tasa Euro BCV del día</span>
          <span className="text-caramel">Bs {rateFmt(rate)}</span>
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-caramel text-lg shadow-card" aria-hidden="true">
            🍰
          </span>
          <span className="font-display text-lg font-bold sm:text-xl">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold text-choco/75 md:flex">
          <a href="#menu" onClick={(e) => scrollToSection(e, "menu")} className="transition hover:text-caramel">
            Menú de hoy
          </a>
          <a href="#opiniones" onClick={(e) => scrollToSection(e, "opiniones")} className="transition hover:text-caramel">
            Opiniones
          </a>
          <a href="#faq" onClick={(e) => scrollToSection(e, "faq")} className="transition hover:text-caramel">
            Preguntas
          </a>
        </nav>

        <button
          onClick={openCart}
          className="relative flex items-center gap-2 rounded-full bg-choco px-4 py-2 text-sm font-bold text-cream transition hover:bg-choco-mid"
        >
          <span aria-hidden="true">🛒</span>
          <span className="hidden sm:inline">Mi pedido</span>
          {count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-honey text-[11px] font-black text-choco ring-2 ring-cream">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
