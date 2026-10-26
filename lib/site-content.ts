// ─────────────────────────────────────────────────────────────────────────────
// Contrato del contenido editable de la landing page.
// Todo el texto/foto de cada sección se guarda como JSON en la BD (settings.site_content)
// y se mezcla sobre estos defaults, así la tienda nunca se rompe si falta un campo.
// El admin (/admin/contenido) edita SiteContent completo vía PUT /api/admin/content.
// ─────────────────────────────────────────────────────────────────────────────

export type ImageRef = { src: string; alt: string };

export type UrgencyContent = {
  enabled: boolean;
  // Si tiene texto, se muestra tal cual (modo manual). Si queda vacío, se genera
  // automáticamente con el stock real de quesillos del día.
  overrideText: string;
};

export type HeroContent = {
  eyebrow: string;
  titleTop: string;
  titleHighlight: string;
  titleBottom: string;
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  sticker: string;
  badges: string[];
  photos: { main: ImageRef; secondary: ImageRef };
};

export type MarqueeContent = {
  items: string[];
};

export type StepContent = { emoji: string; title: string; text: string };

export type StepsSection = {
  eyebrow: string;
  title: string;
  steps: StepContent[];
};

export type CarouselSection = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  // true = solo productos con "Disponible hoy"; false = también agotados (con badge)
  showOnlyAvailable: boolean;
  // Segundos entre foto y foto del auto-avance. 0 = desactivado. Recomendado: 5.
  autoAdvanceSeconds: number;
};

// Efectos de cursor (solo desktop, se auto-desactivan en táctil y con
// prefers-reduced-motion). El dueño puede apagarlos si siente que sobran.
export type FxSection = {
  enabled: boolean;
  // Resplandor cálido que sigue el cursor dentro de las tarjetas
  spotlight: boolean;
  // Inclinación 3D sutil de las fotos al pasar el mouse
  tilt: boolean;
};

export type CatalogSection = {
  eyebrow: string;
  title: string;
  subtitle: string;
};

export type Testimonial = { name: string; where: string; text: string; stars: number };

export type TestimonialsSection = {
  eyebrow: string;
  title: string;
  badges: string[];
  reviews: Testimonial[];
};

export type FaqItem = { q: string; a: string };

export type FaqSection = {
  eyebrow: string;
  title: string;
  faqs: FaqItem[];
};

export type FinalCtaContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  button: string;
  hours: string;
};

export type FooterContent = {
  about: string;
  address: string;
  hours: string;
};

