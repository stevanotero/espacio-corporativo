import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index";
import { logger } from "../lib/logger";

// Aplica en la base de datos los archivos SQL de la carpeta ./drizzle
// que todavía no se hayan aplicado. Se corre con:  npm run db:migrate
async function main() {
  logger.info("Aplicando migraciones...");
  await migrate(db, { migrationsFolder: "./drizzle" });
  logger.info("Migraciones aplicadas");
  await pool.end();
}

main().catch(async (error) => {
  logger.error("Error aplicando migraciones", { error: (error as Error).message });
  await pool.end();
  process.exit(1);
});
