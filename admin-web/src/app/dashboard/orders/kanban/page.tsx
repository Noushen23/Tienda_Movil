import React from 'react';
import Link from 'next/link';
import OrdersKanban from '@/components/orders/OrdersKanban';
import { Package, Table } from 'lucide-react';

export const metadata = {
  title: 'Vista Kanban de Pedidos',
  description: 'Gestión visual de pedidos con drag & drop y sincronización',
};

export default function OrdersKanbanPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="h-8 w-8 mr-3 text-blue-600" />
            Vista Kanban de Pedidos
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión visual de pedidos con drag & drop. Los pedidos confirmados se sincronizan automáticamente con el sistema externo.
          </p>
        </div>
        
        {/* Botones de vista */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
            <Package className="h-5 w-5" />
            Vista Kanban
          </div>
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            <Table className="h-5 w-5" />
            Vista Tabla
          </Link>
        </div>
      </div>

      {/* Componente Kanban */}
      <OrdersKanban />
    </div>
  );
}
