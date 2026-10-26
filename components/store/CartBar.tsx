"use client";

import { bs, usd } from "@/lib/format";
import { useCart, useConfig } from "../StoreProvider";

export default function CartBar() {
  const cart = useCart();
  const config = useConfig();

  if (cart.count === 0 || cart.open) return null;

  return (
    <button
      onClick={cart.openCart}
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 bg-choco px-5 py-3.5 text-cream shadow-pop"
      aria-label="Ver mi pedido"
    >
      <span className="flex items-center gap-2 text-sm font-bold">
        <span className="grid size-6 place-items-center rounded-full bg-honey text-xs font-black text-choco">
          {cart.count}
        </span>
        {cart.count === 1 ? "antojo en tu pedido" : "antojos en tu pedido"}
      </span>
      <span className="flex items-baseline gap-2 font-display font-black">
        <span className="text-lg">{usd(cart.totalUsd)}</span>
        <span className="hidden text-xs font-semibold text-cream/60 sm:inline">{bs(cart.totalUsd, config.rate)}</span>
        <span className="ml-1 text-sm font-bold text-honey">Ver pedido →</span>
      </span>
    </button>
  );
}
