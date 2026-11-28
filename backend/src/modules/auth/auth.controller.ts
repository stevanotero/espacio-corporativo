import type { Request, Response } from "express";
import { COOKIE_SESION, guardarCookiesSesion, borrarCookiesSesion } from "../../lib/cookies";
import { origenPeticion } from "../../lib/peticion";
import { usuarioActual } from "../../middlewares/autenticar";
import { authService } from "./auth.service";
import type { LoginDatos } from "./auth.schema";

// CONTROLLER de autenticación: maneja las cookies y responde JSON.
// Los tokens NUNCA van en el cuerpo de la respuesta: solo en cookies httpOnly.

export const authController = {
  // POST /api/auth/login
  async login(req: Request, res: Response) {
    const { documento, contrasena } = res.locals.validado as LoginDatos;
    const resultado = await authService.login(documento, contrasena, origenPeticion(req));
    guardarCookiesSesion(res, resultado.tokenAcceso, resultado.tokenSesion);
    res.json({ ok: true, data: resultado.usuario });
  },

  // POST /api/auth/renovar
  async renovar(req: Request, res: Response) {
    try {
      const resultado = await authService.renovar(req.cookies?.[COOKIE_SESION]);
      guardarCookiesSesion(res, resultado.tokenAcceso, resultado.tokenSesion);
      res.json({ ok: true, data: resultado.usuario });
    } catch (error) {
      borrarCookiesSesion(res);
      throw error;
    }
  },

  // POST /api/auth/logout
  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies?.[COOKIE_SESION], origenPeticion(req));
    borrarCookiesSesion(res);
    res.json({ ok: true, data: null });
  },

  // GET /api/auth/yo
  async yo(_req: Request, res: Response) {
    const data = await authService.perfil(usuarioActual(res).id);
    res.json({ ok: true, data });
  },
};
