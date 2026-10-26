// Datos iniciales (mock realista) para arrancar la tienda.
// Todos los precios están en CENTAVOS de USD: 500 = $5.00

export type SeedProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceUsd: number;
  variants: { label: string; priceUsd: number }[];
  image: string;
  servings: string;
  ingredients: string;
  stock: number | null;
  sortOrder: number;
  featured?: boolean; // aparece en el carrusel "Disponible hoy" de la landing
};

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    id: "yogur-fresa",
    slug: "yogur-griego-fresa",
    name: "Yogur Griego de Fresa",
    description:
      "Yogur griego colado a mano, extra cremoso, con mermelada casera de fresa hecha con fruta fresca. Sin colorantes ni conservantes.",
    category: "yogures",
    priceUsd: 500,
    variants: [
      { label: "200g", priceUsd: 250 },
      { label: "500g", priceUsd: 500 },
      { label: "1 Litro", priceUsd: 850 },
    ],
    image: "/products/yogur-fresa.webp",
    servings: "El pote de 500g sirve de 2 a 3 personas",
    ingredients: "Leche 100% fresca pasteurizada, cultivo láctico, fresa, azúcar",
    stock: 10,
    sortOrder: 10,
    featured: true,
  },
  {
    id: "yogur-mora",
    slug: "yogur-griego-mora",
    name: "Yogur Griego de Mora",
    description:
      "El favorito de los que prefieren un toque ácido: yogur griego denso con mermelada artesanal de mora, cocida a fuego lento.",
    category: "yogures",
    priceUsd: 500,
    variants: [
      { label: "200g", priceUsd: 250 },
      { label: "500g", priceUsd: 500 },
      { label: "1 Litro", priceUsd: 850 },
    ],
    image: "/products/yogur-mora.webp",
    servings: "El pote de 500g sirve de 2 a 3 personas",
    ingredients: "Leche 100% fresca pasteurizada, cultivo láctico, mora, azúcar",
    stock: 8,
    sortOrder: 20,
  },
  {
    id: "yogur-melocoton",
    slug: "yogur-griego-melocoton",
    name: "Yogur Griego de Melocotón",
    description:
      "Yogur griego con compota casera de melocotón maduro. Suave, dulce y con trocitos de fruta de verdad.",
    category: "yogures",
    priceUsd: 500,
    variants: [
      { label: "200g", priceUsd: 250 },
      { label: "500g", priceUsd: 500 },
      { label: "1 Litro", priceUsd: 850 },
    ],
    image: "/products/yogur-melocoton.webp",
    servings: "El pote de 500g sirve de 2 a 3 personas",
    ingredients: "Leche 100% fresca pasteurizada, cultivo láctico, melocotón, azúcar",
    stock: 6,
    sortOrder: 30,
  },
  {
    id: "yogur-natural",
    slug: "yogur-griego-natural",
    name: "Yogur Griego Natural",
    description:
      "Puro yogur griego sin azúcar añadida, ideal para acompañar con granola, fruta o usar en tus recetas saludables.",
    category: "yogures",
    priceUsd: 400,
    variants: [
      { label: "200g", priceUsd: 200 },
      { label: "500g", priceUsd: 400 },
      { label: "1 Litro", priceUsd: 700 },
    ],
    image: "/products/yogur-natural.webp",
    servings: "El pote de 500g sirve de 2 a 3 personas",
    ingredients: "Leche 100% fresca pasteurizada, cultivo láctico",
    stock: 12,
    sortOrder: 40,
  },
  {
    id: "quesillo-individual",
    slug: "quesillo-individual",
    name: "Quesillo Individual",
    description:
      "El quesillo tradicional venezolano en ración individual: cocido al baño maría, con su caramelo dorado y textura suave que se deshace en la boca.",
    category: "quesillos",
    priceUsd: 200,
    variants: [],
    image: "/products/quesillo-individual.webp",
    servings: "1 porción generosa (180g aprox.)",
    ingredients: "Leche 100% fresca, huevos, azúcar, vainilla",
    stock: 4,
    sortOrder: 50,
  },
  {
    id: "quesillo-bandeja",
    slug: "quesillo-bandeja-1kg",
    name: "Quesillo Bandeja Familiar (1kg)",
    description:
      "Para compartir en familia: bandeja de 1kg de quesillo recién hecho, bañado en su caramelo. El clásico infaltable de los domingos.",
    category: "quesillos",
    priceUsd: 900,
    variants: [],
    image: "/products/quesillo-bandeja.webp",
    servings: "Sirve de 8 a 10 porciones",
    ingredients: "Leche 100% fresca, huevos, azúcar, vainilla",
    stock: 4,
    sortOrder: 60,
    featured: true,
  },
  {
    id: "torta-pan-porcion",
    slug: "torta-de-pan-porcion",
    name: "Torta de Pan (porción)",
    description:
      "Torta de pan casera horneada cada mañana, con toque de canela y pasas. Se sirve tibia o fría, como la hacía la abuela.",
    category: "tortas",
    priceUsd: 250,
    variants: [],
    image: "/products/torta-pan-porcion.webp",
    servings: "1 porción",
    ingredients: "Pan del día, leche fresca, huevos, azúcar, canela, pasas",
    stock: 6,
    sortOrder: 70,
  },
  {
    id: "torta-pan-bandeja",
    slug: "torta-de-pan-familiar",
    name: "Torta de Pan Familiar",
    description:
      "Bandeja familiar de torta de pan recién horneada. Ideal para el desayuno del domingo o la merienda de la oficina.",
    category: "tortas",
    priceUsd: 1000,
    variants: [],
    image: "/products/torta-pan-familiar.webp",
    servings: "Sirve de 8 a 10 porciones",
    ingredients: "Pan del día, leche fresca, huevos, azúcar, canela, pasas",
    stock: 3,
    sortOrder: 80,
  },
  {
    id: "marquesa-chocolate",
    slug: "marquesa-de-chocolate",
    name: "Marquesa de Chocolate (ración)",
    description:
      "Capas de galleta María y crema de chocolate 100% hecha en casa, fría y firme. El postre que nunca falla en los cumpleaños.",
    category: "tortas",
    priceUsd: 350,
    variants: [],
    image: "/products/marquesa-chocolate.webp",
    servings: "1 porción",
    ingredients: "Galleta María, chocolate, leche fresca, mantequilla, azúcar",
    stock: 5,
    sortOrder: 90,
  },
  {
    id: "combo-familiar",
    slug: "combo-familiar-fin-de-semana",
    name: "🎁 Combo Fin de Semana Familiar",
    description:
      "Yogur griego de 1 litro (sabor a elegir) + quesillo bandeja de 1kg. El combo que alimenta la merienda de toda la familia. Solo viernes a domingo.",
    category: "combos",
    priceUsd: 1400,
    variants: [],
    image: "/products/combo-familiar.webp",
    servings: "Hasta 12 porciones entre ambos",
    ingredients: "Incluye: Yogur griego 1L + Quesillo 1kg",
    stock: 5,
    sortOrder: 100,
    featured: true,
  },
  {
    id: "combo-antojo",
    slug: "combo-antojo",
    name: "🎁 Combo Antojo",
    description:
      "2 quesillos individuales + 2 yogures griegos de 200g (sabor a elegir). Perfecto para compartir en pareja o darse un gustito doble.",
    category: "combos",
    priceUsd: 800,
    variants: [],
    image: "/products/combo-antojo.webp",
    servings: "4 antojos felices",
    ingredients: "Incluye: 2 quesillos + 2 yogures 200g",
    stock: 6,
    sortOrder: 110,
    featured: true,
  },
];

export const DEFAULT_SETTINGS: Record<string, string> = {
  bcv_rate: "43.80", // Tasa de referencia editable desde /admin/ajustes o con el botón automático
  bcv_rate_updated_at: new Date().toISOString(),
  whatsapp_number: "584141234567", // ⚠️ CAMBIAR por el número real del negocio
  instagram_url: "https://instagram.com/",
  store_name: "Dulce Encanto",
  delivery_zones: JSON.stringify([
    { id: "retiro", name: "Retiro en taller (Flor Amarillo)", feeUsd: 0 },
    { id: "flor-amarillo", name: "Delivery · Flor Amarillo", feeUsd: 100 },
    { id: "la-isabelica", name: "Delivery · La Isabelica", feeUsd: 150 },
    { id: "el-vinedo", name: "Delivery · El Viñedo", feeUsd: 150 },
    { id: "san-jose", name: "Delivery · San José", feeUsd: 150 },
    { id: "centro", name: "Delivery · Centro de Valencia", feeUsd: 200 },
  ]),
};
