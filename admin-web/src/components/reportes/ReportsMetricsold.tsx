/* COMENTADO - Módulo de reportes deshabilitado
'use client';

import { TrendingUp, CheckCircle, Route } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ReportsMetricsProps {
  resumen: {
    total_entregas: number;
    entregas_exitosas: number;
    entregas_fallidas: number;
    entregas_canceladas: number;
    distancia_total_km: number;
  };
  isLoading: boolean;
}

export function ReportsMetrics({ resumen, isLoading }: ReportsMetricsProps) {
  const exitoPorcentaje =
    resumen.total_entregas > 0
      ? (resumen.entregas_exitosas / resumen.total_entregas) * 100
      : 0;

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <MetricCard
        titulo="Total entregas"
        icono={<TrendingUp className="h-5 w-5 text-blue-600" />}
        valor={resumen.total_entregas.toLocaleString()}
        descripcion="Entregas registradas en reportes"
        loading={isLoading}
      />
      <MetricCard
        titulo="Entregas exitosas"
        icono={<CheckCircle className="h-5 w-5 text-emerald-600" />}
        valor={resumen.entregas_exitosas.toLocaleString()}
        descripcion={`${exitoPorcentaje.toFixed(1)}% de éxito`}
        loading={isLoading}
      />
      <MetricCard
        titulo="Distancia total"
        icono={<Route className="h-5 w-5 text-purple-600" />}
        valor={`${resumen.distancia_total_km.toFixed(1)} km`}
        descripcion="Distancia recorrida estimada"
        loading={isLoading}
      />
    </section>
  );
}

interface MetricCardProps {
  titulo: string;
  icono: React.ReactNode;
  valor: string | number;
  descripcion: string;
  loading?: boolean;
}

function MetricCard({ titulo, icono, valor, descripcion, loading }: MetricCardProps) {
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
          {icono}
        </span>
        {titulo}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {loading ? <Skeleton className="h-6 w-20" /> : valor}
      </div>
      <div className="text-xs text-gray-500">{loading ? <Skeleton className="h-3 w-[120px]" /> : descripcion}</div>
    </article>
  );
}
*/

export function ReportsMetrics() {
  return null;
}
