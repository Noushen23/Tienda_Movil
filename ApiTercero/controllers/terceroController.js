/**
 * Controlador principal de terceros
 * Operaciones CRUD completas de terceros - Versión optimizada
 */

const express = require('express');
const router = express.Router();
const { createConnection, executeQuery, executeTransactionWithCallback } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { buildPaginationParams, buildPaginationResponse } = require('../utils/dataUtils');
const { ERROR_CODES } = require('../utils/constants');
const terceroService = require('../services/terceroService');
const { 
  executeQueryInTransaction, 
  normalizeTerceroData, 
  validateTerceroData, 
  validateForeignReferences, 
  writeAuditLog 
} = require('../utils/terceroHelpers');

/**
 * Busca el DEPARTAMENTO correcto basado en el nombre de la ciudad
 */
const findDepartamento = async (ciudadName) => {
  if (!ciudadName || String(ciudadName).trim() === '') {
    return null;
  }
  
  try {
    const departamentoQuery = `
      SELECT DEPARTAMENTO 
      FROM CIUDANE 
      WHERE UPPER(TRIM(NOMBRE)) = UPPER(TRIM(?))
    `;
    const departamentoRows = await executeQuery(departamentoQuery, [String(ciudadName).trim()]);
    
    if (departamentoRows && departamentoRows.length > 0) {
      return departamentoRows[0].DEPARTAMENTO;
    }
  } catch (error) {
    console.warn('Error buscando DEPARTAMENTO:', error.message);
  }
  
  return null;
};

/**
 * Busca el CIUDANEID correcto basado en el nombre de la ciudad
 */
const findCiudadId = async (ciudadName) => {
  if (!ciudadName || String(ciudadName).trim() === '') {
    return null;
  }
  
  try {
    const ciudadQuery = `
      SELECT CIUDANEID 
      FROM CIUDANE 
      WHERE UPPER(TRIM(NOMBRE)) = UPPER(TRIM(?))
    `;
    const ciudadRows = await executeQuery(ciudadQuery, [String(ciudadName).trim()]);
    
    if (ciudadRows && ciudadRows.length > 0) {
      return ciudadRows[0].CIUDANEID;
    }
  } catch (error) {
    console.warn('Error buscando CIUDANEID:', error.message);
  }
  
  return null;
};

// Aplicar middleware de autenticación solo a rutas que lo requieren
// Las rutas GET son públicas para permitir búsquedas desde el backend

