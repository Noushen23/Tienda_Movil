/* COMENTADO - Módulo de reportes deshabilitado
'use client';

import { ReporteEntrega } from '@/lib/reports';
import { Info, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportsTableProps {
  reportes: ReporteEntrega[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  paginaActual: number;
  limiteActual: number;
  isLoading: boolean;
  onChangePagina: (page: number) => void;
  onChangeLimite: (limit: number) => void;
  onVerDetalle: (id: string) => void;
}

const limites = [10, 20, 50];

export function ReportsTable({
  reportes,
  pagination,
  paginaActual,
  limiteActual,
  isLoading,
  onChangePagina,
  onChangeLimite,
  onVerDetalle,
}: ReportsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-800">Historial de reportes generados</h2>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          <span>
            {pagination ? `${pagination.total} resultados` : `${reportes.length} resultados`}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Rango fechas</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Repartidor</th>
              <th className="px-4 py-3 text-left">Métricas</th>
              <th className="px-4 py-3 text-left">Generado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white text-sm text-gray-700">
            {reportes.map((reporte) => (
              <tr key={reporte.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex flex-col text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">
                      {format(new Date(reporte.fecha_inicio), "dd MMM yyyy", { locale: es })} -{' '}
                      {format(new Date(reporte.fecha_fin), "dd MMM yyyy", { locale: es })}
                    </span>
                    <span className="text-gray-500">
                      {reporte.zona ? `Zona: ${reporte.zona}` : 'Zona no definida'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs capitalize text-gray-600">{reporte.tipo_reporte}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {reporte.repartidor_nombre || 'Todos'}
                </td>
                <td className="px-4 py-3">
                  <div className="text-xs text-gray-500">
                    <p>
                      Total:{' '}
                      <span className="font-semibold text-gray-800">
                        {reporte.total_entregas.toLocaleString()}
                      </span>
                    </p>
                    <p>
                      Exitosas:{' '}
                      <span className="font-semibold text-emerald-600">
                        {reporte.entregas_exitosas.toLocaleString()}
                      </span>
                    </p>
                    <p>
                      Fallidas:{' '}
                      <span className="font-semibold text-red-600">
                        {reporte.entregas_fallidas.toLocaleString()}
                      </span>
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {format(new Date(reporte.fecha_generacion), "dd MMM yyyy HH:mm", { locale: es })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onVerDetalle(reporte.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                  >
                    <Info className="h-4 w-4" />
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
            {!reportes.length && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-500">
                  No se encontraron reportes con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span>Página {paginaActual} de {pagination.pages}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <span>Filas por página:</span>
              <select
                value={limiteActual}
                onChange={(event) => onChangeLimite(Number(event.target.value))}
                className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-semibold focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                {limites.map((limite) => (
                  <option key={limite} value={limite}>
                    {limite}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onChangePagina(Math.max(1, paginaActual - 1))}
                disabled={paginaActual === 1}
                className="rounded border border-gray-300 bg-white px-2 py-1 font-semibold text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => onChangePagina(Math.min(pagination.pages, paginaActual + 1))}
                disabled={paginaActual >= pagination.pages}
                className="rounded border border-gray-300 bg-white px-2 py-1 font-semibold text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
*/

export function ReportsTable() {
  return null;
}
