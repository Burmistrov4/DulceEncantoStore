import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Entrar al panel",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-choco px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-cream p-8 shadow-pop">
        <div className="mb-6 text-center">
          <span className="grid mx-auto size-14 place-items-center rounded-full bg-caramel text-2xl shadow-card" aria-hidden="true">
            🔐
          </span>
          <h1 className="mt-4 font-display text-2xl font-black">Panel del dueño</h1>
          <p className="mt-1 text-sm text-choco/60">Gestiona menú, stock, tasa y métricas</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-[11px] leading-relaxed text-choco/45">
          Acceso exclusivo de la administración.
        </p>
      </div>
    </main>
  );
}
