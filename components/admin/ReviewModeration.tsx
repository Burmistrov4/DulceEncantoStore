"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ReviewDTO } from "@/lib/types";

export type ModerableReview = ReviewDTO & { status: "pending" | "approved" | "rejected" };

const STATUS_META: Record<ModerableReview["status"], { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "bg-honey/20 text-caramel-deep ring-honey/50" },
  approved: { label: "Publicada", cls: "bg-leaf/15 text-leaf ring-leaf/30" },
  rejected: { label: "Rechazada", cls: "bg-choco/10 text-choco/60 ring-choco/20" },
};

function Stars({ n }: { n: number }) {
  return (
    <span className="text-honey" aria-label={`${n} de 5 estrellas`}>
      {"★".repeat(Math.max(0, Math.min(5, n)))}
      <span className="text-choco/20">{"★".repeat(5 - Math.max(0, Math.min(5, n)))}</span>
    </span>
  );
}

function ReviewCard({ review }: { review: ModerableReview }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const send = async (method: "PATCH" | "DELETE", body?: Record<string, unknown>) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("No se pudo completar la acción. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const meta = STATUS_META[review.status];

  return (
    <div className={`rounded-2xl bg-white p-5 shadow-card ring-1 ring-choco/5 ${busy ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg font-bold">{review.name}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ring-1 ${meta.cls}`}>
              {meta.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-choco/55">
            📍 {review.zone || "Sin zona indicada"} · Valencia
          </p>
        </div>
        <Stars n={review.stars} />
      </div>

      <blockquote className="mt-3 rounded-xl bg-cream/70 px-4 py-3 text-sm leading-relaxed text-choco/80">
        “{review.text}”
      </blockquote>

      <div className="mt-4 flex flex-wrap gap-2">
        {review.status !== "approved" && (
          <button
            onClick={() => send("PATCH", { id: Number(review.id), status: "approved" })}
            disabled={busy}
            className="rounded-full bg-leaf px-4 py-2 text-sm font-bold text-cream hover:opacity-90 disabled:opacity-50"
          >
            ✔ Aprobar y publicar
          </button>
        )}
        {review.status !== "rejected" && (
          <button
            onClick={() => send("PATCH", { id: Number(review.id), status: "rejected" })}
            disabled={busy}
            className="rounded-full bg-choco/10 px-4 py-2 text-sm font-bold text-choco/70 hover:bg-choco/20 disabled:opacity-50"
          >
            🚫 Rechazar
          </button>
        )}
        {review.status === "rejected" && (
          <button
            onClick={() => send("PATCH", { id: Number(review.id), status: "pending" })}
            disabled={busy}
            className="rounded-full bg-choco/10 px-4 py-2 text-sm font-bold text-choco/70 hover:bg-choco/20 disabled:opacity-50"
          >
            ↩︎ Volver a pendiente
          </button>
        )}
        <button
          onClick={() => {
            if (window.confirm("¿Eliminar esta reseña para siempre? Esta acción no se puede deshacer.")) {
              send("DELETE", { id: Number(review.id) });
            }
          }}
          disabled={busy}
          className="rounded-full bg-berry/10 px-4 py-2 text-sm font-bold text-berry hover:bg-berry/20 disabled:opacity-50"
        >
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
}

export default function ReviewModeration({ reviews }: { reviews: ModerableReview[] }) {
  const pending = reviews.filter((r) => r.status === "pending");
  const approved = reviews.filter((r) => r.status === "approved");
  const rejected = reviews.filter((r) => r.status === "rejected");

  const Group = ({ title, list, empty }: { title: string; list: ModerableReview[]; empty: string }) => (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-black">
        {title} <span className="text-base font-bold text-choco/40">({list.length})</span>
      </h2>
      {list.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-white p-5 text-sm text-choco/55 shadow-card ring-1 ring-choco/5">{empty}</p>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {list.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </section>
  );

  return (
    <div>
      <Group
        title="Nuevas por revisar 🕐"
        list={pending}
        empty="No hay reseñas esperando revisión. Cuando un cliente deje una desde la tienda, aparecerá aquí."
      />
      <Group title="Publicadas en la tienda ✅" list={approved} empty="Todavía no has aprobado ninguna reseña." />
      <Group title="Rechazadas 🚫" list={rejected} empty="Nada rechazado por ahora." />
    </div>
  );
}
