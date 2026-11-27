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
