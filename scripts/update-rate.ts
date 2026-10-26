// Actualiza la tasa BCV del día en la base de datos (scraping/consulta automática).
// Uso: npm run rate:update   (ideal en una tarea programada diaria)
import { fetchBcvRate } from "../lib/rate";
import { getDb } from "../db";

async function main() {
  const store = getDb();
  const { rate, source } = await fetchBcvRate();
  const now = new Date().toISOString();
  const upsert = store.sqlite.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  );
  upsert.run("bcv_rate", String(rate));
  upsert.run("bcv_rate_updated_at", now);
  console.log(`✔ Tasa BCV actualizada: ${rate.toFixed(2)} Bs/$ (fuente: ${source})`);
  console.log("  La tienda muestra los precios en Bs con esta tasa de inmediato (ISR ≤15 s).");
}

main().catch((e) => {
  console.error("✖ No se pudo actualizar la tasa:", e instanceof Error ? e.message : e);
  process.exit(1);
});
