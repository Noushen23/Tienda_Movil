import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '../hooks/useThemeColor';

interface ThemedPickerProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  items: Array<{ label: string; value: string }>;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}

export default function ThemedPicker<T extends FieldValues>({
  control,
  name,
  label,
  placeholder = 'Seleccione una opción',
  items,
  icon,
  disabled = false,
}: ThemedPickerProps<T>) {
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#d1d5db', dark: '#4b5563' }, 'icon');
  const iconColor = useThemeColor({}, 'icon');
  const placeholderColor = useThemeColor({}, 'tabIconDefault');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        // En iOS usamos un modal con mejor UX
        if (Platform.OS === 'ios') {
          return (
            <IOSPickerModal
              value={value}
              onChange={onChange}
              items={items}
              placeholder={placeholder}
              icon={icon}
              label={label}
              error={error}
              disabled={disabled}
              textColor={textColor}
              backgroundColor={backgroundColor}
              borderColor={borderColor}
              iconColor={iconColor}
              placeholderColor={placeholderColor}
              tintColor={tintColor}
            />
          );
        }

        // En Android usamos el Picker nativo
        return (
          <View style={styles.container}>
            {label && (
              <ThemedText style={styles.label}>{label}</ThemedText>
            )}
            
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: backgroundColor,
                  borderColor: error ? '#d32f2f' : borderColor,
                },
              ]}
            >
              {icon && (
                <Ionicons
                  name={icon}
                  size={20}
                  color={iconColor}
                  style={styles.icon}
                />
              )}

              <Picker
                selectedValue={value}
                onValueChange={(itemValue) => onChange(itemValue)}
                enabled={!disabled}
                style={[
                  styles.picker,
                  {
                    color: value ? textColor : placeholderColor,
                  },
                ]}
                dropdownIconColor={iconColor}
              >
                <Picker.Item
                  label={placeholder}
                  value=""
                  color={placeholderColor}
                />
                {items.map((item) => (
                  <Picker.Item
                    key={item.value}
                    label={item.label}
                    value={item.value}
                    color={textColor}
                  />
                ))}
              </Picker>
            </View>

            {error && (
              <ThemedText style={styles.errorText}>
                {error.message}
              </ThemedText>
            )}
          </View>
        );
      }}
    />
  );
}

// Componente especial para iOS con modal
function IOSPickerModal({
  value,
  onChange,
  items,
  placeholder,
  icon,
  label,
  error,
  disabled,
  textColor,
  backgroundColor,
  borderColor,
  iconColor,
  placeholderColor,
  tintColor,
}: any) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  const selectedItem = items.find((item: any) => item.value === value);
  const displayText = selectedItem ? selectedItem.label : placeholder;

  const handleConfirm = () => {
    onChange(tempValue);
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText style={styles.label}>{label}</ThemedText>
      )}
      
      <TouchableOpacity
        onPress={() => !disabled && setIsModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: backgroundColor,
              borderColor: error ? '#d32f2f' : borderColor,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={iconColor}
              style={styles.icon}
            />
          )}
          
          <ThemedText
            style={[
              styles.pickerText,
              {
                color: value ? textColor : placeholderColor,
              },
            ]}
          >
            {displayText}
          </ThemedText>

          <Ionicons
            name="chevron-down"
            size={20}
            color={iconColor}
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>

      {error && (
        <ThemedText style={styles.errorText}>
          {error.message}
        </ThemedText>
      )}

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={handleCancel}
        >
          <Pressable 
            style={[styles.modalContent, { backgroundColor }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel}>
                <ThemedText style={[styles.modalButton, { color: iconColor }]}>
                  Cancelar
                </ThemedText>
              </TouchableOpacity>
              
              <ThemedText style={styles.modalTitle}>
                {label || placeholder}
              </ThemedText>
              
              <TouchableOpacity onPress={handleConfirm}>
                <ThemedText style={[styles.modalButton, { color: tintColor }]}>
                  Confirmar
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Opciones */}
            <ScrollView style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.option,
                  !tempValue && styles.optionSelected,
                  { borderBottomColor: borderColor },
                ]}
                onPress={() => setTempValue('')}
              >
                <ThemedText
                  style={[
                    styles.optionText,
                    { color: placeholderColor },
                    !tempValue && { fontWeight: '600', color: tintColor },
                  ]}
                >
                  {placeholder}
                </ThemedText>
                {!tempValue && (
                  <Ionicons name="checkmark" size={24} color={tintColor} />
                )}
              </TouchableOpacity>

              {items.map((item: any) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.option,
                    tempValue === item.value && styles.optionSelected,
                    { borderBottomColor: borderColor },
                  ]}
                  onPress={() => setTempValue(item.value)}
                >
                  <ThemedText
                    style={[
                      styles.optionText,
                      { color: textColor },
                      tempValue === item.value && { fontWeight: '600', color: tintColor },
                    ]}
                  >
                    {item.label}
                  </ThemedText>
                  {tempValue === item.value && (
                    <Ionicons name="checkmark" size={24} color={tintColor} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  icon: {
    marginRight: 10,
  },
  picker: {
    flex: 1,
    height: 50,
    marginLeft: -8,
  },
  pickerText: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  chevron: {
    marginLeft: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  // Estilos del Modal (iOS)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalButton: {
    fontSize: 17,
    fontWeight: '400',
  },
  optionsContainer: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  optionSelected: {
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  optionText: {
    fontSize: 16,
  },
});

