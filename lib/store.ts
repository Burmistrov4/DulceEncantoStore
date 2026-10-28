// Capa de datos del servidor (solo usar desde Server Components o Route Handlers)
import { count, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getDb } from "@/db";
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

export function getProducts(opts: { onlyActive?: boolean } = {}): ProductDTO[] {
  const { db } = getDb();
  const list = db
    .select()
    .from(products)
    .orderBy(products.sortOrder, products.name)
    .all()
    .map(toProduct);
  return opts.onlyActive ? list.filter((p) => p.active) : list;
}

export function getProductBySlug(slug: string): ProductDTO | null {
  const { db } = getDb();
  const row = db.select().from(products).where(eq(products.slug, slug)).limit(1).all()[0];
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

export function createProduct(input: ProductInput): ProductDTO {
  const { db } = getDb();
  const id = nanoid(10);
  const slug = slugify(input.slug?.trim() || input.name) || `producto-${id}`;
  const row = {
    id,
    slug: ensureUniqueSlug(slug, id),
    name: input.name.trim(),
    description: input.description ?? "",
    category: input.category,
    priceUsd: Math.max(0, Math.round(input.priceUsd)),
    variants: JSON.stringify(input.variants ?? []),
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
  db.insert(products).values(row).run();
  return toProduct(row as ProductRow);
}

function ensureUniqueSlug(slug: string, id: string): string {
  const { db } = getDb();
  const exists = db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1).all()[0];
  return exists ? `${slug}-${id.slice(0, 4)}` : slug;
}

export function updateProduct(id: string, patch: Partial<ProductInput>): ProductDTO | null {
  const { db } = getDb();
  const set: Record<string, unknown> = {};
  if (patch.name !== undefined) set.name = patch.name.trim();
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.category !== undefined) set.category = patch.category;
  if (patch.priceUsd !== undefined) set.priceUsd = Math.max(0, Math.round(patch.priceUsd));
  if (patch.variants !== undefined) set.variants = JSON.stringify(patch.variants);
  if (patch.image !== undefined) set.image = patch.image;
  if (patch.servings !== undefined) set.servings = patch.servings;
  if (patch.ingredients !== undefined) set.ingredients = patch.ingredients;
  if (patch.active !== undefined) set.active = patch.active;
  if (patch.availableToday !== undefined) set.availableToday = patch.availableToday;
  if (patch.featured !== undefined) set.featured = patch.featured;
  if (patch.stock !== undefined) set.stock = patch.stock;
  if (patch.sortOrder !== undefined) set.sortOrder = patch.sortOrder;
  if (Object.keys(set).length === 0) {
    const cur = db.select().from(products).where(eq(products.id, id)).limit(1).all()[0];
    return cur ? toProduct(cur) : null;
  }
  db.update(products).set(set).where(eq(products.id, id)).run();
  const row = db.select().from(products).where(eq(products.id, id)).limit(1).all()[0];
  return row ? toProduct(row) : null;
}

export function deleteProduct(id: string): boolean {
  const { db } = getDb();
  const res = db.delete(products).where(eq(products.id, id)).run();
  return res.changes > 0;
}

// ---------- Configuración ----------

export function getStoreConfig(): StoreConfigDTO {
  const { db } = getDb();
  const rows = db.select().from(settings).all();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  let zones: DeliveryZone[] = [];
  try {
    zones = JSON.parse(map.delivery_zones || "[]");
  } catch {
    zones = [];
  }
  const rate = Number(map.bcv_rate);
  return {
    storeName: map.store_name || process.env.NEXT_PUBLIC_STORE_NAME || "Dulce Encanto",
    rate: rate > 0 ? rate : 1,
    rateUpdatedAt: map.bcv_rate_updated_at || new Date().toISOString(),
    whatsappNumber: map.whatsapp_number || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "584141234567",
    instagramUrl: map.instagram_url || process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://instagram.com/",
    zones,
  };
}

