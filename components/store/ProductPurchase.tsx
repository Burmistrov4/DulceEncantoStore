"use client";

import { useEffect, useState } from "react";
import { bs, usd } from "@/lib/format";
import type { ProductDTO, StoreConfigDTO } from "@/lib/types";
import { buildDirectProductMessage, waLink } from "@/lib/whatsapp";
import { track, useCart, useConfig } from "../StoreProvider";
import WhatsAppIcon from "../WhatsAppIcon";

// Panel de compra de la ficha de producto: variantes, agregar al pedido o pedir directo por WhatsApp
export default function ProductPurchase({ product }: { product: ProductDTO }) {
  const { add } = useCart();
  const config: StoreConfigDTO = useConfig();
  const defaultIdx = product.variants.length > 0
    ? Math.max(0, product.variants.findIndex((v) => v.label.includes("500")))
    : -1;
  const [variantIdx, setVariantIdx] = useState(defaultIdx);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    track("product_view", product.id);
  }, [product.id]);

  const price = variantIdx >= 0 ? product.variants[variantIdx].priceUsd : product.priceUsd;
  const variantLabel = variantIdx >= 0 ? product.variants[variantIdx].label : null;
  const soldOut = !product.availableToday;

  const onAdd = () => {
    if (soldOut) return;
    add(product, variantLabel, price);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  const directHref = waLink(
    config.whatsappNumber,
    buildDirectProductMessage(product.name, variantLabel, price, config)
  );

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-choco/5">
      {product.variants.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-black uppercase tracking-wider text-choco/60">Elige el tamaño</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {product.variants.map((v, i) => (
              <button
                key={v.label}
                onClick={() => setVariantIdx(i)}
                className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition ${
                  i === variantIdx
                    ? "border-caramel bg-caramel text-cream"
                    : "border-choco/15 bg-cream text-choco/70 hover:border-caramel/50"
                }`}
              >
                {v.label} · {usd(v.priceUsd)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        <span className="font-display text-4xl font-black text-caramel-deep">{usd(price)}</span>
        <span className="pb-1 text-sm font-bold text-choco/55">{bs(price, config.rate)}</span>
      </div>
      <p className="mt-1 text-[11px] text-choco/50">
        Tasa BCV {new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2 }).format(config.rate)} Bs/$
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <button
          onClick={onAdd}
          disabled={soldOut}
          className={`rounded-full px-6 py-3.5 font-display text-lg font-black transition ${
            soldOut
              ? "cursor-not-allowed bg-choco/10 text-choco/40"
              : added
                ? "bg-leaf text-cream"
                : "bg-choco text-cream hover:bg-caramel"
          }`}
        >
          {soldOut ? "Agotado hoy 😢" : added ? "✓ Agregado al pedido" : "Agregar al pedido 🛒"}
        </button>
        <a
          href={soldOut ? undefined : directHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => !soldOut && track("whatsapp_click", product.id)}
          aria-disabled={soldOut}
          className={`flex items-center justify-center gap-2.5 rounded-full border-2 px-6 py-3 font-bold transition ${
            soldOut
              ? "pointer-events-none border-choco/10 text-choco/35"
              : "border-wa text-wa-deep hover:bg-wa hover:text-white"
          }`}
        >
          <WhatsAppIcon className="size-5" />
          Pedir solo esto por WhatsApp
        </a>
      </div>
    </div>
  );
}
