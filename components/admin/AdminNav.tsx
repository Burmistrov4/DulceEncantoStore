"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Inicio", emoji: "📊" },
  { href: "/admin/pedidos", label: "Pedidos", emoji: "🧾" },
  { href: "/admin/productos", label: "Productos", emoji: "🧁" },
  { href: "/admin/contenido", label: "Contenido", emoji: "🎨" },
  { href: "/admin/resenas", label: "Reseñas", emoji: "🗣️" },
  { href: "/admin/ajustes", label: "Ajustes", emoji: "⚙️" },
  { href: "/admin/metricas", label: "Métricas", emoji: "📈" },
];

export default function AdminNav({ storeName }: { storeName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-choco/10 bg-choco text-cream">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/admin" className="flex items-center gap-2 font-display text-lg font-black">
          <span aria-hidden="true">🍰</span>
          <span className="hidden sm:inline">{storeName}</span>
          <span className="rounded-full bg-caramel px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
            Admin
          </span>
        </Link>

        <nav className="order-3 flex w-full gap-1.5 overflow-x-auto sm:order-2 sm:w-auto" aria-label="Secciones del panel">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                  active ? "bg-honey text-choco" : "bg-white/10 text-cream/80 hover:bg-white/20"
                }`}
              >
                <span aria-hidden="true">{l.emoji}</span> {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-3">
          <Link
            href="/"
            target="_blank"
            className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-bold hover:bg-white/20"
          >
            Ver tienda ↗
          </Link>
          <button
            onClick={logout}
            className="rounded-full bg-berry/80 px-3.5 py-1.5 text-sm font-bold hover:bg-berry"
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
