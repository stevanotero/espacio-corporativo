import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, pool } from "./index";
import { empresas, usuarios, usuarioEmpresas } from "./schema";
import { logger } from "../lib/logger";

// Datos iniciales que la plataforma necesita para funcionar.
// Se puede correr varias veces sin duplicar nada:  npm run db:seed
//
// El usuario administrador inicial se crea con los datos de backend/.env:
//   ADMIN_DOCUMENTO, ADMIN_NOMBRE, ADMIN_EMAIL, ADMIN_CONTRASENA
// La contraseña nunca va escrita en el código.
async function main() {
  await db
    .insert(empresas)
    .values([
      { codigo: "servired", nombre: "Servired" },
      { codigo: "multired", nombre: "Multired" },
    ])
    .onConflictDoNothing({ target: empresas.codigo });
  logger.info("Empresas listas (Servired y Multired)");

  const { ADMIN_DOCUMENTO, ADMIN_NOMBRE, ADMIN_EMAIL, ADMIN_CONTRASENA } = process.env;
  if (!ADMIN_DOCUMENTO || !ADMIN_CONTRASENA) {
    logger.warn("No se creó el administrador: faltan ADMIN_DOCUMENTO y ADMIN_CONTRASENA en backend/.env");
  } else if (ADMIN_CONTRASENA.length < 10) {
    logger.warn("No se creó el administrador: ADMIN_CONTRASENA debe tener al menos 10 caracteres");
  } else {
    const [existente] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.documento, ADMIN_DOCUMENTO)).limit(1);
    if (existente) {
      logger.info("El administrador ya existe; no se modifica");
    } else {
      const todas = await db.select().from(empresas);
      const servired = todas.find((e) => e.codigo === "servired")!;
      const [admin] = await db
        .insert(usuarios)
        .values({
          documento: ADMIN_DOCUMENTO,
          nombre: ADMIN_NOMBRE || "Administrador",
          email: ADMIN_EMAIL || `${ADMIN_DOCUMENTO}@espacio-corporativo.local`,
          contrasena: await bcrypt.hash(ADMIN_CONTRASENA, 12),
          rol: "admin",
          empresa_id: servired.id,
          cargo: "Administrador de la plataforma",
        })
        .returning();
      // El administrador tiene acceso a las dos empresas
      await db.insert(usuarioEmpresas).values(todas.map((e) => ({ usuario_id: admin.id, empresa_id: e.id })));
      logger.info(`Administrador creado (documento ${ADMIN_DOCUMENTO})`);
    }
  }

  await pool.end();
}

main().catch(async (error) => {
  logger.error("Error en el seed", { error: (error as Error).message });
  await pool.end();
  process.exit(1);
});
