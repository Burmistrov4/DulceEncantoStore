import SettingsForm from "@/components/admin/SettingsForm";
import { getStoreConfig } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const config = await getStoreConfig();
  return (
    <div>
      <h1 className="font-display text-3xl font-black">Ajustes ⚙️</h1>
      <p className="mt-1 text-sm text-choco/60">
        Tasa de cambio, contacto y zonas de entrega. Los cambios se reflejan en toda la tienda al instante.
      </p>
      <div className="mt-6">
        <SettingsForm config={config} />
      </div>
    </div>
  );
}
