/**
 * Servicio de terceros - Lógica de negocio centralizada
 */

const { executeQuery } = require('../config/database');
const { buildWhereConditions, processTerceroResults } = require('../utils/dataUtils');
const { createError } = require('../middleware/errorHandler');
const { ERROR_CODES } = require('../utils/constants');

/**
 * Campos base para consultas de terceros - Migrado a TNS
 */
const TERCERO_FIELDS = `
  t.TERID, t.NIT, t.TIPODOCIDEN, t.NITTRI, t.CIUDADREXP, t.NOMBRE as NOMBRE_TERCERO, t.DIRECC1, t.DIRECC2, 
  t.CIUDAD, t.DEPARTAMENTO, t.TELEF1, t.TELEF2, t.CLIENTE, t.PROVEED, t.VENDED, t.EMAIL, 
  t.NATJURIDICA, t.RESPONSABILIDADES, t.LISTAPRECIOID, t.MAXCREDCXC, t.MAXCREDDIAS, t.ZONA1,
  t.VRULTCOM, t.ETERRITORIAL, t.FACTELECT, t.NOREPORCIR, t.SINCRONIZADO, t.FECHCREAC, 
  t.CLASIFICAID, 
  'N' as COBRA,
  'N' as PORRETEN,
  'N' as CONDUCTOR,
  'N' as TOMADOR,
  'N' as PROPIETARIO,
  'N' as EMPLEADO,
  'N' as FIADOR,
  t.NOMBRE as NOMREGTRI,
  'N' as OTRO,
  'N' as MOSTRADOR,
  'N' as MESA,
  z.CODIGO as CODIGO_ZONA, z.NOMBRE as NOMBRE_ZONA,
  NULL as CODIGO_CIUDAD, NULL as NOMBRE_CIUDAD, NULL as NOMBRE_DEPARTAMENTO,
  ts.VENDEDOR1, ts.SUSPENDIDO, ts.OBSERVCAR, ts.MAXPLAZO as PLAZO_DIAS_CARTERA,
  ts.REGSIMPLIF, ts.AUTORRETEN, ts.GRANCONTRI, ts.CREDFISCAL, ts.CLIENTETIPO, ts.TEREXENTO
`;

/**
 * Consulta información de ciudad de forma segura
 */
const getCiudadInfo = async (ciudadId) => {
  if (!ciudadId || ciudadId === 'SIN CIUDAD' || isNaN(ciudadId)) {
    return { CODIGO_CIUDAD: null, NOMBRE_CIUDAD: 'SIN CIUDAD', NOMBRE_DEPARTAMENTO: null };
  }
  
  try {
    const ciudadQuery = `
      SELECT CODIGO, NOMBRE, DEPARTAMENTO 
      FROM CIUDANE 
      WHERE CIUDANEID = ?
    `;
    const ciudadRows = await executeQuery(ciudadQuery, [parseInt(ciudadId)]);
    
    if (ciudadRows && ciudadRows.length > 0) {
      return {
        CODIGO_CIUDAD: ciudadRows[0].CODIGO,
        NOMBRE_CIUDAD: ciudadRows[0].NOMBRE,
        NOMBRE_DEPARTAMENTO: ciudadRows[0].DEPARTAMENTO
      };
    }
  } catch (error) {
    console.warn('Error consultando información de ciudad:', error.message);
  }
  
  return { CODIGO_CIUDAD: null, NOMBRE_CIUDAD: 'SIN CIUDAD', NOMBRE_DEPARTAMENTO: null };
};

/**
 * Consulta información del vendedor
 */
const getVendedorInfo = async (vendedorId) => {
  if (!vendedorId) return null;
  
  try {
    const vendedorQuery = `
      SELECT TERID, NIT, NOMBRE 
      FROM TERCEROS 
      WHERE TERID = ?
    `;
    const vendedorRows = await executeQuery(vendedorQuery, [vendedorId]);
    return vendedorRows && vendedorRows.length > 0 ? vendedorRows[0] : null;
  } catch (error) {
    console.warn('Error consultando información de vendedor:', error.message);
    return null;
  }
};

/**
 * Consulta direcciones adicionales de forma segura
 */
