import ContentEditor from "@/components/admin/ContentEditor";
import { getSiteContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function AdminContenidoPage() {
  const content = getSiteContent();

  return (
    <div>
      <h1 className="font-display text-3xl font-black">Contenido de la landing 🎨</h1>
      <p className="mt-1 max-w-2xl text-sm text-choco/60">
        Edita textos y fotos de cada sección. Los cambios se ven al instante en la tienda.
      </p>

      <ContentEditor initial={content} />
    </div>
  );
}
