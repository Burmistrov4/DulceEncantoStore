"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usd } from "@/lib/format";
import { ORDER_STATUSES, type OrderDTO, type OrderStatus } from "@/lib/types";

export type AdminOrder = OrderDTO & { id: number };

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  nuevo: "confirmado",
  confirmado: "preparando",
  preparando: "entregado",
};

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  nuevo: { label: "Nuevo", cls: "bg-honey/25 text-caramel-deep ring-honey/60" },
  confirmado: { label: "Confirmado", cls: "bg-leaf/15 text-leaf ring-leaf/30" },
  preparando: { label: "Preparando", cls: "bg-caramel/15 text-caramel-deep ring-caramel/30" },
  entregado: { label: "Entregado", cls: "bg-leaf/25 text-leaf ring-leaf/40" },
  cancelado: { label: "Cancelado", cls: "bg-choco/10 text-choco/60 ring-choco/20" },
};

const FILTERS: { id: OrderStatus | "activos" | "todos"; label: string }[] = [
  { id: "activos", label: "🔥 Activos" },
  { id: "nuevo", label: "Nuevos" },
  { id: "confirmado", label: "Confirmados" },
  { id: "preparando", label: "Preparando" },
  { id: "entregado", label: "Entregados" },
  { id: "cancelado", label: "Cancelados" },
  { id: "todos", label: "Todos" },
];

function OrderCard({ order }: { order: AdminOrder }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const patch = async (status: OrderStatus) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("No se pudo actualizar el estado. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const meta = STATUS_META[order.status];
  const next = NEXT_STATUS[order.status];

  return (
    <article className={`rounded-2xl bg-white p-5 shadow-card ring-1 ring-choco/5 ${busy ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-lg font-black tracking-widest text-choco">{order.code}</p>
          <p className="text-xs text-choco/55">
            {new Date(order.createdAt).toLocaleString("es-VE", {
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

      {/* Cliente con acceso directo al chat */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-cream/70 px-4 py-2.5">
        <span className="text-sm font-bold">👤 {order.customerName}</span>
        <span className="text-xs text-choco/55">📱 {order.customerPhone}</span>
        <a
          href={`https://wa.me/${order.customerPhone}?text=${encodeURIComponent(
            `¡Hola ${order.customerName}! Sobre tu pedido ${order.code} de Dulce Encanto 🧡`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-wa px-3 py-1.5 text-xs font-bold text-white hover:bg-wa-deep"
        >
          Escribir por WhatsApp
        </a>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-choco/75">
        {order.items.map((item, i) => (
          <li key={i}>
            {item.qty}× <strong>{item.name}</strong>
            {item.variant && <span className="text-choco/55"> ({item.variant})</span>} — {usd(item.unitUsd * item.qty)}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-choco/10 pt-3 text-sm">
        <span className="text-choco/60">
          🚚 {order.zoneName || "Entrega a acordar"} · 💳 {order.payment}
        </span>
        <span className="font-display text-lg font-black text-caramel-deep">
          {usd(order.totalUsd)}
          <span className="ml-1.5 text-xs font-bold text-choco/55">
            (tasa {order.rate.toFixed(2)})
          </span>
        </span>
      </div>

      {/* Pipeline de estados */}
      <div className="mt-4 flex flex-wrap gap-2">
        {next && (
          <button
            onClick={() => patch(next)}
            disabled={busy}
            className="rounded-full bg-leaf px-4 py-2 text-sm font-bold text-cream hover:opacity-90 disabled:opacity-50"
          >
            → Marcar {STATUS_META[next].label.toLowerCase()}
          </button>
        )}
        {order.status !== "cancelado" && order.status !== "entregado" && (
          <button
            onClick={() => patch("cancelado")}
            disabled={busy}
            className="rounded-full bg-choco/10 px-4 py-2 text-sm font-bold text-choco/70 hover:bg-choco/20 disabled:opacity-50"
          >
            Cancelar pedido
          </button>
        )}
        {order.status === "cancelado" && (
          <button
            onClick={() => patch("nuevo")}
            disabled={busy}
            className="rounded-full bg-choco/10 px-4 py-2 text-sm font-bold text-choco/70 hover:bg-choco/20 disabled:opacity-50"
          >
            ↩︎ Reactivar
          </button>
        )}
      </div>
    </article>
  );
}

export default function OrdersBoard({ orders }: { orders: AdminOrder[] }) {
  const [filter, setFilter] = useState<OrderStatus | "activos" | "todos">("activos");

  const isActive = (s: OrderStatus) => s === "nuevo" || s === "confirmado" || s === "preparando";
  const visible = orders.filter((o) =>
    filter === "todos" ? true : filter === "activos" ? isActive(o.status) : o.status === filter
  );

  const today = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === new Date().toDateString() && o.status !== "cancelado"
  );
  const pending = orders.filter((o) => isActive(o.status));

  return (
    <div>
      {/* Resumen del día */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-choco/5">
          <p className="text-xs font-black uppercase tracking-wider text-choco/55">Pedidos hoy</p>
          <p className="mt-1 font-display text-3xl font-black text-caramel-deep">{today.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-choco/5">
          <p className="text-xs font-black uppercase tracking-wider text-choco/55">En curso</p>
          <p className="mt-1 font-display text-3xl font-black text-caramel-deep">{pending.length}</p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-choco/5">
          <p className="text-xs font-black uppercase tracking-wider text-choco/55">Vendido hoy</p>
          <p className="mt-1 font-display text-3xl font-black text-caramel-deep">
            {usd(today.reduce((sum, o) => sum + o.totalUsd, 0))}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar pedidos">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${
              filter === f.id ? "bg-choco text-cream" : "bg-white text-choco/60 ring-1 ring-choco/10 hover:bg-cream-deep"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {visible.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
      {visible.length === 0 && (
        <p className="mt-4 rounded-2xl bg-white p-6 text-center text-sm text-choco/55 shadow-card ring-1 ring-choco/5">
          No hay pedidos en esta vista. Cuando un cliente confirme por WhatsApp, aparecerá aquí con su
          nombre, teléfono y el detalle.
        </p>
      )}
      <p className="mt-6 text-xs text-choco/45">
        Los {ORDER_STATUSES.length} estados: nuevo → confirmado → preparando → entregado (o cancelado).
        El total de cada pedido quedó congelado con la tasa BCV del momento.
      </p>
    </div>
  );
}
