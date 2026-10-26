// Borde festoneado tipo "papel de repostería" para transiciones entre secciones
export default function Scallop({ color = "#FBF3E4", className = "" }: { color?: string; className?: string }) {
  const arcs = Array.from({ length: 36 }, () => "a20 20 0 0 0 40 0").join(" ");
  return (
    <svg
      viewBox="0 0 1440 20"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-3 w-full sm:h-4 ${className}`}
    >
      <path d={`M0 0 ${arcs} L1440 0 Z`} fill={color} />
    </svg>
  );
}
