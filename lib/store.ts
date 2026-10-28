// Capa de datos del servidor (solo usar desde Server Components o Route Handlers).
// Todas las operaciones son async: el driver libSQL habla HTTP con Turso en producción.
import { count, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { affected, getDb } from "@/db";
import { events, orders, products, reviews, settings, type ProductRow } from "@/db/schema";
import { slugify } from "./format";
import { mergeSiteContent, type SiteContent } from "./site-content";
import { ORDER_STATUSES, PAYMENT_METHODS, type OrderDTO, type OrderItemDTO, type OrderStatus } from "./types";
import type { CategoryId, DeliveryZone, ProductDTO, ReviewDTO, StoreConfigDTO, Variant } from "./types";

function toProduct(row: ProductRow): ProductDTO {
  let variants: Variant[] = [];
  try {
    variants = JSON.parse(row.variants || "[]");
  } catch {
    variants = [];
  }
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category as CategoryId,
    priceUsd: row.priceUsd,
    variants,
    image: row.image,
    servings: row.servings,
    ingredients: row.ingredients,
    active: row.active,
    availableToday: row.availableToday,
    featured: !!row.featured,
    stock: row.stock,
    sortOrder: row.sortOrder,
  };
}

// ---------- Productos ----------

export async function getProducts(opts: { onlyActive?: boolean } = {}): Promise<ProductDTO[]> {
  const { db } = await getDb();
  const list = (await db
    .select()
    .from(products)
    .orderBy(products.sortOrder, products.name)
    .all()).map(toProduct);
  return opts.onlyActive ? list.filter((p) => p.active) : list;
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const { db } = await getDb();
  const row = (await db.select().from(products).where(eq(products.slug, slug)).limit(1).all())[0];
  return row ? toProduct(row) : null;
}

export async function getProductById(id: string): Promise<ProductDTO | null> {
  const { db } = await getDb();
  const row = (await db.select().from(products).where(eq(products.id, id)).limit(1).all())[0];
  return row ? toProduct(row) : null;
}

export type ProductInput = {
  name: string;
  slug?: string;
  description?: string;
  category: CategoryId;
  priceUsd: number; // centavos
  variants?: Variant[];
  image?: string;
  servings?: string;
  ingredients?: string;
  active?: boolean;
  availableToday?: boolean;
  featured?: boolean;
  stock?: number | null;
  sortOrder?: number;
};

export async function createProduct(input: ProductInput): Promise<ProductDTO> {
  const { db } = await getDb();
  const id = nanoid(10);
  if (input.name.trim().length < 2) throw new Error("El nombre del producto debe tener al menos 2 caracteres");
  if (!Number.isFinite(input.priceUsd) || input.priceUsd < 0) throw new Error("Precio inválido");
  const slug = slugify(input.slug?.trim() || input.name) || `producto-${id}`;
  const row = {
    id,
    slug: await ensureUniqueSlug(slug),
    name: input.name.trim(),
    description: input.description ?? "",
    category: input.category,
    priceUsd: Math.max(0, Math.round(input.priceUsd)),
    variants: JSON.stringify((input.variants ?? []).filter((v) => v.label?.trim() && v.priceUsd >= 0)),
    image: input.image ?? "",
    servings: input.servings ?? "",
    ingredients: input.ingredients ?? "",
    active: input.active ?? true,
    availableToday: input.availableToday ?? true,
    featured: input.featured ?? false,
    stock: input.stock ?? null,
    sortOrder: input.sortOrder ?? 500,
    createdAt: new Date(),
  };
  await db.insert(products).values(row).run();
  return toProduct(row as ProductRow);
}

