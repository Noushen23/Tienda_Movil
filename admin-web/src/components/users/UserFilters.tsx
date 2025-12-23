'use client'

import { useState } from 'react'
import { FilterIcon } from '@/components/icons'

interface UserFiltersProps {
  onFiltersChange: (filters: {
    rol: string
    emailVerificado: string
    activo: string
  }) => void
}

export function UserFilters({ onFiltersChange }: UserFiltersProps) {
  const [filters, setFilters] = useState({
    rol: 'all',
    emailVerificado: 'all',
    activo: 'all'
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center mb-4">
        <FilterIcon size={18} className="text-gray-500 mr-2" />
        <h3 className="text-sm font-medium text-gray-700">Filtros rápidos</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtro por Rol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rol
          </label>
          <select
            value={filters.rol}
            onChange={(e) => handleFilterChange('rol', e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="cliente">Clientes</option>
          </select>
        </div>

        {/* Filtro por Email Verificado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Verificado
          </label>
          <select
            value={filters.emailVerificado}
            onChange={(e) => handleFilterChange('emailVerificado', e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">Todos</option>
            <option value="true">Verificado</option>
            <option value="false">No Verificado</option>
          </select>
        </div>

        {/* Filtro por Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            value={filters.activo}
            onChange={(e) => handleFilterChange('activo', e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="all">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>
    </div>
  )
}

