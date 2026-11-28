import type { RespuestaApi } from "@espacio/shared";

// Ayudante para llamar al backend desde la web.
// Siempre usa rutas relativas ("/api/..."): Next.js las reenvía al backend (ver next.config.ts).
// La sesión viaja sola en cookies httpOnly: aquí no se maneja ningún token.
//
// Si el acceso venció (cada 15 min), se renueva solo y se repite la petición.
// Si la sesión terminó, se envía al usuario al login.
//
// Uso:  const empresas = await api.get<Empresa[]>("/empresas");

export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    public readonly status: number,
    public readonly codigo?: string
  ) {
    super(mensaje);
  }
}

let renovando: Promise<boolean> | null = null;

// Si varias peticiones vencen al mismo tiempo, se renueva una sola vez
function renovarSesion(): Promise<boolean> {
  renovando ??= fetch("/api/auth/renovar", { method: "POST", credentials: "include" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      renovando = null;
    });
  return renovando;
}

function irAlLogin() {
  if (typeof window === "undefined" || window.location.pathname.startsWith("/login")) return;
  const volver = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?volver=${volver}`;
}

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown, reintento = true): Promise<T> {
  const respuesta = await fetch(`/api${ruta}`, {
    method: metodo,
    headers: metodo !== "GET" ? { "Content-Type": "application/json" } : undefined,
    body: metodo !== "GET" ? JSON.stringify(cuerpo ?? {}) : undefined,
    credentials: "include",
  });

  let json: RespuestaApi<T>;
  try {
    json = await respuesta.json();
  } catch {
    throw new ErrorApi("El servidor no respondió correctamente", respuesta.status);
  }

  if (json.ok) return json.data;

  const codigo = (json.detalles as { codigo?: string } | undefined)?.codigo;
  const esRutaDeLogin = ruta.startsWith("/auth/login") || ruta.startsWith("/auth/renovar");

  if (respuesta.status === 401 && !esRutaDeLogin) {
    // Sin acceso válido (vencido o borrado): se intenta renovar UNA vez con la cookie de sesión.
    // Si la renovación falla, el backend borra las cookies y se va al login (sin ciclos).
    if (reintento && (await renovarSesion())) return pedir<T>(metodo, ruta, cuerpo, false);
    irAlLogin();
  }

  throw new ErrorApi(json.error, respuesta.status, codigo);
}

export const api = {
  get: <T>(ruta: string) => pedir<T>("GET", ruta),
  post: <T>(ruta: string, cuerpo?: unknown) => pedir<T>("POST", ruta, cuerpo),
  patch: <T>(ruta: string, cuerpo: unknown) => pedir<T>("PATCH", ruta, cuerpo),
  delete: <T>(ruta: string) => pedir<T>("DELETE", ruta),
};
