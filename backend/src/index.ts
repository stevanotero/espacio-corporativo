import { env } from "./config/env";
import { crearApp } from "./app";
import { pool } from "./db";
import { logger } from "./lib/logger";
import { auditoriaService } from "./modules/auditoria/auditoria.service";

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

  // La auditoría está partida por mes: se aseguran las particiones al arrancar y una vez al día
  await auditoriaService.asegurarParticiones();
  setInterval(() => {
    auditoriaService.asegurarParticiones().catch((error) =>
      logger.error("No se pudieron crear las particiones de auditoría", { error: (error as Error).message })
    );
  }, 24 * 60 * 60 * 1000).unref();

  crearApp().listen(env.PORT, () => {
    logger.info(`API lista en http://localhost:${env.PORT}/api`);
  });
}

iniciar();
