import { sql } from "drizzle-orm";
import { db } from "../../db";
import { auditoria } from "../../db/schema";

export type NuevoEvento = typeof auditoria.$inferInsert;

// MODEL de auditoría: solo INSERTA. La base de datos impide editar o borrar (trigger).
export const auditoriaModel = {
  async insertar(evento: NuevoEvento): Promise<void> {
    await db.insert(auditoria).values(evento);
  },

  // Crea las particiones del mes actual y los 2 siguientes (función SQL de la migración 0002)
  async asegurarParticiones(): Promise<void> {
    await db.execute(sql`SELECT asegurar_particiones_auditoria()`);
  },
};
