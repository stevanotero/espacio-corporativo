import Encabezado from "@/components/layout/Encabezado";
import Proximamente from "@/components/layout/Proximamente";

export default function CanalesPage() {
  return (
    <>
      <Encabezado seccion="Canales de Área" titulo="Canales de Área" />
      <main className="p-8">
        <Proximamente modulo="Chat por áreas en tiempo real" />
      </main>
    </>
  );
}
