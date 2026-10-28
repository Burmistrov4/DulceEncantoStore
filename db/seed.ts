// Resetea la base de datos LOCAL (file:) y la siembra con los productos mock.
// Uso: npm run db:seed   (no funciona contra Turso remoto por seguridad)
import { resetDb, getDb } from "./index";
import { SEED_PRODUCTS, DEFAULT_SETTINGS } from "./seed-data";

if (process.env.TURSO_DATABASE_URL && !process.env.LIBSQL_URL) {
  console.error("✖ db:seed solo funciona con la base local. Desactiva TURSO_DATABASE_URL temporalmente.");
  process.exit(1);
}

const store = await resetDb();
const fresh = await getDb();
const rs = await fresh.client.execute("SELECT COUNT(*) AS c FROM products");
const count = Number((rs.rows[0] as unknown as { c: number | bigint }).c);
console.log(`✔ Base de datos lista: ${count} productos (esperados ${SEED_PRODUCTS.length}).`);
console.log(`  Ajustes sembrados: ${Object.keys(DEFAULT_SETTINGS).length}.`);
console.log(`  Archivo: db/dulces.db`);
