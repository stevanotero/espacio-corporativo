import { env } from "./config/env";
import { crearApp } from "./app";
import { pool } from "./db";
import { logger } from "./lib/logger";

// Punto de entrada del backend: prueba la conexión a la base de datos y abre el puerto.
async function iniciar() {
  try {
    await pool.query("SELECT 1");
    logger.info("Conectado a PostgreSQL");
  } catch (error) {
    logger.error("No se pudo conectar a PostgreSQL. Revisa DATABASE_URL en backend/.env", {
      error: (error as Error).message,
    });
    process.exit(1);
  }

  crearApp().listen(env.PORT, () => {
    logger.info(`API lista en http://localhost:${env.PORT}/api`);
  });
}

iniciar();
