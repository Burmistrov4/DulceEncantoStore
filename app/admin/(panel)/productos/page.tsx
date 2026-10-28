import ProductManager from "@/components/admin/ProductManager";
import { getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getProducts();
  return <ProductManager products={products} />;
}
