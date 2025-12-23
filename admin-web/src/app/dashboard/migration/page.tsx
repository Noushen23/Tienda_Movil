'use client';

import { useState } from 'react';
import { useMigrationStatusPage } from '@/hooks/useOrderMigration';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function MigrationStatusPage() {
  const [filters, setFilters] = useState({
    estado: undefined as 'pendiente' | 'sincronizado' | 'error' | undefined,
    limit: 20,
    page: 1,
  });

  const { data: migrationData, isLoading, error } = useMigrationStatusPage(filters);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const getStatusInfo = (status?: string) => {
    switch (status) {
      case 'sincronizado':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Migrado',
        };
      case 'error':
        return {
          icon: ExclamationTriangleIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Error',
        };
      case 'pendiente':
      default:
        return {
          icon: ClockIcon,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          label: 'Pendiente',
        };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar el estado de migración</p>
      </div>
    );
  }

  const migrationStatus = migrationData?.data;
  if (!migrationStatus) return null;

  const { data: orders, pagination } = migrationStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estado de Migración TNS</h1>
          <p className="text-gray-600 mt-1">
            Monitoreo de migración de órdenes al sistema TNS
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado de Migración
            </label>
            <select
              value={filters.estado || ''}
              onChange={(e) => handleFilterChange({ 
                estado: e.target.value as 'pendiente' | 'sincronizado' | 'error' | undefined 
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="sincronizado">Migrado</option>
              <option value="error">Error</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Por página
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange({ limit: parseInt(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <ClockIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Órdenes</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Migradas</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(order => order.tns_sincronizado === 'sincronizado').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Con Errores</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.filter(order => order.tns_sincronizado === 'error').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de órdenes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Órdenes</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orden
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Migración TNS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.tns_sincronizado);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.numero_orden}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {order.id.slice(0, 8)}...
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        order.estado === 'confirmada' ? 'bg-blue-100 text-blue-800' :
                        order.estado === 'en_proceso' ? 'bg-purple-100 text-purple-800' :
                        order.estado === 'entregada' ? 'bg-green-100 text-green-800' :
                        order.estado === 'cancelada' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.estado}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      {order.tns_kardex_id && (
                        <div className="text-xs text-gray-500 mt-1">
                          KARDEX: {order.tns_kardex_id}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${order.total.toLocaleString('es-CO')}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.fecha_creacion), "dd/MM/yyyy HH:mm", { locale: es })}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                        Ver Detalles
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} resultados
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange({ page: pagination.page - 1 })}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handleFilterChange({ page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
