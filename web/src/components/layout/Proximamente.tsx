// Contenido temporal para las secciones que aún no se han construido.
export default function Proximamente({ modulo }: { modulo: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/15 bg-white p-10 text-center">
      <p className="text-lg font-semibold">Módulo en construcción</p>
      <p className="mt-1 text-sm text-tinta/60">{modulo}</p>
    </div>
  );
}
