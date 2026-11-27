// Roles de la plataforma:
// - admin: administra todo (las dos empresas)
// - gerencia: publica comunicados para su empresa o para ambas
// - jefe_area: publica comunicados para su área
// - empleado: lee comunicados, usa la bandeja y los canales
export const ROLES = ["admin", "gerencia", "jefe_area", "empleado"] as const;
export type Rol = (typeof ROLES)[number];

export const ROL_LABELS: Record<Rol, string> = {
  admin: "Administrador",
  gerencia: "Gerencia",
  jefe_area: "Jefe de área",
  empleado: "Empleado",
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
