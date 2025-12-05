import * as React from 'react';
import { useState, useCallback, memo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useProducts, useProductSearch } from '@/presentation/products/hooks/useProducts';
import { ThemedView } from '@/presentation/theme/components/ThemedView';
import { ThemedText } from '@/presentation/theme/components/ThemedText';
import { useThemeColor } from '@/presentation/theme/hooks/useThemeColor';
import { Product } from '@/core/api/productsApi';
// import { CategorySelector } from '@/presentation/categories/components/CategorySelector';
import { useToggleFavorite, useIsFavorite } from '@/presentation/favorites/hooks/useFavorites';
import { FilterModal, ProductFilters } from '@/presentation/products/components/FilterModal';
import { SearchHistory } from '@/presentation/products/components/SearchHistory';
import { useSearch } from '@/presentation/products/hooks/useFilters';
// import { useCategories } from '@/presentation/categories/hooks/useCategories';
import { catalogStyles as styles } from '@/presentation/theme/styles/catalog.styles';

// Responsive helpers
const { width: screenWidth } = Dimensions.get('window');

// Paleta de colores
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

const getResponsiveDimensions = () => {
  const isSmallScreen = screenWidth < 385;
  const isMediumScreen = screenWidth >= 385 && screenWidth < 414;
  const isLargeScreen = screenWidth >= 414;
  const marginBetweenCards = isSmallScreen ? 7 : isMediumScreen ? 11 : 15;
  return {
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    cardWidth: (screenWidth - 2 * (isSmallScreen ? 10 : 16) - marginBetweenCards) / 2,
    cardHeight: isSmallScreen ? 320 : isMediumScreen ? 350 : 390,
    imageHeight: isSmallScreen ? 130 : isMediumScreen ? 155 : 185,
    paddingHorizontal: isSmallScreen ? 10 : 16,
    paddingVertical: isSmallScreen ? 8 : 12,
    marginBetweenCards,
    titleFontSize: isSmallScreen ? 15 : isMediumScreen ? 16 : 17,
    descriptionFontSize: isSmallScreen ? 12 : 13,
    priceFontSize: isSmallScreen ? 15 : isMediumScreen ? 17 : 18,
  };
};

