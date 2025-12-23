/**
 * Controlador de TERCEROSSELF
 * Manejo optimizado de datos adicionales de terceros
 */

const express = require('express');
const router = express.Router();
const { createConnection, executeQuery, executeTransactionWithCallback } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { validatePositiveId } = require('../utils/validators');
const { ERROR_CODES } = require('../utils/constants');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

/**
 * GET /api/terceros-self - Listar todos los TERCEROSSELF disponibles
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { pageNum, limitNum, offset } = require('../utils/dataUtils').buildPaginationParams(page, limit);
  
  // Contar total
  const countQuery = `SELECT COUNT(*) AS TOTAL FROM TERCEROSSELF`;
  const totalResult = await executeQuery(countQuery);
  const total = totalResult[0].TOTAL;
  
  // Consulta principal con información del tercero
  const query = `
    SELECT FIRST ${limitNum} SKIP ${offset}
      ts.TERID, t.NIT, t.TIPODOCIDEN, t.NOMBRE, ts.VENDEDOR1, ts.SUSPENDIDO
    FROM TERCEROSSELF ts
    LEFT JOIN TERCEROS t ON ts.TERID = t.TERID
    ORDER BY ts.TERID ASC
  `;
  
  const rows = await executeQuery(query);
  
  const { buildPaginationResponse } = require('../utils/dataUtils');
  const response = buildPaginationResponse(rows, total, pageNum, limitNum);
  res.json(response);
}));

/**
 * Función helper para ejecutar queries en transacciones
 */
async function executeQueryInTransaction(transaction, query, params = []) {
  return new Promise((resolve, reject) => {
    transaction.query(query, params, (err, result) => (err ? reject(err) : resolve(result)));
  });
}

/**
 * Valores por defecto para TERCEROSSELF
 */
const TERCERO_SELF_DEFAULTS = {
  SUSPENDIDO: 'N',
  MAXPLAZO: 0,
  REGSIMPLIF: 'N',
  AUTORRETEN: 'N',
  SUELDO: 0,
  APORTE: 0,
  GRANCONTRI: 'N',
  CREDFISCAL: 'N',
  CLIENTETIPO: 'N',
  TEREXENTO: 'N',
  DECLARARENTA: 'N',
  DEPECONOMICO: 'N',
  EGRMENSUALES: 0,
  FUENTESALTERNAS: 'N',
  INGMENSUALES: 0,
  NUMPERCARGO: 0,
  OPERAMONEDAEXT: 'N',
  OTROINGVALOR: 0,
  POSEEMONEDAEXT: 'N',
  VAPORTE: 0,
  VIVIENDAPROPIA: 'N'
};

/**
 * Normaliza los datos de entrada para TERCEROSSELF
 */
