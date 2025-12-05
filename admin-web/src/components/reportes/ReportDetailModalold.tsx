/* COMENTADO - Módulo de reportes deshabilitado
'use client';

import { ReporteEntrega } from '@/lib/reports';
import { Dialog } from '@headlessui/react';
import { Fragment } from 'react';
import { XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReportDetailModalProps {
  abierto: boolean;
  onClose: () => void;
  reporte: ReporteEntrega | null | undefined;
}

export function ReportDetailModal({ abierto, onClose, reporte }: ReportDetailModalProps) {
  return (
    <Dialog as={Fragment} open={abierto} onClose={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/30 p-4 backdrop-blur-sm">
        <Dialog.Panel className="relative flex max-h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                Detalle del reporte
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500">
                {reporte
                  ? `${format(new Date(reporte.fecha_inicio), "dd MMM yyyy", { locale: es })} - ${format(new Date(reporte.fecha_fin), "dd MMM yyyy", { locale: es })}`
                  : 'Cargando información del reporte'}
              </Dialog.Description>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 text-sm text-gray-600">
            {reporte ? (
              <div className="space-y-4">
                <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <InfoRow label="Tipo" value={reporte.tipo_reporte} />
                  <InfoRow label="Repartidor" value={reporte.repartidor_nombre || 'Todos'} />
                  <InfoRow
                    label="Generado por"
                    value={reporte.generado_por_nombre || 'N/D'}
                  />
                  <InfoRow label="Zona" value={reporte.zona || '—'} />
                  <InfoRow
                    label="Total entregas"
                    value={reporte.total_entregas.toLocaleString()}
                  />
                  <InfoRow
                    label="Entregas exitosas"
                    value={reporte.entregas_exitosas.toLocaleString()}
                  />
                  <InfoRow
                    label="Entregas fallidas"
                    value={reporte.entregas_fallidas.toLocaleString()}
                  />
                  <InfoRow
                    label="Entregas canceladas"
                    value={reporte.entregas_canceladas.toLocaleString()}
                  />
                  <InfoRow
                    label="Distancia total"
                    value={
                      typeof reporte.distancia_total_km === 'number'
                        ? `${reporte.distancia_total_km.toFixed(2)} km`
                        : 'N/D'
                    }
                  />
                  <InfoRow
                    label="Tiempo promedio"
                    value={
                      typeof reporte.tiempo_promedio_minutos === 'number'
                        ? `${reporte.tiempo_promedio_minutos.toFixed(1)} min`
                        : 'N/D'
                    }
                  />
                </section>

                <section className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-800">Detalle de entregas</h3>
                  <p className="text-xs text-gray-500">
                    Muestra las entregas incluidas en el reporte. Puedes exportar desde el listado
                    principal para analizar más a fondo.
                  </p>
                  <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-white p-3 text-xs text-gray-600">
                    {JSON.stringify(reporte.datos_detallados || {}, null, 2)}
                  </pre>
                </section>
              </div>
            ) : (
              <p>Cargando detalle del reporte...</p>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span className="text-sm text-gray-700">{value}</span>
    </div>
  );
}
*/

export function ReportDetailModal() {
  return null;
}
