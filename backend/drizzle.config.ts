import "dotenv/config";
import type { Config } from "drizzle-kit";

// Configuración de drizzle-kit: lee el esquema (los modelos de las tablas)
// y genera los archivos SQL de migración en la carpeta ./drizzle
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
