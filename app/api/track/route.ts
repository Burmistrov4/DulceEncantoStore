import { NextResponse } from "next/server";
import { trackEvent } from "@/lib/store";

const ALLOWED_TYPES = new Set(["view", "product_view", "add_to_cart", "whatsapp_click"]);

// Registro público de eventos del embudo (visitas, carritos, clics a WhatsApp)
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { type?: string; productId?: string | null };
    const type = String(body?.type ?? "");
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const productId = typeof body?.productId === "string" && body.productId ? body.productId : null;
    await trackEvent(type, productId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
