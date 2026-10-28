// Construcción del mensaje de pedido para WhatsApp (seguro para cliente y servidor)
import { bs, rateFmt, usd } from "./format";
import type { CartItem, DeliveryZone, StoreConfigDTO } from "./types";

export function waLink(number: string, text: string): string {
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

export function buildOrderMessage(opts: {
  items: CartItem[];
  zone: DeliveryZone | null;
  payment: string;
  config: StoreConfigDTO;
  code?: string | null;
}): string {
  const { items, zone, payment, config, code } = opts;
  const subtotal = items.reduce((sum, i) => sum + i.unitUsd * i.qty, 0);
  const fee = zone?.feeUsd ?? 0;
  const total = subtotal + fee;

  const lines = items.map(
    (i) => `▸ ${i.qty}× *${i.name}*${i.variant ? ` (${i.variant})` : ""} — ${usd(i.unitUsd * i.qty)}`
  );

  return [
    `¡Hola, ${config.storeName}! 👋 Quiero hacer este pedido:`,
    ...(code ? [``, `*Pedido:* ${code}`] : []),
    ``,
    ...lines,
    ``,
    `*Subtotal:* ${usd(subtotal)}`,
    `*Entrega:* ${zone ? zone.name : "Por definir"}${fee ? ` (${usd(fee)})` : " (sin costo)"}`,
    `*Total: ${usd(total)} · ${bs(total, config.rate)}*`,
    `_Tasa Euro BCV: ${rateFmt(config.rate)} Bs/$_`,
    ``,
    `*Forma de pago:* ${payment}`,
    ``,
    `¿Me confirman disponibilidad y tiempo de entrega? ¡Gracias! 🧡`,
  ].join("\n");
}

export function buildDirectProductMessage(productName: string, variantLabel: string | null, priceUsd: number, config: StoreConfigDTO): string {
  return [
    `¡Hola, ${config.storeName}! 👋`,
    ``,
    `Quiero pedir: *${productName}*${variantLabel ? ` (${variantLabel})` : ""} — ${usd(priceUsd)} · ${bs(priceUsd, config.rate)}`,
    ``,
    `¿Está disponible hoy? 🧡`,
  ].join("\n");
}
