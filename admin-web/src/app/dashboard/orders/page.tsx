import React from 'react';
import Link from 'next/link';

import OrdersTable from '@/components/orders/OrdersTable';
import { Package, Kanban, Table } from 'lucide-react';

export const metadata = {
  title: 'Gestión de Pedidos',
  description: 'Administra todos los pedidos de los clientes',
};

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="h-8 w-8 mr-3 text-blue-600" />
            Gestión de Pedidos
          </h1>
          <p className="text-gray-600 mt-2">
            Visualiza y administra todos los pedidos de los clientes. Confirma pedidos pendientes y monitorea el estado de cada orden.
          </p>
        </div>
        
        {/* Botones de vista */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/orders/kanban"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Kanban className="h-5 w-5" />
            Vista Kanban
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
            <Table className="h-5 w-5" />
            Vista Tabla
          </div>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <OrdersTable />
    </div>
  );
}

