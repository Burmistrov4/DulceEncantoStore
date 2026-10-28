// ─────────────────────────────────────────────────────────────────────────────
// Capa de base de datos (libSQL / Turso)
//
// En desarrollo (y despliegues con disco) usa un archivo SQLite local:
//   LIBSQL_URL=file:./db/dulces.db
// En producción (Vercel) usa una base Turso remota:
//   TURSO_DATABASE_URL=libsql://tu-db.turso.io
//   TURSO_AUTH_TOKEN=eyJ...
// El dialecto Drizzle (sqlite-core) y el esquema son idénticos en ambos casos.
// Todas las operaciones son async (el driver habla HTTP con Turso).
// ─────────────────────────────────────────────────────────────────────────────
import { createClient, type Client, type InStatement } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { SEED_PRODUCTS, DEFAULT_SETTINGS } from "./seed-data";

const DDL = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  price_usd INTEGER NOT NULL,
  variants TEXT NOT NULL DEFAULT '[]',
  image TEXT NOT NULL DEFAULT '',
  servings TEXT NOT NULL DEFAULT '',
  ingredients TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  available_today INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  stock INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  product_id TEXT,
  meta TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  zone TEXT NOT NULL DEFAULT '',
  text TEXT NOT NULL,
  stars INTEGER NOT NULL DEFAULT 5,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items TEXT NOT NULL,
  subtotal_usd INTEGER NOT NULL,
  fee_usd INTEGER NOT NULL DEFAULT 0,
  total_usd INTEGER NOT NULL,
  zone_name TEXT NOT NULL DEFAULT '',
  payment TEXT NOT NULL DEFAULT '',
  rate REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'nuevo',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
`;

export type DbStore = {
  db: LibSQLDatabase<typeof schema>;
  client: Client;
};

// Ejecuta una sentencia cruda y devuelve filas como objetos.
export async function queryAll<T = Record<string, unknown>>(stmt: InStatement): Promise<T[]> {
  const { client } = await getDb();
  const rs = await client.execute(stmt);
  return rs.rows as unknown as T[];
}

// Número de filas afectadas, portable entre el driver viejo (changes) y libSQL.
export function affected(res: unknown): number {
  const r = res as { rowsAffected?: number | bigint; changes?: number | bigint } | undefined;
  return Number(r?.rowsAffected ?? r?.changes ?? 0);
}

async function ensureSchema(client: Client) {
  // DDL idempotente: funciona igual en archivo local y en Turso remoto
  const stmts = DDL.split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((sql) => ({ sql, args: [] as never[] }));
  await client.batch(stmts, "write");
  // Migración incremental: columna featured (bases creadas con versiones antiguas)
  try {
    await client.execute("SELECT featured FROM products LIMIT 1");
  } catch {
    await client.execute("ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0");
    await client.execute(
      `UPDATE products SET featured = 1 WHERE id IN ('yogur-fresa','quesillo-bandeja','combo-familiar')`,
    );
  }
}

async function seedIfEmpty(store: DbStore) {
  const rs = await store.client.execute("SELECT COUNT(*) AS c FROM products");
  const c = Number((rs.rows[0] as unknown as { c: number | bigint } | undefined)?.c ?? 0);
  if (c > 0) return;
  const now = Math.floor(Date.now() / 1000);
  const stmts: InStatement[] = [];
  for (const p of SEED_PRODUCTS) {
    stmts.push({
      sql: `INSERT OR IGNORE INTO products
        (id, slug, name, description, category, price_usd, variants, image, servings, ingredients, active, available_today, featured, stock, sort_order, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)`,
      args: [
        p.id, p.slug, p.name, p.description, p.category, p.priceUsd,
        JSON.stringify(p.variants), p.image, p.servings, p.ingredients,
        p.featured ? 1 : 0, p.stock, p.sortOrder, now,
      ],
    });
  }
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    stmts.push({ sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)", args: [key, value] });
  }
  await store.client.batch(stmts, "write");
}

function resolveConnection(): { url: string; authToken?: string } {
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || "file:./db/dulces.db";
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || undefined;
  return { url, authToken };
}

async function initDb(): Promise<DbStore> {
  const { url, authToken } = resolveConnection();
  const client = createClient({ url, authToken });
  await ensureSchema(client);
  const store: DbStore = { db: drizzle(client, { schema }), client };
  await seedIfEmpty(store);
  return store;
}

// Singleton a nivel de proceso (sobrevive al hot-reload de Next en desarrollo).
// Las funciones de lib/store.ts lo esperan con `await getDb()`.
const g = globalThis as unknown as { __dulcesDb?: DbStore; __dulcesDbPromise?: Promise<DbStore> };

export function getDb(): Promise<DbStore> {
  if (g.__dulcesDb) return Promise.resolve(g.__dulcesDb);
  if (!g.__dulcesDbPromise) {
    g.__dulcesDbPromise = initDb().then((store) => {
      g.__dulcesDb = store;
      return store;
    });
  }
  return g.__dulcesDbPromise;
}

// Alias explícito para scripts y arranques
export const getDbReady = getDb;

// Solo para uso en desarrollo (npm run db:seed): borra la BD local y la re-crea.
export function resetDb(): Promise<DbStore> {
  const fs = require("node:fs") as typeof import("node:fs");
  try { g.__dulcesDb?.client.close(); } catch { /* ignore */ }
  g.__dulcesDb = undefined;
  g.__dulcesDbPromise = undefined;
  const file = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || "file:./db/dulces.db";
  if (!file.startsWith("file:")) {
    throw new Error("resetDb solo se puede usar con una base local (file:).");
  }
  const dbPath = file.slice("file:".length) || "./db/dulces.db";
  for (const suffix of ["", "-wal", "-shm"]) {
    try { fs.rmSync(dbPath + suffix, { force: true }); } catch { /* ignore */ }
  }
  return getDb();
}
