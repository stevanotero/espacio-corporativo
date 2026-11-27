import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";
import { ErrorApp } from "../lib/errores";

// Valida req.params, req.query o req.body con un esquema de Zod ANTES de llegar al controller.
// Uso en un archivo de rutas:
//   router.get("/:id", validar(idParamSchema, "params"), controller.obtener);
export function validar(esquema: ZodType, origen: "body" | "params" | "query" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const resultado = esquema.safeParse(req[origen]);
    if (!resultado.success) {
      throw new ErrorApp(400, "Datos inválidos", resultado.error.issues.map((i) => ({
        campo: i.path.join("."),
        mensaje: i.message,
      })));
    }
    // Guardamos los datos ya validados para que el controller los use con seguridad
    res.locals.validado = resultado.data;
    next();
  };
}
