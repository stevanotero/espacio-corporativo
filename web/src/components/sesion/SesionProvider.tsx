"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { SesionUsuario } from "@espacio/shared";
import { api } from "@/lib/api";

// Guarda el usuario que inició sesión para que cualquier componente lo use:
//   const { usuario, cerrarSesion } = useSesion();
interface ContextoSesion {
  usuario: SesionUsuario | null;
  cargando: boolean;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<ContextoSesion | null>(null);

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api
      .get<SesionUsuario>("/auth/yo")
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const cerrarSesion = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      window.location.href = "/login";
    }
  }, []);

  return <Contexto.Provider value={{ usuario, cargando, cerrarSesion }}>{children}</Contexto.Provider>;
}

export function useSesion(): ContextoSesion {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error("useSesion debe usarse dentro de SesionProvider");
  return contexto;
}