const getDirecciones = async (ciudadId) => {
  if (!ciudadId || ciudadId === 'SIN CIUDAD' || isNaN(ciudadId)) {
    return [];
  }
  
  try {
    const direccionesQuery = `
      SELECT 
        c.CODIGO as codigoCiudad,
        c.NOMBRE as ciudad,
        '' as direccion,
        'Activo' as estado
      FROM CIUDANE c 
      WHERE c.CIUDANEID = ?
    `;
    const dirRows = await executeQuery(direccionesQuery, [parseInt(ciudadId)]);
    return dirRows || [];
  } catch (error) {
    console.warn('Error consultando direcciones:', error.message);
    return [];
  }
};

/**
 * Obtiene terceros con paginación y filtros
 */
const getTerceros = async (filters = {}) => {
  // Extraer paginación
  const { pageNum, limitNum, offset } = filters.pagination || { pageNum: 1, limitNum: 50, offset: 0 };
  
  // Construir filtros sin paginación
  const filterData = { ...filters };
  delete filterData.pagination;
  
  const { whereClause, params } = buildWhereConditions(filterData);
  
  // Contar total
  const countQuery = `SELECT COUNT(*) AS TOTAL FROM TERCEROS ${whereClause}`;
  const totalResult = await executeQuery(countQuery, params);
  const total = totalResult[0].TOTAL;
  
  // Query principal con paginación usando sintaxis Firebird
  const query = `
    SELECT FIRST ${limitNum} SKIP ${offset}
      ${TERCERO_FIELDS}
    FROM TERCEROS t
    LEFT JOIN ZONAS z ON t.ZONA1 = z.ZONAID
    LEFT JOIN TERCEROSSELF ts ON t.TERID = ts.TERID
    ${whereClause}
    ORDER BY t.NOMBRE ASC
  `;
  
  const rows = await executeQuery(query, params);
  const processedRows = processTerceroResults(rows);
  
  return {
    data: processedRows,
    total,
    pageNum,
    limitNum
  };
};

/**
 * Obtiene vendedores con paginación y búsqueda
 */
const getVendedores = async (filters = {}) => {
  // Agregar filtro específico para vendedores
  const vendedorFilters = { ...filters };
  
  // Construir WHERE específico para vendedores
  const { search, pagination } = vendedorFilters;
  const { pageNum, limitNum, offset } = pagination || { pageNum: 1, limitNum: 50, offset: 0 };
  
  let whereConditions = ['t.VENDED = ?'];
  let params = ['S'];
  
  if (search && search.trim()) {
    whereConditions.push('(UPPER(t.NOMBRE) LIKE UPPER(?) OR UPPER(t.NIT) LIKE UPPER(?))');
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }
  
  const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
  
  // Contar total
  const countQuery = `SELECT COUNT(*) AS TOTAL FROM TERCEROS t ${whereClause}`;
  const totalResult = await executeQuery(countQuery, params);
  const total = totalResult[0].TOTAL;
  
  // Query principal simplificada para vendedores
  const query = `
    SELECT FIRST ${limitNum} SKIP ${offset}
      t.TERID, t.NIT, t.TIPODOCIDEN, t.NOMBRE 
    FROM TERCEROS t
    ${whereClause}
    ORDER BY t.NOMBRE ASC
  `;
  
  const rows = await executeQuery(query, params);
  const processedRows = processTerceroResults(rows);
  
  return {
    data: processedRows,
    total,
    pageNum,
    limitNum
  };
};

/**
 * Obtiene un tercero por ID con información completa
 */
const getTerceroById = async (id) => {
  // Validar ID
  const idNum = parseInt(id);
  if (isNaN(idNum) || idNum <= 0) {
    throw createError(
      'ID inválido',
      400,
      ERROR_CODES.BAD_REQUEST,
      [{ field: 'id', message: `ID debe ser un número positivo, recibido: ${id}` }]
    );
  }
  
  // Consulta principal
  const query = `
    SELECT ${TERCERO_FIELDS}
    FROM TERCEROS t
    LEFT JOIN ZONAS z ON t.ZONA1 = z.ZONAID
    LEFT JOIN TERCEROSSELF ts ON t.TERID = ts.TERID
    WHERE t.TERID = ?
  `;
  const rows = await executeQuery(query, [idNum]);
  
  if (!rows || rows.length === 0) {
    throw createError(
      'Tercero no encontrado',
      404,
      ERROR_CODES.NOT_FOUND
    );
  }
  
  const processedRows = processTerceroResults(rows);
  const tercero = processedRows[0];
  
  // Obtener información adicional en paralelo
  const [ciudadInfo, vendedorInfo, direcciones] = await Promise.all([
    getCiudadInfo(tercero.CIUDAD),
    getVendedorInfo(tercero.VENDEDOR1),
    getDirecciones(tercero.CIUDAD)
  ]);
  
  // Aplicar información adicional
  Object.assign(tercero, ciudadInfo);
  
  return {
    tercero,
    vendedorInfo,
    direcciones
  };
};

