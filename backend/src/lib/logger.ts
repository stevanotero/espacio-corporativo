import { env } from "../config/env";

// Logger sencillo: escribe en consola en formato JSON con fecha y nivel.
// Usar siempre logger.info / logger.warn / logger.error en vez de console.log,
// así en producción se pueden filtrar y buscar los mensajes.
const NIVELES = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Nivel = keyof typeof NIVELES;

function escribir(nivel: Nivel, mensaje: string, meta?: Record<string, unknown>) {
  if (NIVELES[nivel] < NIVELES[env.LOG_LEVEL]) return;
  const linea = JSON.stringify({ fecha: new Date().toISOString(), nivel, mensaje, ...(meta ? { meta } : {}) });
  if (nivel === "error") console.error(linea);
  else if (nivel === "warn") console.warn(linea);
  else console.log(linea);
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => escribir("debug", m, meta),
  info: (m: string, meta?: Record<string, unknown>) => escribir("info", m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => escribir("warn", m, meta),
  error: (m: string, meta?: Record<string, unknown>) => escribir("error", m, meta),
};