const normalizeTerceroSelfData = (body) => {
  return {
    TERID: body.TERID,
    VENDEDOR1: body.VENDEDOR1,
    SUSPENDIDO: body.SUSPENDIDO ?? TERCERO_SELF_DEFAULTS.SUSPENDIDO,
    OBSERVCAR: body.OBSERVCAR,
    MAXPLAZO: Number(body.MAXPLAZO ?? TERCERO_SELF_DEFAULTS.MAXPLAZO),
    REGSIMPLIF: body.REGSIMPLIF ?? TERCERO_SELF_DEFAULTS.REGSIMPLIF,
    AUTORRETEN: body.AUTORRETEN ?? TERCERO_SELF_DEFAULTS.AUTORRETEN,
    SUELDO: Number(body.SUELDO ?? TERCERO_SELF_DEFAULTS.SUELDO),
    APORTE: Number(body.APORTE ?? TERCERO_SELF_DEFAULTS.APORTE),
    GRANCONTRI: body.GRANCONTRI ?? TERCERO_SELF_DEFAULTS.GRANCONTRI,
    CREDFISCAL: body.CREDFISCAL ?? TERCERO_SELF_DEFAULTS.CREDFISCAL,
    CLIENTETIPO: body.CLIENTETIPO ?? TERCERO_SELF_DEFAULTS.CLIENTETIPO,
    TEREXENTO: body.TEREXENTO ?? TERCERO_SELF_DEFAULTS.TEREXENTO,
    DECLARARENTA: body.DECLARARENTA ?? TERCERO_SELF_DEFAULTS.DECLARARENTA,
    DEPECONOMICO: body.DEPECONOMICO ?? TERCERO_SELF_DEFAULTS.DEPECONOMICO,
    EGRMENSUALES: Number(body.EGRMENSUALES ?? TERCERO_SELF_DEFAULTS.EGRMENSUALES),
    FUENTESALTERNAS: body.FUENTESALTERNAS ?? TERCERO_SELF_DEFAULTS.FUENTESALTERNAS,
    INGMENSUALES: Number(body.INGMENSUALES ?? TERCERO_SELF_DEFAULTS.INGMENSUALES),
    NUMPERCARGO: Number(body.NUMPERCARGO ?? TERCERO_SELF_DEFAULTS.NUMPERCARGO),
    OPERAMONEDAEXT: body.OPERAMONEDAEXT ?? TERCERO_SELF_DEFAULTS.OPERAMONEDAEXT,
    OTROINGVALOR: Number(body.OTROINGVALOR ?? TERCERO_SELF_DEFAULTS.OTROINGVALOR),
    POSEEMONEDAEXT: body.POSEEMONEDAEXT ?? TERCERO_SELF_DEFAULTS.POSEEMONEDAEXT,
    VAPORTE: Number(body.VAPORTE ?? TERCERO_SELF_DEFAULTS.VAPORTE),
    VIVIENDAPROPIA: body.VIVIENDAPROPIA ?? TERCERO_SELF_DEFAULTS.VIVIENDAPROPIA
  };
};

/**
 * Valida los datos de TERCEROSSELF
 */
const validateTerceroSelfData = (data) => {
  const errors = [];
  
  // TERID requerido
  if (!data.TERID) {
    errors.push({ field: 'TERID', message: 'TERID es obligatorio' });
  }
  
  // VENDEDOR1 debe ser numérico positivo si está presente
  if (data.VENDEDOR1 !== undefined && data.VENDEDOR1 !== null && String(data.VENDEDOR1) !== '') {
    const v1 = Number(data.VENDEDOR1);
    if (!Number.isFinite(v1) || v1 <= 0) {
      errors.push({ field: 'VENDEDOR1', message: 'VENDEDOR1 debe ser numérico y mayor que 0' });
    }
  }
  
  return errors;
};

/**
 * Valida referencias foráneas
 */
const validateForeignReferences = async (transaction, data) => {
  // Validar que TERID exista en TERCEROS
  const terExists = await executeQueryInTransaction(
    transaction, 
    'SELECT COUNT(*) AS CNT FROM TERCEROS WHERE TERID = ?', 
    [data.TERID]
  );
  
  if (!terExists || Number(terExists[0].CNT || 0) === 0) {
    throw createError(
      `TERID ${data.TERID} no existe en TERCEROS`,
      400,
      'TERID_INEXISTENTE'
    );
  }
  
  // Validar VENDEDOR1 si está presente
  if (data.VENDEDOR1 !== undefined && data.VENDEDOR1 !== null && String(data.VENDEDOR1) !== '') {
    const vendExists = await executeQueryInTransaction(
      transaction,
      'SELECT COUNT(*) AS CNT FROM TERCEROS WHERE TERID = ?',
      [Number(data.VENDEDOR1)]
    );
    
    if (!vendExists || Number(vendExists[0].CNT || 0) === 0) {
      throw createError(
        `VENDEDOR1 ${data.VENDEDOR1} no existe en TERCEROS`,
        400,
        'VENDEDOR1_INEXISTENTE'
      );
    }
  }
};

/**
 * GET /api/terceros-self/:terid - Obtener registro TERCEROSSELF por TERID
 */
