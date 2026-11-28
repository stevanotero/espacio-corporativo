import type { Response, CookieOptions } from "express";
import { env } from "../config/env";

// Nombres de las cookies de sesión
export const COOKIE_ACCESO = "ec_acceso";
export const COOKIE_SESION = "ec_sesion";

// httpOnly: el JavaScript de la página no puede leerlas (protege contra robo por XSS).
// sameSite "strict": el navegador no las envía desde otros sitios (protege contra CSRF).
const base: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: env.COOKIE_SECURE,
  path: "/",
};

export function guardarCookiesSesion(res: Response, tokenAcceso: string, tokenSesion: string) {
  res.cookie(COOKIE_ACCESO, tokenAcceso, { ...base, maxAge: env.ACCESO_MINUTOS * 60 * 1000 });
  // La web (Next.js) también la ve, para saber si mandar al usuario al login
  res.cookie(COOKIE_SESION, tokenSesion, { ...base, maxAge: env.SESION_DIAS * 24 * 60 * 60 * 1000 });
}

export function borrarCookiesSesion(res: Response) {
  res.clearCookie(COOKIE_ACCESO, { ...base });
  res.clearCookie(COOKIE_SESION, { ...base });
}
