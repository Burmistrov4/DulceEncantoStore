import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Productos del catálogo. priceUsd y variantes[].priceUsd están en CENTAVOS de dólar
// para evitar errores de redondeo; Bs se calcula al vuelo con la tasa BCV.
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull(), // yogures | quesillos | tortas | combos
  priceUsd: integer("price_usd").notNull(),
  variants: text("variants").notNull().default("[]"), // JSON: [{label, priceUsd}]
  image: text("image").notNull().default(""),
  servings: text("servings").notNull().default(""),
  ingredients: text("ingredients").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  availableToday: integer("available_today", { mode: "boolean" }).notNull().default(true),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  stock: integer("stock"), // null = no se lleva conteo
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Configuración clave-valor: tasa BCV, número de WhatsApp, zonas de delivery, etc.
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

// Eventos del embudo: view | add_to_cart | whatsapp_click | product_view
export const events = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull(),
  productId: text("product_id"),
  meta: text("meta"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Reseñas que dejan los visitantes desde la tienda: quedan "pending" hasta que
// el dueño las aprueba desde /admin/resenas (o las rechaza/elimina).
export const reviews = sqliteTable("reviews", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  zone: text("zone").notNull().default(""),
  text: text("text").notNull(),
  stars: integer("stars").notNull().default(5),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Pedidos confirmados por WhatsApp. Se guardan al momento de abrir el chat,
// sin cuentas: el cliente se identifica con nombre+teléfono y un código corto
// (ej: DE-K7M3Q) que le sirve para rastrear su pedido en /mis-pedidos.
// El servidor recalcula precios/total desde la BD al crear (nunca confía en el cliente).
export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(), // solo dígitos, para enlaces wa.me
  items: text("items").notNull(), // JSON [{name, variant, qty, unitUsd}]
  subtotalUsd: integer("subtotal_usd").notNull(),
  feeUsd: integer("fee_usd").notNull().default(0),
  totalUsd: integer("total_usd").notNull(),
  zoneName: text("zone_name").notNull().default(""),
  payment: text("payment").notNull().default(""),
  rate: real("rate").notNull(), // tasa BCV congelada al momento del pedido
  status: text("status").notNull().default("nuevo"), // nuevo|confirmado|preparando|entregado|cancelado
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type ProductRow = typeof products.$inferSelect;
export type ReviewRow = typeof reviews.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type EventRow = typeof events.$inferSelect;
