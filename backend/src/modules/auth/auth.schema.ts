import { z } from "zod";

export const loginSchema = z.object({
  documento: z.string().trim().min(3, "Escribe tu documento").max(20, "Documento demasiado largo"),
  contrasena: z.string().min(1, "Escribe tu contraseña").max(100),
});

export type LoginDatos = z.infer<typeof loginSchema>;
