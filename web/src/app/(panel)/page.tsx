import Encabezado from "@/components/layout/Encabezado";
import EstadoConexion from "./EstadoConexion";

// VISTA (la "V" del MVC): la página de Inicio. Aquí irán los Comunicados Oficiales.
// Por ahora muestra si la web está bien conectada con el backend y la base de datos.
export default function InicioPage() {
  return (
    <>
      <Encabezado seccion="Inicio" titulo="Comunicados Oficiales" />
      <main className="p-8">
        <h2 className="text-2xl font-semibold">Comunicados Oficiales</h2>
        <p className="mb-6 text-sm text-tinta/60">Mantente al día con los anuncios de la dirección y tu área.</p>
        <EstadoConexion />
      </main>
    </>
  );
}