export function setSetting(key: string, value: string): void {
  const { db } = getDb();
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

// ---------- Reseñas de clientes (con moderación del dueño) ----------

export type ReviewInput = { name: string; zone: string; text: string; stars: number };

export function createReview(input: ReviewInput): void {
  const { db } = getDb();
  db.insert(reviews)
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
export function getApprovedReviews(limit = 6): ReviewDTO[] {
  const { db } = getDb();
  const rows = db
    .select()
    .from(reviews)
    .where(eq(reviews.status, "approved"))
    .orderBy(desc(reviews.createdAt))
    .limit(limit)
    .all();
  return rows.map(toReviewDTO);
}

// Todas, para el panel (pendientes primero, luego aprobadas/rechazadas)
export function getAllReviews() {
  const { db } = getDb();
  return db
    .select()
    .from(reviews)
    .orderBy(desc(reviews.createdAt))
    .all()
    .map((r) => ({ ...toReviewDTO(r), status: r.status }));
}

export function setReviewStatus(id: number, status: "pending" | "approved" | "rejected"): boolean {
  const { db } = getDb();
  const res = db.update(reviews).set({ status }).where(eq(reviews.id, id)).run();
  return res.changes > 0;
}

export function deleteReview(id: number): boolean {
  const { db } = getDb();
  const res = db.delete(reviews).where(eq(reviews.id, id)).run();
  return res.changes > 0;
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

function generateOrderCode(): string {
  const { sqlite } = getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    let code = "DE-";
    for (let i = 0; i < 5; i++) {
      code += ORDER_ALPHABET[Math.floor(Math.random() * ORDER_ALPHABET.length)];
    }
    const exists = sqlite.prepare("SELECT 1 FROM orders WHERE code = ?").get(code);
    if (!exists) return code;
  }
  throw new Error("No se pudo generar un código de pedido");
}

// Crea el pedido recalculando TODO en el servidor: precios desde la BD,
// tarifa desde la zona guardada y tasa BCV actual. Nunca confía en el cliente.
export function createOrder(input: OrderInput): OrderDTO {
  if (input.items.length === 0 || input.items.length > 30) {
    throw new Error("El pedido debe tener entre 1 y 30 líneas");
  }

  const config = getStoreConfig();
  const zone: DeliveryZone = config.zones.find((z) => z.id === input.zoneId) ?? {
    id: input.zoneId,
    name: "Entrega a acordar",
    feeUsd: 0,
  };
  const payment = (PAYMENT_METHODS as readonly string[]).includes(input.payment) ? input.payment : "Por definir";

  const byId = new Map(getProducts({ onlyActive: true }).map((p) => [p.id, p]));
  const items: OrderItemDTO[] = input.items.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw new Error("Un producto del pedido ya no existe: actualiza el menú");
    if (!product.availableToday) throw new Error(`"${product.name}" se agotó hoy: actualiza el pedido`);
    const qty = Math.max(1, Math.min(99, Math.round(line.qty)));
    let unitUsd = product.priceUsd;
    if (line.variant) {
      const variant = product.variants.find((v) => v.label === line.variant);
      if (!variant) throw new Error(`Tamaño inválido para "${product.name}"`);
      unitUsd = variant.priceUsd;
    }
    return { name: product.name, variant: line.variant, qty, unitUsd };
  });

  const subtotalUsd = items.reduce((sum, i) => sum + i.unitUsd * i.qty, 0);
  const feeUsd = zone.feeUsd;
  const totalUsd = subtotalUsd + feeUsd;

  const { db } = getDb();
  const row = {
    code: generateOrderCode(),
    customerName: input.customerName.trim().slice(0, 60),
    customerPhone: input.customerPhone.replace(/\D/g, "").slice(0, 15),
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
  db.insert(orders).values(row).run();

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

export function getOrderByCode(code: string): OrderDTO | null {
  const { db } = getDb();
  const row = db.select().from(orders).where(eq(orders.code, code.trim().toUpperCase())).limit(1).all()[0];
  return row ? toOrderDTO(row) : null;
}

export function getOrdersByCodes(codes: string[]): OrderDTO[] {
  const clean = [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))].slice(0, 50);
  if (clean.length === 0) return [];
  const { db } = getDb();
  return db
    .select()
    .from(orders)
    .where(inArray(orders.code, clean))
    .orderBy(desc(orders.createdAt))
    .all()
    .map(toOrderDTO);
}

