'use client';

import { ChangeEvent } from 'react';
import { Filter, RefreshCcw } from 'lucide-react';
import { useRepartidoresDisponibles } from '@/hooks/useDelivery';

interface FiltrosPedidosAsignados {
  estado?: string;
  repartidor_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  orden_estado?: string;
}

interface FiltrosPedidosAsignadosProps {
  filtros: FiltrosPedidosAsignados;
  onActualizarFiltros: (filtrosActualizados: Partial<FiltrosPedidosAsignados>) => void;
  onReset: () => void;
  estaCargando?: boolean;
}

const estadosEntrega = [
  { valor: 'asignada', etiqueta: 'Asignada' },
  { valor: 'en_camino', etiqueta: 'En Camino' },
  { valor: 'llegada', etiqueta: 'Llegada' },
  { valor: 'entregada', etiqueta: 'Entregada' },
  { valor: 'cancelada', etiqueta: 'Cancelada' },
  { valor: 'fallida', etiqueta: 'Fallida' },
];

const estadosOrden = [
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'confirmada', etiqueta: 'Confirmada' },
  { valor: 'en_proceso', etiqueta: 'En Proceso' },
  { valor: 'enviada', etiqueta: 'Enviada' },
  { valor: 'entregada', etiqueta: 'Entregada' },
  { valor: 'cancelada', etiqueta: 'Cancelada' },
  { valor: 'reembolsada', etiqueta: 'Reembolsada' },
];

export function FiltrosPedidosAsignados({
  filtros,
  onActualizarFiltros,
  onReset,
  estaCargando,
}: FiltrosPedidosAsignadosProps) {
  const { data: repartidores = [] } = useRepartidoresDisponibles();

  const manejarCambio = (evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = evento.target;
    onActualizarFiltros({ [name]: value === '' ? undefined : value });
  };

  const limpiarFiltros = () => {
    onReset();
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-sm shadow-gray-100 sm:p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-gray-600">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <h2 className="text-base font-semibold">Filtros</h2>
          </div>
          {estaCargando && (
            <span className="text-xs font-medium text-purple-600">Actualizando…</span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="fecha_desde" className="text-sm font-medium text-gray-600">
              Fecha desde
            </label>
            <input
              id="fecha_desde"
              name="fecha_desde"
              type="date"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filtros.fecha_desde ?? ''}
              onChange={manejarCambio}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="fecha_hasta" className="text-sm font-medium text-gray-600">
              Fecha hasta
            </label>
            <input
              id="fecha_hasta"
              name="fecha_hasta"
              type="date"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filtros.fecha_hasta ?? ''}
              onChange={manejarCambio}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="estado" className="text-sm font-medium text-gray-600">
              Estado de Entrega
            </label>
            <select
              id="estado"
              name="estado"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filtros.estado ?? ''}
              onChange={manejarCambio}
            >
              <option value="">Todos</option>
              {estadosEntrega.map((estado) => (
                <option key={estado.valor} value={estado.valor}>
                  {estado.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="orden_estado" className="text-sm font-medium text-gray-600">
              Estado del Pedido
            </label>
            <select
              id="orden_estado"
              name="orden_estado"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filtros.orden_estado ?? ''}
              onChange={manejarCambio}
            >
              <option value="">Todos</option>
              {estadosOrden.map((estado) => (
                <option key={estado.valor} value={estado.valor}>
                  {estado.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="repartidor_id" className="text-sm font-medium text-gray-600">
              Repartidor
            </label>
            <select
              id="repartidor_id"
              name="repartidor_id"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              value={filtros.repartidor_id ?? ''}
              onChange={manejarCambio}
            >
              <option value="">Todos</option>
              {repartidores.map((repartidor) => (
                <option key={repartidor.id} value={repartidor.id}>
                  {repartidor.nombre_completo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={limpiarFiltros}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Reiniciar
          </button>
        </div>
      </div>
    </section>
  );
}

