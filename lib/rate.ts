// Obtención de la Tasa Euro oficial del BCV desde fuentes públicas (con respaldo).
// El taller vende en dólares pero convierte a bolívares con la Tasa Euro BCV.
// Fuente principal: pydolarve.org (monitors.bcv del endpoint /euro). No requiere API key.

export type BcvRate = { rate: number; source: string };

export async function fetchBcvRate(): Promise<BcvRate> {
  // Fuente 1: ve.dolarapi.com — cotizaciones oficiales BCV (EUR → VES)
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/cotizaciones", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = (await res.json()) as Array<{ moneda?: string; promedio?: number }>;
      const eur = json.find((c) => c.moneda === "EUR");
      if (typeof eur?.promedio === "number" && eur.promedio > 0) {
        return { rate: eur.promedio, source: "ve.dolarapi.com (Euro BCV)" };
      }
    }
  } catch {
    /* sigue con el respaldo */
  }

  // Fuente 2: pydolarve.org — tasa Euro BCV
  try {
    const res = await fetch("https://pydolarve.org/api/v1/euro?page=bcv", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = (await res.json()) as {
        monitors?: Record<string, { price?: number }> | undefined;
      };
      const bcv = json?.monitors?.bcv?.price;
      if (typeof bcv === "number" && bcv > 0) {
        return { rate: bcv, source: "pydolarve.org (Euro BCV)" };
      }
    }
  } catch {
    /* sigue con el respaldo */
  }

  // Fuente 2: pydolarve.org — página general (por si cambia la estructura del JSON)
  try {
    const res = await fetch("https://pydolarve.org/api/v1/euro", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = (await res.json()) as {
        monitors?: Record<string, { price?: number }> | undefined;
      };
      const bcv = json?.monitors?.bcv?.price;
      if (typeof bcv === "number" && bcv > 0) {
        return { rate: bcv, source: "pydolarve.org (Euro BCV)" };
      }
    }
  } catch {
    /* sin respaldo disponible */
  }

  throw new Error(
    "No se pudo obtener la Tasa Euro BCV. Revisa tu conexión o ingrésala manualmente en /admin/ajustes."
  );
}
