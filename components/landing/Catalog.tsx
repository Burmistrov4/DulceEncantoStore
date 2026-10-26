"use client";

import { useState } from "react";
import { CATEGORIES, type CategoryId, type ProductDTO } from "@/lib/types";
import type { CatalogSection } from "@/lib/site-content";
import ProductCard from "./ProductCard";

export default function Catalog({
  products,
  rate,
  content,
}: {
  products: ProductDTO[];
  rate: number;
  content: CatalogSection;
}) {
  const [tab, setTab] = useState<CategoryId>("yogures");
  const visible = products.filter((p) => p.category === tab);
  const active = CATEGORIES.find((c) => c.id === tab)!;

  return (
    <section id="menu" className="scroll-mt-20 bg-cream-deep/60 py-16">
      <div className="mx-auto max-w-6xl px-4">
        <p className="overline-caps text-center text-caramel">{content.eyebrow}</p>
        <h2 className="mt-2 text-center font-display text-3xl font-black sm:text-4xl">
          {content.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-choco/65">
          {content.subtitle}
        </p>

        {/* Pestañas de categorías */}
        <div
          className="mt-8 flex justify-start gap-2 overflow-x-auto pb-2 sm:justify-center"
          role="tablist"
          aria-label="Categorías del menú"
        >
          {CATEGORIES.map((c) => {
            const count = products.filter((p) => p.category === c.id && p.availableToday).length;
            return (
              <button
                key={c.id}
                role="tab"
                aria-selected={tab === c.id}
                onClick={() => setTab(c.id)}
                className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-caramel ${
                  tab === c.id
                    ? "border-choco bg-choco text-cream shadow-pop"
                    : "border-choco/15 bg-white/70 text-choco/70 hover:border-choco/40"
                }`}
              >
                <span aria-hidden="true">{c.emoji}</span>
                {c.label}
                <span
                  className={`rounded-full px-1.5 text-xs font-black ${
                    tab === c.id ? "bg-honey text-choco" : "bg-choco/10 text-choco/50"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-sm italic text-choco/60">{active.tagline}</p>

        {visible.length === 0 ? (
          <p className="mt-10 text-center text-choco/60">
            No hay productos en esta categoría por ahora. Vuelve pronto. 🧁
          </p>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} rate={rate} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
