import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { ThemedView } from '@/presentation/theme/components/ThemedView';
import { ThemedText } from '@/presentation/theme/components/ThemedText';
import { useThemeColor } from '@/presentation/theme/hooks/useThemeColor';
import { OrderDetail } from '@/presentation/orders/components/OrderDetail';
import { useUserOrder, useCancelUserOrder } from '@/presentation/orders/hooks/useOrders';

const ORDERS_QUERY_KEY = ['orders'];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tintColor = useThemeColor({}, 'tint');
  const queryClient = useQueryClient();
  
  const { 
    data: order, 
    isLoading: orderLoading, 
    error: orderError,
    refetch: refetchOrder
  } = useUserOrder(id!);

  // Refrescar el pedido cada vez que la pantalla entra en foco para obtener el estado más reciente
  useFocusEffect(
    useCallback(() => {
      // Invalidar el cache primero y luego refrescar para asegurar datos actualizados
      if (id) {
        console.log('🔄 [OrderDetailScreen] Refrescando pedido:', id);
        // Invalidar el cache del pedido específico
        queryClient.invalidateQueries({ 
          queryKey: [...ORDERS_QUERY_KEY, 'user', id],
          refetchType: 'active' 
        });
        // Refrescar inmediatamente
        refetchOrder();
      }
    }, [id, refetchOrder, queryClient])
  );
  
  const cancelOrderMutation = useCancelUserOrder();

  const handleCancelOrder = (orderId: string, reason?: string) => {
    cancelOrderMutation.mutate({ orderId, data: { reason } });
  };

  if (orderLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={styles.loadingText}>Cargando pedido...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (orderError || !order) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorTitle}>Error</ThemedText>
          <ThemedText style={styles.errorText}>
            No se pudo cargar el pedido. Verifica que el ID sea correcto.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <OrderDetail 
        order={order} 
        onCancelOrder={handleCancelOrder}
        showCancelButton={true}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});











































