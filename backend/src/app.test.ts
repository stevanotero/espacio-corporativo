import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { crearApp } from "./app";
import { firmarAcceso } from "./lib/tokens";

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

  const cookieAcceso = () =>
    `ec_acceso=${firmarAcceso({ sub: "u1", rol: "empleado", empresaId: "e1", empresas: ["e1"], sesionId: "s1" })}`;

  it("GET /api/empresas sin sesión responde 401", async () => {
    const res = await request(app).get("/api/empresas");
    expect(res.status).toBe(401);
    expect(res.body.detalles.codigo).toBe("SIN_SESION");
  });

  it("GET /api/empresas con un token alterado responde 401 ACCESO_EXPIRADO", async () => {
    const res = await request(app).get("/api/empresas").set("Cookie", "ec_acceso=token.falso.alterado");
    expect(res.status).toBe(401);
    expect(res.body.detalles.codigo).toBe("ACCESO_EXPIRADO");
  });

  it("GET /api/empresas con sesión devuelve la lista", async () => {
    const res = await request(app).get("/api/empresas").set("Cookie", cookieAcceso());
    expect(res.status).toBe(200);
    expect(res.body.data[0].codigo).toBe("servired");
  });

  it("GET /api/empresas/:id con id inválido responde 400", async () => {
    const res = await request(app).get("/api/empresas/no-es-un-uuid").set("Cookie", cookieAcceso());
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Datos inválidos");
  });

  it("POST /api/auth/login sin datos responde 400", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("una ruta que no existe responde 404 en JSON", async () => {
    const res = await request(app).get("/api/no-existe");
    expect(res.status).toBe(404);
    expect(res.body.ok).toBe(false);
  });
});
