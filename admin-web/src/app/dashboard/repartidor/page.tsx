'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEntregas, useDeliveryMutations } from '@/hooks/useDelivery';
import { Entrega } from '@/lib/delivery';
import { MapContainer } from '@/components/repartidor/MapContainer';
import { EntregaCard } from '@/components/repartidor/EntregaCard';
import { DeliveryActions } from '@/components/repartidor/DeliveryActions';
import { Package, Navigation } from 'lucide-react';

export default function RepartidorPage() {
  const [entregaSeleccionada, setEntregaSeleccionada] = useState<Entrega | null>(null);
  const { data: entregas = [], isLoading: cargandoEntregas } = useEntregas();
  const {
    iniciarEntrega,
    registrarLlegada,
    completarEntrega,
    cancelarEntrega,
    estaIniciando,
    estaRegistrandoLlegada,
    estaCompletando,
    estaCancelando,
  } = useDeliveryMutations();

  useEffect(() => {
    if (!entregaSeleccionada && entregas.length > 0) {
      const primeraPendiente = entregas.find(
        (e) => e.estado === 'asignada' || e.estado === 'en_camino'
      );
      setEntregaSeleccionada(primeraPendiente ?? entregas[0] ?? null);
    }
  }, [entregas, entregaSeleccionada]);

  const entregasPendientes = entregas.filter(
    (e) => e.estado === 'asignada' || e.estado === 'en_camino' || e.estado === 'llegada'
  );

  const manejarCancelarEntrega = useCallback(
    (id: string, motivo: string, motivoDetalle?: string) => {
      if (confirm('¿Estás seguro de cancelar esta entrega? El pedido será reasignado automáticamente.')) {
        const payload: { id: string; motivo: string; motivoDetalle?: string } = { id, motivo };
        if (motivoDetalle) {
          payload.motivoDetalle = motivoDetalle;
        }
        cancelarEntrega(payload);
      }
    },
    [cancelarEntrega]
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Panel de Repartidor</h1>
          </div>
          <div className="flex items-center gap-4">
            {entregasPendientes.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                <Package className="h-4 w-4" />
                <span>{entregasPendientes.length} pendientes</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
        <aside className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Entregas
            </h2>
            {cargandoEntregas ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : entregas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No hay entregas asignadas</p>
              </div>
            ) : (
              entregas.map((entrega) => (
                <EntregaCard
                  key={entrega.id}
                  entrega={entrega}
                  seleccionada={entregaSeleccionada?.id === entrega.id}
                  onSeleccionar={() => setEntregaSeleccionada(entrega)}
                />
              ))
            )}
          </div>
        </aside>

        <main className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <MapContainer
              entregaSeleccionada={entregaSeleccionada}
              entregas={entregasPendientes}
            />
          </div>

          {entregaSeleccionada && (
            <DeliveryActions
              entrega={entregaSeleccionada}
              onIniciar={() => iniciarEntrega(entregaSeleccionada.id)}
              onRegistrarLlegada={(lat, lng) =>
                registrarLlegada({ id: entregaSeleccionada.id, latitud: lat, longitud: lng })
              }
              onCompletar={(datos) =>
                completarEntrega({ id: entregaSeleccionada.id, datos })
              }
              onCancelar={(motivo, detalle) =>
                manejarCancelarEntrega(entregaSeleccionada.id, motivo, detalle)
              }
              estaIniciando={estaIniciando}
              estaRegistrandoLlegada={estaRegistrandoLlegada}
              estaCompletando={estaCompletando}
              estaCancelando={estaCancelando}
            />
          )}
        </main>
      </div>
    </div>
  );
}
