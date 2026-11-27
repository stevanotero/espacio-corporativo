import { db, pool } from "./index";
import { empresas } from "./schema";
import { logger } from "../lib/logger";

// Datos iniciales que la plataforma necesita para funcionar.
// Se puede correr varias veces sin duplicar nada:  npm run db:seed
async function main() {
  await db
    .insert(empresas)
    .values([
      { codigo: "servired", nombre: "Servired" },
      { codigo: "multired", nombre: "Multired" },
    ])
    .onConflictDoNothing({ target: empresas.codigo });

  logger.info("Datos iniciales listos (empresas)");
  await pool.end();
}

main().catch(async (error) => {
  logger.error("Error en el seed", { error: (error as Error).message });
  await pool.end();
  process.exit(1);
});
