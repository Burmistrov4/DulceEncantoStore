// Formateo bimonetario: precios guardados en centavos de USD, Bs al cambio del día
const bsFormatter = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function usd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function bs(cents: number, rate: number): string {
  return `Bs ${bsFormatter.format((cents / 100) * rate)}`;
}

export function rateFmt(rate: number): string {
  return bsFormatter.format(rate);
}

export function dateFmt(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat("es-VE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
