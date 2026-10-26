"use client";

import Link from "next/link";
import { useCart } from "../StoreProvider";

export default function Header({ storeName }: { storeName: string }) {
  const { count, openCart } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-choco/10 bg-cream/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-full bg-caramel text-lg shadow-card" aria-hidden="true">
            🍰
          </span>
          <span className="font-display text-lg font-bold sm:text-xl">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-bold text-choco/75 md:flex">
          <a href="#menu" className="transition hover:text-caramel">
            Menú de hoy
          </a>
          <a href="#opiniones" className="transition hover:text-caramel">
            Opiniones
          </a>
          <a href="#faq" className="transition hover:text-caramel">
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
