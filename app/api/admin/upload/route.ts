import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { put } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";

const ALLOWED = new Set(["image/webp", "image/jpeg", "image/png"]);
const MAX_BYTES = 6 * 1024 * 1024;

// Subida de fotos de producto. El cliente recorta y convierte a .webp antes de enviar;
// aquí solo validamos y guardamos.
//
// - Producción (Vercel): con BLOB_READ_WRITE_TOKEN configurado, la foto se sube a
//   Vercel Blob y se devuelve su URL pública permanente (el filesystem de Vercel es
//   efímero; escribir en public/uploads se perdería en el próximo deploy).
// - Desarrollo local: sin token, se guarda en public/uploads como siempre.
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo faltante" }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Formato no permitido (usa WebP, JPG o PNG)" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera 6 MB" }, { status: 413 });
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const bytes = Buffer.from(await file.arrayBuffer());

  // Modo Blob: el token lo inyecta Vercel al vincular el Blob store al proyecto
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`productos/${nanoid(12)}.${ext}`, bytes, {
        contentType: file.type,
        access: "public",
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return NextResponse.json({ path: blob.url, storage: "blob" });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? `No se pudo subir a Vercel Blob: ${e.message}` : "Error subiendo a Blob" },
        { status: 502 },
      );
    }
  }

  // Modo local (desarrollo): public/uploads
  const name = `${nanoid(12)}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), bytes);
  return NextResponse.json({ path: `/uploads/${name}`, storage: "local" });
}
