"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import type { Empresa } from "@espacio/shared";
import { api } from "@/lib/api";

type Estado = { tipo: "cargando" } | { tipo: "ok"; empresas: Empresa[] } | { tipo: "error"; mensaje: string };

// Prueba de punta a punta: web → /api (Next.js) → backend → PostgreSQL.
// Si ves las dos empresas, todo está bien conectado. Se puede borrar cuando exista el módulo de comunicados.
export default function EstadoConexion() {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  useEffect(() => {
    api
      .get<Empresa[]>("/empresas")
      .then((empresas) => setEstado({ tipo: "ok", empresas }))
      .catch((error: Error) => setEstado({ tipo: "error", mensaje: error.message }));
  }, []);

  return (
    <div className="max-w-xl rounded-2xl bg-white p-6 shadow-sm">
      <p className="mb-3 font-semibold">Estado de la conexión</p>

      {estado.tipo === "cargando" && (
        <p className="flex items-center gap-2 text-sm text-tinta/60">
          <Loader2 size={16} className="animate-spin" /> Consultando el backend…
        </p>
      )}

      {estado.tipo === "error" && (
        <div className="text-sm">
          <p className="flex items-center gap-2 font-medium text-alerta">
            <XCircle size={16} /> No hay conexión con el backend
          </p>
          <p className="mt-1 text-tinta/60">{estado.mensaje}</p>
          <p className="mt-1 text-tinta/60">Revisa que el backend esté corriendo (npm run dev:backend) y su .env.</p>
        </div>
      )}

      {estado.tipo === "ok" && (
        <div className="text-sm">
          <p className="flex items-center gap-2 font-medium text-exito">
            <CheckCircle2 size={16} /> Web, backend y base de datos conectados
          </p>
          <ul className="mt-3 space-y-1 text-tinta/70">
            {estado.empresas.map((e) => (
              <li key={e.id}>• {e.nombre}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