router.get('/:terid', asyncHandler(async (req, res) => {
  const { terid } = req.params;
  
  // Validar TERID
  if (!terid || String(terid).trim() === '') {
    throw createError(
      'TERID es requerido',
      400,
      ERROR_CODES.BAD_REQUEST,
      [{ field: 'terid', message: 'TERID es requerido' }]
    );
  }
  
  const teridNum = parseInt(terid);
  if (isNaN(teridNum) || teridNum <= 0) {
    throw createError(
      'TERID inválido',
      400,
      ERROR_CODES.BAD_REQUEST,
      [{ field: 'terid', message: `TERID debe ser un número positivo, recibido: ${terid}` }]
    );
  }
  
  const query = `
    SELECT 
      TERID, VENDEDOR1, SUSPENDIDO, OBSERVCAR, MAXPLAZO, REGSIMPLIF, AUTORRETEN,
      SUELDO, APORTE, GRANCONTRI, CREDFISCAL, CLIENTETIPO, TEREXENTO,
      DECLARARENTA, DEPECONOMICO, EGRMENSUALES, FUENTESALTERNAS, INGMENSUALES,
      NUMPERCARGO, OPERAMONEDAEXT, OTROINGVALOR, POSEEMONEDAEXT, VAPORTE, VIVIENDAPROPIA
    FROM TERCEROSSELF 
    WHERE TERID = ?
  `;
  
  const rows = await executeQuery(query, [teridNum]);
  
  if (!rows || rows.length === 0) {
    throw createError(
      `TERCEROSSELF no encontrado para TERID=${teridNum}`,
      404,
      ERROR_CODES.NOT_FOUND
    );
  }
  
  res.json({ 
    success: true, 
    data: rows[0] 
  });
}));

/**
 * POST /api/terceros-self - Crear o actualizar TERCEROSSELF
 */
