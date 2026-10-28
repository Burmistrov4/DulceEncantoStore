import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { fetchBcvRate } from "@/lib/rate";
import { setSetting } from "@/lib/store";

// Actualización AUTOMÁTICA de la Tasa Euro BCV — llamada por Vercel Cron
// (ver vercel.json). Segura: si CRON_SECRET está definido, exige el header
// "Authorization: Bearer <CRON_SECRET>", que Vercel envía solo a sus propios crons.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  try {
    const { rate, source } = await fetchBcvRate();
    await setSetting("bcv_rate", String(rate));
    await setSetting("bcv_rate_updated_at", new Date().toISOString());
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, rate, source });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo actualizar la tasa" },
      { status: 502 },
    );
  }
}
