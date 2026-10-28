// Empuja TODO tu trabajo local a producción de una vez:
//  1. Sube las imágenes locales (public/uploads/) a Vercel Blob y reescribe las URLs en la BD local.
//  2. Copia productos, ajustes, reseñas y pedidos a Turso.
//
// Requisitos (una sola vez):
//   npx vercel link              (elige tu proyecto dulce-encanto-store)
//   npx vercel env pull .env.production.local
//
// Uso:
//   npx tsx scripts/promote-local-to-production.ts
import { createClient } from "@libsql/client";
import { put } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";

// ── Cargar credenciales de producción ───────────────────────────────────────
const envPath = path.join(process.cwd(), ".env.production.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("✖ Faltan TURSO_DATABASE_URL / TURSO_AUTH_TOKEN. Ejecuta primero:\n  npx vercel link\n  npx vercel env pull .env.production.local");
  process.exit(1);
}

const local = createClient({ url: "file:./db/dulces.db" });
const remote = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

// ── 1) Imágenes locales → Vercel Blob ───────────────────────────────────────
if (BLOB_TOKEN) {
  const tables = [
    { sql: "SELECT id, image FROM products", rewrite: (row: Record<string, unknown>) => row.image },
    { sql: "SELECT key, value FROM settings WHERE key='site_content'", rewrite: null },
  ];
  const rows = await local.execute(tables[0].sql);
  for (const row of rows.rows) {
    const current = String(row.image ?? "");
    if (!current.startsWith("/uploads/")) continue;
    const filePath = path.join(process.cwd(), "public", current);
    if (!fs.existsSync(filePath)) continue;
    const blob = await put(`productos/${path.basename(current)}`, fs.readFileSync(filePath), {
      access: "public",
      addRandomSuffix: false,
      token: BLOB_TOKEN,
    });
    await local.execute({ sql: "UPDATE products SET image = ? WHERE id = ?", args: [blob.url, row.id] });
    console.log(`✔ ${current} → ${blob.url}`);
  }
  console.log("• Imágenes locales subidas a Blob (si las había).");
} else {
  console.log("• Sin BLOB_READ_WRITE_TOKEN: se omitió la subida de imágenes locales (las rutas /uploads/ NO funcionarán en producción).");
}

// ── 2) Copiar tablas a Turso ────────────────────────────────────────────────
type Table = { table: string; cols: string; pk: string };
const tables: Table[] = [
  { table: "products", cols: "id, slug, name, description, category, price_usd, variants, image, servings, ingredients, active, available_today, featured, stock, sort_order, created_at", pk: "id" },
  { table: "settings", cols: "key, value", pk: "key" },
  { table: "events", cols: "id, type, product_id, meta, created_at", pk: "id" },
  { table: "reviews", cols: "id, name, zone, text, stars, status, created_at", pk: "id" },
  { table: "orders", cols: "id, code, customer_name, customer_phone, items, subtotal_usd, fee_usd, total_usd, zone_name, payment, rate, status, created_at", pk: "id" },
];

for (const t of tables) {
  const rs = await local.execute(`SELECT ${t.cols} FROM ${t.table}`);
  if (rs.rows.length === 0) {
    console.log(`• ${t.table}: sin filas, omitida.`);
    continue;
  }
  const cols = t.cols.split(", ").map((c) => `"${c}"`).join(", ");
  const placeholders = t.cols.split(", ").map(() => "?").join(", ");
  const stmts = rs.rows.map((row) => ({
    sql: `INSERT OR REPLACE INTO ${t.table} (${cols}) VALUES (${placeholders})`,
    args: row as unknown as (string | number | null)[],
  }));
  await remote.batch(stmts, "write");
  console.log(`✔ ${t.table}: ${rs.rows.length} filas copiadas a Turso.`);
}

console.log("\n✅ Listo. Abre https://dulce-encanto-store.vercel.app — tu contenido local ya vive en producción.");
console.log("  (Si la tasa no cambia de inmediato, espera ~15 s o haz Redeploy.)");
