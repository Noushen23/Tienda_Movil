'use client';

import Link from 'next/link';
import {
  PlusCircleIcon,
  ShoppingBagIcon,
  FolderPlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const actions = [
  {
    title: 'Crear Producto',
    description: 'Agregar nuevo producto al catálogo',
    href: '/dashboard/products/create',
    icon: PlusCircleIcon,
    color: 'bg-blue-500 hover:bg-blue-600',
  },
  {
    title: 'Ver Pedidos',
    description: 'Gestionar pedidos de clientes',
    href: '/dashboard/orders',
    icon: ShoppingBagIcon,
    color: 'bg-green-500 hover:bg-green-600',
  },
  {
    title: 'Crear Categoría',
    description: 'Agregar nueva categoría',
    href: '/dashboard/categories/create',
    icon: FolderPlusIcon,
    color: 'bg-purple-500 hover:bg-purple-600',
  },
  {
    title: 'Ver Kardex',
    description: 'Revisar movimientos de inventario',
    href: '/dashboard/kardex',
    icon: ChartBarIcon,
    color: 'bg-orange-500 hover:bg-orange-600',
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group relative overflow-hidden rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start gap-3">
              <div className={`${action.color} p-2 rounded-lg text-white transition-colors`}>
                <action.icon className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

