import { NextResponse } from "next/server";
import { fetchBcvRate } from "@/lib/rate";
import { setSetting } from "@/lib/store";

// Scraping/consulta automática de la tasa BCV del día (ve.dolarapi.com con respaldo pydolarve.org)
export async function POST() {
  try {
    const { rate, source } = await fetchBcvRate();
    setSetting("bcv_rate", String(rate));
    setSetting("bcv_rate_updated_at", new Date().toISOString());
    return NextResponse.json({ ok: true, rate, source });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo actualizar la tasa" },
      { status: 502 }
    );
  }
}
