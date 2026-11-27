// Las dos empresas que comparten la plataforma.
// Cada registro (usuario, comunicado, canal) lleva su empresa_id
// para separar la información de Servired y Multired en una sola base de datos.
export const CODIGOS_EMPRESA = ["servired", "multired"] as const;
export type CodigoEmpresa = (typeof CODIGOS_EMPRESA)[number];

export interface Empresa {
  id: string;
  codigo: CodigoEmpresa;
  nombre: string;
  activa: boolean;
}

export interface Area {
  id: string;
  empresaId: string;
  nombre: string;
}
