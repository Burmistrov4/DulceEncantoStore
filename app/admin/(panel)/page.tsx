import Link from "next/link";
import AvailabilityQuickToggle from "@/components/admin/ProductToggle";
import { dateFmt, rateFmt, usd } from "@/lib/format";
import { getMetricsSummary, getOrdersSummary, getProducts, getStoreConfig, getTopProducts } from "@/lib/store";
import { CATEGORIES } from "@/lib/types";

export const dynamic = "force-dynamic";

function MetricCard({ emoji, label, value, note }: { emoji: string; label: string; value: string | number; note?: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-choco/5">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-choco/55">
        <span aria-hidden="true">{emoji}</span>
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-black text-caramel-deep">{value}</div>
      {note && <p className="mt-1 text-xs text-choco/50">{note}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const { totals, last7 } = await getMetricsSummary();
  const products = await getProducts();
  const config = await getStoreConfig();
  const top = await getTopProducts(5);
  const ordersSummary = await getOrdersSummary();

  return (
    <div>
      <h1 className="font-display text-3xl font-black">Hola, jefe pastelero 👋</h1>
      <p className="mt-1 text-sm text-choco/60">
        Así va tu tienda hoy, {new Date().toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })}.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          emoji="🧾"
          label="Pedidos hoy"
          value={ordersSummary.today}
          note={`${ordersSummary.pending} en curso · ${usd(ordersSummary.totalUsdToday)} vendidos hoy`}
        />
        <MetricCard emoji="👀" label="Visitas a la tienda" value={totals.view ?? 0} note={`${last7.view ?? 0} en los últimos 7 días`} />
        <MetricCard emoji="🛒" label="Agregados al pedido" value={totals.add_to_cart ?? 0} note={`${last7.add_to_cart ?? 0} en los últimos 7 días`} />
        <MetricCard emoji="📲" label="Clics a WhatsApp" value={totals.whatsapp_click ?? 0} note={`${last7.whatsapp_click ?? 0} en los últimos 7 días`} />
      </div>

      {/* Acceso directo al pipeline de pedidos */}
      {ordersSummary.pending > 0 && (
        <Link
          href="/admin/pedidos"
          className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-choco px-5 py-4 text-cream shadow-card transition hover:bg-choco-mid"
        >
          <span className="text-sm font-bold">
            🧾 Tienes <strong className="text-honey">{ordersSummary.pending}</strong>{" "}
            {ordersSummary.pending === 1 ? "pedido en curso" : "pedidos en curso"} esperando tu confirmación
          </span>
          <span className="text-sm font-black text-honey">Ver pedidos →</span>
        </Link>
      )}

      {/* Stock diario: el interruptor que evita vender lo que ya no hay en nevera */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-black">¿Qué hay disponible hoy? 🧊</h2>
          <Link href="/admin/productos" className="text-sm font-bold text-caramel hover:underline">
            Editar productos →
          </Link>
        </div>
        <p className="mt-1 text-sm text-choco/55">
          Un clic enciende/apaga cada producto en la tienda al instante (≤15 s).
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {products.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-card ring-1 ring-choco/5 ${
                !p.active ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">
                  {CATEGORIES.find((c) => c.id === p.category)?.emoji} {p.name}
                </p>
                <p className="text-xs text-choco/50">
                  {p.stock !== null ? `Stock: ${p.stock}` : "Sin conteo de stock"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-black uppercase ${p.availableToday ? "text-leaf" : "text-berry"}`}>
                  {p.availableToday ? "Disponible" : "Agotado"}
                </span>
                <AvailabilityQuickToggle id={p.id} field="availableToday" value={p.availableToday} label={`Disponible hoy: ${p.name}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Los más pedidos */}
      <section className="mt-10">
        <h2 className="font-display text-2xl font-black">Los más solicitados 🔥</h2>
        {top.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-choco/55 shadow-card ring-1 ring-choco/5">
            Todavía no hay datos. Cuando los clientes vean productos y agreguen al pedido, verás aquí el ranking.
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {top.map(({ product, count }, i) => (
              <li key={product.id} className="flex items-center gap-4 rounded-2xl bg-white px-4 py-3 shadow-card ring-1 ring-choco/5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-honey font-display font-black text-choco">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{product.name}</span>
                <span className="text-sm font-black text-caramel-deep">{count} interacciones</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
