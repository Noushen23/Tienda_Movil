import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from '../hooks/useFilters';

export interface ProductFilters {
  categoriaId?: string;
  precioMin?: number;
  precioMax?: number;
  calificacionMin?: number;
  enOferta?: boolean;
  sortBy?: 'recientes' | 'precio_asc' | 'precio_desc' | 'ventas' | 'calificacion' | 'nombre';
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  currentFilters: ProductFilters;
  onApplyFilters: (filters: ProductFilters) => void;
  categories?: Array<{ id: string; nombre: string }>;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  currentFilters,
  onApplyFilters,
  categories = [],
}) => {
  const { } = useSearch();

  const [filters, setFilters] = useState<ProductFilters>(currentFilters);
  const [precioMinText, setPrecioMinText] = useState(currentFilters.precioMin?.toString() || '');
  const [precioMaxText, setPrecioMaxText] = useState(currentFilters.precioMax?.toString() || '');

  useEffect(() => {
    setFilters(currentFilters);
    setPrecioMinText(currentFilters.precioMin?.toString() || '');
    setPrecioMaxText(currentFilters.precioMax?.toString() || '');
  }, [currentFilters]);

  const handleApply = () => {
    const finalFilters: ProductFilters = {
      ...filters,
      precioMin: precioMinText ? parseFloat(precioMinText) : undefined,
      precioMax: precioMaxText ? parseFloat(precioMaxText) : undefined,
    };
    onApplyFilters(finalFilters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    setPrecioMinText('');
    setPrecioMaxText('');
    onApplyFilters({});
    onClose();
  };

  const sortOptions = [
    { value: 'recientes', label: 'Más Recientes', icon: 'time-outline' },
    { value: 'precio_asc', label: 'Precio: Menor a Mayor', icon: 'arrow-up-outline' },
    { value: 'precio_desc', label: 'Precio: Mayor a Menor', icon: 'arrow-down-outline' },
    { value: 'ventas', label: 'Más Vendidos', icon: 'trending-up-outline' },
    { value: 'calificacion', label: 'Mejor Calificados', icon: 'star-outline' },
    { value: 'nombre', label: 'Nombre (A-Z)', icon: 'text-outline' },
  ];

  const ratingOptions = [
    { value: 4, label: '4+ estrellas', icon: 'star' },
    { value: 3, label: '3+ estrellas', icon: 'star-half' },
    { value: 2, label: '2+ estrellas', icon: 'star-outline' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filtros y Ordenamiento</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetButton}>Limpiar</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Ordenar Por */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ordenar Por</Text>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  filters.sortBy === option.value && styles.optionSelected,
                ]}
                onPress={() => setFilters({ ...filters, sortBy: option.value as any })}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={filters.sortBy === option.value ? '#007AFF' : '#666'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      filters.sortBy === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {filters.sortBy === option.value && (
                  <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Rango de Precio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rango de Precio</Text>
            <View style={styles.priceInputs}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.inputLabel}>Mínimo</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    keyboardType="numeric"
                    value={precioMinText}
                    onChangeText={setPrecioMinText}
                  />
                </View>
              </View>
              <Text style={styles.priceSeparator}>-</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.inputLabel}>Máximo</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="999999"
                    keyboardType="numeric"
                    value={precioMaxText}
                    onChangeText={setPrecioMaxText}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Calificación Mínima */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calificación Mínima</Text>
            {ratingOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  filters.calificacionMin === option.value && styles.optionSelected,
                ]}
                onPress={() =>
                  setFilters({
                    ...filters,
                    calificacionMin: filters.calificacionMin === option.value ? undefined : option.value,
                  })
                }
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={filters.calificacionMin === option.value ? '#FFD700' : '#666'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      filters.calificacionMin === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {filters.calificacionMin === option.value && (
                  <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Categoría */}
          {categories.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categoría</Text>
              <TouchableOpacity
                style={[
                  styles.option,
                  !filters.categoriaId && styles.optionSelected,
                ]}
                onPress={() => setFilters({ ...filters, categoriaId: undefined })}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name="apps-outline" size={20} color={!filters.categoriaId ? '#007AFF' : '#666'} />
                  <Text
                    style={[
                      styles.optionText,
                      !filters.categoriaId && styles.optionTextSelected,
                    ]}
                  >
                    Todas las categorías
                  </Text>
                </View>
                {!filters.categoriaId && (
                  <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
                )}
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.option,
                    filters.categoriaId === category.id && styles.optionSelected,
                  ]}
                  onPress={() => setFilters({ ...filters, categoriaId: category.id })}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons
                      name="folder-outline"
                      size={20}
                      color={filters.categoriaId === category.id ? '#007AFF' : '#666'}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        filters.categoriaId === category.id && styles.optionTextSelected,
                      ]}
                    >
                      {category.nombre}
                    </Text>
                  </View>
                  {filters.categoriaId === category.id && (
                    <Ionicons name="checkmark-circle" size={22} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          

          {/* Solo Ofertas */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                filters.enOferta && styles.toggleOptionActive,
              ]}
              onPress={() => setFilters({ ...filters, enOferta: !filters.enOferta })}
            >
              <View style={styles.optionLeft}>
                <Ionicons
                  name="flash"
                  size={22}
                  color={filters.enOferta ? '#FFF' : '#FF9500'}
                />
                <Text
                  style={[
                    styles.toggleText,
                    filters.enOferta && styles.toggleTextActive,
                  ]}
                >
                  Solo Productos en Oferta
                </Text>
              </View>
              <View
                style={[
                  styles.toggle,
                  filters.enOferta && styles.toggleActive,
                ]}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    filters.enOferta && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer con botones */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  resetButton: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF3B30',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    marginTop: 12,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    paddingHorizontal: 20,
    paddingBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: '#F0F7FF',
    borderLeftColor: '#007AFF',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
  optionSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
  },
  priceSeparator: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 12,
    borderWidth: 2,
    borderColor: '#FF9500',
  },
  toggleOptionActive: {
    backgroundColor: '#FF9500',
    borderColor: '#FF9500',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF9500',
  },
  toggleTextActive: {
    color: '#FFF',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DDD',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#FFF',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  toggleThumbActive: {
    backgroundColor: '#FF9500',
    transform: [{ translateX: 22 }],
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