/**
 * POST /api/terceros - Crear nuevo tercero (requiere autenticación)
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const data = normalizeTerceroData(req.body);
  const validationErrors = validateTerceroData(data);
  
  if (validationErrors.length > 0) {
    throw createError('Validación fallida', 400, ERROR_CODES.BAD_REQUEST, validationErrors);
  }
  
  const connection = await createConnection();
  
  try {
    // Buscar CIUDANEID y DEPARTAMENTO correctos
    const ciudadId = await findCiudadId(data.CIUDAD);
    const departamento = await findDepartamento(data.CIUDAD);
    
    if (!ciudadId) {
      throw createError(
        `La ciudad "${data.CIUDAD}" no existe en el sistema. Por favor, contacte al administrador para agregar esta ciudad.`,
        400,
        ERROR_CODES.CIUDANE_INEXISTENTE,
        [{ field: 'CIUDAD', message: `Ciudad "${data.CIUDAD}" no encontrada` }]
      );
    }
    
    data.CIUDANEID = ciudadId;
    data.CIUDANEID1 = ciudadId; // CIUDANEID1 = CIUDANEID según migración TNS
    
    if (departamento) {
      data.DEPARTAMENTO = departamento;
    }
    
    const nuevoId = await executeTransactionWithCallback(connection, async (transaction) => {
      await validateForeignReferences(transaction, data);
      
      // Verificar duplicado por NIT
      const duplicate = await executeQueryInTransaction(transaction, 'SELECT TERID FROM TERCEROS WHERE TRIM(NIT) = ?', [data.NIT]);
      if (duplicate?.length > 0) throw createError(`Ya existe un tercero con NIT: ${data.NIT}`, 409, 'NIT_DUPLICADO');

      // Si el EMAIL ya existe, setearlo a NULL para permitir inserción
      if (data.EMAIL) {
        const emailExists = await executeQueryInTransaction(
          transaction,
          'SELECT TERID FROM TERCEROS WHERE TRIM(UPPER(EMAIL)) = TRIM(UPPER(?))',
          [data.EMAIL]
        );
        if (emailExists?.length > 0) {
          data.EMAIL = null;
        }
      }
      
      // Insertar tercero
      const fields = ['NIT', 'NITTRI', 'TIPODOCIDEN', 'NOMBRE', 'DIRECC1', 'DIRECC2', 'CIUDAD', 'CIUDANEID', 'CIUDANEID1', 'DEPARTAMENTO',
        'TELEF1', 'TELEF2', 'EMAIL', 'CLIENTE', 'PROVEED', 'VENDED', 'VRULTCOM', 'ETERRITORIAL', 'FACTELECT', 
        'NOREPORCIR', 'SINCRONIZADO', 'FECHCREAC', 'NATJURIDICA', 'RESPONSABILIDADES', 'LISTAPRECIOID', 
        'MAXCREDCXC', 'MAXCREDDIAS', 'ZONA1', 'CLASIFICAID', 'CODPOSTAL', 
        // Campos migración TNS
        'COBRA', 'PORRETEN', 'CONDUCTOR', 'TOMADOR', 'PROPIETARIO', 
        'EMPLEADO', 'FIADOR', 'NOMREGTRI', 'OTRO', 'MOSTRADOR', 'MESA'];
      
      const values = fields.map(field => {
        if (field === 'CIUDAD') {
          return data.CIUDANAME || data[field];
        }
        // Campos migración TNS con valores por defecto
        if (['COBRA', 'PORRETEN', 'CONDUCTOR', 'TOMADOR', 'PROPIETARIO', 
             'EMPLEADO', 'FIADOR', 'OTRO', 'MOSTRADOR', 'MESA'].includes(field)) {
          return 'N';
        }
        if (field === 'NOMREGTRI') {
          return data.NOMBRE; // NOMREGTRI = NOMBRE según migración TNS
        }
        if (field === 'ZONA1' || field === 'CLASIFICAID') {
          return 1; // Valores por defecto para TNS
        }
        if (field === 'CODPOSTAL') {
          return data.CODPOSTAL || ''; // Usar valor del formulario o vacío
        }
        return data[field];
      });
      
      try {
        await executeQueryInTransaction(transaction, 
          `INSERT INTO TERCEROS (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, 
          values);
      } catch (error) {
        if (error?.gdscode === 335544665 || String(error?.message).toLowerCase().includes('unique')) {
          throw createError(`Ya existe un tercero con NIT: ${data.NIT}`, 409, 'NIT_DUPLICADO');
        }
        if (error?.gdscode === 335544466 || /FOREIGN KEY/i.test(String(error?.message))) {
          throw createError('Clave foránea inválida', 400, ERROR_CODES.FK_VIOLATION);
        }
        throw error;
      }
      
      // Obtener TERID generado
      const teridResult = await executeQueryInTransaction(transaction, 'SELECT TERID FROM TERCEROS WHERE TRIM(NIT) = ?', [data.NIT]);
      if (!teridResult?.[0]?.TERID) throw createError('No se pudo obtener TERID generado', 500, 'TERID_NOT_GENERATED');
      
      return Number(teridResult[0].TERID);
    });
    
    const tercero = await executeQuery('SELECT * FROM TERCEROS WHERE TERID = ?', [nuevoId]);
    writeAuditLog({ action: 'create', entity: 'TERCEROS', id: nuevoId, route: '/api/terceros', method: 'POST', before: null, after: tercero[0] });
    
    res.status(201).json({ success: true, message: 'Tercero creado exitosamente', data: tercero[0] });
  } finally {
    connection?.detach?.();
  }
}));

/**
 * GET /api/terceros/search - Buscar tercero solo por NIT (público)
 */
router.get('/search', asyncHandler(async (req, res) => {
  const { nit } = req.query;
  
  if (!nit) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere NIT para la búsqueda'
    });
  }
  
  try {
    const query = 'SELECT TERID, NIT, NOMBRE, EMAIL FROM TERCEROS WHERE TRIM(NIT) = ?';
    const params = [nit.trim()];
    
    const result = await executeQuery(query, params);
    
    if (result && result.length > 0) {
      res.json({
        success: true,
        data: result[0]
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Tercero no encontrado'
      });
    }
  } catch (error) {
    console.error('Error buscando tercero:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}));

/**
 * GET /api/terceros/vendedores - Listar vendedores
 */
router.get('/vendedores', asyncHandler(async (req, res) => {
  const { page, limit, search } = req.query;
  const pagination = buildPaginationParams(page, limit);
  
  const filters = {
    search,
    pagination,
    VENDED: 'S'
  };
  
  const result = await terceroService.getVendedores(filters);
  const response = buildPaginationResponse(result.data, result.total, result.pageNum, result.limitNum);
  res.json(response);
}));

/**
 * GET /api/terceros/:id - Obtener tercero por ID con información completa
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validar ID básico
  if (!id || String(id).trim() === '') {
    throw createError(
      'ID es requerido',
      400,
      ERROR_CODES.BAD_REQUEST,
      [{ field: 'id', message: 'ID es requerido' }]
    );
  }
  
  // Obtener tercero usando el servicio
  const { tercero, vendedorInfo, direcciones } = await terceroService.getTerceroById(id);
  
  // Formatear respuesta
  const response = terceroService.formatTerceroResponse(tercero, vendedorInfo, direcciones);
  res.json(response);
}));

/**
 * GET /api/terceros - Listar todos los terceros con paginación
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, search, tipo } = req.query;
  const pagination = buildPaginationParams(page, limit);
  
  const filters = {
    search,
    tipo,
    pagination
  };
  
  const result = await terceroService.getTerceros(filters);
  const response = buildPaginationResponse(result.data, result.total, result.pageNum, result.limitNum);
  res.json(response);
}));

module.exports = router;
