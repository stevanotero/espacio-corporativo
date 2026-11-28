import "dotenv/config";
import { z } from "zod";

// Lee y valida las variables del archivo .env al arrancar.
// Si falta alguna o tiene un formato malo, el backend NO arranca
// y te dice exactamente cuál es. Así no hay errores raros más adelante.
const esquemaEnv = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4001),
  DATABASE_URL: z.string().startsWith("postgresql://", "DATABASE_URL debe empezar por postgresql://"),
  CORS_ORIGIN: z.string().default("http://localhost:4000"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // ── Inicio de sesión ──
  // Clave para firmar los tokens. Debe ser larga y secreta (mínimo 32 caracteres).
  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  // Cuánto dura el token de acceso (se renueva solo mientras la sesión siga abierta)
  ACCESO_MINUTOS: z.coerce.number().int().positive().default(15),
  // Cuántos días dura una sesión sin volver a pedir contraseña
  SESION_DIAS: z.coerce.number().int().positive().default(7),
  // Bloqueo temporal tras varios intentos fallidos
  MAX_INTENTOS_LOGIN: z.coerce.number().int().positive().default(5),
  MINUTOS_BLOQUEO: z.coerce.number().int().positive().default(15),
  // En producción (HTTPS) las cookies deben ser "secure"
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  // Cuántos proxies hay delante del backend (Next.js / nginx), para leer la IP real en la auditoría
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
});

const resultado = esquemaEnv.safeParse(process.env);

if (!resultado.success) {
  console.error("❌ Variables de entorno inválidas. Revisa backend/.env:");
  for (const issue of resultado.error.issues) {
    console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = resultado.data;
