'use client';

import { Entrega } from '@/lib/delivery';
import { Package, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface EntregaCardProps {
  entrega: Entrega;
  seleccionada: boolean;
  onSeleccionar: () => void;
}

const estadoConfig = {
  asignada: {
    icon: Package,
    color: 'bg-blue-100 text-blue-800',
    label: 'Asignada',
  },
  en_camino: {
    icon: MapPin,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'En Camino',
  },
  llegada: {
    icon: AlertCircle,
    color: 'bg-orange-100 text-orange-800',
    label: 'Llegada',
  },
  entregada: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
    label: 'Entregada',
  },
  cancelada: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    label: 'Cancelada',
  },
  fallida: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800',
    label: 'Fallida',
  },
};

export function EntregaCard({ entrega, seleccionada, onSeleccionar }: EntregaCardProps) {
  const config = estadoConfig[entrega.estado] || estadoConfig.asignada;
  const Icon = config.icon;

  return (
    <button
      onClick={onSeleccionar}
      className={clsx(
        'w-full text-left p-4 rounded-lg border-2 transition-all',
        seleccionada
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Pedido #{entrega.numero_orden}</span>
        </div>
        <span
          className={clsx(
            'px-2 py-1 rounded-full text-xs font-semibold',
            config.color
          )}
        >
          {config.label}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        {entrega.nombre_destinatario && (
          <p className="font-medium text-gray-900">{entrega.nombre_destinatario}</p>
        )}
        {entrega.direccion && (
          <p className="flex items-start gap-1">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{entrega.direccion}</span>
          </p>
        )}
        {entrega.ciudad && <p>{entrega.ciudad}</p>}
        {entrega.telefono && <p className="text-xs">{entrega.telefono}</p>}
      </div>

      {typeof entrega.distancia_km === 'number' && (
        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-4 text-xs text-gray-500">
          {entrega.distancia_km > 0 && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {entrega.distancia_km.toFixed(2)} km
            </span>
          )}
          {typeof entrega.tiempo_minutos === 'number' && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {entrega.tiempo_minutos} min
            </span>
          )}
        </div>
      )}
    </button>
  );
}


