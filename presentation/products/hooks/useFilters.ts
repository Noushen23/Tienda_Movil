import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '@/core/api/searchApi';

/**
 * Hook para gestionar búsqueda y filtros
 */
export const useSearch = () => {
  const queryClient = useQueryClient();

  // Obtener rango de precios
  const getPriceRangeQuery = (categoriaId?: string) => {
    return useQuery({
      queryKey: ['priceRange', categoriaId],
      queryFn: () => searchApi.getPriceRange(categoriaId),
      staleTime: 1000 * 60 * 10, // 10 minutos
    });
  };

  // Guardar búsqueda
  const saveSearchMutation = useMutation({
    mutationFn: (params: { termino: string; filtros?: any; resultados?: number }) =>
      searchApi.saveSearch(params.termino, params.filtros, params.resultados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });

  // Obtener historial
  const { data: searchHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['searchHistory'],
    queryFn: () => searchApi.getSearchHistory(10),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Limpiar historial
  const clearHistoryMutation = useMutation({
    mutationFn: searchApi.clearSearchHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['searchHistory'] });
    },
  });

  return {
    getPriceRangeQuery,
    saveSearch: saveSearchMutation.mutate,
    searchHistory,
    historyLoading,
    clearHistory: clearHistoryMutation.mutate,
  };
};

/**
 * Hook para sugerencias de búsqueda
 */
export const useSearchSuggestions = (searchQuery: string) => {
  return useQuery({
    queryKey: ['searchSuggestions', searchQuery],
    queryFn: () => searchApi.getSearchSuggestions(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
};

