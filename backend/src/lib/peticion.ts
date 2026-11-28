import type { Request } from "express";

// Datos del origen de la petición, para la auditoría
export function origenPeticion(req: Request): { ip: string | null; userAgent: string | null } {
  return {
    ip: req.ip ?? null,
    userAgent: req.get("user-agent")?.slice(0, 300) ?? null,
  };
}
