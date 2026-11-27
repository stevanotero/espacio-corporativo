import Encabezado from "@/components/layout/Encabezado";
import Proximamente from "@/components/layout/Proximamente";

export default function BandejaPage() {
  return (
    <>
      <Encabezado seccion="Bandeja de Entrada" titulo="Bandeja de Entrada" />
      <main className="p-8">
        <Proximamente modulo="Mensajes directos con jefes y áreas, tipo correo" />
      </main>
    </>
  );
}
