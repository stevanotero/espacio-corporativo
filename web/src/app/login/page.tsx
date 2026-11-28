import { Suspense } from "react";
import { Megaphone, ShieldCheck, Users } from "lucide-react";
import FormularioLogin from "./FormularioLogin";

export const metadata = { title: "Iniciar sesión · Espacio Corporativo" };

// VISTA del login. No lleva el menú lateral porque está fuera de la carpeta (panel).
export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca (mismo azul del menú lateral del Figma) */}
      <section className="hidden flex-col justify-between bg-marca p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-marca">SM</div>
          <div>
            <p className="font-semibold leading-tight">Servired</p>
            <p className="text-[11px] tracking-wide text-white/70">ESPACIO CORPORATIVO</p>
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">La comunicación oficial de la empresa, en un solo lugar.</h1>
          <ul className="mt-8 space-y-4 text-sm text-white/85">
            <li className="flex items-center gap-3">
              <Megaphone size={18} className="text-white/70" /> Comunicados oficiales con confirmación de lectura
            </li>
            <li className="flex items-center gap-3">
              <Users size={18} className="text-white/70" /> Mensajes y canales por área
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck size={18} className="text-white/70" /> Todo queda registrado y auditado
            </li>
          </ul>
        </div>

        <p className="text-sm font-bold">
          <span>Servired</span> <span className="text-white/40">|</span> <span className="text-multired">Multired</span>
        </p>
      </section>

      {/* Formulario */}
      <section className="flex items-center justify-center bg-fondo p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-sm font-bold">
              <span className="text-marca">Servired</span> <span className="text-tinta/30">|</span>{" "}
              <span className="text-multired">Multired</span>
            </p>
          </div>
          <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
          <p className="mt-1 mb-8 text-sm text-tinta/60">Ingresa con tu número de documento.</p>
          {/* useSearchParams necesita Suspense en Next.js 15 */}
          <Suspense>
            <FormularioLogin />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
