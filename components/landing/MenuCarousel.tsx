"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductDTO } from "@/lib/types";
import { bs, usd } from "@/lib/format";
import { useCart } from "../StoreProvider";
import Lightbox from "../store/Lightbox";

// Ancho de una "tarjeta + gap" para saltos exactos (flechas, dots y auto-avance)
function stepSize(el: HTMLElement): number {
  const first = el.querySelector<HTMLElement>("[data-carousel-card]");
  if (!first) return 0;
  const gap = Number.parseFloat(window.getComputedStyle(el).columnGap) || 0;
  return first.offsetWidth + gap;
}

function CarouselCard({
  product,
  rate,
  onZoom,
}: {
  product: ProductDTO;
  rate: number;
  onZoom: (p: ProductDTO) => void;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<number | null>(null);
  const soldOut = !product.availableToday;

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const handleAdd = () => {
    if (soldOut || added) return;
    add(product, null, product.priceUsd);
    setAdded(true);
    timer.current = window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <article
      data-carousel-card
      data-spotlight
      data-tilt
      className={`group relative w-[78vw] shrink-0 snap-start overflow-hidden rounded-3xl bg-choco-mid shadow-pop ring-1 ring-cream/10 sm:w-[420px] ${
        soldOut ? "opacity-70 saturate-[0.55]" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onZoom(product)}
        aria-label={`Ampliar foto de ${product.name}`}
        className="block w-full cursor-zoom-in text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey"
      >
        <span className="relative block aspect-[4/3] w-full overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 78vw, 420px"
            className="object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          {/* Degradado choco→transparente para que el texto respire sobre la foto */}
          <span
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-choco via-choco/55 to-transparent"
            aria-hidden="true"
          />
          {soldOut ? (
            <span className="absolute left-3 top-3 -rotate-3 rounded-full bg-berry px-3 py-1 text-xs font-black uppercase tracking-wide text-white shadow-card">
              Agotado hoy
            </span>
          ) : (
            <span className="absolute left-3 top-3 -rotate-3 rounded-full bg-honey px-3 py-1 text-xs font-black text-choco shadow-card ring-1 ring-choco/10">
              Hecho hoy ✨
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 block p-4 sm:p-5">
            <span className="block font-display text-2xl font-black leading-tight text-white sm:text-3xl">
              {product.name}
            </span>
            <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <span className="font-display text-xl font-black text-honey sm:text-2xl">
                {usd(product.priceUsd)}
              </span>
              <span className="text-xs font-semibold text-cream/75">
                {bs(product.priceUsd, rate)}
              </span>
            </span>
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={handleAdd}
        disabled={soldOut}
        aria-label={
          soldOut ? `${product.name} agotado hoy` : `Agregar ${product.name} al pedido`
        }
        className={`absolute bottom-4 right-4 rounded-full px-4 py-2.5 text-sm font-black shadow-pop transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream ${
          soldOut
            ? "cursor-not-allowed bg-white/20 text-cream/70"
            : added
              ? "bg-leaf text-white"
              : "bg-caramel text-cream hover:-translate-y-0.5 hover:bg-caramel-deep"
        }`}
      >
        {soldOut ? "Agotado" : added ? "✓" : "Agregar 🛒"}
      </button>
    </article>
  );
}

export default function MenuCarousel({
  products,
  rate,
  eyebrow,
  title,
  subtitle,
  intervalSeconds = 5,
}: {
  products: ProductDTO[];
  rate: number;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Segundos entre foto y foto. 0 = el carrusel no avanza solo. */
  intervalSeconds?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(0);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const [zoom, setZoom] = useState<ProductDTO | null>(null);
  const pausedRef = useRef(false);
  const touchedRef = useRef(false);
  const total = products.length;

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  const updateIndex = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || total === 0) return;
    const step = stepSize(el);
    if (step <= 0) return;
    setIndex(Math.min(total - 1, Math.max(0, Math.round(el.scrollLeft / step))));
  }, [total]);

  useEffect(() => {
    updateEdges();
    const onResize = () => updateEdges();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateEdges]);

  const scrollByCards = useCallback((dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = stepSize(el) || el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }, []);

  const scrollToIndex = useCallback((i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = stepSize(el);
    if (step <= 0) return;
    el.scrollTo({ left: step * i, behavior: "smooth" });
  }, []);

  // Auto-avance: un bucle de setTimeout (no setInterval) que solo avanza cuando
  // el carrusel está visible en pantalla, la pestaña está activa, el usuario no
  // está interactuando (hover/touch/foco) y el sistema no pide menos movimiento.
  // Configurable desde /admin/contenido (carousel.autoAdvanceSeconds; 0 = off).
  useEffect(() => {
    const intervalMs = Math.round(intervalSeconds * 1000);
    if (total < 2 || intervalMs <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = true;
    let timer: number | undefined;
    const section = scrollerRef.current?.closest("section") ?? null;

    const observer = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    if (section) observer.observe(section);

    const tick = () => {
      timer = undefined;
      if (document.hidden || !visible || pausedRef.current) {
        timer = window.setTimeout(tick, intervalMs);
        return;
      }
      const el = scrollerRef.current;
      if (!el) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 8) return; // nada que recorrer: no gastes CPU
      if (el.scrollLeft >= max - 8) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollByCards(1);
      }
      // deja terminar la animación suave antes del siguiente salto
      timer = window.setTimeout(tick, intervalMs + 700);
    };
    timer = window.setTimeout(tick, intervalMs);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [total, intervalSeconds, scrollByCards]);

  if (total === 0) return null;

  return (
    <section
      id="disponible-hoy"
      className="relative scroll-mt-20 overflow-hidden bg-choco bg-dots-cream py-16 text-cream sm:py-20"
      role="region"
      aria-roledescription="carrusel"
      aria-label={title}
    >
      {/* Resplandor cálido detrás del encabezado */}
      <div
        className="pointer-events-none absolute -top-44 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-honey/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <p className="overline-caps text-center text-honey">{eyebrow}</p>
        <h2 className="mt-2 text-center font-display text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-cream/70 sm:text-base">
          {subtitle}
        </p>
      </div>

      <div className="relative mt-10">
        {/* Flechas (solo desktop) */}
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          disabled={!canLeft}
          aria-label="Foto anterior"
          className="absolute left-2 top-1/2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-cream font-display text-xl font-black text-choco shadow-pop transition hover:bg-honey focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey disabled:pointer-events-none disabled:opacity-40 sm:grid"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          disabled={!canRight}
          aria-label="Foto siguiente"
          className="absolute right-2 top-1/2 z-10 hidden size-12 -translate-y-1/2 place-items-center rounded-full bg-cream font-display text-xl font-black text-choco shadow-pop transition hover:bg-honey focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey disabled:pointer-events-none disabled:opacity-40 sm:grid"
        >
          →
        </button>

        <div
          ref={scrollerRef}
          tabIndex={0}
          role="group"
          aria-label="Fotos de lo disponible hoy"
          onScroll={() => {
            updateEdges();
            updateIndex();
          }}
          onMouseEnter={() => {
            pausedRef.current = true;
          }}
          onMouseLeave={() => {
            if (!touchedRef.current) pausedRef.current = false;
          }}
          onTouchStart={() => {
            touchedRef.current = true;
            pausedRef.current = true;
          }}
          onFocusCapture={() => {
            pausedRef.current = true;
          }}
          onBlurCapture={() => {
            if (!touchedRef.current) pausedRef.current = false;
          }}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-4 px-4 pb-4 pt-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:scroll-px-10 sm:px-10"
        >
          {products.map((p) => (
            <CarouselCard key={p.id} product={p} rate={rate} onZoom={setZoom} />
          ))}
        </div>
      </div>

      {/* Hint móvil + indicador de progreso */}
      <div className="mt-2 flex flex-col items-center gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-cream/50 sm:hidden">
          Desliza →
        </p>
        <div className="flex items-center gap-2" role="group" aria-label="Progreso del carrusel">
          {products.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => scrollToIndex(i)}
              aria-label={`Ir a la foto ${i + 1} de ${total}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-honey ${
                i === index ? "w-7 bg-honey" : "w-2 bg-cream/30 hover:bg-cream/60"
              }`}
            />
          ))}
        </div>
      </div>

      {zoom && <Lightbox src={zoom.image} alt={zoom.name} onClose={() => setZoom(null)} />}
    </section>
  );
}
