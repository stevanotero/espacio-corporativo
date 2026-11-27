import type { RespuestaApi } from "@espacio/shared";

// Ayudante para llamar al backend desde la web.
// Siempre usa rutas relativas ("/api/..."): Next.js las reenvía al backend (ver next.config.ts).
// Es el equivalente a llamar desde PHP a otro archivo, pero por HTTP.
//
// Uso:  const empresas = await api.get<Empresa[]>("/empresas");
async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: cuerpo !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    credentials: "include",
  });

  let json: RespuestaApi<T>;
  try {
    json = await respuesta.json();
  } catch {
    throw new Error("El servidor no respondió correctamente");
  }

  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>("GET", ruta),
  post: <T>(ruta: string, cuerpo: unknown) => pedir<T>("POST", ruta, cuerpo),
  patch: <T>(ruta: string, cuerpo: unknown) => pedir<T>("PATCH", ruta, cuerpo),
  delete: <T>(ruta: string) => pedir<T>("DELETE", ruta),
};
