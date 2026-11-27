import Encabezado from "@/components/layout/Encabezado";
import Proximamente from "@/components/layout/Proximamente";

export default function PerfilPage() {
  return (
    <>
      <Encabezado seccion="Mi Perfil" titulo="Mi Perfil" />
      <main className="p-8">
        <Proximamente modulo="Datos del usuario y preferencias" />
      </main>
    </>
  );
}
