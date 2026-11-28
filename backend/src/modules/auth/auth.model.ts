import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../../db";
import { usuarios, empresas, areas, sesiones, usuarioEmpresas } from "../../db/schema";

// MODEL de autenticación: consultas de usuarios y sesiones.

export type UsuarioLogin = typeof usuarios.$inferSelect;
export type SesionFila = typeof sesiones.$inferSelect;

export const authModel = {
  async buscarPorDocumento(documento: string): Promise<UsuarioLogin | undefined> {
    const [fila] = await db.select().from(usuarios).where(eq(usuarios.documento, documento)).limit(1);
    return fila;
  },

  async buscarPorId(id: string): Promise<UsuarioLogin | undefined> {
    const [fila] = await db.select().from(usuarios).where(eq(usuarios.id, id)).limit(1);
    return fila;
  },

  // Suma un intento fallido y devuelve cuántos lleva (en una sola consulta, sin carreras)
  async sumarIntentoFallido(id: string): Promise<number> {
    const [fila] = await db
      .update(usuarios)
      .set({ intentos_fallidos: sql`${usuarios.intentos_fallidos} + 1`, updated_at: new Date() })
      .where(eq(usuarios.id, id))
      .returning({ intentos: usuarios.intentos_fallidos });
    return fila?.intentos ?? 0;
  },

  async bloquearHasta(id: string, hasta: Date): Promise<void> {
    await db.update(usuarios).set({ bloqueado_hasta: hasta, updated_at: new Date() }).where(eq(usuarios.id, id));
  },

  async registrarAccesoExitoso(id: string): Promise<void> {
    await db
      .update(usuarios)
      .set({ intentos_fallidos: 0, bloqueado_hasta: null, ultimo_acceso: new Date(), updated_at: new Date() })
      .where(eq(usuarios.id, id));
  },

  // Empresas a las que tiene acceso (con su nombre)
  async empresasDelUsuario(usuarioId: string): Promise<{ id: string; nombre: string }[]> {
    return db
      .select({ id: empresas.id, nombre: empresas.nombre })
      .from(usuarioEmpresas)
      .innerJoin(empresas, eq(empresas.id, usuarioEmpresas.empresa_id))
      .where(and(eq(usuarioEmpresas.usuario_id, usuarioId), eq(empresas.activa, true)))
      .orderBy(empresas.nombre);
  },

  async datosPerfil(usuarioId: string) {
    const [fila] = await db
      .select({
        id: usuarios.id,
        documento: usuarios.documento,
        nombre: usuarios.nombre,
        rol: usuarios.rol,
        cargo: usuarios.cargo,
        activo: usuarios.activo,
        empresaId: empresas.id,
        empresaNombre: empresas.nombre,
        areaId: areas.id,
        areaNombre: areas.nombre,
      })
      .from(usuarios)
      .innerJoin(empresas, eq(empresas.id, usuarios.empresa_id))
      .leftJoin(areas, eq(areas.id, usuarios.area_id))
      .where(eq(usuarios.id, usuarioId))
      .limit(1);
    return fila;
  },

  async crearSesion(datos: { usuarioId: string; tokenHash: string; expiraEn: Date; ip: string | null; userAgent: string | null }): Promise<SesionFila> {
    const [fila] = await db
      .insert(sesiones)
      .values({ usuario_id: datos.usuarioId, token_hash: datos.tokenHash, expira_en: datos.expiraEn, ip: datos.ip, user_agent: datos.userAgent })
      .returning();
    return fila;
  },

  // Sesión vigente (no revocada y no vencida) por el hash de su token
  async buscarSesionVigente(tokenHash: string): Promise<SesionFila | undefined> {
    const [fila] = await db
      .select()
      .from(sesiones)
      .where(and(eq(sesiones.token_hash, tokenHash), isNull(sesiones.revocada_en), gt(sesiones.expira_en, new Date())))
      .limit(1);
    return fila;
  },

  // Rotación: cada renovación cambia el token. El token anterior deja de servir.
  async rotarSesion(id: string, nuevoHash: string): Promise<void> {
    await db.update(sesiones).set({ token_hash: nuevoHash, ultimo_uso_en: new Date() }).where(eq(sesiones.id, id));
  },

  async revocarSesion(id: string): Promise<void> {
    await db.update(sesiones).set({ revocada_en: new Date() }).where(and(eq(sesiones.id, id), isNull(sesiones.revocada_en)));
  },
};
