import bcrypt from "bcryptjs";
import type { SesionUsuario } from "@espacio/shared";
import { env } from "../../config/env";
import { ErrorApp } from "../../lib/errores";
import { firmarAcceso, generarTokenSesion, hashToken } from "../../lib/tokens";
import { auditoriaService } from "../auditoria/auditoria.service";
import { authModel, type UsuarioLogin } from "./auth.model";

// SERVICE de autenticación: todas las reglas del inicio de sesión.

interface Origen {
  ip: string | null;
  userAgent: string | null;
}

export interface ResultadoSesion {
  usuario: SesionUsuario;
  tokenAcceso: string;
  tokenSesion: string;
}

// Hash de relleno: si el documento no existe, igual se compara una contraseña.
// Así la respuesta tarda lo mismo y no se puede adivinar qué documentos existen.
const HASH_RELLENO = "$2b$12$vVfWi4fCF4K7gY5DQPdLCuWPLCFvLkrGF6clvSNtE.OHqRyIbzh.q";

const CREDENCIALES_INVALIDAS = "Documento o contraseña incorrectos";

async function armarSesionUsuario(usuarioId: string): Promise<SesionUsuario> {
  const perfil = await authModel.datosPerfil(usuarioId);
  if (!perfil) throw new ErrorApp(401, "Sesión inválida");
  let empresas = await authModel.empresasDelUsuario(usuarioId);
  // Si todavía no tiene filas en usuario_empresas, al menos tiene acceso a su empresa principal
  if (empresas.length === 0) empresas = [{ id: perfil.empresaId, nombre: perfil.empresaNombre }];
  return {
    id: perfil.id,
    documento: perfil.documento,
    nombre: perfil.nombre,
    rol: perfil.rol,
    cargo: perfil.cargo,
    empresa: { id: perfil.empresaId, nombre: perfil.empresaNombre },
    area: perfil.areaId && perfil.areaNombre ? { id: perfil.areaId, nombre: perfil.areaNombre } : null,
    empresas,
  };
}

function minutosRestantes(hasta: Date): number {
  return Math.max(1, Math.ceil((hasta.getTime() - Date.now()) / 60000));
}

async function emitirTokens(usuario: SesionUsuario, sesionId: string): Promise<string> {
  return firmarAcceso({
    sub: usuario.id,
    rol: usuario.rol,
    empresaId: usuario.empresa.id,
    empresas: usuario.empresas.map((e) => e.id),
    sesionId,
  });
}

