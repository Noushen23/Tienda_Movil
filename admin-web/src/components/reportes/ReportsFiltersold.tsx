/* COMENTADO - Módulo de reportes deshabilitado
'use client';

import { useMemo, useState } from 'react';
import { GenerarReportePayload, TipoReporte } from '@/lib/reports';
import { CalendarRange, Filter, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';

interface ReportsFiltersProps {
  tipoSeleccionado?: TipoReporte;
  repartidorSeleccionado?: string;
  onChangeTipo: (tipo: TipoReporte | undefined) => void;
  onChangeRepartidor: (repartidorId: string | undefined) => void;
  onGenerarReporte: (payload: GenerarReportePayload) => Promise<void> | void;
  generando: boolean;
}

const tiposReporte: Array<{ label: string; value: TipoReporte }> = [
  { label: 'Diario', value: 'diario' },
  { label: 'Semanal', value: 'semanal' },
  { label: 'Mensual', value: 'mensual' },
  { label: 'Personalizado', value: 'personalizado' },
];

type FormValues = {
  tipo_reporte: TipoReporte;
  fecha_inicio: string;
  fecha_fin: string;
  repartidor_id?: string;
  ruta_id?: string;
  zona?: string;
};

export function ReportsFilters({
  tipoSeleccionado,
  repartidorSeleccionado,
  onChangeTipo,
  onChangeRepartidor,
  onGenerarReporte,
  generando,
}: ReportsFiltersProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const { register, handleSubmit, watch, reset } = useForm<FormValues>({
    defaultValues: {
      tipo_reporte: 'diario',
      fecha_inicio: new Date().toISOString().slice(0, 10),
      fecha_fin: new Date().toISOString().slice(0, 10),
    },
  });

  const tipoReporte = watch('tipo_reporte');

  const puedeGenerar = useMemo(() => {
    const valores = watch();
    return Boolean(valores.tipo_reporte && valores.fecha_inicio && valores.fecha_fin);
  }, [watch]);

  const onSubmit = handleSubmit((data) => {
    const payload: GenerarReportePayload = {
      tipo_reporte: data.tipo_reporte,
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
    };

    if (data.repartidor_id) {
      payload.repartidor_id = data.repartidor_id;
    }
    if (data.ruta_id) {
      payload.ruta_id = data.ruta_id;
    }
    if (data.zona) {
      payload.zona = data.zona;
    }

    onGenerarReporte(payload);
    reset({
      ...data,
      repartidor_id: '',
      ruta_id: '',
      zona: '',
    });
    setMostrarFormulario(false);
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <Filter className="h-4 w-4 text-gray-400" />
        Filtrar reportes
      </div>
      <div className="flex flex-wrap gap-2">
        <FiltroPill
          label="Todos"
          active={!tipoSeleccionado}
          onClick={() => onChangeTipo(undefined)}
        />
        {tiposReporte.map((tipo) => (
          <FiltroPill
            key={tipo.value}
            label={tipo.label}
            active={tipoSeleccionado === tipo.value}
            onClick={() => onChangeTipo(tipo.value)}
          />
        ))}
        <input
          type="text"
          placeholder="Filtrar por repartidor (ID opcional)"
          defaultValue={repartidorSeleccionado ?? ''}
          onBlur={(event) => onChangeRepartidor(event.target.value || undefined)}
          className="min-w-[220px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          onClick={() => setMostrarFormulario((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition"
        >
          <Plus className="h-4 w-4" />
          {mostrarFormulario ? 'Cancelar' : 'Nuevo reporte'}
        </button>
      </div>

      {mostrarFormulario && (
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <div>
            <label className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Tipo de reporte
            </label>
            <select
              {...register('tipo_reporte')}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {tiposReporte.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Fecha inicio
            </label>
            <div className="relative">
              <input
                type="date"
                {...register('fecha_inicio')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <CalendarRange className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Fecha fin
            </label>
            <div className="relative">
              <input
                type="date"
                {...register('fecha_fin')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <CalendarRange className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Repartidor (opcional)
            </label>
            <input
              type="text"
              {...register('repartidor_id')}
              placeholder="ID de repartidor"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Ruta (opcional)
            </label>
            <input
              type="text"
              {...register('ruta_id')}
              placeholder="ID de ruta"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Zona (opcional)
            </label>
            <input
              type="text"
              {...register('zona')}
              placeholder="Zona logística"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3 flex items-center justify-end gap-2 pt-2">
            <span className="text-xs text-gray-500">
              {tipoReporte === 'personalizado'
                ? 'Define un rango de fechas específico.'
                : 'Se generará con el período sugerido según el tipo seleccionado.'}
            </span>
            <button
              type="submit"
              disabled={!puedeGenerar || generando}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generando ? 'Generando...' : 'Generar reporte'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

interface FiltroPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function FiltroPill({ label, active, onClick }: FiltroPillProps) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded-full px-3 py-1.5 text-xs font-semibold transition',
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
      )}
    >
      {label}
    </button>
  );
}
*/

export function ReportsFilters() {
  return null;
}
