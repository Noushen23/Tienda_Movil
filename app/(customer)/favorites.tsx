import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedView } from '@/presentation/theme/components/ThemedView';
import { ThemedText } from '@/presentation/theme/components/ThemedText';
import { useThemeColor } from '@/presentation/theme/hooks/useThemeColor';
import { formatCurrency } from '@/presentation/utils';
import {
  useUserFavorites,
  useToggleFavorite,
  useIsFavorite,
} from '@/presentation/favorites/hooks/useFavorites';
import { Favorite } from '@/core/api/favoritesApi';
import { useAuthStore } from '@/presentation/auth/store/useAuthStore';

// Responsive breakpoints igual que en catálogo
const SCREEN = Dimensions.get('window');
const SCREEN_WIDTH = SCREEN.width;
const PRODUCT_CARD_MIN_WIDTH = 165;
const PRODUCT_CARD_SPACING = 12;
const getNumColumns = () => {
  return SCREEN_WIDTH > 550 ? 3 : 2;
};
const getCardWidth = () => {
  const numColumns = getNumColumns();
  return (
    (SCREEN_WIDTH -
      PRODUCT_CARD_SPACING * 2 -
      PRODUCT_CARD_SPACING * (numColumns - 1)) /
    numColumns
  );
};

// Paleta de colores para servicios (igual que en services.tsx)
const COLOR_PALETTE = {
  primary: '#314259',    // Azul oscuro
  accent: '#4F758C',     // Azul medio
  light: '#8EACBF',      // Azul claro
};

// Función para obtener colores basados en el ID del producto
const getColorsByProductId = (productId: number | string): {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  dark: string;
  lightest: string;
} => {
  const id = typeof productId === 'string' ? parseInt(productId) || 0 : productId;
  const colors = [COLOR_PALETTE.primary, COLOR_PALETTE.accent, COLOR_PALETTE.light];
  const colorIndex = id % colors.length;
  const selectedColor = colors[colorIndex];
  
  // Generar variaciones del color seleccionado
  return {
    primary: selectedColor,
    secondary: colors[(colorIndex + 1) % colors.length],
    accent: colors[(colorIndex + 2) % colors.length],
    light: '#F0F4F8', // Fondo claro azulado
    dark: COLOR_PALETTE.primary,
    lightest: '#F8FAFC',
  };
};

