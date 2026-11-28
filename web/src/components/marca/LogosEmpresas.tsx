import Image from "next/image";

// Logos de las dos empresas, en un solo lugar.
// Si llega una versión nueva de un logo, se reemplaza el archivo en web/public/logos/
// y se actualiza en toda la app (login y encabezado).
//
// Van siempre sobre fondo claro: sobre el azul de la app el logo de ServiRed pierde nitidez.
// Multired: por ahora se usa solo el símbolo de colores, porque el archivo recibido
// tiene las letras en blanco sobre fondo blanco. El nombre se escribe como texto.

const PROPORCION_SERVIRED = 235 / 72; // ancho / alto del archivo servired.png

export default function LogosEmpresas({ alto = 32 }: { alto?: number }) {
  return (
    <div className="flex items-center gap-4">
      <Image
        src="/logos/servired.png"
        alt="ServiRed Grupo Empresarial"
        width={Math.round(alto * PROPORCION_SERVIRED)}
        height={alto}
        priority
      />
      <span className="h-6 w-px bg-black/10" aria-hidden="true" />
      <div className="flex items-center gap-2">
        <Image src="/logos/multired-simbolo.png" alt="" width={alto} height={alto} priority />
        <span className="font-bold text-marca" style={{ fontSize: Math.round(alto * 0.5) }}>
          Multired
        </span>
      </div>
    </div>
  );
}
