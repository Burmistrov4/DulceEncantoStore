// Tipos compartidos entre servidor y cliente (sin dependencias de Node)
export type CategoryId = "yogures" | "quesillos" | "tortas" | "combos";

export const CATEGORIES: { id: CategoryId; label: string; emoji: string; tagline: string }[] = [
  { id: "yogures", label: "Yogures Griegos", emoji: "🥛", tagline: "Colados a mano, con mermelada casera de fruta fresca" },
  { id: "quesillos", label: "Quesillos", emoji: "🍮", tagline: "El tradicional venezolano, con su caramelo dorado" },
  { id: "tortas", label: "Torta de Pan y Caseros", emoji: "🍞", tagline: "Recetas de abuela horneadas cada mañana" },
  { id: "combos", label: "Combos Familiares", emoji: "🎁", tagline: "Ahorra compartiendo, solo fin de semana" },
];

export type Variant = { label: string; priceUsd: number };

export type ProductDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: CategoryId;
  priceUsd: number; // centavos de USD
  variants: Variant[];
  image: string;
  servings: string;
  ingredients: string;
  active: boolean;
  availableToday: boolean;
  featured: boolean; // aparece en el carrusel de "Disponible hoy"
  stock: number | null;
  sortOrder: number;
};

export type DeliveryZone = { id: string; name: string; feeUsd: number }; // feeUsd en centavos

export type StoreConfigDTO = {
  storeName: string;
  rate: number;
  rateUpdatedAt: string;
  whatsappNumber: string;
  instagramUrl: string;
  zones: DeliveryZone[];
};

export type CartItem = {
  key: string; // productId + ":" + variantLabel
  productId: string;
  slug: string;
  name: string;
  variant: string | null;
  unitUsd: number; // centavos
  qty: number;
  image: string;
};

export const PAYMENT_METHODS = ["PagoMóvil", "Efectivo $", "Binance Pay", "Zelle"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

// Reseña visible en la tienda (viene de la tabla reviews, ya aprobada,
// o del contenido por defecto como respaldo)
export type ReviewDTO = {
  id: string;
  name: string;
  zone: string;
  text: string;
  stars: number;
};
