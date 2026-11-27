import type { Request, Response } from "express";
import { empresasService } from "./empresas.service";
import type { EmpresaIdParams } from "./empresas.schema";

// CONTROLLER (la "C" del MVC): recibe la petición HTTP, llama al service
// y devuelve la respuesta en JSON. No tiene consultas SQL ni reglas de negocio.
// La "V" (vista) es la web en Next.js: muestra estos datos en pantalla.

export const empresasController = {
  // GET /api/empresas
  async listar(_req: Request, res: Response) {
    const data = await empresasService.listar();
    res.json({ ok: true, data });
  },

  // GET /api/empresas/:id
  async obtener(_req: Request, res: Response) {
    const { id } = res.locals.validado as EmpresaIdParams;
    const data = await empresasService.obtenerConAreas(id);
    res.json({ ok: true, data });
  },
};