/**
 * Formatea la respuesta del tercero según el formato requerido
 */
const formatTerceroResponse = (tercero, vendedorInfo = null, direcciones = []) => {
  return {
    status: true,
    message: "Tercero encontrado exitosamente",
    data: {
      id: String(tercero.TERID || ''),
      codigo: String(tercero.TERID || ''),
      tipoDocumento: tercero.TIPODOCIDEN || '',
      nit: tercero.NIT || '',
      nombre: tercero.NOMBRE_TERCERO || '',
      direccion: tercero.DIRECC1 || '',
      codigoZona: tercero.CODIGO_ZONA || '',
      nombreZona: tercero.NOMBRE_ZONA || '',
      codigoBarrio: '',
      nombreBarrio: '',
      telefefono: tercero.TELEF1 || '',
      representanteLegal: '',
      observacion: tercero.OBSERVCAR || '',
      email: tercero.EMAIL || '',
      empbeeper: '',
      empcelular: tercero.TELEF2 || '',
      fechaCrea: tercero.FECHCREAC || '',
      fechaActualizacion: '',
      codigoClasificacion: String(tercero.CLASIFICAID || ''),
      nombreClasificacion: '',
      idCuentaAuxiliar: '',
      codigoCuentaAuxiliar: '',
      nombreCuentaAuxiliar: '',
      naturalezaJuridica: tercero.NATJURIDICA || '',
      codigoCiudad: tercero.CODIGO_CIUDAD || '',
      nombreCiudad: tercero.NOMBRE_CIUDAD || '',
      ciudadExpedicion: tercero.CIUDADREXP || '',
      inactivo: tercero.SUSPENDIDO === 'S' ? 'S' : 'N',
      nombreRegimenTributario: tercero.NOMREGTRI || '',
      porcentajeRetencionIvaCompra: String(tercero.PORRETEN || '0'),
      porcentajeRetencionIvaVenta: String(tercero.PORRETEN || '0'),
      fechaExpedicion: '',
      nitRepresentanteLegal: '',
      privada: 'N',
      mixta: 'N',
      regimenSimplificado: tercero.REGSIMPLIF || 'N',
      autoRetenedor: tercero.AUTORRETEN || 'N',
      granContribuyente: tercero.GRANCONTRI || 'N',
      excentoIva: tercero.TEREXENTO || 'N',
      listaPrecio: String(tercero.LISTAPRECIOID || ''),
      fiador1: '',
      codigoFiador1: '',
      nombreFiador1: '',
      fiador2: '',
      codigoFiador2: '',
      nombreFiador2: '',
      codigoCobrador: '',
      nombreCobrador: '',
      observacionCartera: tercero.OBSERVCAR || '',
      comision: String(tercero.VRULTCOM || '0'),
      codigoVendedor: vendedorInfo ? String(vendedorInfo.TERID || '') : '',
      nombreVendedor: vendedorInfo ? vendedorInfo.NOMBRE || '' : '',
      inquilino: 'N',
      cliente: tercero.CLIENTE || 'N',
      proveed: tercero.PROVEED || 'N',
      vended: tercero.VENDED || 'N',
      cobra: tercero.COBRA || 'N',
      accionista: 'N',
      asociado: 'N',
      otro: tercero.OTRO || 'N',
      mostrador: tercero.MOSTRADOR || 'N',
      fiador: tercero.FIADOR || 'N',
      propietario: tercero.PROPIETARIO || 'N',
      empleado: tercero.EMPLEADO || 'N',
      mesa: tercero.MESA || 'N',
      plazoDiasCartera: String(tercero.PLAZO_DIAS_CARTERA || '0'),
      matriculaMercantil: '',
      direcciones: direcciones
    }
  };
};

module.exports = {
  getTerceros,
  getVendedores,
  getTerceroById,
  formatTerceroResponse,
  getCiudadInfo,
  getVendedorInfo,
  getDirecciones
};
