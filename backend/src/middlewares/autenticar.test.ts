import { describe, it, expect } from "vitest";
import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { autenticar, requiereRol } from "./autenticar";
import { manejarErrores } from "./errores";
import { firmarAcceso } from "../lib/tokens";

const app = express();
app.use(cookieParser());
app.get("/solo-admin", autenticar, requiereRol("admin"), (_req, res) => {
  res.json({ ok: true });
});
app.use(manejarErrores);

const cookie = (rol: "admin" | "empleado") =>
  `ec_acceso=${firmarAcceso({ sub: "u1", rol, empresaId: "e1", empresas: ["e1"], sesionId: "s1" })}`;

describe("requiereRol", () => {
  it("deja pasar al rol permitido", async () => {
    const res = await request(app).get("/solo-admin").set("Cookie", cookie("admin"));
    expect(res.status).toBe(200);
  });

  it("bloquea a otros roles con 403", async () => {
    const res = await request(app).get("/solo-admin").set("Cookie", cookie("empleado"));
    expect(res.status).toBe(403);
  });
});
