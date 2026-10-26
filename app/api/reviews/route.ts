import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createReview } from "@/lib/store";

// Reseñas que dejan los visitantes. Llegan como "pending": el dueño las aprueba
// desde /admin/resenas antes de que se publiquen en la landing.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });

  // Honeypot anti-spam: los bots rellenan todos los campos; este debe llegar vacío
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }); // fingimos éxito para no dar pistas
  }

  const name = String(body.name ?? "").trim();
  const text = String(body.text ?? "").trim();
  const zone = String(body.zone ?? "").trim();
  const stars = Math.round(Number(body.stars ?? 5));

  if (name.length < 2 || name.length > 60) {
    return NextResponse.json({ error: "Escribe tu nombre (2 a 60 caracteres)" }, { status: 400 });
  }
  if (text.length < 10 || text.length > 400) {
    return NextResponse.json({ error: "Cuéntanos un poco más (10 a 400 caracteres)" }, { status: 400 });
  }
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Calificación inválida" }, { status: 400 });
  }

  createReview({ name, zone, text, stars });
  return NextResponse.json({ ok: true });
}
