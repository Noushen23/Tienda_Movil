import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/core/api/productsApi';
import { CACHE_TIMES } from '@/constants/App';

export const useProduct = (productId: string) => {
  const productQuery = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await productsApi.getProductById(productId);
      
      if (!response.success) {
        throw new Error(response.message || 'Error al cargar el producto');
      }
      
      return response.data;
    },
    staleTime: CACHE_TIMES.FIVE_MINUTES, // Reducido de 1 hora a 5 minutos
    refetchOnMount: 'always', // Siempre refetch al montar el componente
    enabled: !!productId && productId.length > 0,
  });

  return {
    productQuery,
  };
};
