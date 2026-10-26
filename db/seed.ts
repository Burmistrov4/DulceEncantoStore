// Resetea la base de datos local y la siembra con los productos mock.
// Uso: npm run db:seed
import { resetDb, seed, getDb } from "./index";
import { SEED_PRODUCTS, DEFAULT_SETTINGS } from "./seed-data";

const store = resetDb();
const fresh = getDb();
// resetDb ya crea y siembra si está vacía; si existía, re-sembramos explícitamente
const count = fresh.sqlite.prepare("SELECT COUNT(*) AS c FROM products").get() as { c: number };
if (count.c === 0) {
  seed(store);
}

const finalCount = fresh.sqlite.prepare("SELECT COUNT(*) AS c FROM products").get() as { c: number };
const settingsCount = fresh.sqlite.prepare("SELECT COUNT(*) AS c FROM settings").get() as { c: number };
console.log(`✔ Base de datos lista: ${finalCount.c} productos (esperados ${SEED_PRODUCTS.length}), ${settingsCount.c} ajustes (esperados ${Object.keys(DEFAULT_SETTINGS).length}).`);
console.log(`  Archivo: db/dulces.db`);
