"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { usd } from "@/lib/format";
import { CATEGORIES, type CategoryId, type ProductDTO } from "@/lib/types";
import ImageDropzone from "./ImageDropzone";
import ProductToggle from "./ProductToggle";

type FormState = {
  id: string | null;
  name: string;
  slug: string;
  category: CategoryId;
  description: string;
  priceUsd: string; // dólares con decimales, para edición amable
  variants: { label: string; priceUsd: string }[];
  image: string;
  servings: string;
  ingredients: string;
  stock: string;
  sortOrder: string;
  active: boolean;
  availableToday: boolean;
  featured: boolean;
};

const EMPTY: FormState = {
  id: null,
  name: "",
  slug: "",
  category: "yogures",
  description: "",
  priceUsd: "",
  variants: [],
  image: "",
  servings: "",
  ingredients: "",
  stock: "",
  sortOrder: "500",
  active: true,
  availableToday: true,
  featured: false,
};

function parseUsdToCents(input: string): number {
  const n = Number.parseFloat(input.replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export default function ProductManager({ products }: { products: ProductDTO[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const openNew = () => {
    setError("");
    setForm({ ...EMPTY });
  };

  const openEdit = (p: ProductDTO) => {
    setError("");
    setForm({
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      description: p.description,
      priceUsd: (p.priceUsd / 100).toFixed(2),
      variants: p.variants.map((v) => ({ label: v.label, priceUsd: (v.priceUsd / 100).toFixed(2) })),
      image: p.image,
      servings: p.servings,
      ingredients: p.ingredients,
      stock: p.stock === null ? "" : String(p.stock),
      sortOrder: String(p.sortOrder),
      active: p.active,
      availableToday: p.availableToday,
      featured: p.featured,
    });
  };

  const set = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((f) => (f ? { ...f, [field]: value } : f));
  };

  const save = async () => {
    if (!form) return;
    if (!form.name.trim()) {
      setError("Ponle un nombre al producto.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      category: form.category,
      description: form.description.trim(),
      priceUsd: parseUsdToCents(form.priceUsd),
      variants: form.variants
        .filter((v) => v.label.trim())
        .map((v) => ({ label: v.label.trim(), priceUsd: parseUsdToCents(v.priceUsd) })),
      image: form.image,
      servings: form.servings.trim(),
      ingredients: form.ingredients.trim(),
      stock: form.stock.trim() === "" ? null : Math.max(0, Math.round(Number(form.stock))),
      sortOrder: Math.round(Number(form.sortOrder)) || 500,
      active: form.active,
      availableToday: form.availableToday,
      featured: form.featured,
    };
    try {
      const res = await fetch(form.id ? `/api/admin/products/${form.id}` : "/api/admin/products", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo guardar");
      setForm(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: ProductDTO) => {
    if (!window.confirm(`¿Eliminar "${p.name}"?\nEsta acción no se puede deshacer.`)) return;
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-black">Productos 🧁</h1>
          <p className="mt-1 text-sm text-choco/60">
            {products.length} productos · {products.filter((p) => p.active && p.availableToday).length} disponibles hoy
          </p>
        </div>
        <button
          onClick={openNew}
          className="rounded-full bg-caramel px-5 py-2.5 font-bold text-cream shadow-card transition hover:bg-caramel-deep"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className={`flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-choco/5 ${
              !p.active ? "opacity-60" : ""
            }`}
          >
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
              {p.image ? <Image src={p.image} alt={p.name} fill sizes="64px" className="object-cover" /> : <span className="grid h-full place-items-center">🍰</span>}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate font-display text-lg font-bold">{p.name}</span>
                <span className="rounded-full bg-cream-deep px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-choco/60">
                  {CATEGORIES.find((c) => c.id === p.category)?.emoji} {CATEGORIES.find((c) => c.id === p.category)?.label}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-choco/60">
                {p.variants.length > 0
                  ? p.variants.map((v) => `${v.label} ${usd(v.priceUsd)}`).join(" · ")
                  : usd(p.priceUsd)}
                {p.stock !== null && <span className="ml-2 font-bold text-caramel-deep">stock: {p.stock}</span>}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-choco/60">
                Disponible hoy
                <ProductToggle id={p.id} field="availableToday" value={p.availableToday} label={`Disponible hoy: ${p.name}`} />
              </label>
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-choco/60">
                Activo
                <ProductToggle id={p.id} field="active" value={p.active} label={`Activo: ${p.name}`} />
              </label>
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-choco/60">
                ⭐ Destacado
                <ProductToggle id={p.id} field="featured" value={p.featured} label={`Destacado en el carrusel: ${p.name}`} />
              </label>
              <button onClick={() => openEdit(p)} className="rounded-full bg-choco/10 px-4 py-2 text-sm font-bold hover:bg-choco/20">
                ✏️ Editar
              </button>
              <button onClick={() => remove(p)} className="rounded-full bg-berry/10 px-4 py-2 text-sm font-bold text-berry hover:bg-berry/20">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ---------- Modal de creación/edición ---------- */}
      {form && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-choco/70 p-4 backdrop-blur-sm">
          <div className="mx-auto my-4 w-full max-w-2xl rounded-3xl bg-cream p-6 shadow-pop">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-black">
                {form.id ? `Editar: ${form.name}` : "Nuevo producto"}
              </h2>
              <button onClick={() => setForm(null)} aria-label="Cerrar" className="grid size-9 place-items-center rounded-full bg-choco/10 font-bold hover:bg-choco/20">
                ✕
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-choco/60">Nombre *</label>
                <input className="field mt-1.5" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ej: Yogur Griego de Fresa" />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-choco/60">Categoría</label>
                <select className="field mt-1.5" value={form.category} onChange={(e) => set("category", e.target.value as CategoryId)}>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-choco/60">
                  Precio base (USD $) {form.variants.length > 0 && <span className="normal-case text-choco/40">— usado si no hay tamaños</span>}
                </label>
                <input className="field mt-1.5" inputMode="decimal" value={form.priceUsd} onChange={(e) => set("priceUsd", e.target.value)} placeholder="5.00" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-choco/60">Descripción (vende con palabras)</label>
                <textarea className="field mt-1.5 min-h-20" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Ej: Yogur griego colado a mano con mermelada casera…" />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-choco/60">Raciones sugeridas</label>
                <input className="field mt-1.5" value={form.servings} onChange={(e) => set("servings", e.target.value)} placeholder="Ej: Sirve 2 a 3 personas" />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-choco/60">Ingredientes naturales</label>
                <input className="field mt-1.5" value={form.ingredients} onChange={(e) => set("ingredients", e.target.value)} placeholder="Leche fresca, huevos, azúcar…" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-black uppercase tracking-wider text-choco/60">Foto real del producto</label>
                <div className="mt-1.5">
                  <ImageDropzone value={form.image} onChange={(path) => set("image", path)} />
                </div>
              </div>

              {/* Tamaños/variantes */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase tracking-wider text-choco/60">Tamaños / presentaciones</label>
                  <button
                    type="button"
                    onClick={() => set("variants", [...form.variants, { label: "", priceUsd: "" }])}
                    className="rounded-full bg-choco/10 px-3 py-1.5 text-xs font-bold hover:bg-choco/20"
                  >
                    + Agregar tamaño
                  </button>
                </div>
                {form.variants.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {form.variants.map((v, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          className="field min-w-0 flex-1"
                          value={v.label}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[i] = { ...next[i], label: e.target.value };
                            set("variants", next);
                          }}
                          placeholder="200g / 500g / 1 Litro…"
                        />
                        <input
                          className="field w-28! shrink-0"
                          inputMode="decimal"
                          value={v.priceUsd}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[i] = { ...next[i], priceUsd: e.target.value };
                            set("variants", next);
                          }}
                          placeholder="$ 5.00"
                        />
                        <button
                          type="button"
                          onClick={() => set("variants", form.variants.filter((_, j) => j !== i))}
                          aria-label="Quitar tamaño"
                          className="shrink-0 rounded-xl bg-berry/10 px-3 font-bold text-berry hover:bg-berry/20"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-choco/60">Stock (unidades de hoy)</label>
                <input className="field mt-1.5" inputMode="numeric" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="Vacío = no llevar conteo" />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-choco/60">Orden (menor aparece primero)</label>
                <input className="field mt-1.5" inputMode="numeric" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
              </div>

              <div className="flex flex-wrap gap-6 sm:col-span-2">
                <label className="flex items-center gap-2.5 text-sm font-bold">
                  <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="size-5 accent-caramel" />
                  Visible en la tienda
                </label>
                <label className="flex items-center gap-2.5 text-sm font-bold">
                  <input type="checkbox" checked={form.availableToday} onChange={(e) => set("availableToday", e.target.checked)} className="size-5 accent-caramel" />
                  Disponible hoy
                </label>
                <label className="flex items-center gap-2.5 text-sm font-bold">
                  <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="size-5 accent-caramel" />
                  ⭐ Destacado en el carrusel
                </label>
              </div>
            </div>

            {error && <p className="mt-4 rounded-xl bg-berry/10 px-4 py-2.5 text-sm font-bold text-berry">{error}</p>}

            <div className="mt-6 flex gap-3">
              <button onClick={() => setForm(null)} className="flex-1 rounded-full bg-choco/10 px-4 py-3 font-bold text-choco/70 hover:bg-choco/20">
                Cancelar
              </button>
              <button onClick={save} disabled={saving} className="flex-1 rounded-full bg-caramel px-4 py-3 font-display text-lg font-black text-cream hover:bg-caramel-deep disabled:opacity-50">
                {saving ? "Guardando…" : form.id ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