export const authService = {
  async login(documento: string, contrasena: string, origen: Origen): Promise<ResultadoSesion> {
    const usuario = await authModel.buscarPorDocumento(documento);

    if (!usuario) {
      await bcrypt.compare(contrasena, HASH_RELLENO);
      await auditoriaService.registrar({
        accion: "auth.login_fallido",
        entidad: "usuario",
        detalle: { documento, motivo: "documento_no_existe" },
        ...origen,
      });
      throw new ErrorApp(401, CREDENCIALES_INVALIDAS);
    }

    const auditar = (accion: string, detalle?: Record<string, unknown>) =>
      auditoriaService.registrar({
        accion,
        entidad: "usuario",
        entidadId: usuario.id,
        usuarioId: usuario.id,
        empresaId: usuario.empresa_id,
        detalle,
        ...origen,
      });

    if (usuario.bloqueado_hasta && usuario.bloqueado_hasta > new Date()) {
      await auditar("auth.login_bloqueado");
      throw new ErrorApp(423, `Cuenta bloqueada por intentos fallidos. Intenta de nuevo en ${minutosRestantes(usuario.bloqueado_hasta)} minutos.`);
    }

    const valida = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!valida) {
      const intentos = await authModel.sumarIntentoFallido(usuario.id);
      if (intentos >= env.MAX_INTENTOS_LOGIN) {
        const hasta = new Date(Date.now() + env.MINUTOS_BLOQUEO * 60000);
        await authModel.bloquearHasta(usuario.id, hasta);
        await auditar("auth.cuenta_bloqueada", { intentos, minutos: env.MINUTOS_BLOQUEO });
        throw new ErrorApp(423, `Cuenta bloqueada por ${env.MINUTOS_BLOQUEO} minutos tras ${intentos} intentos fallidos.`);
      }
      await auditar("auth.login_fallido", { motivo: "contrasena_incorrecta", intentos });
      throw new ErrorApp(401, CREDENCIALES_INVALIDAS);
    }

    // La contraseña es correcta, pero la cuenta está desactivada: se informa sin revelar más
    if (!usuario.activo) {
      await auditar("auth.login_fallido", { motivo: "usuario_inactivo" });
      throw new ErrorApp(403, "Tu usuario está desactivado. Comunícate con el administrador.");
    }

    await authModel.registrarAccesoExitoso(usuario.id);
    const resultado = await this.abrirSesion(usuario, origen);
    await auditar("auth.login_exitoso", { sesionId: resultado.sesionId });
    return resultado;
  },

  async abrirSesion(usuario: UsuarioLogin, origen: Origen): Promise<ResultadoSesion & { sesionId: string }> {
    const tokenSesion = generarTokenSesion();
    const sesion = await authModel.crearSesion({
      usuarioId: usuario.id,
      tokenHash: hashToken(tokenSesion),
      expiraEn: new Date(Date.now() + env.SESION_DIAS * 24 * 60 * 60 * 1000),
      ip: origen.ip,
      userAgent: origen.userAgent,
    });
    const sesionUsuario = await armarSesionUsuario(usuario.id);
    const tokenAcceso = await emitirTokens(sesionUsuario, sesion.id);
    return { usuario: sesionUsuario, tokenAcceso, tokenSesion, sesionId: sesion.id };
  },

  // Renueva el acceso con el token de sesión. Cada renovación cambia el token (rotación).
  async renovar(tokenSesion: string | undefined): Promise<ResultadoSesion> {
    if (!tokenSesion) throw new ErrorApp(401, "Debes iniciar sesión", { codigo: "SIN_SESION" });

    const sesion = await authModel.buscarSesionVigente(hashToken(tokenSesion));
    if (!sesion) throw new ErrorApp(401, "La sesión terminó. Inicia sesión de nuevo.", { codigo: "SIN_SESION" });

    const usuario = await authModel.buscarPorId(sesion.usuario_id);
    const bloqueado = usuario?.bloqueado_hasta && usuario.bloqueado_hasta > new Date();
    if (!usuario || !usuario.activo || bloqueado) {
      // Si desactivan al usuario, su sesión se cierra en la siguiente renovación (máx. ACCESO_MINUTOS)
      await authModel.revocarSesion(sesion.id);
      throw new ErrorApp(401, "La sesión terminó. Inicia sesión de nuevo.", { codigo: "SIN_SESION" });
    }

    const nuevoToken = generarTokenSesion();
    await authModel.rotarSesion(sesion.id, hashToken(nuevoToken));
    const sesionUsuario = await armarSesionUsuario(usuario.id);
    const tokenAcceso = await emitirTokens(sesionUsuario, sesion.id);
    return { usuario: sesionUsuario, tokenAcceso, tokenSesion: nuevoToken };
  },

  async logout(tokenSesion: string | undefined, origen: Origen): Promise<void> {
    if (!tokenSesion) return;
    const sesion = await authModel.buscarSesionVigente(hashToken(tokenSesion));
    if (!sesion) return;
    await authModel.revocarSesion(sesion.id);
    const usuario = await authModel.buscarPorId(sesion.usuario_id);
    await auditoriaService.registrar({
      accion: "auth.logout",
      entidad: "usuario",
      entidadId: sesion.usuario_id,
      usuarioId: sesion.usuario_id,
      empresaId: usuario?.empresa_id ?? null,
      detalle: { sesionId: sesion.id },
      ...origen,
    });
  },

  async perfil(usuarioId: string): Promise<SesionUsuario> {
    return armarSesionUsuario(usuarioId);
  },
};
