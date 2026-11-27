import { Search, Bell } from "lucide-react";

// Barra superior del Figma: título de la sección, buscador, notificaciones y marcas.
export default function Encabezado({ seccion, titulo }: { seccion: string; titulo: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-[72px] items-center justify-between border-b border-black/5 bg-white px-8">
      <div>
        <p className="text-xs text-tinta/60">{seccion}</p>
        <h1 className="text-lg font-semibold">{titulo}</h1>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex h-9 w-72 items-center gap-2 rounded-lg border border-black/10 bg-fondo px-3 text-sm text-tinta/50">
          <Search size={15} />
          <input className="w-full bg-transparent outline-none" placeholder="Buscar en el espacio…" />
        </label>
        <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-black/10" aria-label="Notificaciones">
          <Bell size={16} />
        </button>
        <p className="border-l border-black/10 pl-4 text-sm font-bold">
          <span className="text-marca">Servired</span> <span className="text-tinta/30">|</span>{" "}
          <span className="text-multired">Multired</span>
        </p>
      </div>
    </header>
  );
}
