"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bs, rateFmt, usd } from "@/lib/format";
import { PAYMENT_METHODS, type PaymentMethod } from "@/lib/types";
import { buildOrderMessage, waLink } from "@/lib/whatsapp";
import { track, useCart, useConfig } from "../StoreProvider";
import WhatsAppIcon from "../WhatsAppIcon";

const CUSTOMER_KEY = "dulces-customer";
const MY_ORDERS_KEY = "dulces-my-orders";

function saveOrderCode(code: string) {
  try {
    const raw = localStorage.getItem(MY_ORDERS_KEY);
    const list = raw ? (JSON.parse(raw) as string[]) : [];
    const next = [code, ...list.filter((c) => c !== code)].slice(0, 50);
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export default function CartDrawer() {
  const cart = useCart();
  const config = useConfig();
  const [sent, setSent] = useState(false);
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // Precargar datos del cliente de pedidos anteriores (sigue sin haber cuentas)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { name?: string; phone?: string };
        if (saved.name) setCustomerName(saved.name);
        if (saved.phone) setCustomerPhone(saved.phone);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!cart.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cart.closeCart();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [cart.open, cart.closeCart]);

  if (!cart.open) return null;

  const onConfirm = async () => {
    setError("");
    const phoneDigits = customerPhone.replace(/\D/g, "");
    if (customerName.trim().length < 2) return setError("Escribe tu nombre para el pedido.");
    if (phoneDigits.length < 7) return setError("Escribe un teléfono válido para coordinar la entrega.");

    setPlacing(true);
    let code: string | null = null;
    let failed = false;

    // 1) Guardar el pedido en el panel (recalculado en el servidor)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone: phoneDigits,
          zoneId: cart.zoneId,
          payment: cart.payment,
          items: cart.items.map((i) => ({ productId: i.productId, variant: i.variant, qty: i.qty })),
          website: honeypot,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo guardar el pedido");
      code = json.code as string;
      saveOrderCode(code);
      try {
        localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: customerName.trim(), phone: phoneDigits }));
      } catch {
        /* ignore */
      }
    } catch {
      // La venta no se bloquea por un error de red: el chat manda igual
      failed = true;
    }

    // 2) Abrir WhatsApp con el pedido (y el código si se guardó)
    const msg = buildOrderMessage({ items: cart.items, zone: cart.zone, payment: cart.payment, config, code });
    track("whatsapp_click");
    window.open(waLink(config.whatsappNumber, msg), "_blank", "noopener");

    setSavedCode(code);
    setSaveFailed(failed);
    setSent(true);
    setPlacing(false);
    if (code) cart.clear();
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Tu pedido">
      <div className="absolute inset-0 bg-choco/60 backdrop-blur-sm" onClick={cart.closeCart} />

      <div className="absolute inset-x-0 bottom-0 flex max-h-[90vh] animate-rise flex-col overflow-hidden rounded-t-3xl bg-cream shadow-pop md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[27rem] md:rounded-l-3xl md:rounded-tr-none">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-choco/10 px-5 py-4">
          <h2 className="font-display text-xl font-black">Tu pedido 🧺</h2>
          <button
            onClick={cart.closeCart}
            aria-label="Cerrar pedido"
            className="grid size-9 place-items-center rounded-full bg-choco/5 text-lg font-bold hover:bg-choco/10"
          >
            ✕
          </button>
        </div>

        {sent ? (
          /* Estado de éxito */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-leaf/15 text-3xl">✅</span>
            <h3 className="font-display text-2xl font-black">¡Pedido en camino!</h3>
            {savedCode ? (
              <>
                <p className="text-sm leading-relaxed text-choco/70">
                  Se abrió WhatsApp con tu pedido listo para <strong>enviar</strong>. Guarda tu código:
                </p>
                <p className="rounded-2xl bg-choco px-6 py-3 font-display text-2xl font-black tracking-widest text-honey">
                  {savedCode}
                </p>
                <p className="text-xs text-choco/55">
                  Con ese código puedes ver el estado en{" "}
                  <Link href="/mis-pedidos" className="font-bold text-caramel underline">
                    Mis pedidos
                  </Link>{" "}
                  (también lo guardamos en este navegador).
                </p>
              </>
            ) : (
              saveFailed && (
                <p className="rounded-xl bg-honey/25 px-4 py-3 text-sm text-choco/80">
                  Tu WhatsApp se abrió, pero no pudimos guardar el pedido en el panel (¿sin internet?).
                  Envíalo igual por el chat: no perderás tu pedido. 🧡
                </p>
              )
            )}
            <div className="mt-2 flex flex-col gap-2 self-stretch">
              <button
                onClick={() => {
                  setSent(false);
                  cart.closeCart();
                }}
                className="rounded-full bg-choco px-6 py-3 font-bold text-cream hover:bg-caramel"
              >
                Volver a la tienda
              </button>
              {savedCode && (
                <Link
                  href="/mis-pedidos"
                  className="rounded-full px-6 py-2 text-sm font-bold text-choco/60 hover:text-choco"
                >
                  Ver mis pedidos →
                </Link>
              )}
            </div>
          </div>
        ) : cart.items.length === 0 ? (
          /* Carrito vacío */
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="text-5xl" aria-hidden="true">🍽️</span>
            <p className="font-display text-xl font-bold">Tu pedido está vacío</p>
            <p className="text-sm text-choco/60">
              Agrégale algo rico del menú: yogur griego, quesillo, torta de pan…
            </p>
            <button
              onClick={cart.closeCart}
              className="mt-2 rounded-full bg-caramel px-6 py-3 font-bold text-cream hover:bg-caramel-deep"
            >
              Ver el menú de hoy
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {cart.items.map((item) => (
                <div key={item.key} className="flex gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-choco/5">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-bold">
                        {item.name}
                        {item.variant && <span className="font-semibold text-choco/55"> · {item.variant}</span>}
                      </p>
                      <button
                        onClick={() => cart.remove(item.key)}
                        aria-label={`Quitar ${item.name}`}
                        className="text-choco/35 transition hover:text-berry"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => cart.setQty(item.key, item.qty - 1)}
                          aria-label="Quitar uno"
                          className="grid size-7 place-items-center rounded-full bg-choco/5 font-black hover:bg-choco/10"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-black">{item.qty}</span>
                        <button
                          onClick={() => cart.setQty(item.key, item.qty + 1)}
                          aria-label="Agregar uno"
                          className="grid size-7 place-items-center rounded-full bg-choco/5 font-black hover:bg-choco/10"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-display text-sm font-black text-caramel-deep">
                        {usd(item.unitUsd * item.qty)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Entrega, pago y datos del cliente */}
            <div className="space-y-4 border-t border-choco/10 bg-cream-deep/50 px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="ck-name" className="text-xs font-black uppercase tracking-wider text-choco/60">
                    👤 Tu nombre
                  </label>
                  <input
                    id="ck-name"
                    className="field mt-1.5"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej: María"
                    maxLength={60}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="ck-phone" className="text-xs font-black uppercase tracking-wider text-choco/60">
                    📱 Tu teléfono
                  </label>
                  <input
                    id="ck-phone"
                    className="field mt-1.5"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="04141234567"
                    inputMode="tel"
                    maxLength={20}
                    autoComplete="tel"
                  />
                </div>
              </div>
              <p className="text-[11px] leading-snug text-choco/50">
                Sin registros ni claves: con tu nombre y teléfono coordinamos la entrega y tu pedido queda
                guardado con un código para que lo rastrees.
              </p>

              <div>
                <label htmlFor="zone" className="text-xs font-black uppercase tracking-wider text-choco/60">
                  🚚 Método de entrega
                </label>
                <select
                  id="zone"
                  className="field mt-1.5 font-semibold"
                  value={cart.zoneId ?? ""}
                  onChange={(e) => cart.setZoneId(e.target.value)}
                >
                  {config.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} {z.feeUsd > 0 ? `(+${usd(z.feeUsd)})` : "(sin costo)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-xs font-black uppercase tracking-wider text-choco/60">💳 Método de pago</span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m: PaymentMethod) => (
                    <button
                      key={m}
                      onClick={() => cart.setPayment(m)}
                      className={`rounded-xl border-2 px-2 py-2 text-xs font-bold transition ${
                        cart.payment === m
                          ? "border-choco bg-choco text-cream"
                          : "border-choco/15 bg-white text-choco/70 hover:border-choco/40"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Honeypot anti-spam invisible */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="pointer-events-none absolute size-0 opacity-0"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
              />

              {/* Totales */}
              <div className="rounded-2xl bg-white p-4 text-sm shadow-card ring-1 ring-choco/5">
                <div className="flex justify-between text-choco/70">
                  <span>Subtotal</span>
                  <span className="font-bold text-choco">{usd(cart.subtotalUsd)}</span>
                </div>
                <div className="mt-1 flex justify-between text-choco/70">
                  <span>Entrega</span>
                  <span className="font-bold text-choco">
                    {cart.zone ? (cart.zone.feeUsd > 0 ? usd(cart.zone.feeUsd) : "Gratis") : "—"}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-dashed border-choco/20 pt-2">
                  <span className="font-display text-base font-black">Total</span>
                  <span className="text-right font-display text-xl font-black text-caramel-deep">
                    {usd(cart.totalUsd)}
                    <span className="ml-2 block text-xs font-bold text-choco/55">{bs(cart.totalUsd, config.rate)}</span>
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-choco/50">
                  Tasa Euro BCV {rateFmt(config.rate)} Bs/$ · {config.storeName}
                </p>
              </div>

              {error && (
                <p className="rounded-xl bg-berry/10 px-4 py-2.5 text-sm font-bold text-berry" role="alert">
                  {error}
                </p>
              )}

              <button
                onClick={onConfirm}
                disabled={placing}
                className="flex w-full items-center justify-center gap-3 rounded-full bg-wa px-6 py-4 font-display text-lg font-black text-white shadow-pop transition hover:-translate-y-0.5 hover:bg-wa-deep disabled:opacity-60"
              >
                <WhatsAppIcon className="size-6" />
                {placing ? "Guardando tu pedido…" : "Confirmar pedido por WhatsApp 📲"}
              </button>
              <p className="pb-1 text-center text-[11px] text-choco/50">
                Se guarda con tu código y se abre el chat listo para enviar. 🔒
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
