"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Editor de contenido de la landing: una sección = un acordeón editable.
// Al guardar manda el SiteContent completo por PUT /api/admin/content
// (la API reemplaza las claves de primer nivel que recibe).
// ─────────────────────────────────────────────────────────────────────────────

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type {
  CarouselSection,
  CatalogSection,
  FaqSection,
  FinalCtaContent,
  FooterContent,
  FxSection,
  HeroContent,
  ImageRef,
  MarqueeContent,
  SiteContent,
  StepContent,
  StepsSection,
  Testimonial,
  TestimonialsSection,
  UrgencyContent,
} from "@/lib/site-content";
import ImageDropzone from "./ImageDropzone";

// ── Utilidades ───────────────────────────────────────────────────────────────

const LABEL = "block text-xs font-black uppercase tracking-wider text-choco/60";
const HINT = "mt-0.5 text-[11px] leading-snug text-choco/50";

/** Reordena un array moviendo el ítem `index` una posición (dir -1 = arriba, 1 = abajo). */
function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const to = index + dir;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(to, 0, item);
  return next;
}

/** Reemplaza de forma inmutable un ítem del array (sin spread de genéricos). */
function patchItem<T>(list: T[], index: number, make: (item: T) => T): T[] {
  return list.map((item, i) => (i === index ? make(item) : item));
}

type SectionProps<T> = {
  value: T;
  onChange: (patch: Partial<T>) => void;
};

// ── Campos reutilizables ─────────────────────────────────────────────────────

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={LABEL}>{label}</label>
      {hint && <p className={HINT}>{hint}</p>}
      <input
        className="field mt-1.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className={LABEL}>{label}</label>
      {hint && <p className={HINT}>{hint}</p>}
      <textarea
        className="field mt-1.5 min-h-20"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function CheckField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <div>
      <label className="flex items-center gap-2.5 text-sm font-bold">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="size-5 shrink-0 accent-caramel"
        />
        {label}
      </label>
      {hint && <p className={`${HINT} ml-8`}>{hint}</p>}
    </div>
  );
}

/** Botones ✕ ↑ ↓ de cada fila editable. */
function RowButtons({
  onUp,
  onDown,
  onRemove,
  canUp,
  canDown,
  removeLabel,
}: {
  onUp: () => void;
  onDown: () => void;
  onRemove: () => void;
  canUp: boolean;
  canDown: boolean;
  removeLabel: string;
}) {
  const base =
    "grid size-8 shrink-0 place-items-center rounded-full font-bold transition disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={onUp}
        disabled={!canUp}
        aria-label="Subir"
        className={`${base} bg-choco/10 text-choco/70 hover:bg-choco/20`}
      >
        ↑
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={!canDown}
        aria-label="Bajar"
        className={`${base} bg-choco/10 text-choco/70 hover:bg-choco/20`}
      >
        ↓
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel}
        className={`${base} bg-berry/10 text-berry hover:bg-berry/20`}
      >
        ✕
      </button>
    </div>
  );
}

