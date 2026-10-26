"use client";

import Image from "next/image";
import { useState } from "react";
import Lightbox from "./Lightbox";

export default function ProductGallery({ src, alt, badge }: { src: string; alt: string; badge: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar foto de ${alt}`}
        className="relative block aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-[2rem] shadow-pop"
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover transition duration-500 hover:scale-105"
        />
      </button>
      <span className="pointer-events-none absolute left-4 top-4 rotate-[-3deg] rounded-full bg-honey/95 px-4 py-1.5 text-sm font-black text-choco shadow-card">
        {badge}
      </span>
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </div>
  );
}
