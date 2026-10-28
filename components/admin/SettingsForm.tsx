"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { rateFmt } from "@/lib/format";
import type { StoreConfigDTO } from "@/lib/types";

type ZoneRow = { id: string; name: string; feeUsd: string };

export default function SettingsForm({ config }: { config: StoreConfigDTO }) {
  const router = useRouter();
  const [rate, setRate] = useState(String(config.rate));
  const [whatsapp, setWhatsapp] = useState(config.whatsappNumber);
  const [instagram, setInstagram] = useState(config.instagramUrl);
  const [storeName, setStoreName] = useState(config.storeName);
  const [zones, setZones] = useState<ZoneRow[]>(
    config.zones.map((z) => ({ id: z.id, name: z.name, feeUsd: (z.feeUsd / 100).toFixed(2) }))
  );
  const [status, setStatus] = useState<{ kind: "ok" | "err" | "info"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bcv_rate: Number(rate.replace(",", ".")),
          whatsapp_number: whatsapp,
          instagram_url: instagram,
          store_name: storeName,
          delivery_zones: zones.map((z) => ({
            id: z.id,
            name: z.name.trim(),
            feeUsd: Math.round((Number(z.feeUsd.replace(",", ".")) || 0) * 100),
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo guardar");
      setStatus({ kind: "ok", text: "✔ Ajustes guardados. La tienda ya refleja los cambios." });
      router.refresh();
    } catch (e) {
      setStatus({ kind: "err", text: e instanceof Error ? e.message : "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const refreshRate = async () => {
    setFetching(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/rate/refresh", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo obtener la tasa");
      setRate(String(json.rate));
      setStatus({ kind: "ok", text: `✔ Tasa Euro BCV actualizada desde ${json.source}: ${rateFmt(json.rate)} Bs/$` });
      router.refresh();
    } catch (e) {
      setStatus({ kind: "err", text: e instanceof Error ? e.message : "Error al consultar la tasa" });
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Tasa del día */}
      <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-choco/5">
        <h2 className="font-display text-xl font-black">💱 Tasa Euro BCV del día</h2>
        <p className="mt-1 text-sm text-choco/60">
          Con esta tasa se calculan todos los precios en bolívares de la tienda.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-choco/60">Bs por USD</label>
            <input
              className="field mt-1.5 w-40!"
              inputMode="decimal"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <button
            onClick={refreshRate}
            disabled={fetching}
            className="rounded-full bg-leaf px-5 py-2.5 font-bold text-cream transition hover:opacity-90 disabled:opacity-50"
          >
            {fetching ? "Consultando…" : "🔄 Obtener tasa automática"}
          </button>
        </div>
      </section>

      {/* Contacto y marca */}
      <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-choco/5">
        <h2 className="font-display text-xl font-black">🏪 Datos del negocio</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-choco/60">Nombre de la tienda</label>
            <input className="field mt-1.5" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-choco/60">
              WhatsApp de pedidos (con código país, ej: 584141234567)
            </label>
            <input className="field mt-1.5" inputMode="numeric" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-black uppercase tracking-wider text-choco/60">URL de Instagram</label>
            <input className="field mt-1.5" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/tucuenta" />
          </div>
        </div>
      </section>

      {/* Zonas de entrega */}
      <section className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-choco/5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl font-black">🚚 Zonas de entrega y tarifas</h2>
          <button
            onClick={() => setZones([...zones, { id: `zona-${Date.now()}`, name: "", feeUsd: "0.00" }])}
            className="rounded-full bg-choco/10 px-4 py-2 text-sm font-bold hover:bg-choco/20"
          >
            + Agregar zona
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {zones.map((z, i) => (
            <div key={z.id} className="flex gap-2">
              <input
                className="field min-w-0 flex-1"
                value={z.name}
                placeholder="Ej: Delivery · El Viñedo"
                onChange={(e) => {
                  const next = [...zones];
                  next[i] = { ...next[i], name: e.target.value };
                  setZones(next);
                }}
              />
              <input
                className="field w-28!"
                inputMode="decimal"
                value={z.feeUsd}
                placeholder="$ 1.50"
                onChange={(e) => {
                  const next = [...zones];
                  next[i] = { ...next[i], feeUsd: e.target.value };
                  setZones(next);
                }}
              />
              <button
                onClick={() => setZones(zones.filter((_, j) => j !== i))}
                aria-label="Quitar zona"
                className="shrink-0 rounded-xl bg-berry/10 px-3 font-bold text-berry hover:bg-berry/20"
              >
                ✕
              </button>
            </div>
          ))}
          {zones.length === 0 && <p className="text-sm text-choco/50">Sin zonas: el checkout mostrará “Por definir”.</p>}
        </div>
      </section>

      {status && (
        <p
          role="status"
          className={`rounded-2xl px-4 py-3 text-sm font-bold ${
            status.kind === "ok"
              ? "bg-leaf/10 text-leaf"
              : status.kind === "err"
                ? "bg-berry/10 text-berry"
                : "bg-honey/15 text-caramel-deep"
          }`}
        >
          {status.text}
        </p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-full bg-caramel px-6 py-3.5 font-display text-lg font-black text-cream shadow-card hover:bg-caramel-deep disabled:opacity-50 sm:w-auto sm:px-10"
      >
        {saving ? "Guardando…" : "Guardar ajustes"}
      </button>
    </div>
  );
}
