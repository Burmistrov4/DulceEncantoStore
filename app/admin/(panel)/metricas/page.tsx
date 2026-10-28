import { getDailyMetrics, getMetricsSummary, getTopProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

const TYPE_COLORS: Record<string, { label: string; color: string }> = {
  view: { label: "👀 Visitas", color: "bg-choco/30" },
  product_view: { label: "🔍 Vistas de producto", color: "bg-honey" },
  add_to_cart: { label: "🛒 Agregados al pedido", color: "bg-caramel" },
  whatsapp_click: { label: "📲 Clics a WhatsApp", color: "bg-wa" },
};

export default async function AdminMetricsPage() {
  const { totals } = await getMetricsSummary();
  const daily = await getDailyMetrics(14);
  const top = await getTopProducts(8);

  // Agrupar por día (de más viejo a más reciente)
  const days: { day: string; byType: Record<string, number>; total: number }[] = [];
  const byDay = new Map<string, Record<string, number>>();
  for (const row of daily) {
    const cur = byDay.get(row.day) ?? {};
    cur[row.type] = (cur[row.type] ?? 0) + row.c;
    byDay.set(row.day, cur);
  }
  const sortedDays = [...byDay.keys()].sort();
  for (const day of sortedDays) {
    const byType = byDay.get(day)!;
    days.push({ day, byType, total: Object.values(byType).reduce((a, b) => a + b, 0) });
  }
  const max = Math.max(1, ...days.map((d) => d.total));

  return (
    <div>
      <h1 className="font-display text-3xl font-black">Métricas del embudo 📈</h1>
      <p className="mt-1 text-sm text-choco/60">
        Cuánta gente entra, qué antoja y cuántos llegan al WhatsApp. Últimos 14 días.
      </p>

      {/* Totales */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Object.entries(TYPE_COLORS).map(([type, meta]) => (
          <div key={type} className="rounded-3xl bg-white p-5 shadow-card ring-1 ring-choco/5">
            <p className="text-xs font-black uppercase tracking-wider text-choco/55">{meta.label}</p>
            <p className="mt-2 font-display text-3xl font-black text-caramel-deep">{totals[type] ?? 0}</p>
            <p className="text-xs text-choco/45">histórico total</p>
          </div>
        ))}
      </div>

      {/* Gráfico por día */}
      <section className="mt-8 rounded-3xl bg-white p-6 shadow-card ring-1 ring-choco/5">
        <h2 className="font-display text-xl font-black">Actividad diaria</h2>
        {days.length === 0 ? (
          <p className="mt-3 text-sm text-choco/55">Sin eventos todavía. Comparte el link de tu tienda y aquí aparecerá la actividad.</p>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap gap-3">
              {Object.entries(TYPE_COLORS).map(([type, meta]) => (
                <span key={type} className="flex items-center gap-1.5 text-xs font-bold text-choco/60">
                  <span className={`inline-block size-3 rounded ${meta.color}`} aria-hidden="true" />
                  {meta.label}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-1.5">
              {days.map((d) => (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-[11px] font-bold text-choco/50">
                    {d.day.slice(5).replace("-", "/")}
                  </span>
                  <div className="flex h-6 flex-1 overflow-hidden rounded-lg bg-choco/5">
                    {Object.entries(d.byType).map(([type, c]) => (
                      <div
                        key={type}
                        title={`${TYPE_COLORS[type]?.label ?? type}: ${c}`}
                        className={`${TYPE_COLORS[type]?.color ?? "bg-choco/20"} h-full`}
                        style={{ width: `${(c / max) * 100}%` }}
                      />
                    ))}
                  </div>
                  <span className="w-8 text-right text-xs font-black text-choco/60">{d.total}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* Ranking de productos */}
      <section className="mt-8 rounded-3xl bg-white p-6 shadow-card ring-1 ring-choco/5">
        <h2 className="font-display text-xl font-black">Productos con más interacciones</h2>
        {top.length === 0 ? (
          <p className="mt-3 text-sm text-choco/55">Cuando los clientes abran fichas de producto o agreguen al pedido, aparecerán aquí.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-choco/10 text-left text-xs font-black uppercase tracking-wider text-choco/50">
                <th className="pb-2">#</th>
                <th className="pb-2">Producto</th>
                <th className="pb-2 text-right">Interacciones</th>
              </tr>
            </thead>
            <tbody>
              {top.map(({ product, count }, i) => (
                <tr key={product.id} className="border-b border-choco/5 last:border-0">
                  <td className="py-2.5 font-black text-choco/40">{i + 1}</td>
                  <td className="py-2.5 font-bold">{product.name}</td>
                  <td className="py-2.5 text-right font-black text-caramel-deep">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="mt-3 text-xs text-choco/45">
          Las interacciones suman vistas de ficha, agregados al pedido y clics de “pedir solo esto”.
        </p>
      </section>
    </div>
  );
}
