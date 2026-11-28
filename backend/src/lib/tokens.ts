import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Rol } from "@espacio/shared";
import { env } from "../config/env";

// Dos tokens distintos:
// - Token de ACCESO (JWT, dura pocos minutos): va en cada petición y dice quién es el usuario.
// - Token de SESIÓN (aleatorio, dura días): solo sirve para pedir un acceso nuevo.
//   En la base de datos se guarda su HASH, nunca el token real.

export interface DatosAcceso {
  sub: string; // id del usuario
  rol: Rol;
  empresaId: string; // empresa principal
  empresas: string[]; // empresas a las que tiene acceso
  sesionId: string;
}

export function firmarAcceso(datos: DatosAcceso): string {
  return jwt.sign(datos, env.JWT_SECRET, { expiresIn: `${env.ACCESO_MINUTOS}m`, algorithm: "HS256" });
}

export function verificarAcceso(token: string): DatosAcceso {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as DatosAcceso;
}

export function generarTokenSesion(): string {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
