import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getStoreConfig, setSetting } from "@/lib/store";
import type { DeliveryZone } from "@/lib/types";

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  if (typeof body.bcv_rate === "number" && Number.isFinite(body.bcv_rate) && body.bcv_rate > 0) {
    await setSetting("bcv_rate", String(body.bcv_rate));
    await setSetting("bcv_rate_updated_at", new Date().toISOString());
  }

  const wa = typeof body.whatsapp_number === "string" ? body.whatsapp_number.replace(/\D/g, "") : "";
  if (wa.length >= 10 && wa.length <= 15) await setSetting("whatsapp_number", wa);

  if (typeof body.instagram_url === "string" && /^https?:\/\/.+/.test(body.instagram_url)) {
    await setSetting("instagram_url", body.instagram_url.trim());
  }

  if (typeof body.store_name === "string" && body.store_name.trim().length >= 2) {
    await setSetting("store_name", body.store_name.trim());
  }

  if (Array.isArray(body.delivery_zones)) {
    const zones: DeliveryZone[] = (body.delivery_zones as Record<string, unknown>[])
      .map((z) => ({
        id: String(z.id ?? "").trim() || `zona-${Math.random().toString(36).slice(2, 8)}`,
        name: String(z.name ?? "").trim(),
        feeUsd: Math.max(0, Math.round(Number(z.feeUsd ?? 0))),
      }))
      .filter((z) => z.name);
    await setSetting("delivery_zones", JSON.stringify(zones));
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, config: await getStoreConfig() });
}
