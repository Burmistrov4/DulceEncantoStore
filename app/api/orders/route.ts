import { NextResponse } from "next/server";
import { createOrder, getOrdersByCodes } from "@/lib/store";

// Crear un pedido sin cuentas: el cliente pone nombre + teléfono al confirmar,
// el servidor recalcula precios/totales desde la BD y devuelve un código corto
// (ej: DE-K7M3Q) que el cliente puede rastrear en /mis-pedidos.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  // Honeypot anti-spam (igual que en reseñas)
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true, code: "DE-00000" }); // fingimos éxito
  }

  const customerName = String(body.customerName ?? "").trim();
  const customerPhone = String(body.customerPhone ?? "").replace(/\D/g, "");
  const zoneId = String(body.zoneId ?? "");
  const payment = String(body.payment ?? "");

  if (customerName.length < 2 || customerName.length > 60) {
    return NextResponse.json({ error: "Escribe tu nombre (2 a 60 caracteres)" }, { status: 400 });
  }
  if (customerPhone.length < 7 || customerPhone.length > 15) {
    return NextResponse.json({ error: "Escribe un teléfono válido (ej: 04141234567)" }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "El pedido está vacío" }, { status: 400 });
  }

  const items = (body.items as Record<string, unknown>[])
    .map((i) => ({
      productId: String(i.productId ?? ""),
      variant: typeof i.variant === "string" && i.variant ? i.variant : null,
      qty: Math.round(Number(i.qty ?? 1)),
    }))
    .filter((i) => i.productId && Number.isFinite(i.qty) && i.qty > 0);

  try {
    const order = await createOrder({ customerName, customerPhone, zoneId, payment, items });
    return NextResponse.json({ ok: true, code: order.code, totalUsd: order.totalUsd, rate: order.rate });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo guardar el pedido" },
      { status: 400 }
    );
  }
}

// Rastreo público por códigos: /api/orders?codes=DE-K7M3Q,DE-XXXXX
export async function GET(req: Request) {
  const url = new URL(req.url);
  const codes = (url.searchParams.get("codes") ?? "").split(",");
  const orders = await getOrdersByCodes(codes);
  return NextResponse.json({ orders });
}
