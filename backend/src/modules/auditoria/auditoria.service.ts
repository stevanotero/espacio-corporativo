import { logger } from "../../lib/logger";
import { auditoriaModel } from "./auditoria.model";

// SERVICIO CENTRAL DE AUDITORÍA: todos los módulos registran aquí lo que pasa.
// Uso:
//   await auditoriaService.registrar({
//     accion: "comunicado.publicar", entidad: "comunicado", entidadId: id,
//     usuarioId, empresaId, detalle: { titulo }, ip, userAgent,
//   });
//
// Convención para "accion": "<modulo>.<verbo>"  (auth.login_exitoso, archivo.subir, ...)

export interface EventoAuditoria {
  accion: string;
  entidad: string;
  entidadId?: string | null;
  usuarioId?: string | null;
  empresaId?: string | null;
  detalle?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

export const auditoriaService = {
  async registrar(evento: EventoAuditoria): Promise<void> {
    try {
      await auditoriaModel.insertar({
        accion: evento.accion,
        entidad: evento.entidad,
        entidad_id: evento.entidadId ?? null,
        usuario_id: evento.usuarioId ?? null,
        empresa_id: evento.empresaId ?? null,
        detalle: evento.detalle ?? null,
        ip: evento.ip ?? null,
        user_agent: evento.userAgent ?? null,
      });
    } catch (error) {
      // Si la auditoría falla, la acción del usuario no se cae, pero queda en el log como ERROR
      // para revisarlo de inmediato (una auditoría que falla en silencio no sirve).
      logger.error("No se pudo registrar el evento de auditoría", {
        accion: evento.accion,
        error: (error as Error).message,
      });
    }
  },

  async asegurarParticiones(): Promise<void> {
    await auditoriaModel.asegurarParticiones();
  },
};