async function ensureUniqueSlug(slug: string): Promise<string> {
  const { db } = await getDb();
  let candidate = slug;
  for (let i = 0; i < 5; i++) {
    const exists = (await db.select({ id: products.id }).from(products).where(eq(products.slug, candidate)).limit(1).all())[0];
    if (!exists) return candidate;
    candidate = `${slug}-${nanoid(4).toLowerCase()}`;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

export async function updateProduct(id: string, patch: Partial<ProductInput>): Promise<ProductDTO | null> {
  const { db } = await getDb();
  const set: Record<string, unknown> = {};
  if (patch.name !== undefined) set.name = patch.name.trim();
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.category !== undefined) set.category = patch.category;
  if (patch.priceUsd !== undefined) set.priceUsd = Math.max(0, Math.round(patch.priceUsd));
  if (patch.variants !== undefined) set.variants = JSON.stringify(patch.variants.filter((v) => v.label?.trim()));
  if (patch.image !== undefined) set.image = patch.image;
  if (patch.servings !== undefined) set.servings = patch.servings;
  if (patch.ingredients !== undefined) set.ingredients = patch.ingredients;
  if (patch.active !== undefined) set.active = patch.active;
  if (patch.availableToday !== undefined) set.availableToday = patch.availableToday;
  if (patch.featured !== undefined) set.featured = patch.featured;
  if (patch.stock !== undefined) set.stock = patch.stock;
  if (patch.sortOrder !== undefined) set.sortOrder = patch.sortOrder;
  if (Object.keys(set).length === 0) {
    const cur = (await db.select().from(products).where(eq(products.id, id)).limit(1).all())[0];
    return cur ? toProduct(cur) : null;
  }
  await db.update(products).set(set).where(eq(products.id, id)).run();
  const row = (await db.select().from(products).where(eq(products.id, id)).limit(1).all())[0];
  return row ? toProduct(row) : null;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { db } = await getDb();
  const res = await db.delete(products).where(eq(products.id, id)).run();
  return affected(res) > 0;
}

// ---------- Configuración ----------

export async function getStoreConfig(): Promise<StoreConfigDTO> {
  const { db } = await getDb();
  const rows = await db.select().from(settings).all();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  let zones: DeliveryZone[] = [];
  try {
    zones = JSON.parse(map.delivery_zones || "[]");
  } catch {
    zones = [];
  }
  const rate = Number(map.bcv_rate);
  const envRate = Number(process.env.BCV_RATE_FALLBACK);
  return {
    storeName: map.store_name || process.env.NEXT_PUBLIC_STORE_NAME || "Dulce Encanto",
    // Tasa válida de BD; si falta, un valor del entorno; jamás 0 (rompería los Bs)
    rate: rate > 0 ? rate : envRate > 0 ? envRate : 1,
    rateUpdatedAt: map.bcv_rate_updated_at || new Date().toISOString(),
    whatsappNumber: map.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "584141234567",
    instagramUrl: map.instagram_url || process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/",
    zones,
  };
}

export async function setSetting(key: string, value: string): Promise<void> {
  const { db } = await getDb();
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

// ---------- Reseñas de clientes (con moderación del dueño) ----------

export type ReviewInput = { name: string; zone: string; text: string; stars: number };

export async function createReview(input: ReviewInput): Promise<void> {
  const { db } = await getDb();
  await db
    .insert(reviews)
    .values({
      name: input.name.trim().slice(0, 60),
      zone: input.zone.trim().slice(0, 60),
      text: input.text.trim().slice(0, 400),
      stars: Math.min(5, Math.max(1, Math.round(input.stars))),
      status: "pending",
      createdAt: new Date(),
    })
    .run();
}

function toReviewDTO(row: { id: number; name: string; zone: string; text: string; stars: number }): ReviewDTO {
  return { id: String(row.id), name: row.name, zone: row.zone, text: row.text, stars: row.stars };
}

// Aprobadas, para la landing (las más recientes primero)
export async function getApprovedReviews(limit = 6): Promise<ReviewDTO[]> {
  const { db } = await getDb();
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.status, "approved"))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .all();
  return rows.map(toReviewDTO);
}

// Todas, para el panel (pendientes primero, luego aprobadas/rechazadas)
export async function getAllReviews() {
  const { db } = await getDb();
  return (await db
    .select()
    .from(reviews)
    .orderBy(desc(reviews.createdAt))
    .all()).map((r) => ({ ...toReviewDTO(r), status: r.status }));
}

export async function setReviewStatus(id: number, status: "pending" | "approved" | "rejected"): Promise<boolean> {
  const { db } = await getDb();
  const res = await db.update(reviews).set({ status }).where(eq(reviews.id, id)).run();
  return affected(res) > 0;
}

export async function deleteReview(id: number): Promise<boolean> {
  const { db } = await getDb();
  const res = await db.delete(reviews).where(eq(reviews.id, id)).run();
  return affected(res) > 0;
}

// ---------- Pedidos (sin cuentas: código corto + teléfono del cliente) ----------

const ORDER_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin I,L,O,0,1 (no confundir a mano)
const ORDER_PENDING: OrderStatus[] = ["nuevo", "confirmado", "preparando"];

export type OrderInput = {
  customerName: string;
  customerPhone: string; // solo dígitos con código país, ej: 584141234567
  zoneId: string;
  payment: string;
  items: { productId: string; variant: string | null; qty: number }[];
};

