import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { authService } from "./auth.service";
import { authModel } from "./auth.model";
import { auditoriaService } from "../auditoria/auditoria.service";
import { verificarAcceso, hashToken } from "../../lib/tokens";

vi.mock("./auth.model", () => ({
  authModel: {
    buscarPorDocumento: vi.fn(),
    buscarPorId: vi.fn(),
    sumarIntentoFallido: vi.fn(),
    bloquearHasta: vi.fn(),
    registrarAccesoExitoso: vi.fn(),
    empresasDelUsuario: vi.fn(),
    datosPerfil: vi.fn(),
    crearSesion: vi.fn(),
    buscarSesionVigente: vi.fn(),
    rotarSesion: vi.fn(),
    revocarSesion: vi.fn(),
  },
}));
vi.mock("../auditoria/auditoria.service", () => ({ auditoriaService: { registrar: vi.fn() } }));

const origen = { ip: "10.0.0.1", userAgent: "pruebas" };
const hash = bcrypt.hashSync("Clave-Correcta-1", 4);
const EMPRESA = "e1111111-1111-4111-8111-111111111111";

function usuario(extra: Record<string, unknown> = {}) {
  return {
    id: "u1", documento: "1112046457", nombre: "Stevan", email: "s@x.co", contrasena: hash, rol: "admin",
    empresa_id: EMPRESA, area_id: null, punto_id: null, cargo: null, activo: true, intentos_fallidos: 0,
    bloqueado_hasta: null, ultimo_acceso: null, created_at: new Date(), updated_at: new Date(), ...extra,
  } as never;
}

const auditado = (accion: string) =>
  vi.mocked(auditoriaService.registrar).mock.calls.some(([e]) => e.accion === accion);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authModel.datosPerfil).mockResolvedValue({
    id: "u1", documento: "1112046457", nombre: "Stevan", rol: "admin", cargo: null, activo: true,
    empresaId: EMPRESA, empresaNombre: "Servired", areaId: null, areaNombre: null,
  });
  vi.mocked(authModel.empresasDelUsuario).mockResolvedValue([{ id: EMPRESA, nombre: "Servired" }]);
  vi.mocked(authModel.crearSesion).mockResolvedValue({ id: "s1" } as never);
});

describe("authService.login", () => {
  it("documento inexistente: 401 con mensaje genérico y queda auditado", async () => {
    vi.mocked(authModel.buscarPorDocumento).mockResolvedValue(undefined);
    await expect(authService.login("999", "x", origen)).rejects.toMatchObject({ status: 401, message: "Documento o contraseña incorrectos" });
    expect(auditado("auth.login_fallido")).toBe(true);
  });

  it("contraseña incorrecta: 401, suma intento y queda auditado", async () => {
    vi.mocked(authModel.buscarPorDocumento).mockResolvedValue(usuario());
    vi.mocked(authModel.sumarIntentoFallido).mockResolvedValue(1);
    await expect(authService.login("1112046457", "mala", origen)).rejects.toMatchObject({ status: 401 });
    expect(authModel.sumarIntentoFallido).toHaveBeenCalledWith("u1");
    expect(authModel.bloquearHasta).not.toHaveBeenCalled();
  });

  it("al llegar al máximo de intentos bloquea la cuenta (423)", async () => {
    vi.mocked(authModel.buscarPorDocumento).mockResolvedValue(usuario());
    vi.mocked(authModel.sumarIntentoFallido).mockResolvedValue(5);
    await expect(authService.login("1112046457", "mala", origen)).rejects.toMatchObject({ status: 423 });
    expect(authModel.bloquearHasta).toHaveBeenCalled();
    expect(auditado("auth.cuenta_bloqueada")).toBe(true);
  });

  it("cuenta bloqueada: 423 aunque la contraseña sea correcta", async () => {
    vi.mocked(authModel.buscarPorDocumento).mockResolvedValue(usuario({ bloqueado_hasta: new Date(Date.now() + 600000) }));
    await expect(authService.login("1112046457", "Clave-Correcta-1", origen)).rejects.toMatchObject({ status: 423 });
    expect(authModel.registrarAccesoExitoso).not.toHaveBeenCalled();
  });

  it("usuario desactivado: 403", async () => {
    vi.mocked(authModel.buscarPorDocumento).mockResolvedValue(usuario({ activo: false }));
    await expect(authService.login("1112046457", "Clave-Correcta-1", origen)).rejects.toMatchObject({ status: 403 });
  });

  it("login correcto: reinicia intentos, abre sesión, emite token válido y audita", async () => {
    vi.mocked(authModel.buscarPorDocumento).mockResolvedValue(usuario({ intentos_fallidos: 3 }));
    const r = await authService.login("1112046457", "Clave-Correcta-1", origen);
    expect(authModel.registrarAccesoExitoso).toHaveBeenCalledWith("u1");
    expect(r.usuario.empresa.nombre).toBe("Servired");
    const datos = verificarAcceso(r.tokenAcceso);
    expect(datos).toMatchObject({ sub: "u1", rol: "admin", empresaId: EMPRESA, sesionId: "s1" });
    // En la base se guarda el hash del token de sesión, no el token
    expect(vi.mocked(authModel.crearSesion).mock.calls[0][0].tokenHash).toBe(hashToken(r.tokenSesion));
    expect(auditado("auth.login_exitoso")).toBe(true);
  });
});

describe("authService.renovar", () => {
  it("sin token de sesión: 401", async () => {
    await expect(authService.renovar(undefined)).rejects.toMatchObject({ status: 401 });
  });

  it("sesión vigente: rota el token y emite un acceso nuevo", async () => {
    vi.mocked(authModel.buscarSesionVigente).mockResolvedValue({ id: "s1", usuario_id: "u1" } as never);
    vi.mocked(authModel.buscarPorId).mockResolvedValue(usuario());
    const r = await authService.renovar("token-viejo");
    expect(r.tokenSesion).not.toBe("token-viejo");
    expect(authModel.rotarSesion).toHaveBeenCalledWith("s1", hashToken(r.tokenSesion));
  });

  it("si el usuario fue desactivado, cierra la sesión", async () => {
    vi.mocked(authModel.buscarSesionVigente).mockResolvedValue({ id: "s1", usuario_id: "u1" } as never);
    vi.mocked(authModel.buscarPorId).mockResolvedValue(usuario({ activo: false }));
    await expect(authService.renovar("token")).rejects.toMatchObject({ status: 401 });
    expect(authModel.revocarSesion).toHaveBeenCalledWith("s1");
  });
});
