import { NextResponse } from "next/server";
import { fetchBcvRate } from "@/lib/rate";
import { setSetting } from "@/lib/store";

// Consulta automática de la Tasa Euro BCV del día (pydolarve.org con respaldo)
export async function POST() {
  try {
    const { rate, source } = await fetchBcvRate();
    await setSetting("bcv_rate", String(rate));
    await setSetting("bcv_rate_updated_at", new Date().toISOString());
    return NextResponse.json({ ok: true, rate, source });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo actualizar la tasa" },
      { status: 502 }
    );
  }
}