async function generateOrderCode(): Promise<string> {
  const { db } = await getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = "DE-";
    for (let i = 0; i < 5; i++) {
      code += ORDER_ALPHABET[Math.floor(Math.random() * ORDER_ALPHABET.length)];
    }
    const exists = (await db.select({ id: orders.id }).from(orders).where(eq(orders.code, code)).limit(1).all())[0];
    if (!exists) return code;
  }
  throw new Error("No se pudo generar un código de pedido");
}

// Crea el pedido recalculando TODO en el servidor: precios desde la BD,
// tarifa desde la zona guardada y tasa Euro BCV actual. Nunca confía en el cliente.
export async function createOrder(input: OrderInput): Promise<OrderDTO> {
  if (input.items.length === 0 || input.items.length > 30) {
    throw new Error("El pedido debe tener entre 1 y 30 líneas");
  }
  const name = input.customerName.trim();
  if (name.length < 2 || name.length > 60) throw new Error("Escribe tu nombre (2 a 60 caracteres)");
  const phone = input.customerPhone.replace(/\D/g, "");
  if (phone.length < 7 || phone.length > 15) throw new Error("Escribe un teléfono válido");

  const config = await getStoreConfig();
  const zone: DeliveryZone | undefined = config.zones.find((z) => z.id === input.zoneId);
  if (!zone) throw new Error("Elige una zona de entrega válida");
  const payment = (PAYMENT_METHODS as readonly string[]).includes(input.payment) ? input.payment : "Por definir";

  // Deduplica líneas por producto+variante sumando cantidades
  const merged = new Map<string, { productId: string; variant: string | null; qty: number }>();
  for (const line of input.items) {
    const key = `${line.productId}|${line.variant ?? ""}`;
    const prev = merged.get(key);
    if (prev) prev.qty += Math.max(0, Math.round(line.qty));
    else merged.set(key, { productId: line.productId, variant: line.variant, qty: Math.max(0, Math.round(line.qty)) });
  }

  const byId = new Map((await getProducts({ onlyActive: true })).map((p) => [p.id, p]));
  const items: OrderItemDTO[] = [];
  for (const line of merged.values()) {
    const product = byId.get(line.productId);
    if (!product) throw new Error("Un producto del pedido ya no existe: actualiza el menú");
    if (!product.availableToday) throw new Error(`"${product.name}" se agotó hoy: actualiza el pedido`);
    const qty = Math.max(1, Math.min(99, line.qty));
    let unitUsd = product.priceUsd;
    if (line.variant) {
      const variant = product.variants.find((v) => v.label === line.variant);
      if (!variant) throw new Error(`Tamaño inválido para "${product.name}"`);
      unitUsd = variant.priceUsd;
    }
    // Sin stock definido (null) no se limita; con stock, nunca vender más de lo disponible
    if (product.stock !== null && qty > product.stock) {
      throw new Error(`Solo quedan ${product.stock} de "${product.name}" hoy`);
    }
    items.push({ name: product.name, variant: line.variant, qty, unitUsd });
  }

  const subtotalUsd = items.reduce((sum, i) => sum + i.unitUsd * i.qty, 0);
  const feeUsd = zone.feeUsd;
  const totalUsd = subtotalUsd + feeUsd;

  const { db } = await getDb();
  const row = {
    code: await generateOrderCode(),
    customerName: name.slice(0, 60),
    customerPhone: phone.slice(0, 15),
    items: JSON.stringify(items),
    subtotalUsd,
    feeUsd,
    totalUsd,
    zoneName: zone.name,
    payment,
    rate: config.rate,
    status: "nuevo",
    createdAt: new Date(),
  };
  await db.insert(orders).values(row).run();

  return toOrderDTO(row);
}

function toOrderDTO(row: {
  code: string;
  customerName: string;
  customerPhone: string;
  items: string;
  subtotalUsd: number;
  feeUsd: number;
  totalUsd: number;
  zoneName: string;
  payment: string;
  rate: number;
  status: string;
  createdAt: Date;
}): OrderDTO {
  let items: OrderItemDTO[] = [];
  try {
    items = JSON.parse(row.items);
  } catch {
    items = [];
  }
  const status = (ORDER_STATUSES as readonly string[]).includes(row.status) ? (row.status as OrderStatus) : "nuevo";
  return {
    code: row.code,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    items,
    subtotalUsd: row.subtotalUsd,
    feeUsd: row.feeUsd,
    totalUsd: row.totalUsd,
    zoneName: row.zoneName,
    payment: row.payment,
    rate: row.rate,
    status,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getOrderByCode(code: string): Promise<OrderDTO | null> {
  const { db } = await getDb();
  const row = (await db.select().from(orders).where(eq(orders.code, code.trim().toUpperCase())).limit(1).all())[0];
  return row ? toOrderDTO(row) : null;
}

export async function getOrdersByCodes(codes: string[]): Promise<OrderDTO[]> {
  const clean = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))].slice(0, 50);
  if (clean.length === 0) return [];
  const { db } = await getDb();
  return (await db
    .select()
    .from(orders)
    .where(inArray(orders.code, clean))
    .orderBy(desc(orders.createdAt))
    .all()).map(toOrderDTO);
}

