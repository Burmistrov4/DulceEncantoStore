"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Interruptor de 1 clic para "Disponible hoy", "Activo" (pausar) y "Destacado" (carrusel)
export default function ProductToggle({
  id,
  field,
  value,
  label,
}: {
  id: string;
  field: "availableToday" | "active" | "featured";
  value: boolean;
  label?: string;
}) {
  const [on, setOn] = useState(value);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    const next = !on;
    setOn(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setOn(!next);
      alert("No se pudo guardar el cambio. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label ?? field}
      title={label ?? field}
      onClick={toggle}
      disabled={saving}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${on ? "bg-leaf" : "bg-choco/25"} ${saving ? "opacity-60" : ""}`}
    >
      <span
        className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${on ? "left-6" : "left-1"}`}
      />
    </button>
  );
}
