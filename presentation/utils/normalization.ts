/**
 * Utilidades de normalización de texto para el frontend móvil
 * Maneja caracteres especiales (acentos, tildes) para compatibilidad con TNS
 */

/**
 * Normalizar ciudad para búsqueda (remover acentos)
 * normalize("NFD") separa los caracteres base de sus acentos (por ejemplo, "ú" → "u" + "´")
 * replace(/[\u0300-\u036f]/g, "") elimina todos esos signos diacríticos (tildes, diéresis, etc.)
 * Funciona también con letras como "Ñ" → no se elimina, porque no es un acento, es una letra propia
 */
export const normalizeCityForSearch = (city: string): string => {
  if (!city) return '';
  return city
    .normalize("NFD")  // Separar caracteres base de acentos
    .replace(/[\u0300-\u036f]/g, "")  // Eliminar signos diacríticos
    .toUpperCase()
    .trim();
};

/**
 * Normalizar ciudad para almacenamiento (SIN acentos)
 * Elimina acentos y capitaliza la primera letra de cada palabra
 */
export const normalizeCityForStorage = (city: string): string => {
  if (!city) return '';
  return city
    .normalize("NFD")  // Separar caracteres base de acentos
    .replace(/[\u0300-\u036f]/g, "")  // Eliminar signos diacríticos
    .trim()
    .replace(/\s+/g, ' ')  // Normalizar espacios múltiples
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Normalizar departamento para almacenamiento (SIN acentos)
 */
export const normalizeDepartmentForStorage = (department: string): string => {
  if (!department) return '';
  return department
    .normalize("NFD")  // Separar caracteres base de acentos
    .replace(/[\u0300-\u036f]/g, "")  // Eliminar signos diacríticos
    .trim()
    .replace(/\s+/g, ' ')  // Normalizar espacios múltiples
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Normalizar dirección para almacenamiento (SIN acentos)
 */
export const normalizeAddressForStorage = (address: string): string => {
  if (!address) return '';
  return address
    .normalize("NFD")  // Separar caracteres base de acentos
    .replace(/[\u0300-\u036f]/g, "")  // Eliminar signos diacríticos
    .trim()
    .replace(/\s+/g, ' ')  // Normalizar espacios múltiples
    .split(' ')
    .map(word => {
      // Mantener números y caracteres especiales como están
      if (/^[0-9#-]+$/.test(word)) {
        return word;
      }
      // Capitalizar palabras normales (sin acentos)
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

/**
 * Normalizar nombre para almacenamiento (SIN acentos)
 */
export const normalizeNameForStorage = (name: string): string => {
  if (!name) return '';
  return name
    .normalize("NFD")  // Separar caracteres base de acentos
    .replace(/[\u0300-\u036f]/g, "")  // Eliminar signos diacríticos
    .trim()
    .replace(/\s+/g, ' ')  // Normalizar espacios múltiples
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Función de normalización completa para datos de dirección
 */
export const normalizeAddressData = (addressData: {
  address?: string;
  city?: string;
  department?: string;
  country?: string;
  postalCode?: string;
}) => {
  return {
    address: normalizeAddressForStorage(addressData.address || ''),
    city: normalizeCityForStorage(addressData.city || ''),
    department: normalizeDepartmentForStorage(addressData.department || ''),
    country: normalizeCityForStorage(addressData.country || 'Colombia'),
    postalCode: addressData.postalCode?.trim() || undefined,
  };
};

/**
 * Ejemplos de normalización para testing (SIN acentos)
 */
export const normalizationExamples = {
  cities: [
    { original: 'bogotá', normalized: 'Bogota', search: 'BOGOTA' },
    { original: 'MEDELLÍN', normalized: 'Medellin', search: 'MEDELLIN' },
    { original: 'santa marta', normalized: 'Santa Marta', search: 'SANTA MARTA' },
    { original: 'cali', normalized: 'Cali', search: 'CALI' },
    { original: 'barranquilla', normalized: 'Barranquilla', search: 'BARRANQUILLA' },
    { original: 'cúcuta', normalized: 'Cucuta', search: 'CUCUTA' },
    { original: 'villavicencio', normalized: 'Villavicencio', search: 'VILLAVICENCIO' },
  ],
  departments: [
    { original: 'cundinamarca', normalized: 'Cundinamarca', search: 'CUNDINAMARCA' },
    { original: 'ANTIOQUIA', normalized: 'Antioquia', search: 'ANTIOQUIA' },
    { original: 'valle del cauca', normalized: 'Valle Del Cauca', search: 'VALLE DEL CAUCA' },
    { original: 'atlántico', normalized: 'Atlantico', search: 'ATLANTICO' },
    { original: 'santander', normalized: 'Santander', search: 'SANTANDER' },
    { original: 'norte de santander', normalized: 'Norte De Santander', search: 'NORTE DE SANTANDER' },
  ],
  addresses: [
    { original: 'calle 123 #45-67', normalized: 'Calle 123 #45-67' },
    { original: 'CARRERA 7 #32-16', normalized: 'Carrera 7 #32-16' },
    { original: 'avenida 6n #28-30', normalized: 'Avenida 6N #28-30' },
    { original: 'calle 93 #15-30', normalized: 'Calle 93 #15-30' },
  ]
};

/**
 * Función de prueba para verificar normalización
 */
export const testNormalization = () => {
  console.log('🔤 Pruebas de Normalización de Ciudades:');
  
  normalizationExamples.cities.forEach(example => {
    const normalized = normalizeCityForStorage(example.original);
    const search = normalizeCityForSearch(example.original);
    
    console.log(`   "${example.original}" → Almacenada: "${normalized}" | Búsqueda: "${search}"`);
    
    if (normalized !== example.normalized) {
      console.warn(`   ⚠️ Normalización incorrecta: esperada "${example.normalized}", obtenida "${normalized}"`);
    }
  });
  
  console.log('\n🏙️ Pruebas de Normalización de Departamentos:');
  normalizationExamples.departments.forEach(example => {
    const normalized = normalizeDepartmentForStorage(example.original);
    console.log(`   "${example.original}" → "${normalized}"`);
  });
  
  console.log('\n📍 Pruebas de Normalización de Direcciones:');
  normalizationExamples.addresses.forEach(example => {
    const normalized = normalizeAddressForStorage(example.original);
    console.log(`   "${example.original}" → "${normalized}"`);
  });
};
