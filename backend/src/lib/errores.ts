// Error de la aplicación con su código HTTP.
// En un service se lanza así:  throw new ErrorApp(404, "Empresa no encontrada");
// y el middleware de errores lo convierte en la respuesta JSON para la web.
export class ErrorApp extends Error {
  constructor(
    public readonly status: number,
    mensaje: string,
    public readonly detalles?: unknown
  ) {
    super(mensaje);
    this.name = "ErrorApp";
  }
}
