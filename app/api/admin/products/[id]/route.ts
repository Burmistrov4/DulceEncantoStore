import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteProduct, updateProduct } from "@/lib/store";
import type { CategoryId, Variant } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const patch: Parameters<typeof updateProduct>[1] = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name;
  if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.category === "string") patch.category = body.category as CategoryId;
  if (body.priceUsd !== undefined && Number.isFinite(Number(body.priceUsd))) patch.priceUsd = Math.round(Number(body.priceUsd));
  if (Array.isArray(body.variants)) {
    patch.variants = (body.variants as Record<string, unknown>[])
      .map((v) => ({ label: String(v.label ?? "").trim(), priceUsd: Math.round(Number(v.priceUsd ?? 0)) }))
      .filter((v) => v.label && Number.isFinite(v.priceUsd) && v.priceUsd >= 0);
  }
  if (typeof body.image === "string") patch.image = body.image;
  if (typeof body.servings === "string") patch.servings = body.servings;
  if (typeof body.ingredients === "string") patch.ingredients = body.ingredients;
  if (typeof body.active === "boolean") patch.active = body.active;
  if (typeof body.availableToday === "boolean") patch.availableToday = body.availableToday;
  if (typeof body.featured === "boolean") patch.featured = body.featured;
  if (body.stock === null || body.stock === "" || body.stock === undefined) patch.stock = body.stock === undefined ? undefined : null;
  else if (Number.isFinite(Number(body.stock))) patch.stock = Math.max(0, Math.round(Number(body.stock)));
  if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) patch.sortOrder = Math.round(Number(body.sortOrder));

  const product = updateProduct(id, patch);
  if (!product) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  revalidatePath("/", "layout");
  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ok = deleteProduct(id);
  if (!ok) return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
