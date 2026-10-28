"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { bs, usd } from "@/lib/format";
import type { OrderDTO, OrderStatus } from "@/lib/types";
import WhatsAppIcon from "@/components/WhatsAppIcon";

const MY_ORDERS_KEY = "dulces-my-orders";

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  nuevo: { label: "Recibido 🕐", cls: "bg-honey/20 text-caramel-deep ring-honey/50" },
  confirmado: { label: "Confirmado ✅", cls: "bg-leaf/15 text-leaf ring-leaf/30" },
  preparando: { label: "En preparación 🧑‍🍳", cls: "bg-caramel/15 text-caramel-deep ring-caramel/30" },
  entregado: { label: "Entregado 🎉", cls: "bg-leaf/25 text-leaf ring-leaf/40" },
  cancelado: { label: "Cancelado", cls: "bg-choco/10 text-choco/60 ring-choco/20" },
};

function readCodes(): string[] {
  try {
    const raw = localStorage.getItem(MY_ORDERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((c) => typeof c === "string") : [];
  } catch {
    return [];
  }
}

export default function MisPedidosClient({ whatsappNumber }: { whatsappNumber: string }) {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackCode, setTrackCode] = useState("");
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async (codes: string[]) => {
    if (codes.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/orders?codes=${encodeURIComponent(codes.join(","))}`);
      const json = await res.json();
      setOrders((json.orders as OrderDTO[]) ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(readCodes());
  }, [load]);

  const track = async () => {
    const code = trackCode.trim().toUpperCase();
    if (!code) return;
    const res = await fetch(`/api/orders?codes=${encodeURIComponent(code)}`);
    const json = await res.json();
    const found = (json.orders as OrderDTO[]) ?? [];
    if (found.length === 0) {
      setNotFound(true);
      return;
    }
    setNotFound(false);
    setTrackCode("");
    // guardarlo junto a los del navegador
    const codes = [code, ...readCodes().filter((c) => c !== code)].slice(0, 50);
    try {
      localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(codes));
    } catch {
      /* ignore */
    }
    void load(codes);
  };

  return (
    <main className="min-h-dvh bg-cream px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link href="/" className="text-sm font-bold text-caramel hover:underline">
          ← Volver a la tienda
        </Link>
        <h1 className="mt-4 font-display text-3xl font-black">Mis pedidos 🧺</h1>
        <p className="mt-1 text-sm text-choco/60">
          Sin cuentas ni claves: tus pedidos quedan guardados en este navegador y puedes rastrear
          cualquiera por su código.
        </p>

        {/* Rastrear por código (para verlo desde otro dispositivo) */}
        <div className="mt-5 flex gap-2 rounded-2xl bg-white p-3 shadow-card ring-1 ring-choco/5">
          <input
            value={trackCode}
            onChange={(e) => setTrackCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void track()}
            placeholder="¿En otro dispositivo? Escribe tu código: DE-XXXXX"
            className="field flex-1 font-mono text-sm uppercase"
            maxLength={10}
            aria-label="Código de pedido"
          />
          <button
            onClick={() => void track()}
            className="shrink-0 rounded-full bg-choco px-5 py-2 text-sm font-bold text-cream hover:bg-caramel"
          >
            Rastrear
          </button>
        </div>
        {notFound && (
          <p className="mt-2 rounded-xl bg-berry/10 px-4 py-2.5 text-sm font-bold text-berry" role="alert">
            No encontramos ese código. Revísalo o escríbenos por WhatsApp. 🧡
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-center text-sm text-choco/50">Cargando tus pedidos…</p>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-center shadow-card ring-1 ring-choco/5">
            <span className="text-4xl" aria-hidden="true">🛒</span>
            <p className="mt-3 font-display text-xl font-bold">Todavía no tienes pedidos aquí</p>
            <p className="mt-1 text-sm text-choco/60">
              Cuando confirmes tu primer pedido por WhatsApp, aparecerá en esta lista con su código.
            </p>
            <Link href="/#menu" className="mt-4 inline-block rounded-full bg-caramel px-6 py-3 font-bold text-cream hover:bg-caramel-deep">
              Ver el menú de hoy
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {orders.map((o) => {
              const meta = STATUS_META[o.status] ?? STATUS_META.nuevo;
              return (
                <article key={o.code} className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-choco/5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-lg font-black tracking-widest text-choco">{o.code}</p>
                      <p className="text-xs text-choco/55">
                        {new Date(o.createdAt).toLocaleString("es-VE", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm text-choco/75">
                    {o.items.map((item, i) => (
                      <li key={i}>
                        {item.qty}× <strong>{item.name}</strong>
                        {item.variant && <span className="text-choco/55"> ({item.variant})</span>} —{" "}
                        {usd(item.unitUsd * item.qty)}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-choco/10 pt-3 text-sm">
                    <span className="text-choco/60">
                      🚚 {o.zoneName || "Entrega a acordar"} · 💳 {o.payment || "Por definir"}
                    </span>
                    <span className="font-display text-lg font-black text-caramel-deep">
                      {usd(o.totalUsd)}
                      <span className="ml-1.5 text-xs font-bold text-choco/55">
                        {bs(o.totalUsd, o.rate)}
                      </span>
                    </span>
                  </div>
                </article>
              );
            })}

            <p className="pt-2 text-center text-xs text-choco/45">
              ¿Dudas con algún pedido?{" "}
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-bold text-wa-deep"
              >
                <WhatsAppIcon className="size-3.5" /> Escríbenos por WhatsApp
              </a>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
