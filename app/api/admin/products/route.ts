import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createProduct } from "@/lib/store";
import { CATEGORIES, type CategoryId, type Variant } from "@/lib/types";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "") as CategoryId;
  if (!name) return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  if (!CATEGORIES.some((c) => c.id === category)) {
    return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
  }

  const priceUsd = Math.round(Number(body.priceUsd ?? 0));
  if (!Number.isFinite(priceUsd) || priceUsd < 0) {
    return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
  }

  const variants: Variant[] = Array.isArray(body.variants)
    ? (body.variants as Record<string, unknown>[])
        .map((v) => ({ label: String(v.label ?? "").trim(), priceUsd: Math.round(Number(v.priceUsd ?? 0)) }))
        .filter((v) => v.label && Number.isFinite(v.priceUsd) && v.priceUsd >= 0)
    : [];

  try {
    const product = await createProduct({
      name,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description: String(body.description ?? ""),
      category,
      priceUsd,
      variants,
      image: String(body.image ?? ""),
      servings: String(body.servings ?? ""),
      ingredients: String(body.ingredients ?? ""),
      active: body.active !== false,
      availableToday: body.availableToday !== false,
      featured: body.featured === true,
      stock: body.stock === null || body.stock === undefined || body.stock === "" ? null : Math.max(0, Math.round(Number(body.stock))),
      sortOrder: Number.isFinite(Number(body.sortOrder)) ? Math.round(Number(body.sortOrder)) : 500,
    });
    revalidatePath("/", "layout");
    return NextResponse.json({ product });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error al crear" }, { status: 500 });
  }
}
