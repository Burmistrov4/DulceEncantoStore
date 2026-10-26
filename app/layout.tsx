import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Dulce Encanto";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${storeName} — Postres artesanales en Valencia, Carabobo`,
    template: `%s · ${storeName}`,
  },
  description:
    "Yogur griego con mermelada casera, quesillo tradicional venezolano y torta de pan hechos hoy con leche 100% fresca y sin conservantes. Pide por WhatsApp con delivery en Valencia, Carabobo (Flor Amarillo, La Isabelica, El Viñedo y más).",
  keywords: [
    "postres artesanales Valencia",
    "yogur griego Valencia Carabobo",
    "quesillo venezolano Valencia",
    "torta de pan casera",
    "dulces por WhatsApp Venezuela",
  ],
  openGraph: {
    type: "website",
    locale: "es_VE",
    siteName: storeName,
    title: `${storeName} — Postres artesanales recién hechos en Valencia`,
    description:
      "Yogur griego, quesillo tradicional y torta de pan con leche 100% fresca. Pide por WhatsApp, retira en taller o pide delivery en Valencia, Carabobo.",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="bg-cream font-body text-choco antialiased">{children}</body>
    </html>
  );
}
