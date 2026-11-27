import Encabezado from "@/components/layout/Encabezado";
import Proximamente from "@/components/layout/Proximamente";

export default function ActividadPage() {
  return (
    <>
      <Encabezado seccion="Registro de Actividad" titulo="Registro de Actividad" />
      <main className="p-8">
        <Proximamente modulo="Auditoría de todo lo que pasa en la plataforma (solo administradores)" />
      </main>
    </>
  );
}
