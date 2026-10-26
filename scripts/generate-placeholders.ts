// Genera imágenes placeholder .webp para el catálogo mock (se reemplazan por fotos
// reales desde el panel /admin). Uso: npm run placeholders
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

type Spec = { file: string; from: string; to: string; label: string; sub: string };

const SPECS: Spec[] = [
  { file: "yogur-fresa.webp", from: "#F8756A", to: "#C22B33", label: "Yogur Griego", sub: "Fresa · mermelada casera" },
  { file: "yogur-mora.webp", from: "#8A5CA0", to: "#3E2A56", label: "Yogur Griego", sub: "Mora · mermelada casera" },
  { file: "yogur-melocoton.webp", from: "#F9A66C", to: "#E0703A", label: "Yogur Griego", sub: "Melocotón · compota casera" },
  { file: "yogur-natural.webp", from: "#F4E7C8", to: "#D9BE85", label: "Yogur Griego", sub: "Natural · sin azúcar añadida" },
  { file: "quesillo-individual.webp", from: "#E8B04B", to: "#B4701E", label: "Quesillo", sub: "Ración individual" },
  { file: "quesillo-bandeja.webp", from: "#E09A3A", to: "#9A5A12", label: "Quesillo 1kg", sub: "Bandeja familiar" },
  { file: "torta-pan-porcion.webp", from: "#8B5A33", to: "#4E2E1E", label: "Torta de Pan", sub: "Porción" },
  { file: "torta-pan-familiar.webp", from: "#7A4E2A", to: "#3A2114", label: "Torta de Pan", sub: "Bandeja familiar" },
  { file: "marquesa-chocolate.webp", from: "#6B3F2A", to: "#2A1810", label: "Marquesa", sub: "Chocolate" },
  { file: "combo-familiar.webp", from: "#E9A23B", to: "#C05621", label: "Combo Familiar", sub: "Yogur 1L + Quesillo 1kg" },
  { file: "combo-antojo.webp", from: "#F0705A", to: "#C05621", label: "Combo Antojo", sub: "2 quesillos + 2 yogures" },
];

function svg({ from, to, label, sub }: Spec): string {
  return `<svg width="1200" height="900" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#g)"/>
  <circle cx="950" cy="160" r="230" fill="#FFFFFF" opacity="0.14"/>
  <circle cx="170" cy="760" r="260" fill="#FFFFFF" opacity="0.10"/>
  <circle cx="1070" cy="700" r="120" fill="#FFFFFF" opacity="0.12"/>
  <circle cx="120" cy="150" r="60" fill="#FBF3E4" opacity="0.18"/>
  <circle cx="1080" cy="420" r="46" fill="#FBF3E4" opacity="0.16"/>
  <rect x="90" y="356" width="1020" height="188" rx="40" fill="#2A1810" opacity="0.30"/>
  <text x="600" y="448" font-family="Arial, Helvetica, sans-serif" font-size="84" font-weight="bold" fill="#FFF9F2" text-anchor="middle">${label}</text>
  <text x="600" y="510" font-family="Arial, Helvetica, sans-serif" font-size="38" fill="#FBF3E4" opacity="0.92" text-anchor="middle">${sub}</text>
  <text x="600" y="822" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#FBF3E4" opacity="0.7" text-anchor="middle">Dulce Encanto · Valencia, Carabobo</text>
</svg>`;
}

async function main() {
  const dir = path.join(process.cwd(), "public", "products");
  fs.mkdirSync(dir, { recursive: true });
  for (const spec of SPECS) {
    const out = path.join(dir, spec.file);
    await sharp(Buffer.from(svg(spec))).webp({ quality: 82 }).toFile(out);
    console.log(`✔ ${spec.file}`);
  }
  console.log(`\nListo: ${SPECS.length} imágenes generadas en public/products/.`);
  console.log("Recuerda reemplazarlas por fotos reales desde /admin/productos.");
}

main().catch((e) => {
  console.error("Error generando placeholders:", e);
  process.exit(1);
});
