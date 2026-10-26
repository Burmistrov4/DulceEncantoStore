// Obtención de la tasa oficial BCV desde fuentes públicas (con respaldo).
// Fuentes: ve.dolarapi.com y pydolarve.org — no requieren API key.

export type BcvRate = { rate: number; source: string };

export async function fetchBcvRate(): Promise<BcvRate> {
  // Fuente 1: ve.dolarapi.com
  try {
    const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = (await res.json()) as { promedio?: number };
      if (typeof json.promedio === "number" && json.promedio > 0) {
        return { rate: json.promedio, source: "ve.dolarapi.com" };
      }
    }
  } catch {
    /* sigue con el respaldo */
  }

  // Fuente 2: pydolarve.org
  try {
    const res = await fetch("https://pydolarve.org/api/v1/dollar?page=bcv", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const json = (await res.json()) as { monitors?: { usd?: { price?: number } } };
      const price = json?.monitors?.usd?.price;
      if (typeof price === "number" && price > 0) {
        return { rate: price, source: "pydolarve.org" };
      }
    }
  } catch {
    /* sin respaldo disponible */
  }

  throw new Error("No se pudo obtener la tasa BCV. Revisa tu conexión o ingrésala manualmente.");
}
