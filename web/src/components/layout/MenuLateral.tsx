"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Inbox, Hash, Activity, User, LogOut, type LucideIcon } from "lucide-react";
import { useSesion } from "@/components/sesion/SesionProvider";

// Menú lateral del Figma. Para agregar una sección nueva, se agrega una línea aquí.
const SECCIONES: { ruta: string; nombre: string; icono: LucideIcon }[] = [
  { ruta: "/", nombre: "Inicio", icono: Home },
  { ruta: "/bandeja", nombre: "Bandeja de Entrada", icono: Inbox },
  { ruta: "/canales", nombre: "Canales de Área", icono: Hash },
  { ruta: "/actividad", nombre: "Registro de Actividad", icono: Activity },
  { ruta: "/perfil", nombre: "Mi Perfil", icono: User },
];

export default function MenuLateral() {
  const rutaActual = usePathname();
  const { usuario, cerrarSesion } = useSesion();
  const iniciales = usuario?.nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 flex w-[260px] flex-col bg-marca px-4 py-7 text-white">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-bold text-marca">SM</div>
        <div>
          <p className="font-semibold leading-tight">Servired</p>
          <p className="text-[11px] tracking-wide text-white/70">ESPACIO CORPORATIVO</p>
        </div>
      </div>

      <p className="mb-3 px-3 text-[11px] font-medium tracking-wider text-white/60">MENÚ PRINCIPAL</p>
      <nav className="flex flex-col gap-1">
        {SECCIONES.map(({ ruta, nombre, icono: Icono }) => {
          const activa = ruta === "/" ? rutaActual === "/" : rutaActual.startsWith(ruta);
          return (
            <Link
              key={ruta}
              href={ruta}
              className={`flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${
                activa ? "bg-marca-claro font-medium" : "text-white/85 hover:bg-white/10"
              }`}
            >
              <Icono size={16} />
              {nombre}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-xl bg-white/10 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-medium">
          {iniciales ?? "…"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{usuario?.nombre ?? "Cargando…"}</p>
          {usuario && (
            <span className="mt-0.5 inline-block max-w-full truncate rounded bg-white/15 px-1.5 py-0.5 text-[11px] text-white/80">
              {usuario.area ? `Área: ${usuario.area.nombre}` : usuario.empresa.nombre}
            </span>
          )}
        </div>
        <button onClick={cerrarSesion} className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
