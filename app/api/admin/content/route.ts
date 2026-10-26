import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSiteContent, saveSiteContent } from "@/lib/store";
import { DEFAULT_SITE_CONTENT } from "@/lib/site-content";

// Guarda el contenido editable de la landing. El editor manda las secciones completas
// que modificó (claves de primer nivel de SiteContent); las demás quedan intactas.
export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  for (const key of Object.keys(DEFAULT_SITE_CONTENT)) {
    if (body[key] !== undefined) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada que guardar" }, { status: 400 });
  }

  saveSiteContent(patch as Partial<ReturnType<typeof getSiteContent>>);
  // Reflejar los cambios al instante en toda la tienda (sin esperar el ISR de 15 s)
  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, content: getSiteContent() });
}

export async function GET() {
  return NextResponse.json({ content: getSiteContent() });
}