export type SiteContent = {
  urgency: UrgencyContent;
  hero: HeroContent;
  marquee: MarqueeContent;
  steps: StepsSection;
  carousel: CarouselSection;
  catalog: CatalogSection;
  testimonials: TestimonialsSection;
  faq: FaqSection;
  finalCta: FinalCtaContent;
  footer: FooterContent;
  fx: FxSection;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  urgency: {
    enabled: true,
    overrideText: "",
  },
  hero: {
    eyebrow: "Postres artesanales · Valencia, Carabobo",
    titleTop: "Recién hechos, con",
    titleHighlight: "leche 100% fresca",
    titleBottom: "y sin conservantes.",
    subtitle:
      "Yogur griego con mermelada casera, quesillo tradicional y torta de pan horneada esta mañana. Pide hoy por WhatsApp: retíralo en el taller o te lo llevamos hasta tu puerta. 🧡",
    primaryCta: "Ver menú de hoy",
    secondaryCta: "Pedir por WhatsApp",
    sticker: "¡Horneado hoy! ✨",
    badges: ["Sin conservantes", "Leche fresca de la zona", "Horneado cada mañana", "Taller en Flor Amarillo"],
    photos: {
      main: { src: "/products/quesillo-bandeja.webp", alt: "Quesillo artesanal recién hecho con caramelo" },
      secondary: { src: "/products/yogur-fresa.webp", alt: "Yogur griego artesanal de fresa" },
    },
  },
  marquee: {
    items: [
      "🥛 Leche 100% fresca",
      "🧁 Horneado cada mañana",
      "🚚 Delivery en Valencia",
      "❄️ Sin conservantes",
      "🍮 Quesillo tradicional",
      "💵 Precios claros en $ y Bs",
    ],
  },
  steps: {
    eyebrow: "Pedir es facilísimo",
    title: "Tu postre, en 3 pasos",
    steps: [
      {
        emoji: "🧁",
        title: "Elige tus antojos",
        text: "Recorre el menú de hoy, escoge tamaños y sabores. Sin registros ni formularios largos.",
      },
      {
        emoji: "📲",
        title: "Confirma por WhatsApp",
        text: "Tu pedido llega perfecto y totalizado en $ y Bs. Un clic y ya está en el chat.",
      },
      {
        emoji: "🚗",
        title: "Recoge o recíbelo hoy",
        text: "Retira en el taller (Flor Amarillo) o pide delivery en Valencia. Paga como prefieras.",
      },
    ],
  },
  carousel: {
    enabled: true,
    eyebrow: "Fotos reales, sin filtros",
    title: "Disponible hoy en la nevera 🧊",
    subtitle:
      "Desliza y mira lo que salió del horno y de la nevera esta mañana. Lo que ves es lo que llega: fotos reales de nuestro taller.",
    showOnlyAvailable: true,
    autoAdvanceSeconds: 5,
  },
  catalog: {
    eyebrow: "Menú de hoy",
    title: "Elige tu antojo 🤤",
    subtitle:
      "Precios en dólares y bolívares a la tasa BCV del día. Todo se prepara por lotes pequeños: si aparece “Agotado hoy”, vuelve mañana temprano. 😉",
  },
  testimonials: {
    eyebrow: "Valencianos felices",
    title: "Lo que dicen quienes ya probaron",
    badges: ["🧑‍🍳 100% Artesanal y Seguro", "🥛 Leche fresca local", "⭐ 4,9/5 en pedidos entregados"],
    reviews: [
      {
        name: "María González",
        where: "La Isabelica",
        text: "El yogur griego de mora es otro nivel, se nota la fruta de verdad. Ya vamos por el cuarto pote del mes. 🥛",
        stars: 5,
      },
      {
        name: "Carlos Rodríguez",
        where: "El Viñedo",
        text: "Pedí el quesillo de 1kg para el cumpleaños de mi mamá y volvió a pedirlo la semana siguiente. Suave, fresco y el caramelo perfecto.",
        stars: 5,
      },
      {
        name: "Andreína P.",
        where: "Flor Amarillo",
        text: "La torta de pan tibia es un abrazo. Retiro en el taller y siempre sale recién horneada. ¡100% recomendado!",
        stars: 5,
      },
      {
        name: "José Mendoza",
        where: "San José",
        text: "Me pagan por PagoMóvil y llegan puntual con el delivery. La atención por WhatsApp es rapidísima.",
        stars: 5,
      },
      {
        name: "La familia Suárez",
        where: "Centro de Valencia",
        text: "El combo del fin de semana nos salva las meriendas. Yogur de litro + quesillo y todos felices. 🎁",
        stars: 5,
      },
    ],
  },
  faq: {
    eyebrow: "Sin dudas",
    title: "Preguntas frecuentes",
    faqs: [
      {
        q: "¿Cómo hago mi pedido?",
        a: "Agrega lo que quieras al carrito, elige retiro o delivery y tu forma de pago. Al pulsar «Confirmar por WhatsApp» se abre el chat con tu pedido ya escrito y totalizado en $ y Bs. Solo presiona enviar.",
      },
      {
        q: "¿Dónde entregan?",
        a: "Retiro sin costo en nuestro taller en Flor Amarillo. Delivery a Flor Amarillo, La Isabelica, El Viñedo, San José y Centro de Valencia (tarifa desde $1). Otras zonas de Valencia: escríbenos y coordinamos.",
      },
      {
        q: "¿Cómo puedo pagar?",
        a: "PagoMóvil, efectivo en dólares, Binance Pay o Zelle. Los montos en bolívares se calculan con la tasa BCV del día, mostrada en toda la tienda.",
      },
      {
        q: "¿Todo es del día?",
        a: "Sí. Horneamos y colamos por lotes pequeños cada mañana. El interruptor «Disponible hoy» que ves en cada producto se actualiza cuando algo se agota de verdad.",
      },
    ],
  },
  finalCta: {
    eyebrow: "Última llamada al antojo",
    title: "¿Se te antojó algo dulce ahora mismo?",
    subtitle:
      "Escríbenos por WhatsApp: te respondemos en minutos dentro del horario de atención y te confirmamos lo que quedó fresco de hoy.",
    button: "Pedir por WhatsApp",
    hours: "Lun a Sáb · 8:00 am – 6:00 pm · Valencia, Carabobo",
  },
  footer: {
    about:
      "Postres artesanales hechos cada mañana con leche 100% fresca y sin conservantes. De nuestra nevera a tu antojo. 🧡",
    address: "Flor Amarillo, Valencia — Carabobo, Venezuela",
    hours: "Lunes a Sábado · 8:00 am – 6:00 pm",
  },
  fx: {
    enabled: true,
    spotlight: true,
    tilt: true,
  },
};

// Mezcla lo guardado en BD sobre los defaults (profundidad 1 por sección):
// arrays y escalares se reemplazan completos; objetos de sección heredan los defaults
// para los campos que falten. Así las versiones viejas del JSON nunca rompen la tienda.
export function mergeSiteContent(stored: unknown): SiteContent {
  const base = structuredClone(DEFAULT_SITE_CONTENT) as unknown as Record<string, unknown>;
  if (stored && typeof stored === "object") {
    for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
      if (!(key in base)) continue;
      const current = base[key];
      if (
        value && typeof value === "object" && !Array.isArray(value) &&
        current && typeof current === "object" && !Array.isArray(current)
      ) {
        base[key] = { ...(current as object), ...(value as object) };
      } else if (value !== undefined) {
        base[key] = value;
      }
    }
  }
  return base as unknown as SiteContent;
}