// Componente de tarjeta de servicio (sin botón de carrito, solo informativo)
const ServiceItem = memo(({ product }: { product: Product }) => {
  if (!product || !product.id) {
    return null;
  }

  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const toggleFavorite = useToggleFavorite();
  const { isFavorite, isLoading: isFavoriteLoading } = useIsFavorite(product.id);
  const responsiveDims = getResponsiveDimensions();
  const colors = getColorsByProductId(product.id);

  const handleToggleFavorite = useCallback(async (e: any) => {
    e.stopPropagation();
    try {
      toggleFavorite.toggle(product.id, isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, [product.id, isFavorite, toggleFavorite]);

  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : null;

  const isValidImageUrl = (url: string | null): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    if (trimmedUrl === '') return false;
    
    try {
      new URL(trimmedUrl);
      return true;
    } catch {
      return false;
    }
  };

  const shouldShowImage = isValidImageUrl(imageUrl);

  return (
    <TouchableOpacity
      style={[
        styles.serviceCard,
        {
          backgroundColor: isFavorite ? colors.lightest : colors.light,
          width: responsiveDims.cardWidth,
          height: responsiveDims.cardHeight,
          shadowColor: isFavorite ? colors.accent : colors.primary,
          shadowOpacity: Platform.OS === 'ios' ? (isFavorite ? 0.25 : 0.18) : (isFavorite ? 0.30 : 0.24),
          shadowRadius: isFavorite ? 12 : 10,
          // elevation: isFavorite ? 8 : 5,
          borderColor: isFavorite ? colors.accent : colors.lightest,
          borderWidth: isFavorite ? 2.5 : 1.5,
        }
      ]}
      onPress={() => {
        if (product?.id) {
          router.push(`/(customer)/product/${product.id}?fromService=true` as any);
        }
      }}
      activeOpacity={0.93}
    >
      <View style={[
        styles.serviceImage,
        {
          height: responsiveDims.imageHeight,
          marginBottom: 12,
          backgroundColor: colors.lightest,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          overflow: 'hidden'
        }
      ]}>
        {shouldShowImage ? (
          <Image
            source={{ uri: imageUrl!.trim() }}
            style={styles.serviceImageContent}
            resizeMode="cover"
            onError={(error) => {
              console.warn('⚠️ Error cargando imagen:', imageUrl, error.nativeEvent.error);
            }}
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons
              name="construct-outline"
              size={responsiveDims.isSmallScreen ? 54 : responsiveDims.isMediumScreen ? 58 : 62}
              color="#ced3de"
              style={{ marginBottom: 3 }}
            />
            <ThemedText style={styles.noImageText}>Sin imagen</ThemedText>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.favoriteButton,
            {
              backgroundColor: toggleFavorite.isPending ? colors.lightest : '#fff',
              borderColor: isFavorite ? colors.primary : colors.lightest,
              opacity: toggleFavorite.isPending || isFavoriteLoading ? 0.8 : 1,
              shadowColor: colors.primary,
              top: 12,
              right: 12
            }
          ]}
          onPress={handleToggleFavorite}
          disabled={toggleFavorite.isPending || isFavoriteLoading}
          activeOpacity={0.83}
        >
          {toggleFavorite.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={responsiveDims.isSmallScreen ? 20 : 22}
              color={isFavorite ? colors.accent : colors.secondary}
              style={Platform.OS === 'android' ? { 
                color: isFavorite ? colors.accent : colors.secondary 
              } : undefined}
            />
          )}
        </TouchableOpacity>

        {/* Badge de Servicio */}
        <View style={[styles.serviceBadge, {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        }]}>
          <Ionicons name="construct" size={12} color="#fff" />
          <ThemedText style={styles.serviceBadgeText}>Recargas</ThemedText>
        </View>
      </View>

      <View style={styles.serviceInfo}>
        <ThemedText
          style={[styles.serviceTitle, {
            fontSize: responsiveDims.titleFontSize,
            marginBottom: 1,
            color: isFavorite ? colors.primary : colors.dark,
            fontWeight: isFavorite ? '800' : '700'
          }]}
          numberOfLines={2}
        >
          {String(product.nombre || 'Sin nombre')}
        </ThemedText>

        <ThemedText
          style={[styles.serviceDescription, {
            fontSize: responsiveDims.descriptionFontSize,
            color: isFavorite ? colors.primary : colors.secondary,
            marginBottom: 7,
            minHeight: 40,
            opacity: isFavorite ? 0.85 : 1
          }]}
          numberOfLines={3}
        >
          {String(product.descripcion || 'Sin descripción')}
        </ThemedText>

        {/* Información de precio (opcional para Recargas) */}
        {(typeof product.precio === 'number' && product.precio > 0) || 
         (typeof product.precioFinal === 'number' && product.precioFinal > 0) ? (
          <View style={styles.priceContainer}>
            <ThemedText style={[
              styles.servicePrice,
              {
                color: isFavorite ? colors.accent : colors.primary,
                fontSize: responsiveDims.priceFontSize,
                fontWeight: '700'
              }
            ]}>
              {`Desde $${String((product.precioFinal || product.precio || 0).toLocaleString())}`}
            </ThemedText>
          </View>
        ) : null}

        {/* Indicador informativo - Solo se muestra si NO es favorito */}
        {!isFavorite && (
          <View style={[styles.infoBadge, {
            backgroundColor: colors.lightest,
            borderColor: colors.primary,
            borderWidth: 1.5,
          }]}>
            <Ionicons name="eye-outline" size={14} color={colors.primary} />
            <ThemedText style={[styles.infoBadgeText, { color: colors.primary, fontWeight: '600' }]}>
              Solo Visualización
            </ThemedText>
          </View>
        )}

        {/* Badge de Favorito - Solo se muestra si ES favorito */}
        {isFavorite && (
          <View style={[styles.favoriteBadge, {
            backgroundColor: colors.accent + '20',
            borderColor: colors.accent,
            borderWidth: 1.5,
          }]}>
            <Ionicons name="heart" size={14} color={colors.accent} />
            <ThemedText style={[styles.favoriteBadgeText, { color: colors.accent, fontWeight: '700' }]}>
              En Favoritos
            </ThemedText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => (
  prevProps.product.id === nextProps.product.id &&
  prevProps.product.nombre === nextProps.product.nombre &&
  prevProps.product.precio === nextProps.product.precio &&
  prevProps.product.images?.length === nextProps.product.images?.length &&
  prevProps.product.images?.[0] === nextProps.product.images?.[0]
));
ServiceItem.displayName = 'ServiceItem';

export default function ServicesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({ sortBy: 'recientes' });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = '#e1e6f0';
  const responsiveDims = getResponsiveDimensions();
  // const categoriesQuery = useCategories();
  const { saveSearch } = useSearch();

  const searchTermTrimmed = searchTerm.trim();
  const shouldSearch = searchTermTrimmed.length > 0;

  React.useEffect(() => {
    let count = 0;
    if (filters.precioMin || filters.precioMax) count++;
    if (filters.calificacionMin) count++;
    if (filters.enOferta) count++;
    if (filters.sortBy && filters.sortBy !== 'recientes') count++;
    setActiveFiltersCount(count);
  }, [filters]);

  // Filtrar productos que sean Recargas usando el filtro del backend
  const {
    productsQuery,
    loadNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useProducts({
    activo: true,
    esServicio: true, // Filtrar solo Recargas desde el backend
    // categoriaId: filters.categoriaId || selectedCategoryId || undefined,
    precioMin: filters.precioMin,
    precioMax: filters.precioMax,
    calificacionMin: filters.calificacionMin,
    enOferta: filters.enOferta,
    sortBy: filters.sortBy,
  });

  const {
    data: searchData,
    isLoading: isSearchLoading,
    error: searchError,
    refetch: refetchSearch
  } = useProductSearch(searchTermTrimmed, {
    activo: true,
    esServicio: true, // Filtrar solo Recargas desde el backend
    // categoriaId: filters.categoriaId || selectedCategoryId || undefined,
    precioMin: filters.precioMin,
    precioMax: filters.precioMax,
    calificacionMin: filters.calificacionMin,
    enOferta: filters.enOferta,
    sortBy: filters.sortBy,
  });

  const services = shouldSearch
    ? searchData?.products ?? []
    : productsQuery.data?.pages.flatMap((page) => page?.products ?? []) ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (shouldSearch) {
        await refetchSearch();
      } else {
        await productsQuery.refetch();
      }
    } catch (error) {
      console.error('Error refreshing services:', error);
    } finally {
      setRefreshing(false);
    }
  }, [shouldSearch, productsQuery, refetchSearch]);

  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    setSearchTerm(trimmed);
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchTerm('');
  }, []);

  // const handleCategorySelect = useCallback((categoryId: string | null) => {
  //   setSelectedCategoryId(categoryId);
  //   setFilters(prev => ({ ...prev, categoriaId: categoryId || undefined }));
  //   setSearchQuery('');
  //   setSearchTerm('');
  // }, []);

  const handleApplyFilters = useCallback((newFilters: ProductFilters) => {
    setFilters(newFilters);
    // if (newFilters.categoriaId) {
    //   setSelectedCategoryId(newFilters.categoriaId);
    // }
  }, []);

  const handleSearchFromHistory = useCallback((termino: string) => {
    setSearchQuery(termino);
    setSearchTerm(termino);
  }, []);

  React.useEffect(() => {
    if (searchTermTrimmed.length > 0 && searchData) {
      const timer = setTimeout(() => {
        const totalResults = services.length;
        saveSearch({
          termino: searchTermTrimmed,
          filtros: { ...filters, esServicio: true },
          resultados: totalResults
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [searchTermTrimmed, searchData, filters, saveSearch, services.length]);

  const renderService = useCallback(({ item }: { item: Product }) => {
    if (!item) return null;
    return <ServiceItem product={item} />;
  }, []);

  const keyExtractor = useCallback((item: Product | null | undefined, index: number) => {
    if (!item) return `service-null-${index}`;
    return item.id ? `service-${item.id}` : `service-index-${index}`;
  }, []);

  const isLoading = shouldSearch ? isSearchLoading : productsQuery.isLoading;
  const error = shouldSearch ? searchError : productsQuery.error;

  if (isLoading && !refreshing) {
    return (
        <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR_PALETTE.primary} />
        <ThemedText style={styles.loadingText}>Cargando Recargas...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={62} color="#ef4444" />
        <ThemedText style={styles.errorText}>
          Error al cargar Recargas
        </ThemedText>
        <ThemedText style={styles.errorSubtext}>
          {error instanceof Error ? error.message : 'Error desconocido'}
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header Search */}
      <View style={[
        styles.headerContainer,
        {
          paddingHorizontal: responsiveDims.paddingHorizontal,
          backgroundColor: COLOR_PALETTE.primary + '15',
          borderBottomWidth: 1,
          borderBottomColor: COLOR_PALETTE.accent + '40'
        }
      ]}>
        {/* Searchbar */}
        <View style={[
          styles.searchContainer,
          {
            borderColor: COLOR_PALETTE.light + '60',
            shadowColor: COLOR_PALETTE.primary,
            borderWidth: 1,
            backgroundColor: COLOR_PALETTE.light + '30',
          }
        ]}>
          <Ionicons
            name="search"
            size={responsiveDims.isSmallScreen ? 19 : 21}
            color={COLOR_PALETTE.primary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[
              styles.searchInput,
              {
                fontSize: responsiveDims.isSmallScreen ? 14 : 16,
                color: COLOR_PALETTE.primary,
                minHeight: 41,
                letterSpacing: 0.1,
                fontWeight: '500'
              }
            ]}
            placeholder="Buscar Recargas..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor={COLOR_PALETTE.accent + '80'}
            returnKeyType="search"
            underlineColorAndroid="transparent"
          />
          {searchQuery.length > 0 && (
            <>
              <TouchableOpacity onPress={handleClearSearch} style={{ marginLeft: 3, padding: 4 }}>
                <Ionicons
                  name="close-circle"
                  size={responsiveDims.isSmallScreen ? 18 : 20}
                  color="#cbced6"
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSearch} 
                style={{ marginLeft: 6, padding: 4 }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="search"
                  size={responsiveDims.isSmallScreen ? 20 : 22}
                  color={COLOR_PALETTE.primary}
                />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Filtro + badge */}
        <TouchableOpacity
          style={[styles.filterButton, {
            backgroundColor: COLOR_PALETTE.primary + '20',
            shadowColor: COLOR_PALETTE.primary,
          }]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="options-outline" size={26} color={COLOR_PALETTE.primary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <ThemedText style={styles.filterBadgeText}>{activeFiltersCount}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search history */}
      {!shouldSearch && searchQuery.length === 0 && searchTerm.length === 0 && (
        <SearchHistory onSelectSearch={handleSearchFromHistory} />
      )}

      {/* Categorías */}
      {/* <View style={styles.categorySelectorContainer}>
        <CategorySelector
          selectedCategoryId={selectedCategoryId || undefined}
          onCategorySelect={handleCategorySelect}
          showAllOption={true}
        />
      </View> */}

      {/* Banner Informativo - Debajo de Categorías */}
      <View style={{
        backgroundColor: COLOR_PALETTE.primary + '15',
        paddingVertical: 14,
        paddingHorizontal: responsiveDims.paddingHorizontal,
        borderLeftWidth: 5,
        borderLeftColor: COLOR_PALETTE.primary,
        borderBottomWidth: 1,
        borderBottomColor: COLOR_PALETTE.accent + '40',
        shadowColor: COLOR_PALETTE.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        // elevation: 2,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}>
          {/* Icono con fondo circular */}
          <View style={{
            backgroundColor: COLOR_PALETTE.primary,
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: COLOR_PALETTE.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            // elevation: 4,
          }}>
            <Ionicons name="document-text-outline" size={22} color="#fff" />
          </View>
          
          {/* Contenido */}
          <View style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}>
              <ThemedText style={{
                color: COLOR_PALETTE.primary,
                fontSize: responsiveDims.isSmallScreen ? 15 : 17,
                fontWeight: '700',
              }}>
                Vista Informativa
              </ThemedText>
              <View style={{
                backgroundColor: COLOR_PALETTE.accent,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                <ThemedText style={{
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: '700',
                  letterSpacing: 0.3,
                }}>
                  INFORMACIÓN
                </ThemedText>
              </View>
            </View>
            
            <ThemedText style={{
              color: COLOR_PALETTE.accent,
              fontSize: responsiveDims.isSmallScreen ? 12 : 13,
              fontWeight: '500',
              lineHeight: 18,
            }}>
              Consulta información detallada de servicios y recargas
            </ThemedText>
          </View>
          
          {/* Indicador visual lateral */}
          <View style={{
            width: 4,
            height: 40,
            backgroundColor: COLOR_PALETTE.primary,
            borderRadius: 2,
            opacity: 0.6,
          }} />
        </View>
      </View>

      {/* Filtros activos */}
      {activeFiltersCount > 0 && (
        <View style={styles.activeFiltersContainer}>
          <View style={styles.activeFiltersContent}>
            <Ionicons name="funnel" size={16} color="#2563eb" />
            <ThemedText style={styles.activeFiltersText}>
              {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro activo' : 'filtros activos'}
            </ThemedText>
          </View>
          <TouchableOpacity
            onPress={() => {
              setFilters({ sortBy: 'recientes' });
              // setSelectedCategoryId(null);
            }}
          >
            <ThemedText style={styles.clearFiltersButton}>Limpiar</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Services Grid */}
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={[
          styles.servicesList,
          { padding: responsiveDims.paddingHorizontal, backgroundColor: COLOR_PALETTE.light + '20' }
        ]}
        columnWrapperStyle={{
          justifyContent: 'space-between',
          paddingBottom: responsiveDims.marginBetweenCards,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (!shouldSearch && hasNextPage && !isFetchingNextPage) {
            loadNextPage();
          }
        }}
        onEndReachedThreshold={0.45}
        ListFooterComponent={() => {
          if (isFetchingNextPage) {
            return (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={COLOR_PALETTE.primary} />
                <ThemedText style={styles.loadingMoreText}>Cargando más...</ThemedText>
              </View>
            );
          }
          return null;
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="construct-outline" size={66} color="#bfc8de" />
            <ThemedText style={styles.emptyText}>
              {shouldSearch
                ? 'No se encontraron Recargas'
                // : selectedCategoryId
                //   ? 'No hay Recargas en esta categoría'
                : 'No hay Recargas disponibles'
              }
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              Los Recargas aparecerán aquí cuando estén disponibles
            </ThemedText>
          </View>
        }
      />

      {/* Modal de filtros */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
        categories={[]}
        // categories={categoriesQuery.data?.categories || []}
      />
    </ThemedView>
  );
}

