import OrdersBoard from "@/components/admin/OrdersBoard";
import { getAllOrders } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  const orders = getAllOrders();
  return (
    <div>
      <h1 className="font-display text-3xl font-black">Pedidos 🧾</h1>
      <p className="mt-1 text-sm text-choco/60">
        Cada pedido confirmado por WhatsApp llega aquí con su código, cliente y estado. Avanza el
        pipeline con un clic y escríbele directo por WhatsApp al cliente.
      </p>
      <div className="mt-6">
        <OrdersBoard orders={orders} />
      </div>
    </div>
  );
}
