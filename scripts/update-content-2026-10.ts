// One-off (2026-10): ingredientes con mezcla de 3 leches + reseñas semilla aprobadas.
// Uso: npx tsx scripts/update-content-2026-10.ts
import { getDb } from "../db";

const { client } = await getDb();

// 1) Ingredientes de productos ya existentes
const rs = await client.execute("SELECT id, ingredients FROM products");
const update = "UPDATE products SET ingredients = ? WHERE id = ?";
let n = 0;
for (const row of rs.rows) {
  const { id, ingredients } = row as unknown as { id: string; ingredients: string };
  const next = ingredients
    .replaceAll("Leche 100% fresca pasteurizada", "Leche líquida completa, leche en polvo entera y crema de leche")
    .replaceAll("Leche 100% fresca", "Mezcla de 3 leches (líquida completa, en polvo y crema)")
    .replaceAll("leche fresca", "mezcla de 3 leches (líquida, en polvo y crema)");
  if (next !== ingredients) {
    await client.execute({ sql: update, args: [next, id] });
    n++;
  }
}
console.log(`✔ Ingredientes actualizados en ${n} productos.`);

// 2) Reseñas semilla aprobadas (idempotente: solo inserta si el nombre no existe)
const seedReviews = [
  {
    name: "Yulimar Pérez",
    zone: "Flor Amarillo",
    text: "Vivo cerquita del taller y el quesillo sale tibio todas las mañanas. Es el de confianza de la familia: pido por WhatsApp y en minutos está listo para retirar. 🧡",
    stars: 5,
  },
  {
    name: "Douglas Ramírez",
    zone: "El Alboral",
    text: "Pedí el yogur griego de melocotón y llegó fresquito con el delivery. Se nota que es fruta de verdad y no colorante. La relación calidad-precio es excelente.",
    stars: 4,
  },
  {
    name: "Gabriela Fernández",
    zone: "La Isabelica",
    text: "La torta de pan sabe exactamente a la de mi abuela. Pagué por PagoMóvil en bolívares con la tasa del día, sin líos de cuentas. ¡Repetiré seguro! ⭐",
    stars: 5,
  },
];

const have = new Set(
  (await client.execute("SELECT name FROM reviews")).rows.map((r) => String(r.name)),
);
const base = Date.now();
let inserted = 0;
for (const [i, r] of seedReviews.entries()) {
  if (have.has(r.name)) continue;
  await client.execute({
    sql: "INSERT INTO reviews (name, zone, text, stars, status, created_at) VALUES (?, ?, ?, ?, 'approved', ?)",
    args: [r.name, r.zone, r.text, r.stars, Math.floor((base + i * 60000) / 1000)],
  });
  inserted++;
}
console.log(`✔ Reseñas semilla insertadas: ${inserted}.`);
