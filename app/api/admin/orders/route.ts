import { NextResponse } from "next/server";
import { getAllOrders, setOrderStatus } from "@/lib/store";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

// Panel de pedidos: lista completa y cambio de estado en el pipeline
// (nuevo → confirmado → preparando → entregado / cancelado).
export async function GET() {
  return NextResponse.json({ orders: await getAllOrders() });
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: number; status?: string } | null;
  const id = Math.round(Number(body?.id));
  const status = String(body?.status ?? "");
  if (!Number.isInteger(id) || !(ORDER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const ok = await setOrderStatus(id, status as OrderStatus);
  if (!ok) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
