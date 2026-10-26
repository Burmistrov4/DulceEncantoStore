import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { SEED_PRODUCTS, DEFAULT_SETTINGS } from "./seed-data";

const DB_PATH = path.join(process.cwd(), "db", "dulces.db");

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
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
`;

export type DbStore = {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: Database.Database;
};

// Migraciones incrementales para bases creadas con versiones anteriores.
function migrate(sqlite: Database.Database) {
  const cols = sqlite.prepare("PRAGMA table_info(products)").all() as { name: string }[];
  const has = (name: string) => cols.some((c) => c.name === name);
  if (!has("featured")) {
    sqlite.exec("ALTER TABLE products ADD COLUMN featured INTEGER NOT NULL DEFAULT 0");
    // Sembramos algunos destacados para que el carrusel tenga demo en bases existentes
    sqlite.exec(
      `UPDATE products SET featured = 1 WHERE id IN ('yogur-fresa','quesillo-bandeja','combo-familiar')`
    );
  }
}

function seedIfEmpty(store: DbStore) {
  const row = store.sqlite.prepare("SELECT COUNT(*) AS c FROM products").get() as { c: number };
  if (row.c > 0) return;
  seed(store);
}

export function seed(store: DbStore) {
  const now = Math.floor(Date.now() / 1000);
  const insertProduct = store.sqlite.prepare(
    `INSERT OR IGNORE INTO products
     (id, slug, name, description, category, price_usd, variants, image, servings, ingredients, active, available_today, featured, stock, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)`
  );
  const insertSetting = store.sqlite.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  const tx = store.sqlite.transaction(() => {
    for (const p of SEED_PRODUCTS) {
      insertProduct.run(
        p.id,
        p.slug,
        p.name,
        p.description,
        p.category,
        p.priceUsd,
        JSON.stringify(p.variants),
        p.image,
        p.servings,
        p.ingredients,
        p.featured ? 1 : 0,
        p.stock,
        p.sortOrder,
        now
      );
    }
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) insertSetting.run(key, value);
  });
  tx();
}

function initDb(): DbStore {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(DDL);
  migrate(sqlite);
  const store: DbStore = { db: drizzle(sqlite, { schema }), sqlite };
  seedIfEmpty(store);
  return store;
}

// Singleton a nivel de proceso: sobrevive al hot-reload de Next en desarrollo
const g = globalThis as unknown as { __dulcesDb?: DbStore };

export function getDb(): DbStore {
  if (!g.__dulcesDb) g.__dulcesDb = initDb();
  return g.__dulcesDb;
}

export function resetDb(): DbStore {
  if (g.__dulcesDb) {
    try {
      g.__dulcesDb.sqlite.close();
    } catch {
      /* ignore */
    }
    g.__dulcesDb = undefined;
  }
  for (const suffix of ["", "-wal", "-shm"]) {
    try {
      fs.rmSync(DB_PATH + suffix, { force: true });
    } catch {
      /* ignore */
    }
  }
  return getDb();
}
