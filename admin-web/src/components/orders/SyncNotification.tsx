'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface Notification {
  isVisible: boolean;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  details?: string;
}

interface SyncNotificationProps extends Notification {
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function SyncNotification({
  isVisible,
  type,
  title,
  message,
  details,
  onClose,
  autoClose = true,
  duration = 5000
}: SyncNotificationProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClose = useCallback(() => {
    // iniciar animación de salida
    setIsAnimating(false);
    // esperando que termine la animación antes de avisar al padre
    const t = setTimeout(() => {
      onClose();
    }, 300);
    return () => clearTimeout(t);
  }, [onClose]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (isVisible) {
      // cuando se muestra, iniciar animación de entrada
      setIsAnimating(true);

      if (autoClose) {
        timer = setTimeout(() => {
          // usar handleClose como función (no su retorno)
          setIsAnimating(false);
          // darle tiempo a la animación para terminar y luego notificar al padre
          setTimeout(onClose, 300);
        }, duration);
      }
    } else {
      // si isVisible pasa a false, aseguramos quitar la animación
      setIsAnimating(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-600" />;
      default:
        return <InformationCircleIcon className="h-6 w-6 text-gray-600" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'warning':
        return 'text-yellow-800';
      case 'error':
        return 'text-red-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <div
        className={`
          ${getBgColor()} border rounded-lg shadow-lg p-4 transition-all duration-300
          ${isAnimating ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">{getIcon()}</div>

          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold ${getTextColor()} mb-1`}>{title}</h4>
            <p className={`text-sm ${getTextColor()} mb-2`}>{message}</p>
            {details && (
              <div className={`text-xs ${getTextColor()} bg-white bg-opacity-50 rounded p-2`}>
                {details}
              </div>
            )}
          </div>

          <button
            onClick={handleClose}
            className={`flex-shrink-0 ${getTextColor()} hover:opacity-75 transition-opacity`}
            aria-label="Cerrar notificación"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook para usar las notificaciones
export function useSyncNotification() {
  const [notification, setNotification] = useState<Notification>({
    isVisible: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showNotification = (
    type: Notification['type'],
    title: string,
    message: string
  ) => {
    setNotification({
      isVisible: true,
      type,
      title,
      message
    });
  };

  const hideNotification = () => {
    setNotification(prev => ({
      ...prev,
      isVisible: false
    }));
  };

  const showSuccess = (title: string, message: string) => {
    showNotification('success', title, message, );
  };

  const showError = (title: string, message: string) => {
    showNotification('error', title, message, );
  };

  const showWarning = (title: string, message: string) => {
    showNotification('warning', title, message, );
  };

  const showInfo = (title: string, message: string) => {
    showNotification('info', title, message );
  };

  return {
    notification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification
  };
}
