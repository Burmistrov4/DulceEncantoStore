"use client";

import { scrollToSection } from "./Header";

// Enlace ancla con desplazamiento suave programático. Necesita ser Client Component
// porque pasa un onClick; los componentes de servidor no pueden recibir handlers.
export default function SmoothLink({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={`#${id}`} onClick={(e) => scrollToSection(e, id)} className={className}>
      {children}
    </a>
  );
}
