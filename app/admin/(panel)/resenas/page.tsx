import ReviewModeration from "@/components/admin/ReviewModeration";
import { getAllReviews } from "@/lib/store";
import type { ModerableReview } from "@/components/admin/ReviewModeration";

export const dynamic = "force-dynamic";

export default function AdminReviewsPage() {
  const rows = getAllReviews();
  const reviews = rows.map((r) => ({
    id: r.id,
    name: r.name,
    zone: r.zone,
    text: r.text,
    stars: r.stars,
    status: r.status as ModerableReview["status"],
  }));

  return (
    <div>
      <h1 className="font-display text-3xl font-black">Reseñas 🗣️</h1>
      <p className="mt-1 text-sm text-choco/60">
        Las reseñas que dejan los clientes en la tienda llegan aquí primero. Aprueba las que quieras
        publicar (aparecen al instante) y elimina las que no.
      </p>
      <ReviewModeration reviews={reviews} />
    </div>
  );
}
