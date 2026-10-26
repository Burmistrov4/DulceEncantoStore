import AdminNav from "@/components/admin/AdminNav";
import { getStoreConfig } from "@/lib/store";

// El panel siempre muestra datos frescos (nunca cachear HTML del admin)
export const dynamic = "force-dynamic";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const config = getStoreConfig();
  return (
    <div className="min-h-dvh bg-cream">
      <AdminNav storeName={config.storeName} />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