export async function getAllOrders(limit = 200): Promise<(OrderDTO & { id: number })[]> {
  const { db } = await getDb();
  return (await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .all()).map((r) => ({ ...toOrderDTO(r), id: r.id }));
}

export async function setOrderStatus(id: number, status: OrderStatus): Promise<boolean> {
  const { db } = await getDb();
  const res = await db.update(orders).set({ status }).where(eq(orders.id, id)).run();
  return affected(res) > 0;
}

export async function getOrdersSummary(): Promise<{ today: number; pending: number; totalUsdToday: number }> {
  const { db } = await getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const all = await db.select().from(orders).where(gte(orders.createdAt, startOfDay)).all();
  const active = all.filter((o) => o.status !== "cancelado");
  return {
    today: all.length,
    pending: all.filter((o) => ORDER_PENDING.includes(o.status as OrderStatus)).length,
    totalUsdToday: active.reduce((sum, o) => sum + o.totalUsd, 0),
  };
}

// ---------- Contenido editable de la landing ----------

export async function getSiteContent(): Promise<SiteContent> {
  const { db } = await getDb();
  const row = (await db.select().from(settings).where(eq(settings.key, "site_content")).limit(1).all())[0];
  let stored: unknown = {};
  if (row) {
    try {
      stored = JSON.parse(row.value);
    } catch {
      stored = {};
    }
  }
  return mergeSiteContent(stored);
}

// Reemplaza las secciones (claves de primer nivel) que vengan en el patch.
export async function saveSiteContent(patch: Partial<SiteContent>): Promise<SiteContent> {
  const current = await getSiteContent();
  const next: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (key in current && value !== undefined) next[key] = value;
  }
  await setSetting("site_content", JSON.stringify(next));
  return next as unknown as SiteContent;
}

// ---------- Eventos del embudo (leads y métricas) ----------

export async function trackEvent(type: string, productId?: string | null, meta?: string): Promise<void> {
  try {
    const { db } = await getDb();
    await db.insert(events).values({ type, productId: productId ?? null, meta: meta ?? null, createdAt: new Date() }).run();
  } catch {
    // el tracking nunca debe romper la experiencia de compra
  }
}

export async function getMetricsSummary() {
  const { db } = await getDb();
  const byType = await db.select({ type: events.type, c: count() }).from(events).groupBy(events.type).all();
  const totals: Record<string, number> = {};
  for (const r of byType) totals[r.type] = r.c;

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const byType7 = await db
    .select({ type: events.type, c: count() })
    .from(events)
    .where(gte(events.createdAt, weekAgo))
    .groupBy(events.type)
    .all();
  const last7: Record<string, number> = {};
  for (const r of byType7) last7[r.type] = r.c;

  return { totals, last7 };
}

export type DailyMetric = { day: string; type: string; c: number };

export async function getDailyMetrics(days = 14): Promise<DailyMetric[]> {
  const { db } = await getDb();
  const since = new Date(Date.now() - (days - 1) * 86400000);
  since.setHours(0, 0, 0, 0);
  const dayExpr = sql<string>`strftime('%Y-%m-%d', ${events.createdAt}, 'unixepoch')`;
  return await db
    .select({ day: dayExpr, type: events.type, c: count() })
    .from(events)
    .where(gte(events.createdAt, since))
    .groupBy(dayExpr, events.type)
    .all();
}

export async function getTopProducts(limit = 8) {
  const { db } = await getDb();
  const rows = await db
    .select({ productId: events.productId, c: count() })
    .from(events)
    .where(isNotNull(events.productId))
    .groupBy(events.productId)
    .orderBy(desc(count()))
    .limit(limit)
    .all();
  const ids = rows.map((r) => r.productId).filter((x): x is string => !!x);
  if (ids.length === 0) return [];
  const prods = await db.select().from(products).where(inArray(products.id, ids)).all();
  const byId = new Map(prods.map((p) => [p.id, toProduct(p)]));
  return rows
    .filter((r): r is { productId: string; c: number } => !!r.productId && byId.has(r.productId))
    .map((r) => ({ product: byId.get(r.productId)!, count: r.c }));
}
