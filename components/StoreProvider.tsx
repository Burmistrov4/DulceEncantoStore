"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { PAYMENT_METHODS, type CartItem, type DeliveryZone, type PaymentMethod, type ProductDTO, type StoreConfigDTO } from "@/lib/types";

const ConfigContext = createContext<StoreConfigDTO | null>(null);

export function useConfig(): StoreConfigDTO {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig debe usarse dentro de <StoreProvider>");
  return ctx;
}

// Registro de eventos del embudo (fire-and-forget, nunca bloquea la compra)
export function track(type: string, productId?: string | null) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, productId: productId ?? null }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}

type CartState = {
  items: CartItem[];
  count: number;
  subtotalUsd: number;
  zone: DeliveryZone | null;
  totalUsd: number;
  zoneId: string | null;
  payment: PaymentMethod;
  open: boolean;
  setZoneId: (id: string) => void;
  setPayment: (p: PaymentMethod) => void;
  openCart: () => void;
  closeCart: () => void;
  add: (product: ProductDTO, variantLabel: string | null, unitUsd: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <StoreProvider>");
  return ctx;
}

export default function StoreProvider({
  config,
  children,
}: {
  config: StoreConfigDTO;
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [zoneId, setZoneId] = useState<string | null>(config.zones[0]?.id ?? null);
  const [payment, setPayment] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Recuperar pedido guardado (el antojo no debe perderse al recargar)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dulces-cart");
      if (raw) {
        const saved = JSON.parse(raw) as { items?: CartItem[]; zoneId?: string; payment?: PaymentMethod };
        if (Array.isArray(saved.items)) setItems(saved.items.filter((i) => i && i.key && i.qty > 0));
        if (typeof saved.zoneId === "string" && config.zones.some((z) => z.id === saved.zoneId)) setZoneId(saved.zoneId);
        if (typeof saved.payment === "string" && (PAYMENT_METHODS as readonly string[]).includes(saved.payment)) setPayment(saved.payment);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [config.zones]);

  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem("dulces-cart", JSON.stringify({ items, zoneId, payment }));
      } catch {
        /* ignore */
      }
    }
  }, [items, zoneId, payment, hydrated]);

  const add = useCallback((product: ProductDTO, variantLabel: string | null, unitUsd: number) => {
    setItems((prev) => {
      const key = `${product.id}:${variantLabel ?? ""}`;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: Math.min(99, i.qty + 1) } : i));
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          variant: variantLabel,
          unitUsd,
          qty: 1,
          image: product.image,
        },
      ];
    });
    track("add_to_cart", product.id);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty: Math.min(99, qty) } : i))
    );
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotalUsd = useMemo(() => items.reduce((sum, i) => sum + i.unitUsd * i.qty, 0), [items]);
  const zone = useMemo(() => config.zones.find((z) => z.id === zoneId) ?? null, [config.zones, zoneId]);
  const totalUsd = subtotalUsd + (zone?.feeUsd ?? 0);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  const value = useMemo<CartState>(
    () => ({
      items,
      count,
      subtotalUsd,
      zone,
      totalUsd,
      zoneId,
      payment,
      open,
      setZoneId,
      setPayment,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      add,
      setQty,
      remove,
      clear,
    }),
    [items, count, subtotalUsd, zone, totalUsd, zoneId, payment, open, add, setQty, remove, clear]
  );

  return (
    <ConfigContext.Provider value={config}>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
    </ConfigContext.Provider>
  );
}