export function getAllOrders(limit = 200): (OrderDTO & { id: number })[] {
  const { db } = getDb();
  return db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .all()
    .map((r) => ({ ...toOrderDTO(r), id: r.id }));
}

export function setOrderStatus(id: number, status: OrderStatus): boolean {
  const { db } = getDb();
  const res = db.update(orders).set({ status }).where(eq(orders.id, id)).run();
  return res.changes > 0;
}

export function getOrdersSummary(): { today: number; pending: number; totalUsdToday: number } {
  const { db } = getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const all = db.select().from(orders).where(gte(orders.createdAt, startOfDay)).all();
  const active = all.filter((o) => o.status !== "cancelado");
  return {
    today: all.length,
    pending: all.filter((o) => ORDER_PENDING.includes(o.status as OrderStatus)).length,
    totalUsdToday: active.reduce((sum, o) => sum + o.totalUsd, 0),
  };
}

// ---------- Contenido editable de la landing ----------

export function getSiteContent(): SiteContent {
  const { db } = getDb();
  const row = db.select().from(settings).where(eq(settings.key, "site_content")).limit(1).all()[0];
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
export function saveSiteContent(patch: Partial<SiteContent>): SiteContent {
  const current = getSiteContent();
  const next: Record<string, unknown> = { ...current };
  for (const [key, value] of Object.entries(patch)) {
    if (key in current && value !== undefined) next[key] = value;
  }
  setSetting("site_content", JSON.stringify(next));
  return next as unknown as SiteContent;
}

// ---------- Eventos del embudo (leads y métricas) ----------

export function trackEvent(type: string, productId?: string | null, meta?: string): void {
  try {
    const { db } = getDb();
    db.insert(events).values({ type, productId: productId ?? null, meta: meta ?? null, createdAt: new Date() }).run();
  } catch {
    // el tracking nunca debe romper la experiencia de compra
  }
}

export function getMetricsSummary() {
  const { db } = getDb();
  const byType = db.select({ type: events.type, c: count() }).from(events).groupBy(events.type).all();
  const totals: Record<string, number> = {};
  for (const r of byType) totals[r.type] = r.c;

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const byType7 = db
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

export function getDailyMetrics(days = 14): DailyMetric[] {
  const { db } = getDb();
  const since = new Date(Date.now() - (days - 1) * 86400000);
  since.setHours(0, 0, 0, 0);
  const dayExpr = sql<string>`strftime('%Y-%m-%d', ${events.createdAt}, 'unixepoch')`;
  return db
    .select({ day: dayExpr, type: events.type, c: count() })
    .from(events)
    .where(gte(events.createdAt, since))
    .groupBy(dayExpr, events.type)
    .all();
}

export function getTopProducts(limit = 8) {
  const { db } = getDb();
  const rows = db
    .select({ productId: events.productId, c: count() })
    .from(events)
    .where(isNotNull(events.productId))
    .groupBy(events.productId)
    .orderBy(desc(count()))
    .limit(limit)
    .all();
  const ids = rows.map((r) => r.productId).filter((x): x is string => !!x);
  if (ids.length === 0) return [];
  const prods = db.select().from(products).where(inArray(products.id, ids)).all();
  const byId = new Map(prods.map((p) => [p.id, toProduct(p)]));
  return rows
    .filter((r): r is { productId: string; c: number } => !!r.productId && byId.has(r.productId))
    .map((r) => ({ product: byId.get(r.productId)!, count: r.c }));
}
