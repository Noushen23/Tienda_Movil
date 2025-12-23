'use client'

import { useState } from 'react'
import { UsersTable } from '@/components/users/UsersTable'
import { UserFilters } from '@/components/users/UserFilters'
import { Users } from 'lucide-react'

export default function UsersPage() {
  const [filters, setFilters] = useState({
    rol: 'all',
    emailVerificado: 'all',
    activo: 'all'
  })

  const handleFiltersChange = (newFilters: {
    rol: string
    emailVerificado: string
    activo: string
  }) => {
    setFilters(newFilters)
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Usuarios</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona los usuarios registrados en la plataforma
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <div className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white">
            <Users className="h-4 w-4 mr-2" />
            Gestión de Usuarios
          </div>
        </div>
      </div>

      {/* Filtros rápidos */}
      <UserFilters onFiltersChange={handleFiltersChange} />

      {/* Tabla de usuarios */}
      <UsersTable 
        key={`users-${filters.rol}-${filters.emailVerificado}-${filters.activo}`}
        filters={filters} 
      />
    </div>
  )
}

