import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteReview, getAllReviews, setReviewStatus } from "@/lib/store";

const VALID_STATUS = new Set(["pending", "approved", "rejected"]);

// Moderación de reseñas: aprobar (publicar en la landing), rechazar u ocultar
// (volver a pendiente) y eliminar para siempre.
export async function GET() {
  return NextResponse.json({ reviews: getAllReviews() });
}

export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: number; status?: string } | null;
  const id = Math.round(Number(body?.id));
  const status = String(body?.status ?? "");
  if (!Number.isInteger(id) || !VALID_STATUS.has(status)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const ok = setReviewStatus(id, status as "pending" | "approved" | "rejected");
  if (!ok) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => null)) as { id?: number } | null;
  const id = Math.round(Number(body?.id));
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const ok = deleteReview(id);
  if (!ok) return NextResponse.json({ error: "Reseña no encontrada" }, { status: 404 });
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true });
}
