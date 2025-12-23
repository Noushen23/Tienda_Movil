/* COMENTADO - Módulo de reportes deshabilitado
'use client';

import { useMemo, useState } from 'react';
import { useReportes, useGenerarReporte, useReporte } from '@/hooks/useReports';
import { TipoReporte } from '@/lib/reports';
import { ReportsFilters } from '@/components/reportes/ReportsFilters';
import { ReportsMetrics } from '@/components/reportes/ReportsMetrics';
import { ReportsTable } from '@/components/reportes/ReportsTable';
import { ReportDetailModal } from '@/components/reportes/ReportDetailModal';
import { Download, PlusCircle } from 'lucide-react';

export default function ReportesPage() {
  const [tipo, setTipo] = useState<TipoReporte | undefined>();
  const [repartidorId, setRepartidorId] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [modalReporteId, setModalReporteId] = useState<string | null>(null);

  const { data: reportesResponse, isLoading, isFetching, refetch } = useReportes({
    page,
    limit,
    tipo,
    repartidor_id: repartidorId,
  });

  const { mutateAsync: generarReporte, isPending: generandoReporte } = useGenerarReporte();

  const { data: reporteDetalle } = useReporte(modalReporteId);

  const resumen = useMemo(() => {
    const data = reportesResponse?.data ?? [];
    if (!data.length) {
      return {
        total_entregas: 0,
        entregas_exitosas: 0,
        entregas_fallidas: 0,
        entregas_canceladas: 0,
        distancia_total_km: 0,
      };
    }

    return data.reduce(
      (acc, item) => ({
        total_entregas: acc.total_entregas + (item.total_entregas ?? 0),
        entregas_exitosas: acc.entregas_exitosas + (item.entregas_exitosas ?? 0),
        entregas_fallidas: acc.entregas_fallidas + (item.entregas_fallidas ?? 0),
        entregas_canceladas: acc.entregas_canceladas + (item.entregas_canceladas ?? 0),
        distancia_total_km: acc.distancia_total_km + (item.distancia_total_km ?? 0),
      }),
      {
        total_entregas: 0,
        entregas_exitosas: 0,
        entregas_fallidas: 0,
        entregas_canceladas: 0,
        distancia_total_km: 0,
      }
    );
  }, [reportesResponse]);

  const manejarGenerarReporte = async (payload: {
    tipo_reporte: TipoReporte;
    fecha_inicio: string;
    fecha_fin: string;
    repartidor_id?: string;
    ruta_id?: string;
    zona?: string;
  }) => {
    await generarReporte(payload);
    refetch();
  };

  const manejarExportJson = () => {
    const data = reportesResponse?.data ?? [];
    if (!data.length) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reportes-entregas-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de entregas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Genera reportes personalizados de métricas de entregas por rango de fechas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => manejarExportJson()}
            disabled={!reportesResponse?.data?.length}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </button>
          <ReportsFilters
            tipoSeleccionado={tipo}
            repartidorSeleccionado={repartidorId}
            onChangeTipo={(value) => {
              setTipo(value);
              setPage(1);
            }}
            onChangeRepartidor={(value) => {
              setRepartidorId(value);
              setPage(1);
            }}
            onGenerarReporte={manejarGenerarReporte}
            generando={generandoReporte}
          />
        </div>
      </header>

      <ReportsMetrics resumen={resumen} isLoading={isLoading && !reportesResponse} />

      <ReportsTable
        reportes={reportesResponse?.data ?? []}
        pagination={reportesResponse?.pagination}
        isLoading={isLoading || isFetching}
        paginaActual={page}
        onChangePagina={setPage}
        limiteActual={limit}
        onChangeLimite={(nuevo) => {
          setLimit(nuevo);
          setPage(1);
        }}
        onVerDetalle={setModalReporteId}
      />

      <ReportDetailModal
        abierto={!!modalReporteId}
        onClose={() => setModalReporteId(null)}
        reporte={reporteDetalle}
      />

      {(isFetching || generandoReporte) && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <PlusCircle className="h-4 w-4 animate-spin" />
          Actualizando información de reportes...
        </div>
      )}
    </div>
  );
}
*/

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-gray-500">Módulo de reportes temporalmente deshabilitado</p>
      </div>
    </div>
  );
}
