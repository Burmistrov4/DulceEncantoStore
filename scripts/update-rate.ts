// Actualiza la Tasa Euro BCV del día en la base de datos (consulta automática).
// Uso: npm run rate:update   (ideal en una tarea programada diaria, ej. Vercel Cron)
import { fetchBcvRate } from "../lib/rate";
import { setSetting } from "../lib/store";

async function main() {
  const { rate, source } = await fetchBcvRate();
  await setSetting("bcv_rate", String(rate));
  await setSetting("bcv_rate_updated_at", new Date().toISOString());
  console.log(`✔ Tasa Euro BCV actualizada: ${rate.toFixed(2)} Bs/€ (fuente: ${source})`);
  console.log("  La tienda muestra los precios en Bs con esta tasa de inmediato (ISR ≤15 s).");
}

main().catch((e) => {
  console.error("✖ No se pudo actualizar la tasa:", e instanceof Error ? e.message : e);
  process.exit(1);
});
