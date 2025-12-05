/**
 * Helpers para operaciones de terceros
 */

const { TERCERO_DEFAULTS } = require('./constants');
const { normalizeFlag, normalizeNumber, getCurrentDate } = require('./dataUtils');
const { createError } = require('../middleware/errorHandler');

// Helper ultra-rápido para queries en transacciones
const executeQueryInTransaction = (transaction, query, params = []) => 
  new Promise((resolve, reject) => 
    transaction.query(query, params, (err, result) => err ? reject(err) : resolve(result))
  );

// Normaliza string (inline para performance)
const normalizeString = (value, defaultValue = '') => value ? String(value).trim() : defaultValue;

// Configuración estática para evitar recreaciones
const FIELD_CONFIG = {
  strings: ['DIRECC1', 'DIRECC2', 'EMAIL'],
  flags: ['CLIENTE', 'VENDED', 'PROVEED'],
  defaults: ['VRULTCOM', 'ETERRITORIAL', 'FACTELECT', 'NOREPORCIR', 'SINCRONIZADO', 
            'PORRETEN', 'CONDUCTOR', 'TOMADOR', 'PROPIETARIO', 'EMPLEADO', 'FIADOR', 'OTRO', 'MESA', 'MOSTRADOR'],
  numerics: ['ZONA1', 'CIUDANEID', 'LISTAPRECIOID']
};

/**
 * Normaliza datos TERCEROS (ultra-optimizado)
 */
const normalizeTerceroData = (body) => {
  const NIT = normalizeString(body.NIT);
  const NOMBRE = normalizeString(body.NOMBRE);
  const result = { NIT, NOMBRE };
  
  // Procesamiento batch optimizado
  FIELD_CONFIG.strings.forEach(f => result[f] = normalizeString(body[f]));
  FIELD_CONFIG.flags.forEach(f => result[f] = normalizeFlag(body[f], TERCERO_DEFAULTS[f]));
  FIELD_CONFIG.defaults.forEach(f => result[f] = body[f] ?? TERCERO_DEFAULTS[f]);
  FIELD_CONFIG.numerics.forEach(f => result[f] = normalizeNumber(body[f]));
  
  // Campos específicos (inline para performance)
  return Object.assign(result, {
    NITTRI: body.NITTRI || NIT, TIPODOCIDEN: body.TIPODOCIDEN || null,
    CIUDAD: body.CIUDAD || '', TELEF1: body.TELEF1 || '', TELEF2: body.TELEF2 || '',
    NATJURIDICA: body.NATJURIDICA ? String(body.NATJURIDICA).trim().toUpperCase() : null,
    RESPONSABILIDADES: normalizeString(body.RESPONSABILIDADES) || TERCERO_DEFAULTS.RESPONSABILIDADES,
    FECHCREAC: body.FECHCREAC ? String(body.FECHCREAC).slice(0, 10) : getCurrentDate(),
    CIUDANAME: body.CIUDANAME || body.CIUDAD || '', DEPARTAMENTO: body.DEPARTAMENTO || null,
    CLASIFICAID: normalizeNumber(body.CLASIFICAID, TERCERO_DEFAULTS.CLASIFICAID),
    MAXCREDCXC: normalizeNumber(body.MAXCREDCXC, TERCERO_DEFAULTS.MAXCREDCXC),
    MAXCREDDIAS: normalizeNumber(body.MAXCREDDIAS, TERCERO_DEFAULTS.MAXCREDDIAS),
    NOMREGTRI: body.NOMREGTRI ?? NOMBRE
  });
};

// Importar validaciones desde validators.js
const { validateTerceroData } = require('./validators');

// Configuración FK estática
const FK_CHECKS = [
  { field: 'CIUDANEID', table: 'CIUDANE', column: 'CIUDANEID' },
  { field: 'ZONA1', table: 'ZONAS', column: 'ZONAID' }
];

/**
 * Valida FKs (optimizado para performance)
 */
const validateForeignReferences = async (transaction, data) => {
  for (const { field, table, column } of FK_CHECKS) {
    const value = data[field];
    if (value != null && String(value) !== '') {
      const numericValue = +value; // Más rápido que Number()
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        throw createError(`${field} debe ser un número válido mayor a 0`, 400, `${field}_INVALID`);
      }
      
      const [result] = await executeQueryInTransaction(
        transaction, `SELECT COUNT(*) AS CNT FROM ${table} WHERE ${column} = ?`, [numericValue]
      );
      
      if (!result || +(result.CNT || 0) === 0) {
        throw createError(`${field} ${value} no existe en ${table}`, 400, `${field}_INEXISTENTE`);
      }
    }
  }
};

/**
 * Función básica de auditoría
 */
const writeAuditLog = (auditData) => {
  try {
    console.log('[AUDIT]', JSON.stringify({
      timestamp: new Date().toISOString(),
      ...auditData
    }));
  } catch (error) {
    console.error('Error escribiendo audit log:', error);
  }
};

module.exports = {
  executeQueryInTransaction, normalizeTerceroData, validateTerceroData,
  validateForeignReferences, writeAuditLog
};
