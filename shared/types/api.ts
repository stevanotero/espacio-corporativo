// Forma estándar de las respuestas de la API.
// Así la web siempre sabe dónde buscar los datos y los errores.
export interface RespuestaOk<T> {
  ok: true;
  data: T;
}

export interface RespuestaError {
  ok: false;
  error: string;
  detalles?: unknown;
}

export type RespuestaApi<T> = RespuestaOk<T> | RespuestaError;
