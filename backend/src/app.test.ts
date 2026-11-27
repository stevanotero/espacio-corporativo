import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { crearApp } from "./app";

vi.mock("./modules/empresas/empresas.service", () => ({
  empresasService: {
    listar: vi.fn().mockResolvedValue([{ id: "e1", codigo: "servired", nombre: "Servired", activa: true }]),
    obtenerConAreas: vi.fn(),
  },
}));

const app = crearApp();

describe("app", () => {
  it("GET /api/salud responde ok", async () => {
    const res = await request(app).get("/api/salud");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("GET /api/empresas devuelve la lista", async () => {
    const res = await request(app).get("/api/empresas");
    expect(res.status).toBe(200);
    expect(res.body.data[0].codigo).toBe("servired");
  });

  it("GET /api/empresas/:id con id inválido responde 400", async () => {
    const res = await request(app).get("/api/empresas/no-es-un-uuid");
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Datos inválidos");
  });

  it("una ruta que no existe responde 404 en JSON", async () => {
    const res = await request(app).get("/api/no-existe");
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});
