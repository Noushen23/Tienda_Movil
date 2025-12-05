import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { apiClient } from '@/core/api/apiClient';

// Configurar el comportamiento de las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // Reproducir sonido
    shouldSetBadge: false, // Dejar que el servidor controle el badge
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  type: string;
  orderId?: string;
  orderNumber?: string;
  newStatus?: string;
  customerName?: string;
  timestamp: string;
}

export interface PushNotificationState {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    expoPushToken: null,
    notification: null,
    isRegistered: false,
    isLoading: false,
    error: null,
  });

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  // Función para registrar el dispositivo para notificaciones push
  const registerForPushNotificationsAsync = useCallback(async (): Promise<string | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Verificar si el dispositivo es físico (no funciona en simulador)
      if (!Device.isDevice) {
        setState(prev => ({ ...prev, error: 'Las notificaciones push no funcionan en el simulador', isLoading: false }));
        return null;
      }

      // Verificar si hay un token de autenticación válido antes de hacer la petición
      const authToken = await apiClient.loadToken();
      if (!authToken) {
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      // Solicitar permisos para notificaciones
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        setState(prev => ({ 
          ...prev, 
          error: 'Permisos de notificaciones denegados',
          isLoading: false 
        }));
        return null;
      }

      // Obtener el token de Expo
      let projectId = process.env.EXPO_PUBLIC_PROJECT_ID;
      
      let token;
      try {
        if (projectId) {
          token = await Notifications.getExpoPushTokenAsync({ projectId });
        } else {
          token = await Notifications.getExpoPushTokenAsync();
        }
      } catch (error) {
        token = await Notifications.getExpoPushTokenAsync();
      }

      const expoPushToken = token.data;

      // Configurar canales de notificación para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('order_updates', {
          name: 'Actualizaciones de Pedidos',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
          description: 'Notificaciones sobre cambios en el estado de tus pedidos',
        });

        await Notifications.setNotificationChannelAsync('product_notifications', {
          name: 'Notificaciones de Productos',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          description: 'Alertas de stock y precios',
        });

        await Notifications.setNotificationChannelAsync('cart_reminders', {
          name: 'Recordatorios de Carrito',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
          description: 'Recordatorios de productos en tu carrito',
        });
      }

      // Enviar el token al backend
      try {
        const response = await apiClient.post('/profile/push-token', {
          push_token: expoPushToken,
        });

        if (response.success) {
          setState(prev => ({
            ...prev,
            expoPushToken,
            isRegistered: true,
            isLoading: false,
          }));
          return expoPushToken;
        } else {
          throw new Error(response.message || 'Error al registrar token en el backend');
        }
      } catch (apiError) {
        if (apiError instanceof Error && apiError.message.includes('Token inválido')) {
          setState(prev => ({ ...prev, isLoading: false }));
          return null;
        }
        throw apiError;
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('projectId')) {
        setState(prev => ({
          ...prev,
          error: 'Configuración de notificaciones incompleta',
          isLoading: false,
        }));
        return null;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      return null;
    }
  }, []);

  // Función para eliminar el token de notificaciones
  const unregisterPushNotifications = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const authToken = await apiClient.loadToken();
      if (!authToken) {
        setState(prev => ({
          ...prev,
          expoPushToken: null,
          isRegistered: false,
          isLoading: false,
        }));
        return true;
      }

      try {
        const response = await apiClient.delete('/profile/push-token');

        if (response.success) {
          setState(prev => ({
            ...prev,
            expoPushToken: null,
            isRegistered: false,
            isLoading: false,
          }));
          return true;
        } else {
          throw new Error(response.message || 'Error al eliminar token del backend');
        }
      } catch (apiError) {
        if (apiError instanceof Error && apiError.message.includes('Token inválido')) {
          setState(prev => ({
            ...prev,
            expoPushToken: null,
            isRegistered: false,
            isLoading: false,
          }));
          return true;
        }
        throw apiError;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      return false;
    }
  }, []);

  // --- Lógica de Listeners ---

  // Función para manejar la navegación basada en los datos de la notificación
  const handleNotificationNavigation = useCallback((data: NotificationData) => {
    try {
      switch (data.type) {
        case 'order_status_update':
          if (data.orderId) {
            router.push(`/(customer)/orders/${data.orderId}` as any);
          } else {
            router.push('/(customer)/orders' as any);
          }
          break;

        case 'stock_available':
        case 'price_drop':
          if (data.productId) {
            router.push(`/(customer)/product/${data.productId}` as any);
          } else {
            router.push('/(customer)/catalog' as any);
          }
          break;

        case 'cart_reminder':
          router.push('/(customer)/cart' as any);
          break;

        default:
          router.push('/(customer)/catalog' as any);
          break;
      }
    } catch (error) {
      router.push('/(customer)/catalog' as any);
    }
  }, []);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setState(prev => ({ ...prev, notification }));
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const rawData = response.notification.request.content.data as unknown;
      
      if (rawData && typeof rawData === 'object' && 'type' in rawData && 'timestamp' in rawData) {
        const data = rawData as NotificationData;
        handleNotificationNavigation(data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [handleNotificationNavigation]);

  const clearNotificationBadge = useCallback(async () => {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      // Silently fail
    }
  }, []);

  const initializeNotifications = useCallback(async () => {
    return await registerForPushNotificationsAsync();
  }, [registerForPushNotificationsAsync]);

  return {
    ...state,
    initializeNotifications,
    unregisterPushNotifications,
    clearNotificationBadge,
  };
};
