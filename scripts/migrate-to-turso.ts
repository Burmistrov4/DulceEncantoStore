// Copia TODOS los datos de tu base local (db/dulces.db) a la base Turso remota.
// Úsalo una sola vez, después de crear la base en Turso.
//
// Uso:
//   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=eyJ... npx tsx scripts/migrate-to-turso.ts
//   (en Windows PowerShell:  $env:TURSO_DATABASE_URL="..."; $env:TURSO_AUTH_TOKEN="..."; npx tsx scripts/migrate-to-turso.ts)
import { createClient } from "@libsql/client";
import fs from "node:fs";
import path from "node:path";

const url = process.env.TURSO_DATABASE_URL;
const token = process.env.TURSO_AUTH_TOKEN;
if (!url || !token) {
  console.error("✖ Faltan TURSO_DATABASE_URL y/o TURSO_AUTH_TOKEN en el entorno.");
  process.exit(1);
}

const localPath = path.join(process.cwd(), "db", "dulces.db");
if (!fs.existsSync(localPath)) {
  console.error("✖ No existe db/dulces.db local.");
  process.exit(1);
}

const local = createClient({ url: `file:${localPath}` });
const remote = createClient({ url, authToken: token });

// Asegura el esquema remoto (idempotente; la app también lo hace al arrancar)
console.log("→ Creando esquema remoto (lo hará la app al arrancar también, esto es idempotente)…");
await remote.execute(`CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL, price_usd INTEGER NOT NULL, variants TEXT NOT NULL DEFAULT '[]', image TEXT NOT NULL DEFAULT '',
  servings TEXT NOT NULL DEFAULT '', ingredients TEXT NOT NULL DEFAULT '', active INTEGER NOT NULL DEFAULT 1,
  available_today INTEGER NOT NULL DEFAULT 1, featured INTEGER NOT NULL DEFAULT 0, stock INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)`);
await remote.execute(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
await remote.execute(`CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, type TEXT NOT NULL,
  product_id TEXT, meta TEXT, created_at INTEGER NOT NULL)`);
await remote.execute(`CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
  zone TEXT NOT NULL DEFAULT '', text TEXT NOT NULL, stars INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL)`);
await remote.execute(`CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL, customer_phone TEXT NOT NULL, items TEXT NOT NULL, subtotal_usd INTEGER NOT NULL,
  fee_usd INTEGER NOT NULL DEFAULT 0, total_usd INTEGER NOT NULL, zone_name TEXT NOT NULL DEFAULT '',
  payment TEXT NOT NULL DEFAULT '', rate REAL NOT NULL, status TEXT NOT NULL DEFAULT 'nuevo', created_at INTEGER NOT NULL)`);

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
    console.log(`• ${t.table}: sin filas locales, omitida.`);
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

console.log("\n✅ Migración completa. Configura TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en Vercel y despliega.");
