import { z } from "zod";

// VALIDACIÓN de lo que llega en la petición (params, query o body).
// Si no cumple, el middleware "validar" responde 400 y el controller ni se ejecuta.
export const empresaIdSchema = z.object({
  id: z.uuid("El id de la empresa no es válido"),
});

export type EmpresaIdParams = z.infer<typeof empresaIdSchema>;
