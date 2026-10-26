"use client";

import { useEffect, useState } from "react";

export default function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-choco/90 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Cerrar foto"
        className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-cream text-xl font-bold text-choco shadow-pop"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onClick={(e) => {
          e.stopPropagation();
          setZoomed((z) => !z);
        }}
        className={`max-h-[85vh] max-w-full cursor-zoom-in rounded-2xl shadow-pop transition-transform duration-300 ${
          zoomed ? "scale-[1.6] cursor-zoom-out" : "scale-100"
        }`}
      />
      <p className="absolute bottom-5 text-sm font-semibold text-cream/80">
        {zoomed ? "Clic para reducir" : "Clic en la foto para hacer zoom"} · ESC para cerrar
      </p>
    </div>
  );
}
