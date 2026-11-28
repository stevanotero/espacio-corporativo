import type { Request, Response, NextFunction } from "express";
import type { Rol } from "@espacio/shared";
import { COOKIE_ACCESO } from "../lib/cookies";
import { verificarAcceso, type DatosAcceso } from "../lib/tokens";
import { ErrorApp } from "../lib/errores";

// Usuario que hizo la petición. Lo deja "autenticar" en res.locals.usuario
export interface UsuarioActual {
  id: string;
  rol: Rol;
  empresaId: string;
  empresas: string[];
  sesionId: string;
}

export function usuarioActual(res: Response): UsuarioActual {
  return res.locals.usuario as UsuarioActual;
}

// Exige sesión iniciada. Se pone antes de cualquier ruta privada:
//   router.get("/", autenticar, controller.listar);
export function autenticar(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_ACCESO];
  if (!token) throw new ErrorApp(401, "Debes iniciar sesión", { codigo: "SIN_SESION" });

  let datos: DatosAcceso;
  try {
    datos = verificarAcceso(token);
  } catch {
    // La web, al recibir este código, renueva la sesión sola y repite la petición
    throw new ErrorApp(401, "La sesión expiró", { codigo: "ACCESO_EXPIRADO" });
  }

  res.locals.usuario = {
    id: datos.sub,
    rol: datos.rol,
    empresaId: datos.empresaId,
    empresas: datos.empresas,
    sesionId: datos.sesionId,
  } satisfies UsuarioActual;
  next();
}

// Exige uno de los roles indicados. Va DESPUÉS de autenticar:
//   router.post("/", autenticar, requiereRol("admin", "gerencia"), controller.crear);
export function requiereRol(...roles: Rol[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const usuario = usuarioActual(res);
    if (!usuario || !roles.includes(usuario.rol)) {
      throw new ErrorApp(403, "No tienes permiso para esta acción");
    }
    next();
  };
}
