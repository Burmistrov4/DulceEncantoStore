import Header from "@/components/landing/Header";
import UrgencyBar from "@/components/landing/UrgencyBar";
import Hero from "@/components/landing/Hero";
import Marquee from "@/components/landing/Marquee";
import Steps from "@/components/landing/Steps";
import MenuCarousel from "@/components/landing/MenuCarousel";
import Catalog from "@/components/landing/Catalog";
import Testimonials from "@/components/landing/Testimonials";
import Faq from "@/components/landing/Faq";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";
import StoreProvider from "@/components/StoreProvider";
import CartBar from "@/components/store/CartBar";
import CartDrawer from "@/components/store/CartDrawer";
import CursorFX from "@/components/store/CursorFX";
import Reveal from "@/components/store/Reveal";
import TrackView from "@/components/store/TrackView";
import WhatsAppFloat from "@/components/store/WhatsAppFloat";
import { getApprovedReviews, getProducts, getSiteContent, getStoreConfig } from "@/lib/store";
import { waLink } from "@/lib/whatsapp";
import type { ProductDTO } from "@/lib/types";

// Revalidación ISR: el contenido/stock editado en el admin se refleja aquí
// (los APIs del admin además llaman revalidatePath para efecto inmediato)
export const revalidate = 15;

function buildUrgencyText(products: ProductDTO[]): string {
  const available = products.filter((p) => p.availableToday);
  const quesillos = available.filter((p) => p.category === "quesillos" && p.stock !== null);
  const stockQuesillos = quesillos.reduce((sum, p) => sum + (p.stock ?? 0), 0);

  if (quesillos.length > 0 && stockQuesillos === 0) {
    return `🔥 Lote fresco de hoy · Quesillos agotados (vuelven mañana) · Quedan ${available.length} postres`;
  }
  if (stockQuesillos > 0 && stockQuesillos <= 8) {
    return `🔥 Lote fresco horneado hoy · Solo quedan ${stockQuesillos} quesillos · ${available.length} postres disponibles`;
  }
  return `🔥 Lote fresco horneado hoy · ${available.length} postres recién hechos disponibles`;
}

// El carrusel muestra hasta 12 productos: primero los ⭐ Destacados y después
// completa con los demás disponibles, para que siempre haya recorrido que
// fotografiar (con pocos destacados el rango de scroll era casi nulo en desktop).
function pickCarouselProducts(products: ProductDTO[], onlyAvailable: boolean): ProductDTO[] {
  const base = products.filter((p) => p.active && (onlyAvailable ? p.availableToday : true));
  const featured = base.filter((p) => p.featured);
  const rest = base.filter((p) => !p.featured);
  return [...featured, ...rest].slice(0, 12);
}

export default async function Home() {
  const products = getProducts({ onlyActive: true });
  const config = getStoreConfig();
  const content = getSiteContent();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const waHeroHref = waLink(
    config.whatsappNumber,
    `¡Hola ${config.storeName}! 👋 Quiero ver el menú de hoy y hacer un pedido.`
  );
  const waFinalHref = waLink(
    config.whatsappNumber,
    `¡Hola ${config.storeName}! 👋 Se me antojó algo dulce, ¿qué hay disponible hoy?`
  );

  // Reseñas: las aprobadas por el dueño; si todavía no hay ninguna, se muestran
  // las del contenido editable como respaldo (la sección nunca se ve vacía).
  const approvedReviews = getApprovedReviews(6);
  const seedReviews = content.testimonials.reviews.map((r, i) => ({
    id: `seed-${i}`,
    name: r.name,
    zone: r.where,
    text: r.text,
    stars: r.stars,
  }));
  const uiReviews = approvedReviews.length > 0 ? approvedReviews : seedReviews;

  // Datos estructurados Schema.org: Bakery local con ofertas en USD (y Bs implícitos por tasa BCV)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: config.storeName,
    description:
      "Postres artesanales recién hechos con leche 100% fresca y sin conservantes en Valencia, Carabobo: yogur griego, quesillo tradicional y torta de pan. Pedidos por WhatsApp.",
    image: `${site}/opengraph-image`,
    telephone: `+${config.whatsappNumber.replace(/\D/g, "")}`,
    priceRange: "$2 - $15",
    currenciesAccepted: "USD, VES",
    paymentAccepted: "PagoMóvil, Efectivo, Binance Pay, Zelle",
    servesCuisine: "Postres artesanales",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Valencia",
      addressRegion: "Carabobo",
      addressCountry: "VE",
    },
    areaServed: config.zones.map((z) => z.name),
    openingHours: "Mo-Sa 08:00-18:00",
    sameAs: [config.instagramUrl],
    hasMenu: `${site}/#menu`,
    makesOffer: products.map((p) => ({
      "@type": "Offer",
      price: (p.priceUsd / 100).toFixed(2),
      priceCurrency: "USD",
      availability: p.availableToday ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemOffered: {
        "@type": "Product",
        name: p.name,
        image: `${site}${p.image}`,
        description: p.description,
      },
    })),
  };

  return (
    <StoreProvider config={config}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TrackView />
      {content.urgency.enabled && (
        <UrgencyBar text={content.urgency.overrideText.trim() || buildUrgencyText(products)} />
      )}
      <Header storeName={config.storeName} />
      <main>
        <Hero content={content.hero} waHref={waHeroHref} />
        <Marquee items={content.marquee.items} />
        {content.carousel.enabled && (
          <MenuCarousel
            products={pickCarouselProducts(products, content.carousel.showOnlyAvailable)}
            rate={config.rate}
            eyebrow={content.carousel.eyebrow}
            title={content.carousel.title}
            subtitle={content.carousel.subtitle}
            intervalSeconds={content.carousel.autoAdvanceSeconds}
          />
        )}
        <Reveal>
          <Steps content={content.steps} />
        </Reveal>
        <Catalog products={products} rate={config.rate} content={content.catalog} />
        <Reveal>
          <Testimonials content={content.testimonials} reviews={uiReviews} />
        </Reveal>
        <Reveal>
          <Faq content={content.faq} />
        </Reveal>
        <Reveal>
          <FinalCta content={content.finalCta} waHref={waFinalHref} />
        </Reveal>
      </main>
      <Footer config={config} content={content.footer} />
      <CartBar />
      <CartDrawer />
      <CursorFX fx={content.fx} />
      <WhatsAppFloat />
    </StoreProvider>
  );
}
