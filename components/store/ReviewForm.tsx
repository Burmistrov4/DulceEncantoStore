"use client";

import { useState } from "react";

// Formulario público de reseñas: llega como "pending" y el dueño la aprueba
// desde /admin/resenas. Incluye honeypot anti-spam (campo "website" oculto).
export default function ReviewForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [zone, setZone] = useState("");
  const [text, setText] = useState("");
  const [stars, setStars] = useState(5);
  const [website, setWebsite] = useState(""); // honeypot: los bots lo rellenan
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Escribe tu nombre (mínimo 2 letras).");
    if (text.trim().length < 10) return setError("Cuéntanos un poco más (mínimo 10 letras).");
    setError("");
    setStatus("sending");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, zone, text, stars, website }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo enviar tu reseña");
      setStatus("done");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Error inesperado");
    }
  };

  if (!open) {
    return (
      <div className="mt-10 text-center">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border-2 border-caramel/40 bg-white/70 px-7 py-3 font-display text-lg font-bold text-caramel-deep shadow-card transition hover:-translate-y-0.5 hover:border-caramel hover:bg-caramel hover:text-cream"
        >
          ⭐ Dejar mi reseña
        </button>
        <p className="mt-2 text-xs text-choco/50">
          ¿Probaste nuestros postres? Tu opinión ayuda a otros valencianos a antojarse. 🧡
        </p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="mx-auto mt-10 max-w-xl rounded-3xl bg-white p-7 text-center shadow-card ring-1 ring-choco/5">
        <span className="text-4xl" aria-hidden="true">🧡</span>
        <h3 className="mt-2 font-display text-xl font-black">¡Gracias, {name.split(" ")[0]}!</h3>
        <p className="mt-2 text-sm text-choco/70">
          Tu reseña quedó registrada y será visible en cuanto la revisemos. Mil gracias por el cariño.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-10 w-full max-w-xl rounded-3xl bg-white p-6 shadow-card ring-1 ring-choco/5"
    >
      <h3 className="font-display text-xl font-black">Cuéntanos tu experiencia ✨</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="rv-name" className="text-xs font-black uppercase tracking-wider text-choco/60">
            Tu nombre *
          </label>
          <input
            id="rv-name"
            className="field mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            required
          />
        </div>
        <div>
          <label htmlFor="rv-zone" className="text-xs font-black uppercase tracking-wider text-choco/60">
            Tu zona (opcional)
          </label>
          <input
            id="rv-zone"
            className="field mt-1.5"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
            maxLength={60}
            placeholder="Ej: El Viñedo"
          />
        </div>
      </div>

      <div className="mt-4">
        <span className="text-xs font-black uppercase tracking-wider text-choco/60">Tu calificación</span>
        <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Calificación de 1 a 5 estrellas">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={stars === n}
              aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
              onClick={() => setStars(n)}
              className={`text-3xl leading-none transition hover:scale-110 ${
                n <= stars ? "text-honey" : "text-choco/15"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="rv-text" className="text-xs font-black uppercase tracking-wider text-choco/60">
          Tu reseña *
        </label>
        <textarea
          id="rv-text"
          className="field mt-1.5 min-h-24"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={400}
          placeholder="¿Qué pediste? ¿Cómo te gustó? 😋"
          required
        />
        <p className="mt-1 text-right text-[11px] text-choco/40">{text.length}/400</p>
      </div>

      {/* Honeypot anti-spam: invisible para personas */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="pointer-events-none absolute size-0 opacity-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {error && (
        <p className="rounded-xl bg-berry/10 px-4 py-2.5 text-sm font-bold text-berry" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={status === "sending"}
          className="flex-1 rounded-full bg-caramel px-6 py-3 font-bold text-cream transition hover:bg-caramel-deep disabled:opacity-50 sm:flex-none sm:px-10"
        >
          {status === "sending" ? "Enviando…" : "Enviar reseña"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full px-5 py-3 font-bold text-choco/50 hover:text-choco"
        >
          Cancelar
        </button>
      </div>
      <p className="mt-3 text-[11px] text-choco/45">
        Tu reseña se publica después de una revisión rápida (filtramos spam, no opiniones 😊).
      </p>
    </form>
  );
}