router.post('/', asyncHandler(async (req, res) => {
  let connection;
  
  try {
    // Normalizar y validar datos
    const data = normalizeTerceroSelfData(req.body);
    const validationErrors = validateTerceroSelfData(data);
    
    if (validationErrors.length > 0) {
      throw createError(
        'Validación fallida',
        400,
        ERROR_CODES.BAD_REQUEST,
        validationErrors
      );
    }
    
    connection = await createConnection();
    
    const outId = await executeTransactionWithCallback(connection, async (transaction) => {
      // Validar referencias foráneas
      await validateForeignReferences(transaction, data);
      
      // Verificar si ya existe
      const exists = await executeQueryInTransaction(
        transaction, 
        'SELECT COUNT(*) AS CNT FROM TERCEROSSELF WHERE TERID = ?', 
        [data.TERID]
      );
      
      const cnt = Number(exists && exists[0] && (exists[0].CNT || exists[0].cnt) || 0);
      
      if (cnt > 0) {
        // UPDATE - Registro existente
        const updateQuery = `
          UPDATE TERCEROSSELF SET
            VENDEDOR1 = ?, SUSPENDIDO = ?, OBSERVCAR = ?, MAXPLAZO = ?, REGSIMPLIF = ?, AUTORRETEN = ?,
            SUELDO = ?, APORTE = ?, GRANCONTRI = ?, CREDFISCAL = ?, CLIENTETIPO = ?, TEREXENTO = ?,
            DECLARARENTA = ?, DEPECONOMICO = ?, EGRMENSUALES = ?, FUENTESALTERNAS = ?, INGMENSUALES = ?,
            NUMPERCARGO = ?, OPERAMONEDAEXT = ?, OTROINGVALOR = ?, POSEEMONEDAEXT = ?, VAPORTE = ?, VIVIENDAPROPIA = ?
          WHERE TERID = ?
        `;
        
        try {
          await executeQueryInTransaction(transaction, updateQuery, [
            data.VENDEDOR1 || null, data.SUSPENDIDO, data.OBSERVCAR || null, 
            data.MAXPLAZO, data.REGSIMPLIF, data.AUTORRETEN,
            data.SUELDO, data.APORTE, data.GRANCONTRI, data.CREDFISCAL, 
            data.CLIENTETIPO, data.TEREXENTO,
            data.DECLARARENTA, data.DEPECONOMICO, data.EGRMENSUALES, 
            data.FUENTESALTERNAS, data.INGMENSUALES,
            data.NUMPERCARGO, data.OPERAMONEDAEXT, data.OTROINGVALOR, 
            data.POSEEMONEDAEXT, data.VAPORTE, data.VIVIENDAPROPIA,
            data.TERID
          ]);
        } catch (error) {
          if (error && (error.gdscode === 335544466 || /FOREIGN KEY/i.test(String(error.message || '')))) {
            throw createError(
              'Clave foránea inválida: el TERID o VENDEDOR1 referenciado no existe en TERCEROS',
              400,
              ERROR_CODES.FK_VIOLATION
            );
          }
          throw error;
        }
      } else {
        // INSERT - Nuevo registro
        const insertQuery = `
          INSERT INTO TERCEROSSELF (
            TERID, VENDEDOR1, SUSPENDIDO, OBSERVCAR, MAXPLAZO, REGSIMPLIF, AUTORRETEN,
            SUELDO, APORTE, GRANCONTRI, CREDFISCAL, CLIENTETIPO, TEREXENTO,
            DECLARARENTA, DEPECONOMICO, EGRMENSUALES, FUENTESALTERNAS, INGMENSUALES,
            NUMPERCARGO, OPERAMONEDAEXT, OTROINGVALOR, POSEEMONEDAEXT, VAPORTE, VIVIENDAPROPIA
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        try {
          await executeQueryInTransaction(transaction, insertQuery, [
            data.TERID,
            data.VENDEDOR1 || null, data.SUSPENDIDO, data.OBSERVCAR || null, 
            data.MAXPLAZO, data.REGSIMPLIF, data.AUTORRETEN,
            data.SUELDO, data.APORTE, data.GRANCONTRI, data.CREDFISCAL, 
            data.CLIENTETIPO, data.TEREXENTO,
            data.DECLARARENTA, data.DEPECONOMICO, data.EGRMENSUALES, 
            data.FUENTESALTERNAS, data.INGMENSUALES,
            data.NUMPERCARGO, data.OPERAMONEDAEXT, data.OTROINGVALOR, 
            data.POSEEMONEDAEXT, data.VAPORTE, data.VIVIENDAPROPIA
          ]);
        } catch (error) {
          if (error && (error.gdscode === 335544466 || /FOREIGN KEY/i.test(String(error.message || '')))) {
            throw createError(
              'Clave foránea inválida: el TERID o VENDEDOR1 referenciado no existe en TERCEROS',
              400,
              ERROR_CODES.FK_VIOLATION
            );
          }
          throw error;
        }
      }
      
      return data.TERID;
    });
    
    // Obtener el registro guardado
    const selfRecord = await executeQuery(`
      SELECT 
        TERID, VENDEDOR1, SUSPENDIDO, OBSERVCAR, MAXPLAZO, REGSIMPLIF, AUTORRETEN,
        SUELDO, APORTE, GRANCONTRI, CREDFISCAL, CLIENTETIPO, TEREXENTO,
        DECLARARENTA, DEPECONOMICO, EGRMENSUALES, FUENTESALTERNAS, INGMENSUALES,
        NUMPERCARGO, OPERAMONEDAEXT, OTROINGVALOR, POSEEMONEDAEXT, VAPORTE, VIVIENDAPROPIA
      FROM TERCEROSSELF 
      WHERE TERID = ?
    `, [outId]);
    
    res.status(201).json({ 
      success: true, 
      message: 'TERCEROSSELF guardado exitosamente', 
      data: selfRecord[0] 
    });
    
  } finally {
    if (connection) {
      try {
        connection.detach();
      } catch (closeError) {
        console.error('Error cerrando conexión:', closeError);
      }
    }
  }
}));

module.exports = router;
