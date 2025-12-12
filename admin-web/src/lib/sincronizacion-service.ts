import { migrationApiClient } from './migration-api-client';

/**
 * Tipos de datos para sincronización
 */
export interface PedidoPendiente {
  id: string;
  numero_orden: string;
  estado: string;
  total: number;
  fecha_creacion: string;
  tns_sincronizado: 'pendiente' | 'sincronizado' | 'error';
  tns_fecha_sincronizacion?: string;
  tns_error_message?: string;
}

export interface PedidoError {
  id: string;
  numero_orden: string;
  estado: string;
  total: number;
  fecha_creacion: string;
  tns_sincronizado: 'error';
  tns_fecha_sincronizacion?: string;
  tns_error_message: string;
}

export interface UltimaSincronizacion {
  fecha: string;
  pedidos_sincronizados: number;
  pedidos_con_error: number;
  estado: 'exitoso' | 'error' | 'parcial';
}

export interface EstadoAPI {
  nombre: string;
  disponible: boolean;
  latencia?: number;
  ultima_verificacion: string;
  mensaje?: string;
}

export interface EstadisticasSincronizacion {
  total_pendientes: number;
  total_errores: number;
  total_sincronizados: number;
  ultima_sincronizacion?: UltimaSincronizacion;
  estado_apis: EstadoAPI[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Servicio para sincronización de pedidos
 */
export const SincronizacionService = {
  /**
   * Obtiene pedidos pendientes de sincronización
   */
  async getPedidosPendientes(limit: number = 10): Promise<PedidoPendiente[]> {
    try {
      const response = await migrationApiClient.get<ApiResponse<PedidoPendiente[]>>(
        `/orders/migration-status?estado=pendiente&limit=${limit}`
      );
      
      if (response.data.success && response.data.data) {
        return Array.isArray(response.data.data) ? response.data.data : [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ SincronizacionService: Error obteniendo pedidos pendientes:', error);
      throw error;
    }
  },

  /**
   * Obtiene pedidos con errores de sincronización
   */
  async getPedidosConErrores(limit: number = 10): Promise<PedidoError[]> {
    try {
      const response = await migrationApiClient.get<ApiResponse<PedidoError[]>>(
        `/orders/migration-status?estado=error&limit=${limit}`
      );
      
      if (response.data.success && response.data.data) {
        return Array.isArray(response.data.data) ? response.data.data : [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ SincronizacionService: Error obteniendo pedidos con errores:', error);
      throw error;
    }
  },

  /**
   * Obtiene la última sincronización exitosa
   */
  async getUltimaSincronizacionExitosa(): Promise<UltimaSincronizacion | null> {
    try {
      const response = await migrationApiClient.get<ApiResponse<UltimaSincronizacion>>(
        '/sincronizacion/ultima-exitosa'
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      return null;
    } catch (error) {
      console.error('❌ SincronizacionService: Error obteniendo última sincronización:', error);
      // No lanzar error, retornar null si no existe
      return null;
    }
  },

  /**
   * Verifica el estado de las APIs relacionadas
   */
  async verificarEstadoAPIs(): Promise<EstadoAPI[]> {
    try {
      const response = await migrationApiClient.get<ApiResponse<EstadoAPI[]>>(
        '/sincronizacion/estado-apis'
      );
      
      if (response.data.success && response.data.data) {
        return Array.isArray(response.data.data) ? response.data.data : [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ SincronizacionService: Error verificando estado de APIs:', error);
      // Retornar array vacío en caso de error
      return [];
    }
  },

  /**
   * Reintenta la sincronización de un pedido
   */
  async reintentarSincronizacion(pedidoId: string): Promise<boolean> {
    try {
      const response = await migrationApiClient.put<ApiResponse<{ success: boolean }>>(
        `/orders/${pedidoId}/retry-migration`
      );
      
      return response.data.success && response.data.data?.success === true;
    } catch (error) {
      console.error('❌ SincronizacionService: Error reintentando sincronización:', error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas generales de sincronización
   */
  async getEstadisticas(): Promise<EstadisticasSincronizacion> {
    try {
      const response = await migrationApiClient.get<ApiResponse<EstadisticasSincronizacion>>(
        '/sincronizacion/estadisticas'
      );
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      // Retornar estadísticas por defecto si no hay datos
      return {
        total_pendientes: 0,
        total_errores: 0,
        total_sincronizados: 0,
        estado_apis: [],
      };
    } catch (error) {
      console.error('❌ SincronizacionService: Error obteniendo estadísticas:', error);
      // Retornar estadísticas por defecto en caso de error
      return {
        total_pendientes: 0,
        total_errores: 0,
        total_sincronizados: 0,
        estado_apis: [],
      };
    }
  },
};




