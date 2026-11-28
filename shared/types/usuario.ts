// Roles de la plataforma:
// - admin: administra todo (las dos empresas)
// - gerencia: publica comunicados para su empresa o para ambas
// - jefe_area: publica comunicados para su área
// - empleado: lee comunicados, usa la bandeja y los canales
// - punto: cuenta de un punto de venta (fase 2: atención a puntos)
export const ROLES = ["admin", "gerencia", "jefe_area", "empleado", "punto"] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_LABELS: Record<Rol, string> = {
  admin: "Administrador",
  gerencia: "Gerencia",
  jefe_area: "Jefe de área",
  empleado: "Empleado",
  punto: "Punto de venta",
};

export interface Usuario {
  id: string;
  documento: string;
  nombre: string;
  email: string;
  rol: Rol;
  empresaId: string;
  areaId: string | null;
  activo: boolean;
}

// Lo que la web recibe del usuario que inició sesión (GET /api/auth/yo y POST /api/auth/login)
export interface SesionUsuario {
  id: string;
  documento: string;
  nombre: string;
  rol: Rol;
  cargo: string | null;
  empresa: { id: string; nombre: string };
  area: { id: string; nombre: string } | null;
  // Empresas a las que tiene acceso (una o las dos)
  empresas: { id: string; nombre: string }[];
}
