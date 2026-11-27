import { eq, asc } from "drizzle-orm";
import { db } from "../../db";
import { empresas, areas } from "../../db/schema";

// MODEL (la "M" del MVC): es la ÚNICA capa que habla con la base de datos.
// Aquí solo van consultas: nada de reglas de negocio ni de req/res.
// Es lo que en PHP era el archivo con las consultas SQL (DAO).

export type EmpresaFila = typeof empresas.$inferSelect;
export type AreaFila = typeof areas.$inferSelect;

export const empresasModel = {
  async listarActivas(): Promise<EmpresaFila[]> {
    return db.select().from(empresas).where(eq(empresas.activa, true)).orderBy(asc(empresas.nombre));
  },

  async buscarPorId(id: string): Promise<EmpresaFila | undefined> {
    const [fila] = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1);
    return fila;
  },

  async listarAreas(empresaId: string): Promise<AreaFila[]> {
    return db.select().from(areas).where(eq(areas.empresa_id, empresaId)).orderBy(asc(areas.nombre));
  },
};
