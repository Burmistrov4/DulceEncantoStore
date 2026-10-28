import type { Metadata } from "next";
import MisPedidosClient from "@/components/store/MisPedidosClient";
import { getStoreConfig } from "@/lib/store";

export const metadata: Metadata = {
  title: "Mis pedidos",
  description: "Rastrea tus pedidos con tu código. Sin cuentas ni claves.",
};

export default async function MisPedidosPage() {
  const config = await getStoreConfig();
  return <MisPedidosClient whatsappNumber={config.whatsappNumber} />;
}
