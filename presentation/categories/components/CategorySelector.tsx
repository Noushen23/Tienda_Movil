import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/presentation/theme/components/ThemedText';
import { useThemeColor } from '@/presentation/theme/hooks/useThemeColor';
import { useCategories } from '../hooks/useCategories';

interface CategorySelectorProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string | null) => void;
  showAllOption?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  showAllOption = true,
}) => {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const { data: categoriesData, isLoading, error } = useCategories({ activa: true });
  const categories = categoriesData?.categories || [];

  const handleCategoryPress = (categoryId: string | null) => {
    onCategorySelect(categoryId);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={tintColor} />
        <ThemedText style={styles.loadingText}>Cargando categorías...</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={20} color="#ef4444" />
        <ThemedText style={styles.errorText}>Error al cargar categorías</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Opción "Todas" */}
        {showAllOption && (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategoryId && styles.selectedChip,
            ]}
            onPress={() => handleCategoryPress(null)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="grid-outline" 
              size={16} 
              color={!selectedCategoryId ? 'white' : "#64748b"} 
            />
            <ThemedText
              style={[
                styles.chipText,
                { color: !selectedCategoryId ? 'white' : "#334155" }
              ]}
            >
              Todas
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Lista de categorías */}
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategoryId === category.id && styles.selectedChip,
            ]}
            onPress={() => handleCategoryPress(category.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="checkbox-outline" 
              size={16} 
              color={selectedCategoryId === category.id ? 'white' : "#64748b"} 
            />
            <ThemedText
              style={[
                styles.chipText,
                { color: selectedCategoryId === category.id ? 'white' : "#334155" }
              ]}
              numberOfLines={1}
            >
              {category.nombre}
            </ThemedText>
          </TouchableOpacity>
        ))}

        {/* Mensaje si no hay categorías */}
        {categories.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={20} color="#94a3b8" />
            <ThemedText style={styles.emptyText}>Sin categorías</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 50,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,  // antes 3
    borderBottomColor: '#e2e8f0',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    marginBottom: 0,   // 🔹 quita el espacio inferior
    marginTop: 0,      // 🔹 quita el espacio superior
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 4, // 🔹 reduce este valor (antes 8)
  },
  

  // 🌸 Estilo de chip de categoría
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f9fafb',
    minHeight: 38,

    // Sombras sutiles estilo iOS / SHEIN
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },

  selectedChip: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    transform: [{ scale: 1.03 }],
  },

  chipText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.3,
    color: '#334155',
    textTransform: 'capitalize',
  },

  // 🌀 Estados de carga y error
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },

  // 🪶 Cuando no hay categorías
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 6,
    fontWeight: '500',
  },
});
