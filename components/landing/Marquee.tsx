// Cinta infinita tipo "ticker" que separa el hero del resto de la página.
// Server component: solo CSS (animate-marquee), sin JS. Lista duplicada 2x
// para un loop seamless (keyframes translateX(-50%)). Pausa en hover.
export default function Marquee({ items }: { items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="group relative overflow-hidden border-y border-honey/25 bg-choco py-3.5 text-cream">
      <div className="marquee-track flex w-max animate-marquee items-center gap-8 sm:gap-10">
        {[0, 1].map((copy) => (
          <ul
            key={copy}
            aria-hidden={copy === 1}
            className="flex items-center gap-8 sm:gap-10"
          >
            {items.map((item, i) => (
              <li
                key={`${copy}-${i}`}
                className="flex items-center gap-8 whitespace-nowrap font-display text-sm font-bold tracking-wide sm:gap-10 sm:text-base"
              >
                <span>{item}</span>
                <span className="text-honey" aria-hidden="true">
                  •
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>

      {/* Degradados en los bordes para un acabado más pulido */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-choco to-transparent sm:w-16"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-choco to-transparent sm:w-16"
        aria-hidden="true"
      />
    </div>
  );
}
