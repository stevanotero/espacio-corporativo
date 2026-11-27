import type { Request, Response, NextFunction } from "express";
import { ErrorApp } from "../lib/errores";
import { logger } from "../lib/logger";

// Ruta que no existe → 404 en JSON (y no la página HTML por defecto de Express)
export function rutaNoEncontrada(req: Request, res: Response) {
  res.status(404).json({ ok: false, error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
}

// Manejador central de errores. Express 5 manda aquí cualquier error,
// también los de funciones async, sin necesidad de try/catch en cada controller.
export function manejarErrores(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ErrorApp) {
    res.status(err.status).json({ ok: false, error: err.message, detalles: err.detalles });
    return;
  }
  logger.error("Error no controlado", { error: (err as Error)?.message, stack: (err as Error)?.stack });
  // Al usuario nunca se le muestra el detalle técnico del error
  res.status(500).json({ ok: false, error: "Error interno del servidor" });
}
