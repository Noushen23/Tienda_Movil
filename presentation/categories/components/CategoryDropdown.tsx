import React, { useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/presentation/theme/components/ThemedText';
import { ThemedView } from '@/presentation/theme/components/ThemedView';
import { useThemeColor } from '@/presentation/theme/hooks/useThemeColor';
import { useCategories } from '../hooks/useCategories';
import { Category } from '@/core/api/categoriesApi';

const { width: screenWidth } = Dimensions.get('window');

interface CategoryDropdownProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string | null) => void;
  showAllOption?: boolean;
}

export const CategoryDropdown: React.FC<CategoryDropdownProps> = ({
  selectedCategoryId,
  onCategorySelect,
  showAllOption = true,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({ light: '#e2e8f0', dark: '#4b5563' }, 'border');

  const { data: categoriesData, isLoading, error } = useCategories({ activa: true });
  const categories = categoriesData?.categories || [];

  // Filtrar categorías según la búsqueda
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) {
      return categories;
    }
    const query = searchQuery.toLowerCase().trim();
    return categories.filter((category) =>
      category.nombre.toLowerCase().includes(query)
    );
  }, [categories, searchQuery]);

  // Obtener el nombre de la categoría seleccionada
  const selectedCategory = categories.find((cat) => cat.id === selectedCategoryId);
  const displayText = selectedCategory
    ? selectedCategory.nombre
    : showAllOption
    ? 'Todas las categorías'
    : 'Seleccionar categoría';

  const handleCategoryPress = (categoryId: string | null) => {
    onCategorySelect(categoryId);
    setIsModalVisible(false);
    setSearchQuery('');
  };

  const handleOpenModal = () => {
    setIsModalVisible(true);
    setSearchQuery('');
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSearchQuery('');
  };

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategoryId === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          {
            backgroundColor: isSelected ? tintColor + '15' : cardBackground,
            borderLeftWidth: isSelected ? 3 : 0,
            borderLeftColor: isSelected ? tintColor : 'transparent',
          },
        ]}
        onPress={() => handleCategoryPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryItemContent}>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={22}
            color={isSelected ? tintColor : '#94a3b8'}
          />
          <ThemedText
            style={[
              styles.categoryItemText,
              {
                color: isSelected ? tintColor : '#1e293b',
                fontWeight: isSelected ? '600' : '500',
              },
            ]}
          >
            {item.nombre}
          </ThemedText>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={tintColor} />
        )}
      </TouchableOpacity>
    );
  };

  const renderAllOption = () => {
    if (!showAllOption) return null;
    
    const isSelected = !selectedCategoryId;
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          {
            backgroundColor: isSelected ? tintColor + '15' : cardBackground,
            borderLeftWidth: isSelected ? 3 : 0,
            borderLeftColor: isSelected ? tintColor : 'transparent',
          },
        ]}
        onPress={() => handleCategoryPress(null)}
        activeOpacity={0.7}
      >
        <View style={styles.categoryItemContent}>
          <Ionicons
            name={isSelected ? 'grid' : 'grid-outline'}
            size={22}
            color={isSelected ? tintColor : '#94a3b8'}
          />
          <ThemedText
            style={[
              styles.categoryItemText,
              {
                color: isSelected ? tintColor : '#1e293b',
                fontWeight: isSelected ? '600' : '500',
              },
            ]}
          >
            Todas las categorías
          </ThemedText>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={tintColor} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Botón del dropdown */}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          {
            backgroundColor: cardBackground,
            borderColor: selectedCategoryId ? tintColor : borderColor,
            borderWidth: selectedCategoryId ? 2 : 1,
          },
        ]}
        onPress={handleOpenModal}
        activeOpacity={0.8}
      >
        <View style={styles.dropdownButtonContent}>
          <Ionicons
            name="grid-outline"
            size={18}
            color={selectedCategoryId ? tintColor : '#64748b'}
            style={styles.dropdownIcon}
          />
          <ThemedText
            style={[
              styles.dropdownText,
              {
                color: selectedCategoryId ? tintColor : '#475569',
                fontWeight: selectedCategoryId ? '600' : '500',
              },
            ]}
            numberOfLines={1}
          >
            {displayText}
          </ThemedText>
        </View>
        <Ionicons
          name="chevron-down"
          size={18}
          color={selectedCategoryId ? tintColor : '#94a3b8'}
        />
      </TouchableOpacity>

      {/* Modal con lista de categorías */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable
            style={[styles.modalContent, { backgroundColor }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Categorías</ThemedText>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Barra de búsqueda */}
            {categories.length > 5 && (
              <View style={[styles.searchContainer, { borderColor }]}>
                <Ionicons
                  name="search"
                  size={18}
                  color="#94a3b8"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar categoría..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchButton}
                  >
                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Lista de categorías */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tintColor} />
                <ThemedText style={styles.loadingText}>
                  Cargando categorías...
                </ThemedText>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
                <ThemedText style={styles.errorText}>
                  Error al cargar categorías
                </ThemedText>
              </View>
            ) : (
              <FlatList
                data={filteredCategories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderAllOption}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search-outline" size={48} color="#cbd5e1" />
                    <ThemedText style={styles.emptyText}>
                      {searchQuery.trim()
                        ? 'No se encontraron categorías'
                        : 'No hay categorías disponibles'}
                    </ThemedText>
                  </View>
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 15,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '50%',
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#f8fafc',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    padding: 0,
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginVertical: 4,
    borderRadius: 10,
  },
  categoryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

