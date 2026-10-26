"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { bs, usd } from "@/lib/format";
import type { ProductDTO } from "@/lib/types";
import { useCart } from "../StoreProvider";
import Lightbox from "../store/Lightbox";

export default function ProductCard({ product, rate }: { product: ProductDTO; rate: number }) {
  const { add } = useCart();
  const defaultIdx = product.variants.length > 0
    ? Math.max(0, product.variants.findIndex((v) => v.label.includes("500")))
    : -1;
  const [variantIdx, setVariantIdx] = useState(defaultIdx);
  const [zoom, setZoom] = useState(false);
  const [added, setAdded] = useState(false);

  const price = variantIdx >= 0 ? product.variants[variantIdx].priceUsd : product.priceUsd;
  const variantLabel = variantIdx >= 0 ? product.variants[variantIdx].label : null;
  const soldOut = !product.availableToday;

  const onAdd = () => {
    if (soldOut) return;
    add(product, variantLabel, price);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article
      data-spotlight
      data-tilt
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-card ring-1 ring-choco/5 transition hover:-translate-y-1 hover:shadow-pop"
    >
      <button
        type="button"
        onClick={() => setZoom(true)}
        className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden bg-cream-deep"
        aria-label={`Ampliar foto de ${product.name}`}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={`object-cover transition duration-500 group-hover:scale-105 ${soldOut ? "opacity-60 saturate-50" : ""}`}
          />
        ) : (
          <span className="grid h-full place-items-center text-5xl" aria-hidden="true">🍰</span>
        )}
        {soldOut ? (
          <span className="absolute inset-x-0 bottom-0 bg-choco/85 py-2 text-center text-sm font-black uppercase tracking-wider text-cream">
            Agotado hoy
          </span>
        ) : (
          <span className="absolute left-3 top-3 rotate-[-3deg] rounded-full bg-honey/95 px-3 py-1 text-xs font-black text-choco shadow-card">
            Hecho hoy ✨
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-xl font-bold leading-snug">
            <Link href={`/producto/${product.slug}`} className="hover:text-caramel">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-choco/70">{product.description}</p>
        </div>

        {(product.servings || product.ingredients) && (
          <p className="text-xs leading-relaxed text-choco/55">
            {product.servings && <span>🍽️ {product.servings}</span>}
            {product.servings && product.ingredients && <span className="mx-1.5">·</span>}
            {product.ingredients && <span>{product.ingredients}</span>}
          </p>
        )}

        {product.variants.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tamaños disponibles">
            {product.variants.map((v, i) => (
              <button
                key={v.label}
                type="button"
                onClick={() => setVariantIdx(i)}
                className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-bold transition ${
                  i === variantIdx
                    ? "border-caramel bg-caramel text-cream"
                    : "border-choco/15 bg-cream text-choco/70 hover:border-caramel/50"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <div className="font-display text-2xl font-black text-caramel-deep">{usd(price)}</div>
            <div className="text-xs font-semibold text-choco/55">{bs(price, rate)}</div>
          </div>
          <button
            type="button"
            onClick={onAdd}
            disabled={soldOut}
            className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
              soldOut
                ? "cursor-not-allowed bg-choco/10 text-choco/40"
                : added
                  ? "bg-leaf text-cream"
                  : "bg-choco text-cream hover:bg-caramel"
            }`}
          >
            {soldOut ? "Agotado" : added ? "✓ Agregado" : "Agregar al pedido"}
          </button>
        </div>
      </div>

      {zoom && <Lightbox src={product.image} alt={product.name} onClose={() => setZoom(false)} />}
    </article>
  );
}
