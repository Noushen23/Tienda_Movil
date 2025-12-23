/**
 * Validadores reutilizables
 */

const { NATURALEZA_JURIDICA, FIELD_LIMITS } = require('./constants');

/**
 * Validador genérico que retorna { isValid, message }
 */
const createValidator = (testFn, errorMessage) => (value, fieldName) => {
  const isValid = testFn(value, fieldName);
  return { isValid, message: isValid ? null : errorMessage(value, fieldName) };
};

/**
 * Validadores específicos
 */
const validateEmail = createValidator(
  (email) => !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email)),
  () => 'EMAIL inválido'
);

const validateRequired = createValidator(
  (value) => value && String(value).trim() !== '',
  (_, fieldName) => `${fieldName} es obligatorio`
);

const validateNumeric = createValidator(
  (value) => value == null || String(value) === '' || Number.isFinite(Number(value)),
  (_, fieldName) => `${fieldName} debe ser numérico`
);

const validateNaturalezaJuridica = createValidator(
  (natJuridica) => !natJuridica || Object.values(NATURALEZA_JURIDICA).includes(String(natJuridica).trim().toUpperCase()),
  () => "NATJURIDICA debe ser 'N' o 'J'"
);

const validateMaxLength = (maxLength) => createValidator(
  (value) => !value || String(value).length <= maxLength,
  (_, fieldName) => `${fieldName} no puede tener más de ${maxLength} caracteres`
);

const validatePositiveId = createValidator(
  (id) => {
    const numId = parseInt(id);
    return !isNaN(numId) && numId > 0;
  },
  (_, fieldName = 'ID') => `${fieldName} inválido`
);

// Caché de validadores de longitud para evitar recreación
const lengthValidators = Object.fromEntries(
  Object.entries(FIELD_LIMITS).map(([field, limit]) => [field, validateMaxLength(limit)])
);

/**
 * Validador principal ultra-optimizado
 */
const validateTerceroData = (data) => {
  const errors = [];
  
  // Validaciones obligatorias (más directo)
  if (!data.NIT || !String(data.NIT).trim()) errors.push({ field: 'NIT', message: 'NIT es obligatorio' });
  if (!data.NOMBRE || !String(data.NOMBRE).trim()) errors.push({ field: 'NOMBRE', message: 'NOMBRE es obligatorio' });
  
  // Validaciones de formato (solo si tienen valor)
  if (data.EMAIL && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.EMAIL))) {
    errors.push({ field: 'EMAIL', message: 'EMAIL inválido' });
  }
  
  if (data.NATJURIDICA && !Object.values(NATURALEZA_JURIDICA).includes(String(data.NATJURIDICA).trim().toUpperCase())) {
    errors.push({ field: 'NATJURIDICA', message: "NATJURIDICA debe ser 'N' o 'J'" });
  }
  
  // Validaciones de longitud (usando caché)
  ['NIT', 'NOMBRE', 'EMAIL', 'DIRECC1', 'DIRECC2', 'TELEF1', 'TELEF2'].forEach(field => {
    if (data[field] && lengthValidators[field]) {
      const result = lengthValidators[field](data[field], field);
      if (!result.isValid) errors.push({ field, message: result.message });
    }
  });
  
  // Validaciones numéricas (optimizado)
  ['LISTAPRECIOID', 'MAXCREDCXC', 'MAXCREDDIAS', 'ZONA1', 'CIUDANEID'].forEach(field => {
    const value = data[field];
    if (value != null && String(value) !== '' && !Number.isFinite(Number(value))) {
      errors.push({ field, message: `${field} debe ser numérico` });
    }
  });
  
  return errors;
};

module.exports = {
  validateEmail, validateRequired, validateNumeric, validateNaturalezaJuridica,
  validateMaxLength, validatePositiveId, validateTerceroData
};
