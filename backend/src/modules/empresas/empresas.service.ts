import type { Empresa, Area, CodigoEmpresa } from "@espacio/shared";
import { ErrorApp } from "../../lib/errores";
import { empresasModel, type EmpresaFila, type AreaFila } from "./empresas.model";

// SERVICE: las reglas de negocio. Usa el model para leer/guardar datos
// y decide qué hacer con ellos (validar permisos, combinar datos, lanzar errores).
// No sabe nada de HTTP: no usa req ni res. Por eso es fácil de probar.

function aEmpresa(fila: EmpresaFila): Empresa {
  return { id: fila.id, codigo: fila.codigo as CodigoEmpresa, nombre: fila.nombre, activa: fila.activa };
}

function aArea(fila: AreaFila): Area {
  return { id: fila.id, empresaId: fila.empresa_id, nombre: fila.nombre };
}

export const empresasService = {
  async listar(): Promise<Empresa[]> {
    const filas = await empresasModel.listarActivas();
    return filas.map(aEmpresa);
  },

  async obtenerConAreas(id: string): Promise<Empresa & { areas: Area[] }> {
    const empresa = await empresasModel.buscarPorId(id);
    if (!empresa || !empresa.activa) {
      throw new ErrorApp(404, "Empresa no encontrada");
    }
    const areas = await empresasModel.listarAreas(id);
    return { ...aEmpresa(empresa), areas: areas.map(aArea) };
  },
};
