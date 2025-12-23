import { apiClient } from './apiClient';

/**
 * Interfaces para búsqueda y filtros
 */
// Eliminado soporte de marcas

export interface PriceRange {
  min: number;
  max: number;
  avg: number;
}

export interface SearchHistoryItem {
  termino: string;
  filtros: any;
  resultados: number;
  fecha: string;
}

export interface SearchSuggestion {
  tipo: 'producto' | 'categoria';
  texto: string;
}

/**
 * API de búsqueda y filtros
 */
export const searchApi = {
  /**
   * Obtener rango de precios
   */
  getPriceRange: async (categoriaId?: string): Promise<PriceRange> => {
    const params: any = {};
    if (categoriaId) params.categoriaId = categoriaId;

    const response = await apiClient.get('/search/price-range', { params });
    return response.data;
  },

  /**
   * Guardar búsqueda en historial
   */
  saveSearch: async (termino: string, filtros?: any, resultados?: number) => {
    const response = await apiClient.post('/search/history', {
      termino,
      filtros,
      resultados,
    });
    return response;
  },

  /**
   * Obtener historial de búsquedas
   */
  getSearchHistory: async (limit: number = 10): Promise<SearchHistoryItem[]> => {
    const response = await apiClient.get('/search/history', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Limpiar historial de búsquedas
   */
  clearSearchHistory: async () => {
    const response = await apiClient.delete('/search/history');
    return response;
  },

  /**
   * Obtener sugerencias de búsqueda
   */
  getSearchSuggestions: async (query: string): Promise<SearchSuggestion[]> => {
    if (!query || query.length < 2) return [];
    
    const response = await apiClient.get('/search/suggestions', {
      params: { q: query },
    });
    return response.data;
  },
};

