/**
 * Utilidades para procesamiento de datos
 */

const { PAGINATION } = require('./constants');

/**
 * Normaliza valores booleanos a 'S'/'N'
 */
const normalizeFlag = (value, defaultValue = 'N') => 
  String(value ?? defaultValue).trim().toUpperCase() === 'S' ? 'S' : 'N';

/**
 * Normaliza valores numéricos
 */
const normalizeNumber = (value, defaultValue = null) => {
  if (value === undefined || value === null || String(value) === '') return defaultValue;
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

/**
 * Genera fecha actual en formato YYYY-MM-DD
 */
const getCurrentDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Construye parámetros para consulta de paginación (ultra-optimizado)
 */
const buildPaginationParams = (page, limit) => {
  const pageNum = Math.max(PAGINATION.MIN_PAGE, parseInt(page) || PAGINATION.DEFAULT_PAGE);
  const limitNum = Math.min(PAGINATION.MAX_LIMIT, Math.max(PAGINATION.MIN_LIMIT, parseInt(limit) || PAGINATION.DEFAULT_LIMIT));
  return { pageNum, limitNum, offset: (pageNum - 1) * limitNum };
};

/**
 * Construye respuesta de paginación (memoria optimizada)
 */
const buildPaginationResponse = (data, total, pageNum, limitNum) => {
  const safeTotal = Math.max(0, +total || 0);
  const safeLimitNum = Math.max(1, +limitNum || 1);
  const safePageNum = Math.max(1, +pageNum || 1);
  const totalPages = Math.ceil(safeTotal / safeLimitNum);
  
  return {
    success: true,
    data: data || [],
    pagination: {
      page: safePageNum, limit: safeLimitNum, total: safeTotal, totalPages,
      hasNext: safePageNum < totalPages, hasPrev: safePageNum > 1
    }
  };
};

// Defaults estáticos para evitar recreación en cada llamada
const TERCERO_RESULT_DEFAULTS = {
  NOMBRE_CIUDAD: 'SIN CIUDAD', CLIENTE: 'N', VENDED: 'N', PROVEED: 'N', SUSPENDIDO: 'N',
  EMAIL: '', TELEF1: '', TELEF2: '', DIRECC1: '', DIRECC2: ''
};

/**
 * Procesa resultados (memoria y performance optimizado)
 */
const processTerceroResults = (rows) => {
  if (!rows?.length) return [];
  
  return rows.map(row => {
    const processed = { ...row };
    for (const key in processed) {
      if (processed[key] == null) processed[key] = TERCERO_RESULT_DEFAULTS[key] || '';
      else if (typeof processed[key] === 'string') processed[key] = processed[key].trim();
    }
    return processed;
  });
};

/**
 * Construye condiciones WHERE dinámicamente
 */
const buildWhereConditions = (filters = {}) => {
  const conditions = [];
  const params = [];
  
  const tipoMap = { cliente: 'CLIENTE', vendedor: 'VENDED', proveedor: 'PROVEED' };
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value != null && String(value).trim()) {
      if (key === 'search') {
        conditions.push('(UPPER(NOMBRE) LIKE UPPER(?) OR UPPER(NIT) LIKE UPPER(?))');
        const searchTerm = `%${String(value).trim()}%`;
        params.push(searchTerm, searchTerm);
      } else if (key === 'tipo') {
        const tipoField = tipoMap[String(value).toLowerCase()];
        if (tipoField) {
          conditions.push(`${tipoField} = ?`);
          params.push('S');
        }
      } else {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }
  });
  
  return {
    whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

module.exports = {
  normalizeFlag, normalizeNumber, getCurrentDate, buildPaginationParams,
  buildPaginationResponse, processTerceroResults, buildWhereConditions
};
