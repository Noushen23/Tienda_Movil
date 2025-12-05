import { useOptimizedQuery } from './useApi'
import { AdminProductsService } from '@/lib/admin-products'

interface CheckProductExistsParams {
  sku?: string
  CodVinculacion?: string
}

interface CheckProductExistsResult {
  success: boolean
  exists: boolean
  product?: {
    id: string
    nombre: string
    sku: string | null
    CodVinculacion: string | null
  }
  searchField?: string
  searchValue?: string
}

export function useCheckProductExists(params: CheckProductExistsParams) {
  return useOptimizedQuery(
    ['check-product-exists', params.sku, params.CodVinculacion],
    async (): Promise<CheckProductExistsResult> => {
      if (!params.sku && !params.CodVinculacion) {
        return {
          success: true,
          exists: false
        }
      }
      
      return await AdminProductsService.checkProductExists(params.sku, params.CodVinculacion)
    },
    {
      enabled: !!(params.sku || params.CodVinculacion),
      staleTime: 5 * 1000, // 5 segundos - más frecuente para detectar cambios
      gcTime: 30 * 1000, // 30 segundos
      refetchOnWindowFocus: true, // Refetch cuando se enfoca la ventana
    }
  )
}

