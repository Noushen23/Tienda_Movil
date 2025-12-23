import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SincronizacionService } from '@/lib/sincronizacion-service';
import toast from 'react-hot-toast';

/**
 * Hook para obtener pedidos pendientes
 */
export function usePedidosPendientes(limit: number = 10) {
  return useQuery({
    queryKey: ['sincronizacion', 'pedidos-pendientes', limit],
    queryFn: () => SincronizacionService.getPedidosPendientes(limit),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refrescar cada minuto
  });
}

/**
 * Hook para obtener pedidos con errores
 */
export function usePedidosConErrores(limit: number = 10) {
  return useQuery({
    queryKey: ['sincronizacion', 'pedidos-errores', limit],
    queryFn: () => SincronizacionService.getPedidosConErrores(limit),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refrescar cada minuto
  });
}

/**
 * Hook para obtener la última sincronización exitosa
 */
export function useUltimaSincronizacion() {
  return useQuery({
    queryKey: ['sincronizacion', 'ultima-sincronizacion'],
    queryFn: () => SincronizacionService.getUltimaSincronizacionExitosa(),
    staleTime: 60 * 1000, // 1 minuto
    refetchInterval: 5 * 60 * 1000, // Refrescar cada 5 minutos
  });
}

/**
 * Hook para verificar el estado de las APIs
 */
export function useEstadoAPIs() {
  return useQuery({
    queryKey: ['sincronizacion', 'estado-apis'],
    queryFn: () => SincronizacionService.verificarEstadoAPIs(),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 2 * 60 * 1000, // Refrescar cada 2 minutos
  });
}

/**
 * Hook para reintentar sincronización
 */
export function useReintentarSincronizacion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pedidoId: string) => SincronizacionService.reintentarSincronizacion(pedidoId),
    onSuccess: (success) => {
      if (success) {
        toast.success('✅ Sincronización reintentada exitosamente', {
          duration: 3000,
        });
        
        // Invalidar queries relacionadas
        queryClient.invalidateQueries({ queryKey: ['sincronizacion'] });
        queryClient.invalidateQueries({ queryKey: ['migration'] });
      } else {
        toast.error('❌ Error al reintentar sincronización', {
          duration: 4000,
        });
      }
    },
    onError: (error: Error) => {
      toast.error(`❌ Error: ${error.message}`, {
        duration: 4000,
      });
    },
  });
}

/**
 * Hook para obtener todas las estadísticas de sincronización
 */
export function useEstadisticasSincronizacion() {
  return useQuery({
    queryKey: ['sincronizacion', 'estadisticas'],
    queryFn: () => SincronizacionService.getEstadisticas(),
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refrescar cada minuto
  });
}

