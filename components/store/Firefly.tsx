"use client";

import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Luciérnaga 🪰✨ de Dulce Encanto
//
// Un punto de luz cálido con estela que:
//  - sigue al cursor con easing suave,
//  - cuando el cursor queda quieto unos segundos, "vuela sola" cerca de su
//    última posición (movimiento orgánico con ruido sinusoidal),
//  - cambia su color según el fondo de la sección donde está parada:
//      fondos claros (crema)  → luz ámbar/caramelo profunda,
//      fondos oscuros (choco) → luz miel brillante.
// Solo toca transform/opacity (GPU) y se desactiva en táctil y con
// prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────────────────────

const IDLE_MS = 2600; // tiempo de quietud antes de volar sola
const LIGHT_BG = { core: "#d97706", glow: "rgba(217, 119, 6, 0.55)" }; // caramel  (fondo claro)
const DARK_BG = { core: "#fbbf24", glow: "rgba(251, 191, 36, 0.65)" }; // honey    (fondo oscuro)

function luminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export default function Firefly() {
  const ref = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const fly = ref.current;
    if (!fly) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let mx = window.innerWidth / 2;
    let my = window.innerHeight * 0.35;
    let x = mx;
    let y = my;
    let lastMove = performance.now();
    let autoT = 0;
    let seed = Math.random() * 100;

    // Historial de posiciones para la estela (los hijos siguen con más retraso)
    const history: Array<[number, number]> = [];

    const pickColor = (px: number, py: number) => {
      // ¿Qué hay debajo de la luciérnaga? Subimos hasta encontrar el color de fondo real.
      fly.style.visibility = "hidden";
      const stack = document.elementsFromPoint(px, py);
      fly.style.visibility = "";
      let bg = "";
      for (const el of stack) {
        const c = getComputedStyle(el).backgroundColor;
        if (c && c !== "rgba(0, 0, 0, 0)" && c !== "transparent") {
          bg = c;
          break;
        }
      }
      const m = bg.match(/(\d+\.?\d*)[ ,]+(\d+\.?\d*)[ ,]+(\d+\.?\d*)/);
      const isDark = m ? luminance(+m[1], +m[2], +m[3]) < 0.55 : false;
      const c = isDark ? DARK_BG : LIGHT_BG;
      fly.style.setProperty("--fly-core", c.core);
      fly.style.setProperty("--fly-glow", c.glow);
      for (const t of trailRefs.current) {
        if (t) {
          t.style.setProperty("--fly-core", c.core);
          t.style.setProperty("--fly-glow", c.glow);
        }
      }
    };

    // Muestreo de color con throttle (~8 veces/seg): elementsFromPoint es barato pero no gratis
    let lastSample = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);

      const idle = now - lastMove > IDLE_MS;
      let tx = mx;
      let ty = my;
      if (idle) {
        // Vuelo autónomo: órbita orgánica alrededor del último punto conocido
        autoT += 0.012;
        const rx = 130 + 70 * Math.sin(autoT * 0.7 + seed);
        const ry = 90 + 55 * Math.cos(autoT * 0.53 + seed * 1.7);
        tx = mx + rx * Math.cos(autoT);
        ty = my + ry * Math.sin(autoT * 1.13);
        // Mantener la órbita dentro del viewport
        tx = Math.max(24, Math.min(window.innerWidth - 24, tx));
        ty = Math.max(24, Math.min(window.innerHeight - 24, ty));
      }

      // Easing: la luciérnaga "persigue" el objetivo
      x += (tx - x) * (idle ? 0.045 : 0.16);
      y += (ty - y) * (idle ? 0.045 : 0.16);

      // Aleteo: vibración perpendicular mínima
      const flutter = Math.sin(now * 0.02 + seed) * 1.5;

      fly.style.transform = `translate3d(${(x - 9).toFixed(1)}px, ${(y - 9 + flutter).toFixed(1)}px, 0)`;

      // Estela: 3 puntitos con retraso creciente
      history.unshift([x, y + flutter]);
      if (history.length > 48) history.pop();
      [10, 20, 32].forEach((delay, i) => {
        const t = trailRefs.current[i];
        const p = history[Math.min(delay, history.length - 1)];
        if (t && p) t.style.transform = `translate3d(${(p[0] - 5).toFixed(1)}px, ${p[1] - 5}px, 0)`;
      });

      if (now - lastSample > 120) {
        lastSample = now;
        pickColor(x, y);
      }
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      lastMove = performance.now();
      autoT = 0;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] hidden overflow-hidden md:block">
      {/* Estela (de atrás hacia adelante) */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          ref={(el) => {
            trailRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 size-2.5 rounded-full will-change-transform"
          style={{
            opacity: 0.32 - i * 0.08,
            background:
              "radial-gradient(circle, var(--fly-core, #d97706) 0%, var(--fly-glow, rgba(217,119,6,0.55)) 55%, transparent 75%)",
            filter: "blur(1px)",
          }}
        />
      ))}
      {/* Cuerpo de la luciérnaga: núcleo + halo pulsante */}
      <div
        ref={ref}
        className="absolute left-0 top-0 size-[18px] rounded-full will-change-transform"
        style={{
          background:
            "radial-gradient(circle, #fff7ed 0%, var(--fly-core, #d97706) 38%, var(--fly-glow, rgba(217,119,6,0.55)) 62%, transparent 78%)",
          filter: "blur(0.4px)",
        }}
      />
    </div>
  );
}
