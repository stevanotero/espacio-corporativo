import { describe, it, expect, vi, beforeEach } from "vitest";
import { empresasService } from "./empresas.service";
import { empresasModel } from "./empresas.model";
import { ErrorApp } from "../../lib/errores";

// Se simula el model: el test prueba solo las reglas del service, sin base de datos
vi.mock("./empresas.model", () => ({
  empresasModel: {
    listarActivas: vi.fn(),
    buscarPorId: vi.fn(),
    listarAreas: vi.fn(),
  },
}));

const fecha = new Date("2026-11-27T00:00:00Z");
const servired = { id: "11111111-1111-4111-8111-111111111111", codigo: "servired", nombre: "Servired", activa: true, created_at: fecha };

describe("empresasService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lista las empresas activas con el formato de shared", async () => {
    vi.mocked(empresasModel.listarActivas).mockResolvedValue([servired]);
    const empresas = await empresasService.listar();
    expect(empresas).toEqual([{ id: servired.id, codigo: "servired", nombre: "Servired", activa: true }]);
  });

  it("devuelve la empresa con sus áreas", async () => {
    vi.mocked(empresasModel.buscarPorId).mockResolvedValue(servired);
    vi.mocked(empresasModel.listarAreas).mockResolvedValue([
      { id: "a1", empresa_id: servired.id, nombre: "Sistemas", created_at: fecha },
    ]);
    const empresa = await empresasService.obtenerConAreas(servired.id);
    expect(empresa.areas).toEqual([{ id: "a1", empresaId: servired.id, nombre: "Sistemas" }]);
  });

  it("lanza 404 si la empresa no existe", async () => {
    vi.mocked(empresasModel.buscarPorId).mockResolvedValue(undefined);
    await expect(empresasService.obtenerConAreas(servired.id)).rejects.toMatchObject({ status: 404 });
  });

  it("lanza 404 si la empresa está inactiva", async () => {
    vi.mocked(empresasModel.buscarPorId).mockResolvedValue({ ...servired, activa: false });
    await expect(empresasService.obtenerConAreas(servired.id)).rejects.toBeInstanceOf(ErrorApp);
  });
});