// Catalog-style product card for favorites
const FavoriteProductItem = memo(
  ({ favorite }: { favorite: Favorite }) => {
    const tintColor = useThemeColor({}, 'tint');
    const backgroundColor = useThemeColor({}, 'background');
    const textColor = useThemeColor({}, 'text');
    const toggleFavorite = useToggleFavorite();
    const { isFavorite } = useIsFavorite(favorite.producto_id);

    const cardWidth = getCardWidth();


    const handlePressToggleFavorite = useCallback(
      async (e: any) => {
        e.stopPropagation?.();
        try {
          toggleFavorite.toggle(favorite.producto_id, isFavorite);
        } catch (error) {
          // no-op
        }
      },
      [favorite.producto_id, isFavorite, toggleFavorite]
    );

    const product = favorite.producto as typeof favorite.producto & {
      images?: string[];
      esServicio?: boolean;
      es_servicio?: boolean;
    };

    if (!product) {
      return (
        <View style={[favoriteStyles.card, { width: cardWidth }]}>
          <View style={favoriteStyles.missingCardBody}>
            <ThemedText style={{ color: '#e53935', fontWeight: '600' }}>
              Error al cargar producto
            </ThemedText>
          </View>
        </View>
      );
    }

    const imageUrl =
      product.images && product.images.length > 0 ? product.images[0] : null;
    
    // Verificar si es un servicio (recarga)
    // Verificar ambos campos posibles: esServicio (camelCase) y es_servicio (snake_case)
    const isService = Boolean(
      product.esServicio || 
      product.es_servicio || 
      (product as any).esServicio === true || 
      (product as any).es_servicio === true
    );
    
    // Obtener colores para servicios
    const serviceColors = isService ? getColorsByProductId(favorite.producto_id) : null;

    const handlePressProduct = useCallback(() => {
      if (isService) {
        router.push(`/(customer)/product/${favorite.producto_id}?fromService=true` as any);
      } else {
        router.push(`/(customer)/product/${favorite.producto_id}` as any);
      }
    }, [favorite.producto_id, isService]);

    return (
      <Pressable
        style={[
          favoriteStyles.card,
          { 
            width: cardWidth, 
            backgroundColor: isService && serviceColors ? serviceColors.lightest : backgroundColor,
            borderColor: isService && serviceColors ? serviceColors.accent : '#f7f7f7',
            borderWidth: isService && serviceColors ? 2.5 : 1,
            shadowColor: isService && serviceColors ? serviceColors.accent : '#000',
            shadowOpacity: isService ? 0.15 : 0.06,
            shadowRadius: isService ? 4 : 2,
            // elevation: isService ? 5 : 3,
          },
        ]}
        onPress={handlePressProduct}
      >
        <View style={favoriteStyles.imageBox}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={favoriteStyles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={favoriteStyles.noImageBox}>
              <Ionicons name="image-outline" size={34} color="#bbb" />
            </View>
          )}
          
          {/* Badge de Recarga/Servicio */}
          {isService && (
            <View style={favoriteStyles.serviceBadge}>
              <Ionicons name="construct" size={10} color="#fff" />
              <ThemedText style={favoriteStyles.serviceBadgeText}>Recargas</ThemedText>
            </View>
          )}
          
          <TouchableOpacity
            style={[
              favoriteStyles.favBtn,
              {
                backgroundColor: toggleFavorite.isPending
                  ? '#ffebee'
                  : '#fff',
                opacity: toggleFavorite.isPending ? 0.7 : 1,
              },
            ]}
            onPress={handlePressToggleFavorite}
            disabled={toggleFavorite.isPending}
            activeOpacity={0.82}
          >
            {toggleFavorite.isPending ? (
              <ActivityIndicator size={15} color="#e53935" />
            ) : (
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={18}
                color="#E53935"
              />
            )}
          </TouchableOpacity>
        </View>
        <View style={favoriteStyles.cardContent}>
          <ThemedText
            style={[
              favoriteStyles.name,
              isService && serviceColors ? {
                color: serviceColors.primary,
                fontWeight: '800'
              } : {}
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {product.nombre}
          </ThemedText>
          <ThemedText
            style={[
              favoriteStyles.desc,
              isService && serviceColors ? {
                color: serviceColors.primary,
                opacity: 0.85
              } : {}
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {product.descripcion || 'Sin descripción'}
          </ThemedText>
          <View style={favoriteStyles.priceRow}>
            {product.precio_oferta && product.precio_oferta < product.precio && (
              <>
                <ThemedText style={[
                  favoriteStyles.ofertaPrice,
                  isService && serviceColors ? { color: serviceColors.accent } : {}
                ]}>
                  {formatCurrency(product.precio_oferta)}
                </ThemedText>
                <ThemedText style={favoriteStyles.precioTachado}>
                  {formatCurrency(product.precio)}
                </ThemedText>
              </>
            )}
            {(!product.precio_oferta ||
              !(product.precio_oferta < product.precio)) && (
              <ThemedText style={[
                favoriteStyles.price,
                isService && serviceColors ? { color: serviceColors.accent } : {}
              ]}>
                {formatCurrency(product.precio_final)}
              </ThemedText>
            )}
          </View>
          {/* Stock - Solo se muestra si NO es servicio */}
          {!isService && (
            <View style={favoriteStyles.stockRow}>
              <Ionicons
                name={product.stock > 0 ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={product.stock > 0 ? '#38a169' : '#d32f2f'}
              />
              <ThemedText
                style={[
                  favoriteStyles.stockText,
                  {
                    color:
                      product.stock > 0
                        ? '#38a169'
                        : '#d32f2f',
                  },
                ]}
              >
                {product.stock > 0
                  ? `Stock: ${product.stock}`
                  : 'Agotado'}
              </ThemedText>
            </View>
          )}
          {/* Badge de Favorito para Servicios - Solo se muestra si ES servicio */}
          {isService && serviceColors && (
            <View style={[
              favoriteStyles.favoriteServiceBadge,
              {
                backgroundColor: serviceColors.accent + '20',
                borderColor: serviceColors.accent,
              }
            ]}>
              <Ionicons name="heart" size={12} color={serviceColors.accent} />
              <ThemedText style={[
                favoriteStyles.favoriteServiceBadgeText,
                { color: serviceColors.accent }
              ]}>
                En Favoritos
              </ThemedText>
            </View>
          )}
        </View>
      </Pressable>
    );
  },
  (prev, next) => {
    // Compare like memo from catalog cards
    const pA = prev.favorite.producto;
    const pB = next.favorite.producto;
    return (
      prev.favorite.id === next.favorite.id &&
      prev.favorite.producto_id === next.favorite.producto_id &&
      pA?.nombre === pB?.nombre &&
      pA?.precio === pB?.precio &&
      pA?.precio_final === pB?.precio_final &&
      pA?.precio_oferta === pB?.precio_oferta &&
      pA?.stock === pB?.stock &&
      pA?.images?.[0] === pB?.images?.[0]
    );
  }
);
FavoriteProductItem.displayName = 'FavoriteProductItem';

const EmptyFavorites = memo(
  ({ onExploreCatalog }: { onExploreCatalog: () => void }) => {
    const tintColor = useThemeColor({}, 'tint');
    return (
      <View style={favoriteStyles.emptyWrap}>
        <View style={favoriteStyles.emptyIconWrap}>
          <Ionicons name="heart-circle-outline" size={80} color={tintColor} />
        </View>
        <ThemedText style={favoriteStyles.emptyTitle}>
          ¡Aún no tienes favoritos!
        </ThemedText>
        <ThemedText style={favoriteStyles.emptySubtitle}>
          Explora el catálogo y agrega tus productos favoritos tocando el{' '}
          <Ionicons name="heart-outline" size={14} color={tintColor} />
          .
        </ThemedText>
        <TouchableOpacity
          style={[favoriteStyles.exploreBtn, { backgroundColor: tintColor }]}
          onPress={onExploreCatalog}
          activeOpacity={0.88}
        >
          <Ionicons name="pricetag-outline" size={18} color="#fff" />
          <ThemedText style={favoriteStyles.exploreBtnText}>
            Ver catálogo
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }
);
EmptyFavorites.displayName = 'EmptyFavorites';

const ErrorState = memo(
  ({
    onRetry,
    isTokenExpired,
  }: {
    onRetry: () => void;
    isTokenExpired?: boolean;
  }) => {
    const tintColor = useThemeColor({}, 'tint');
    return (
      <View style={favoriteStyles.emptyWrap}>
        <View style={favoriteStyles.emptyIconWrap}>
          <Ionicons name="alert-circle-outline" size={80} color="#d32f2f" />
        </View>
        <ThemedText style={favoriteStyles.emptyTitle}>
          {isTokenExpired ? 'Sesión expirada' : 'Ha ocurrido un error'}
        </ThemedText>
        <ThemedText style={favoriteStyles.emptySubtitle}>
          {isTokenExpired
            ? 'Por favor inicia sesión nuevamente para ver tus favoritos.'
            : 'No pudimos cargar la información. Intenta nuevamente.'}
        </ThemedText>
        <TouchableOpacity
          style={[
            favoriteStyles.exploreBtn,
            { backgroundColor: tintColor, marginTop: 16 },
          ]}
          onPress={onRetry}
          activeOpacity={0.88}
        >
          <Ionicons
            name={isTokenExpired ? 'log-in-outline' : 'refresh'}
            size={18}
            color="#fff"
          />
          <ThemedText style={favoriteStyles.exploreBtnText}>
            {isTokenExpired ? 'Iniciar sesión' : 'Intentar de nuevo'}
          </ThemedText>
        </TouchableOpacity>
      </View>
    );
  }
);
ErrorState.displayName = 'ErrorState';

export default function FavoritesScreen() {
  // colores/tema igual a catálogo
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const [refreshing, setRefreshing] = useState(false);
  const { status, logout } = useAuthStore();

  const {
    data: favoritesData,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useUserFavorites({
    include_details: true,
    limit: 50,
  });

  const isTokenExpired =
    error?.message?.includes('Token inválido') ||
    error?.message?.includes('expirado');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleExploreCatalog = useCallback(() => {
    router.push('/(customer)/catalog' as any);
  }, []);

  const handleRetry = useCallback(() => {
    if (isTokenExpired) {
      logout();
      router.replace('/auth/login' as any);
    } else {
      refetch();
    }
  }, [isTokenExpired, logout, refetch]);

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login' as any);
    }
  }, [status]);

  const favorites = useMemo(() => {
    return favoritesData?.success && favoritesData.data
      ? favoritesData.data.favorites
      : [];
  }, [favoritesData]);

  // Key igual catálogo
  const getItemKey = useCallback((item: Favorite) => String(item.id), []);

  const numColumns = getNumColumns();
  const cardWidth = getCardWidth();

  return (
    <ThemedView style={{ flex: 1, backgroundColor: backgroundColor }}>
      {/* Header estilo catálogo */}
      <View style={favoriteStyles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={favoriteStyles.headerBack}
        >
          <Ionicons name="arrow-back" size={23} color={tintColor} />
        </TouchableOpacity>
        <ThemedText style={favoriteStyles.headerText}>
          Mis Favoritos
        </ThemedText>
        <View style={favoriteStyles.headerRight}>
          {favorites.length > 0 && (
            <View style={favoriteStyles.counterBadge}>
              <ThemedText style={favoriteStyles.counterBadgeText}>
                {favorites.length}
              </ThemedText>
            </View>
          )}
        </View>
      </View>
      {/* CONTENT */}
      <View style={favoriteStyles.flex1}>
        {isLoading ? (
          <View style={[favoriteStyles.centered, { flex: 1 }]}>
            <ActivityIndicator size="large" color={tintColor} />
            <ThemedText style={{ marginTop: 16, color: '#aaa' }}>
              Cargando...
            </ThemedText>
          </View>
        ) : error ? (
          <ErrorState
            onRetry={handleRetry}
            isTokenExpired={isTokenExpired}
          />
        ) : favorites.length === 0 ? (
          <EmptyFavorites onExploreCatalog={handleExploreCatalog} />
        ) : (
          <FlatList
            data={favorites}
            renderItem={({ item }) => (
              <FavoriteProductItem favorite={item} />
            )}
            keyExtractor={getItemKey}
            numColumns={numColumns}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={favoriteStyles.listContent}
            columnWrapperStyle={
              numColumns > 1
                ? { gap: PRODUCT_CARD_SPACING }
                : undefined
            }
            ItemSeparatorComponent={() => <View style={{ height: 17 }} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || isRefetching}
                onRefresh={onRefresh}
                colors={[tintColor]}
                tintColor={tintColor}
              />
            }
            ListFooterComponent={() => (
              <View style={favoriteStyles.footer}>
                <ThemedText style={favoriteStyles.footerText}>
                  Mostrando {favorites.length}{' '}
                  {favorites.length === 1 ? 'producto' : 'productos'}
                </ThemedText>
              </View>
            )}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </ThemedView>
  );
}

const favoriteStyles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerBack: {
    padding: 8,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    minHeight: 36,
    marginRight: 4,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.1,
    color: '#262626',
    marginHorizontal: 8,
    includeFontPadding: false,
  },
  headerRight: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 6,
    marginLeft: 4,
  },
  counterBadge: {
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    minWidth: 24,
    paddingHorizontal: 6,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  counterBadgeText: {
    color: '#E53935',
    fontWeight: '700',
    fontSize: 14,
  },

  listContent: {
    paddingHorizontal: PRODUCT_CARD_SPACING,
    paddingVertical: 16,
    gap: PRODUCT_CARD_SPACING,
    minHeight: 120,
    flexGrow: 1,
  },
  card: {
    borderRadius: 18,
    marginBottom: 0,
    overflow: 'hidden',
    minHeight: 252,
    minWidth: PRODUCT_CARD_MIN_WIDTH,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#f7f7f7',
    backgroundColor: '#fff',
    // elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  missingCardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 142,
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1.15,
    backgroundColor: '#f7f8fa',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  noImageBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 110,
    backgroundColor: '#f1f1f5',
  },
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 100,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    // elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    zIndex: 2,
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 13,
    flex: 1,
    minHeight: 98,
    gap: 5,
  },
  name: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#333',
    marginBottom: 0,
  },
  desc: {
    fontSize: 12.3,
    color: '#73777D',
    marginBottom: 4,
    lineHeight: 20,
  },
  productDescription: {
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 0,
  },
  ofertaPrice: {
    color: '#E53935',
    fontWeight: '700',
    fontSize: 16.5,
  },
  precioTachado: {
    color: '#9e9e9e',
    textDecorationLine: 'line-through',
    fontSize: 13,
    marginLeft: 4,
  },
  price: {
    color: '#212121',
    fontWeight: '700',
    fontSize: 16.5,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 3,
    color: '#38a169',
  },
  /* EMPTY state styles */
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 20,
  },
  emptyIconWrap: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 26,
    marginTop: 2,
    lineHeight: 22,
  },
  exploreBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 11,
    borderRadius: 23,
    gap: 8,
    // elevation: 2,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 2,
    letterSpacing: 0.1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 19,
    paddingBottom: 29,
    marginTop: 0,
  },
  footerText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 4,
  },

  // Badge de servicio/recarga
  serviceBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    // elevation: 2,
  },
  serviceBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  favoriteServiceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
    gap: 4,
    borderWidth: 1.5,
    shadowColor: '#f43f5e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    // elevation: 1,
  },
  favoriteServiceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
