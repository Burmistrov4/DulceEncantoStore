import ProductManager from "@/components/admin/ProductManager";
import { getProducts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function AdminProductsPage() {
  const products = getProducts();
  return <ProductManager products={products} />;
}
