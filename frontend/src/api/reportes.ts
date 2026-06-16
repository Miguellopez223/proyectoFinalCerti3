import { api } from './client';
import type {
  MovimientoInventario,
  ReporteAnalitico,
  ReporteCliente,
  ReporteProductos,
  ReporteVentas,
} from '@/types';

export interface RangoFechas {
  desde?: string; // yyyy-MM-dd
  hasta?: string; // yyyy-MM-dd
}

export const reportesApi = {
  analitico: (tiendaId: number, rango: RangoFechas = {}) =>
    api
      .get<ReporteAnalitico>(`/api/reportes/tienda/${tiendaId}/analitico`, { params: rango })
      .then((r) => r.data),

  ventas: (tiendaId: number, rango: RangoFechas = {}) =>
    api
      .get<ReporteVentas>(`/api/reportes/tienda/${tiendaId}/ventas`, { params: rango })
      .then((r) => r.data),

  productos: (tiendaId: number, rango: RangoFechas = {}, diasSinMovimiento = 30) =>
    api
      .get<ReporteProductos>(`/api/reportes/tienda/${tiendaId}/productos`, {
        params: { ...rango, diasSinMovimiento },
      })
      .then((r) => r.data),

  clientes: (tiendaId: number, rango: RangoFechas = {}) =>
    api
      .get<ReporteCliente[]>(`/api/reportes/tienda/${tiendaId}/clientes`, { params: rango })
      .then((r) => r.data),

  movimientos: (
    tiendaId: number,
    filtros: RangoFechas & { tipo?: string; usuarioId?: number } = {},
  ) =>
    api
      .get<MovimientoInventario[]>(`/api/reportes/tienda/${tiendaId}/movimientos`, {
        params: filtros,
      })
      .then((r) => r.data),
};