/** Lista editable de textos sueltos (badges, marquee). */
function StringList({
  label,
  items,
  onChange,
  addLabel,
  itemLabel,
  placeholder,
  defaultValue,
  hint,
}: {
  label: string;
  items: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  itemLabel: string;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <label className={LABEL}>
            {label} ({items.length})
          </label>
          {hint && <p className={HINT}>{hint}</p>}
        </div>
        <button
          type="button"
          onClick={() => onChange([...items, defaultValue ?? ""])}
          className="shrink-0 rounded-full bg-choco/10 px-3 py-1.5 text-xs font-bold transition hover:bg-choco/20"
        >
          {addLabel}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 rounded-xl bg-cream-deep/60 px-3 py-2 text-xs text-choco/50">
          No hay elementos todavía. Agrega el primero con el botón de arriba.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="field flex-1"
                value={item}
                onChange={(e) => onChange(items.map((it, j) => (j === i ? e.target.value : it)))}
                placeholder={placeholder}
                aria-label={`${itemLabel} ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                aria-label={`Quitar ${itemLabel.toLowerCase()} ${i + 1}`}
                className="shrink-0 rounded-xl bg-berry/10 px-3 font-bold text-berry transition hover:bg-berry/20"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Lista editable de objetos con botón de agregar y máximo opcional. */
function EditableList({
  label,
  count,
  addLabel,
  onAdd,
  max,
  emptyText,
  children,
}: {
  label: string;
  count: number;
  addLabel: string;
  onAdd: () => void;
  max?: number;
  emptyText?: string;
  children: ReactNode;
}) {
  const atMax = max !== undefined && count >= max;
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className={LABEL}>
          {label} ({count})
          {max !== undefined && <span className="normal-case text-choco/40"> · máx. {max}</span>}
        </label>
        <button
          type="button"
          onClick={onAdd}
          disabled={atMax}
          className="shrink-0 rounded-full bg-choco/10 px-3 py-1.5 text-xs font-bold transition hover:bg-choco/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {addLabel}
        </button>
      </div>
      {count === 0 && (
        <p className="mt-2 rounded-xl bg-cream-deep/60 px-3 py-2 text-xs text-choco/50">
          {emptyText ?? "Todavía no hay elementos. Agrega el primero con el botón de arriba."}
        </p>
      )}
      {count > 0 && <ul className="mt-2 space-y-3">{children}</ul>}
    </div>
  );
}

/** Acordeón de sección: summary como cabecera de card + contenido. */
function SectionCard({
  emoji,
  title,
  subtitle,
  open,
  children,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group rounded-3xl bg-white shadow-card ring-1 ring-choco/5">
      <summary className="flex cursor-pointer select-none list-none items-center gap-3 rounded-3xl px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span
          className="grid size-10 shrink-0 place-items-center rounded-2xl bg-cream-deep text-xl"
          aria-hidden="true"
        >
          {emoji}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-black leading-tight">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs text-choco/50">{subtitle}</span>}
        </span>
        <span className="shrink-0 text-choco/35 transition-transform group-open:rotate-180" aria-hidden="true">
          ▾
        </span>
      </summary>
      <div className="border-t border-choco/5 px-5 py-5 sm:px-6">{children}</div>
    </details>
  );
}

/** Una foto del hero: subida con recorte (ImageDropzone) + texto alternativo. */
function PhotoPicker({
  title,
  photo,
  onChange,
}: {
  title: string;
  photo: ImageRef;
  onChange: (next: ImageRef) => void;
}) {
  return (
    <div className="rounded-2xl bg-cream-deep/50 p-3 ring-1 ring-choco/5">
      <span className={LABEL}>{title}</span>
      <div className="mt-1.5">
        <ImageDropzone value={photo.src} onChange={(src) => onChange({ ...photo, src })} />
      </div>
      <input
        className="field mt-2"
        value={photo.alt}
        onChange={(e) => onChange({ ...photo, alt: e.target.value })}
        placeholder="Texto alternativo: describe la foto"
        aria-label={`Texto alternativo de la ${title.toLowerCase()}`}
      />
      <p className={HINT}>La descripción ayuda a Google y a quienes usan lectores de pantalla.</p>
    </div>
  );
}

// ── Editores por sección ─────────────────────────────────────────────────────

function UrgencyEditor({ value, onChange }: SectionProps<UrgencyContent>) {
  return (
    <div className="space-y-4">
      <CheckField
        label="Mostrar barra de urgencia"
        checked={value.enabled}
        onChange={(enabled) => onChange({ enabled })}
      />
      <TextField
        label="Texto de la barra"
        value={value.overrideText}
        onChange={(overrideText) => onChange({ overrideText })}
        placeholder="🔥 Solo quedan 4 quesillos"
        hint="Déjalo vacío para generarla automática con el stock real del día. Ej: 🔥 Solo quedan 4 quesillos."
      />
    </div>
  );
}

function HeroEditor({ value, onChange }: SectionProps<HeroContent>) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Texto pequeño de arriba"
          value={value.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Postres artesanales · Valencia, Carabobo"
        />
        <TextField
          label="Sticker flotante ✨"
          value={value.sticker}
          onChange={(sticker) => onChange({ sticker })}
          placeholder="¡Horneado hoy! ✨"
        />
        <TextField
          label="Título — parte 1"
          value={value.titleTop}
          onChange={(titleTop) => onChange({ titleTop })}
          placeholder="Recién hechos, con"
        />
        <TextField
          label="Palabras destacadas"
          value={value.titleHighlight}
          onChange={(titleHighlight) => onChange({ titleHighlight })}
          placeholder="leche 100% fresca"
          hint="Estas palabras se resaltan en color dentro del título."
        />
        <TextField
          label="Título — parte 2"
          value={value.titleBottom}
          onChange={(titleBottom) => onChange({ titleBottom })}
          placeholder="y sin conservantes."
        />
        <TextField
          label="Botón principal"
          value={value.primaryCta}
          onChange={(primaryCta) => onChange({ primaryCta })}
          placeholder="Ver menú de hoy"
        />
        <TextField
          label="Botón secundario"
          value={value.secondaryCta}
          onChange={(secondaryCta) => onChange({ secondaryCta })}
          placeholder="Pedir por WhatsApp"
        />
      </div>

      <TextAreaField
        label="Subtítulo"
        value={value.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={3}
        placeholder="Cuenta qué vendes y por qué pedirte es fácil…"
      />

      <StringList
        label="Sellos del hero"
        items={value.badges}
        onChange={(badges) => onChange({ badges })}
        addLabel="+ Agregar sello"
        itemLabel="Sello"
        placeholder="Sin conservantes"
        defaultValue="🏷️ Nuevo sello"
        hint="Pastillas cortas que refuerzan la confianza (aparecen bajo el subtítulo)."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <PhotoPicker
          title="Foto principal"
          photo={value.photos.main}
          onChange={(main) => onChange({ photos: { ...value.photos, main } })}
        />
        <PhotoPicker
          title="Foto secundaria superpuesta"
          photo={value.photos.secondary}
          onChange={(secondary) => onChange({ photos: { ...value.photos, secondary } })}
        />
      </div>
    </div>
  );
}

function MarqueeEditor({ value, onChange }: SectionProps<MarqueeContent>) {
  return (
    <StringList
      label="Textos de la cinta"
      items={value.items}
      onChange={(items) => onChange({ items })}
      addLabel="+ Agregar texto"
      itemLabel="Texto de la cinta"
      placeholder="🥛 Leche 100% fresca"
      defaultValue="✨ Nuevo texto"
      hint="Los emojis se escriben directo en el texto. La cinta se desliza sola en la tienda."
    />
  );
}

function StepsEditor({ value, onChange }: SectionProps<StepsSection>) {
  const steps = value.steps;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Texto pequeño (eyebrow)"
          value={value.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Pedir es facilísimo"
        />
        <TextField
          label="Título de la sección"
          value={value.title}
          onChange={(title) => onChange({ title })}
          placeholder="Tu postre, en 3 pasos"
        />
      </div>

      <EditableList
        label="Pasos"
        count={steps.length}
        max={6}
        addLabel="+ Agregar paso"
        emptyText="Agrega el primer paso del pedido."
        onAdd={() => onChange({ steps: [...steps, { emoji: "✨", title: "Nuevo paso", text: "" }] })}
      >
        {steps.map((step, i) => (
          <li key={i} className="rounded-2xl bg-cream-deep/50 p-3 ring-1 ring-choco/5">
            <div className="flex items-center gap-2">
              <div className="w-16 shrink-0">
                <input
                  className="field text-center"
                  value={step.emoji}
                  onChange={(e) =>
                    onChange({ steps: patchItem(steps, i, (s: StepContent) => ({ ...s, emoji: e.target.value })) })
                  }
                  placeholder="🧁"
                  aria-label={`Emoji del paso ${i + 1}`}
                />
              </div>
              <input
                className="field flex-1"
                value={step.title}
                onChange={(e) =>
                  onChange({ steps: patchItem(steps, i, (s: StepContent) => ({ ...s, title: e.target.value })) })
                }
                placeholder="Título del paso"
                aria-label={`Título del paso ${i + 1}`}
              />
              <RowButtons
                onUp={() => onChange({ steps: moveItem(steps, i, -1) })}
                onDown={() => onChange({ steps: moveItem(steps, i, 1) })}
                onRemove={() => onChange({ steps: steps.filter((_, j) => j !== i) })}
                canUp={i > 0}
                canDown={i < steps.length - 1}
                removeLabel={`Quitar paso ${i + 1}`}
              />
            </div>
            <textarea
              className="field mt-2 min-h-16"
              rows={2}
              value={step.text}
              onChange={(e) =>
                onChange({ steps: patchItem(steps, i, (s: StepContent) => ({ ...s, text: e.target.value })) })
              }
              placeholder="Qué hace el cliente en este paso…"
              aria-label={`Texto del paso ${i + 1}`}
            />
          </li>
        ))}
      </EditableList>
      <p className={HINT}>Consejo: 3 o 4 pasos cortos venden mejor que muchos pasos largos.</p>
    </div>
  );
}

function CarouselEditor({ value, onChange }: SectionProps<CarouselSection>) {
  return (
    <div className="space-y-4">
      <CheckField
        label="Mostrar carrusel «Disponible hoy»"
        checked={value.enabled}
        onChange={(enabled) => onChange({ enabled })}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Texto pequeño (eyebrow)"
          value={value.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Fotos reales, sin filtros"
        />
        <TextField
          label="Título"
          value={value.title}
          onChange={(title) => onChange({ title })}
          placeholder="Disponible hoy en la nevera 🧊"
        />
      </div>
      <TextAreaField
        label="Subtítulo"
        value={value.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={2}
        placeholder="Invita a deslizar y ver lo fresco de hoy…"
      />
      <CheckField
        label="Mostrar solo productos disponibles hoy"
        checked={value.showOnlyAvailable}
        onChange={(showOnlyAvailable) => onChange({ showOnlyAvailable })}
        hint="Marcado = solo productos con «Disponible hoy». Desmarcado = incluye los agotados con su badge."
      />
      <div>
        <label className={LABEL} htmlFor="carousel-auto-advance">
          Segundos entre foto y foto (auto-avance)
        </label>
        <p className={HINT}>0 = el carrusel no avanza solo. Recomendado: 5.</p>
        <input
          id="carousel-auto-advance"
          type="number"
          min={0}
          max={30}
          step={1}
          className="field mt-1.5 w-28"
          value={value.autoAdvanceSeconds}
          onChange={(e) => {
            const parsed = Number(e.target.value);
            onChange({ autoAdvanceSeconds: Number.isFinite(parsed) ? parsed : 0 });
          }}
        />
      </div>
      <p className="rounded-xl bg-honey/40 px-3 py-2 text-xs leading-snug text-choco/70">
        💡 Los productos que salen aquí se eligen en <strong>Productos</strong> con el interruptor ⭐ Destacado.
        Si no hay destacados se muestran los disponibles del día.
      </p>
    </div>
  );
}

function FxEditor({ value, onChange }: SectionProps<FxSection>) {
  return (
    <div className="space-y-4">
      <CheckField
        label="Activar efectos en la tienda"
        checked={value.enabled}
        onChange={(enabled) => onChange({ enabled })}
        hint="Interruptor general. Los efectos se apagan solos en móviles/táctil y para quien tenga «menos movimiento» activado en su sistema."
      />
      <CheckField
        label="Iluminación cálida que sigue el cursor"
        checked={value.spotlight}
        onChange={(spotlight) => onChange({ spotlight })}
        hint="Resplandor suave dentro de las tarjetas de productos y reseñas."
      />
      <CheckField
        label="Efecto 3D sutil en las fotos"
        checked={value.tilt}
        onChange={(tilt) => onChange({ tilt })}
        hint="Las fotos se inclinan apenas al pasar el mouse. Elegante, nunca molesto."
      />
    </div>
  );
}

function CatalogEditor({ value, onChange }: SectionProps<CatalogSection>) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Texto pequeño (eyebrow)"
          value={value.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Menú de hoy"
        />
        <TextField
          label="Título"
          value={value.title}
          onChange={(title) => onChange({ title })}
          placeholder="Elige tu antojo 🤤"
        />
      </div>
      <TextAreaField
        label="Subtítulo"
        value={value.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={2}
        placeholder="Explica precios, tasa del día y lotes pequeños…"
      />
    </div>
  );
}

function TestimonialsEditor({ value, onChange }: SectionProps<TestimonialsSection>) {
  const reviews = value.reviews;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Texto pequeño (eyebrow)"
          value={value.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Valencianos felices"
        />
        <TextField
          label="Título"
          value={value.title}
          onChange={(title) => onChange({ title })}
          placeholder="Lo que dicen quienes ya probaron"
        />
      </div>

      <StringList
        label="Sellos de confianza"
        items={value.badges}
        onChange={(badges) => onChange({ badges })}
        addLabel="+ Agregar sello"
        itemLabel="Sello"
        placeholder="🧑‍🍳 100% Artesanal y Seguro"
        defaultValue="⭐ Nuevo sello"
      />

      <EditableList
        label="Testimonios"
        count={reviews.length}
        addLabel="+ Agregar testimonio"
        emptyText="Agrega el primer testimonio de tus clientes."
        onAdd={() =>
          onChange({ reviews: [...reviews, { name: "Cliente feliz", where: "", text: "", stars: 5 }] })
        }
      >
        {reviews.map((review, i) => (
          <li key={i} className="rounded-2xl bg-cream-deep/50 p-3 ring-1 ring-choco/5">
            <div className="flex items-start gap-2">
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                <input
                  className="field"
                  value={review.name}
                  onChange={(e) =>
                    onChange({ reviews: patchItem(reviews, i, (r: Testimonial) => ({ ...r, name: e.target.value })) })
                  }
                  placeholder="Nombre del cliente"
                  aria-label={`Nombre del testimonio ${i + 1}`}
                />
                <input
                  className="field"
                  value={review.where}
                  onChange={(e) =>
                    onChange({ reviews: patchItem(reviews, i, (r: Testimonial) => ({ ...r, where: e.target.value })) })
                  }
                  placeholder="Zona o barrio (opcional)"
                  aria-label={`Zona del testimonio ${i + 1}`}
                />
              </div>
              <RowButtons
                onUp={() => onChange({ reviews: moveItem(reviews, i, -1) })}
                onDown={() => onChange({ reviews: moveItem(reviews, i, 1) })}
                onRemove={() => onChange({ reviews: reviews.filter((_, j) => j !== i) })}
                canUp={i > 0}
                canDown={i < reviews.length - 1}
                removeLabel={`Quitar testimonio ${i + 1}`}
              />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={LABEL}>Estrellas</span>
              <span className="block w-40">
                <select
                  className="field"
                  value={review.stars}
                  onChange={(e) =>
                    onChange({ reviews: patchItem(reviews, i, (r: Testimonial) => ({ ...r, stars: Number(e.target.value) })) })
                  }
                  aria-label={`Estrellas del testimonio ${i + 1}`}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {"⭐".repeat(n)}
                    </option>
                  ))}
                </select>
              </span>
            </div>
            <textarea
              className="field mt-2 min-h-20"
              rows={3}
              value={review.text}
              onChange={(e) =>
                onChange({ reviews: patchItem(reviews, i, (r: Testimonial) => ({ ...r, text: e.target.value })) })
              }
              placeholder="Lo que dijo el cliente…"
              aria-label={`Texto del testimonio ${i + 1}`}
            />
          </li>
        ))}
      </EditableList>
    </div>
  );
}

function FaqEditor({ value, onChange }: SectionProps<FaqSection>) {
  const faqs = value.faqs;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Texto pequeño (eyebrow)"
          value={value.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Sin dudas"
        />
        <TextField
          label="Título"
          value={value.title}
          onChange={(title) => onChange({ title })}
          placeholder="Preguntas frecuentes"
        />
      </div>

      <EditableList
        label="Preguntas"
        count={faqs.length}
        addLabel="+ Agregar pregunta"
        emptyText="Agrega la primera pregunta frecuente."
        onAdd={() => onChange({ faqs: [...faqs, { q: "Nueva pregunta", a: "" }] })}
      >
        {faqs.map((faq, i) => (
          <li key={i} className="rounded-2xl bg-cream-deep/50 p-3 ring-1 ring-choco/5">
            <div className="flex items-center gap-2">
              <input
                className="field flex-1"
                value={faq.q}
                onChange={(e) =>
                  onChange({
                    faqs: faqs.map((f, j) => (j === i ? { ...f, q: e.target.value } : f)),
                  })
                }
                placeholder="Pregunta"
                aria-label={`Pregunta ${i + 1}`}
              />
              <RowButtons
                onUp={() => onChange({ faqs: moveItem(faqs, i, -1) })}
                onDown={() => onChange({ faqs: moveItem(faqs, i, 1) })}
                onRemove={() => onChange({ faqs: faqs.filter((_, j) => j !== i) })}
                canUp={i > 0}
                canDown={i < faqs.length - 1}
                removeLabel={`Quitar pregunta ${i + 1}`}
              />
            </div>
            <textarea
              className="field mt-2 min-h-20"
              rows={3}
              value={faq.a}
              onChange={(e) =>
                onChange({ faqs: faqs.map((f, j) => (j === i ? { ...f, a: e.target.value } : f)) })
              }
              placeholder="Respuesta clara y corta…"
              aria-label={`Respuesta de la pregunta ${i + 1}`}
            />
          </li>
        ))}
      </EditableList>
    </div>
  );
}

function FinalCtaEditor({ value, onChange }: SectionProps<FinalCtaContent>) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Texto pequeño (eyebrow)"
          value={value.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Última llamada al antojo"
        />
        <TextField
          label="Texto del botón"
          value={value.button}
          onChange={(button) => onChange({ button })}
          placeholder="Pedir por WhatsApp"
        />
        <TextField
          className="sm:col-span-2"
          label="Título"
          value={value.title}
          onChange={(title) => onChange({ title })}
          placeholder="¿Se te antojó algo dulce ahora mismo?"
        />
        <TextField
          className="sm:col-span-2"
          label="Horario que se muestra debajo"
          value={value.hours}
          onChange={(hours) => onChange({ hours })}
          placeholder="Lun a Sáb · 8:00 am – 6:00 pm · Valencia, Carabobo"
        />
      </div>
      <TextAreaField
        label="Subtítulo"
        value={value.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={2}
        placeholder="Invita a escribir por WhatsApp…"
      />
    </div>
  );
}

function FooterEditor({ value, onChange }: SectionProps<FooterContent>) {
  return (
    <div className="space-y-4">
      <TextAreaField
        label="Acerca de la tienda"
        value={value.about}
        onChange={(about) => onChange({ about })}
        rows={3}
        placeholder="Una frase con la personalidad del taller…"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Dirección"
          value={value.address}
          onChange={(address) => onChange({ address })}
          placeholder="Flor Amarillo, Valencia — Carabobo"
        />
        <TextField
          label="Horario"
          value={value.hours}
          onChange={(hours) => onChange({ hours })}
          placeholder="Lunes a Sábado · 8:00 am – 6:00 pm"
        />
      </div>
    </div>
  );
}

// ── Editor principal ─────────────────────────────────────────────────────────

export default function ContentEditor({ initial }: { initial: SiteContent }) {
  const router = useRouter();
  const [content, setContent] = useState<SiteContent>(() => structuredClone(initial));
  const [lastSavedJson, setLastSavedJson] = useState(() => JSON.stringify(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  // Indicador de cambios sin guardar: compara el estado contra el último guardado.
  const isDirty = useMemo(() => JSON.stringify(content) !== lastSavedJson, [content, lastSavedJson]);

  // Toda edición pasa por aquí: limpia el aviso de "guardado" y errores viejos.
  const edit = (fn: (c: SiteContent) => SiteContent) => {
    setJustSaved(false);
    setError("");
    setContent(fn);
  };

  const setUrgency = (patch: Partial<UrgencyContent>) =>
    edit((c) => ({ ...c, urgency: { ...c.urgency, ...patch } }));
  const setHero = (patch: Partial<HeroContent>) => edit((c) => ({ ...c, hero: { ...c.hero, ...patch } }));
  const setMarquee = (patch: Partial<MarqueeContent>) =>
    edit((c) => ({ ...c, marquee: { ...c.marquee, ...patch } }));
  const setSteps = (patch: Partial<StepsSection>) => edit((c) => ({ ...c, steps: { ...c.steps, ...patch } }));
  const setCarousel = (patch: Partial<CarouselSection>) =>
    edit((c) => ({ ...c, carousel: { ...c.carousel, ...patch } }));
  const setCatalog = (patch: Partial<CatalogSection>) =>
    edit((c) => ({ ...c, catalog: { ...c.catalog, ...patch } }));
  const setTestimonials = (patch: Partial<TestimonialsSection>) =>
    edit((c) => ({ ...c, testimonials: { ...c.testimonials, ...patch } }));
  const setFaq = (patch: Partial<FaqSection>) => edit((c) => ({ ...c, faq: { ...c.faq, ...patch } }));
  const setFinalCta = (patch: Partial<FinalCtaContent>) =>
    edit((c) => ({ ...c, finalCta: { ...c.finalCta, ...patch } }));
  const setFooter = (patch: Partial<FooterContent>) => edit((c) => ({ ...c, footer: { ...c.footer, ...patch } }));
  const setFx = (patch: Partial<FxSection>) => edit((c) => ({ ...c, fx: { ...c.fx, ...patch } }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      // Se manda SiteContent completo; la API reemplaza por clave de primer nivel.
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "No se pudo guardar el contenido");
      setLastSavedJson(JSON.stringify(content));
      setJustSaved(true);
      router.refresh(); // la tienda ya sirve el contenido nuevo
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 pb-2">
      <div className="space-y-4">
        <SectionCard emoji="🚨" title="Barra de urgencia" subtitle="El aviso de stock que corona la tienda">
          <UrgencyEditor value={content.urgency} onChange={setUrgency} />
        </SectionCard>

        <SectionCard emoji="🦸" title="Portada (hero)" subtitle="Titular, sellos y fotos de la portada" open>
          <HeroEditor value={content.hero} onChange={setHero} />
        </SectionCard>

        <SectionCard emoji="🎀" title="Cinta marquee" subtitle="Los mensajes que se deslizan solos">
          <MarqueeEditor value={content.marquee} onChange={setMarquee} />
        </SectionCard>

        <SectionCard emoji="🪜" title="Cómo pedir" subtitle="Los pasos que le siguen al antojo">
          <StepsEditor value={content.steps} onChange={setSteps} />
        </SectionCard>

        <SectionCard emoji="🧊" title="Carrusel «Disponible hoy»" subtitle="Fotos reales de lo que salió hoy">
          <CarouselEditor value={content.carousel} onChange={setCarousel} />
        </SectionCard>

        <SectionCard emoji="✨" title="Efectos visuales" subtitle="Detalles de movimiento que puedes apagar">
          <FxEditor value={content.fx} onChange={setFx} />
        </SectionCard>

        <SectionCard emoji="🛒" title="Menú / catálogo" subtitle="Encabezado de la lista de productos">
          <CatalogEditor value={content.catalog} onChange={setCatalog} />
        </SectionCard>

        <SectionCard emoji="💬" title="Testimonios" subtitle="La prueba social de tus clientes">
          <TestimonialsEditor value={content.testimonials} onChange={setTestimonials} />
        </SectionCard>

        <SectionCard emoji="❓" title="Preguntas frecuentes" subtitle="Resuelve dudas antes de que pregunten">
          <FaqEditor value={content.faq} onChange={setFaq} />
        </SectionCard>

        <SectionCard emoji="📣" title="CTA final" subtitle="El último empujón para pedir">
          <FinalCtaEditor value={content.finalCta} onChange={setFinalCta} />
        </SectionCard>

        <SectionCard emoji="🦶" title="Pie de página" subtitle="Sobre ti, dirección y horario">
          <FooterEditor value={content.footer} onChange={setFooter} />
        </SectionCard>
      </div>

      {/* Barra de guardado pegajosa */}
      <div className="sticky bottom-4 z-30 mt-8">
        <div className="flex flex-wrap items-center gap-3 rounded-3xl bg-white p-4 shadow-pop ring-1 ring-choco/10 sm:px-6">
          <div className="min-w-0 flex-1">
            {error ? (
              <p className="text-sm font-bold text-berry">✖ {error}</p>
            ) : saving ? (
              <p className="text-sm font-bold text-choco/60">Guardando…</p>
            ) : isDirty ? (
              <p className="text-sm font-bold text-caramel-deep">✏️ Tienes cambios sin guardar</p>
            ) : justSaved ? (
              <p className="text-sm font-bold text-leaf">✔ Guardado — la tienda ya muestra los cambios</p>
            ) : (
              <p className="text-sm text-choco/50">Todo guardado ✔</p>
            )}
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-caramel px-6 py-3 font-display text-lg font-black text-cream shadow-card transition hover:bg-caramel-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Guardando…" : "💾 Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
