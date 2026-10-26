"use client";

import { useEffect } from "react";
import type { FxSection } from "@/lib/site-content";

// Iluminación cálida (spotlight) + inclinación 3D (tilt) que siguen el cursor.
// Un único listener global + requestAnimationFrame: se recalculan los rectángulos
// en fase de lectura ANTES de escribir estilos (sin layout thrashing) y solo se
// escriben variables CSS en los elementos bajo el cursor. Todo el movimiento es
// transform/opacity (GPU). Se auto-desactiva en táctil y con prefers-reduced-motion.
export default function CursorFX({ fx }: { fx: FxSection }) {
  useEffect(() => {
    if (!fx.enabled || (!fx.spotlight && !fx.tilt)) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let px = -1e4;
    let py = -1e4;
    let els: HTMLElement[] = [];
    let collectQueued = false;

    const collect = () => {
      collectQueued = false;
      els = Array.from(document.querySelectorAll<HTMLElement>("[data-spotlight], [data-tilt]"));
    };
    const scheduleCollect = () => {
      if (collectQueued) return;
      collectQueued = true;
      requestAnimationFrame(collect);
    };

    const apply = () => {
      raf = 0;
      // Fase de lectura: rects frescos de todos los candidatos
      const rects = els.map((el) => el.getBoundingClientRect());
      // Fase de escritura: solo los elementos bajo el cursor
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const r = rects[i];
        const hit = px >= r.left && px <= r.right && py >= r.top && py <= r.bottom;
        if (!hit) {
          if (el.hasAttribute("data-tilt-active")) {
            el.removeAttribute("data-tilt-active");
            el.style.removeProperty("--rx");
            el.style.removeProperty("--ry");
          }
          continue;
        }
        const lx = px - r.left;
        const ly = py - r.top;
        if (fx.spotlight && el.hasAttribute("data-spotlight")) {
          el.style.setProperty("--mx", `${lx.toFixed(1)}px`);
          el.style.setProperty("--my", `${ly.toFixed(1)}px`);
        }
        if (fx.tilt && el.hasAttribute("data-tilt")) {
          const ry = (lx / r.width - 0.5) * 9;
          const rx = (0.5 - ly / r.height) * 7;
          el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
          el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
          el.setAttribute("data-tilt-active", "");
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const onOut = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        px = -1e4;
        py = -1e4;
        if (!raf) raf = requestAnimationFrame(apply);
      }
    };

    collect();
    // El carrusel/productos pueden montar nodos después: recopilar con debounce
    const mo = new MutationObserver(scheduleCollect);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerout", onOut);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      mo.disconnect();
      for (const el of els) {
        el.removeAttribute("data-tilt-active");
        el.style.removeProperty("--mx");
        el.style.removeProperty("--my");
        el.style.removeProperty("--rx");
        el.style.removeProperty("--ry");
      }
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerout", onOut);
    };
  }, [fx]);

  return null;
}
