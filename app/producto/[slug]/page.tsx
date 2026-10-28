import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import StoreProvider from "@/components/StoreProvider";
import CartBar from "@/components/store/CartBar";
import CartDrawer from "@/components/store/CartDrawer";
import ProductGallery from "@/components/store/ProductGallery";
import ProductPurchase from "@/components/store/ProductPurchase";
import WhatsAppFloat from "@/components/store/WhatsAppFloat";
import { bs, usd } from "@/lib/format";
import { getProductBySlug, getProducts, getSiteContent, getStoreConfig } from "@/lib/store";
import { CATEGORIES } from "@/lib/types";

export const revalidate = 15;

export async function generateStaticParams() {
  return (await getProducts({ onlyActive: true })).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };

  const config = await getStoreConfig();
  const minPrice = Math.min(product.priceUsd, ...product.variants.map((v) => v.priceUsd));
  const title = `${product.name} — ${usd(minPrice)} · ${bs(minPrice, config.rate)}`;
  const description = `${product.description} Pide hoy por WhatsApp con retiro en Flor Amarillo o delivery en Valencia, Carabobo.`;

  return {
    title,
    description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title: `${product.name} · ${usd(minPrice)} / ${bs(minPrice, config.rate)}`,
      description,
      images: [{ url: product.image, width: 1200, height: 900, alt: product.name }],
      type: "website",
      locale: "es_VE",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product || !product.active) notFound();

  const config = await getStoreConfig();
  const content = await getSiteContent();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const category = CATEGORIES.find((c) => c.id === product.category);
  const minPrice = Math.min(product.priceUsd, ...product.variants.map((v) => v.priceUsd));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: `${site}${product.image}`,
    description: product.description,
    category: category?.label,
    brand: { "@type": "Brand", name: config.storeName },
    offers: {
      "@type": "Offer",
      price: (minPrice / 100).toFixed(2),
      priceCurrency: "USD",
      availability: product.availableToday ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      areaServed: "Valencia, Carabobo, Venezuela",
      priceSpecification: [
        { "@type": "PriceSpecification", price: (minPrice / 100).toFixed(2), priceCurrency: "USD" },
        { "@type": "PriceSpecification", price: ((minPrice / 100) * config.rate).toFixed(2), priceCurrency: "VES" },
      ],
    },
  };

  return (
    <StoreProvider config={config}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header storeName={config.storeName} rate={config.rate} />

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <Link href="/#menu" className="text-sm font-bold text-caramel hover:underline">
          ← Volver al menú de hoy
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <ProductGallery
            src={product.image}
            alt={product.name}
            badge={product.availableToday ? "Hecho hoy ✨" : "Agotado hoy"}
          />

          <div className="flex flex-col gap-6">
            <div>
              <p className="overline-caps text-caramel">
                {category?.emoji} {category?.label}
              </p>
              <h1 className="mt-2 font-display text-4xl font-black leading-tight">{product.name}</h1>
              <p className="mt-4 leading-relaxed text-choco/75">{product.description}</p>
            </div>

            <ProductPurchase product={product} />

            <ul className="grid gap-2 text-sm text-choco/70">
              {product.servings && (
                <li className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-choco/5">🍽️ <strong>Raciones:</strong> {product.servings}</li>
              )}
              {product.ingredients && (
                <li className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-choco/5">🥛 <strong>Ingredientes naturales:</strong> {product.ingredients}</li>
              )}
              <li className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-choco/5">
                🚚 <strong>Entrega:</strong> retiro gratis en Flor Amarillo o delivery en Valencia desde $1
              </li>
              <li className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-choco/5">
                💳 <strong>Pago:</strong> PagoMóvil · Efectivo $ · Binance Pay · Zelle
              </li>
            </ul>
          </div>
        </div>
      </main>

      <Footer config={config} content={content.footer} />
      <CartBar />
      <CartDrawer />
      <WhatsAppFloat />
    </StoreProvider>
  );
}
