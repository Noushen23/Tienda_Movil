/**
 * Controlador específico para registro desde la aplicación móvil
 * Maneja el formulario de registro completo de usuarios móviles
 */

const express = require('express');
const router = express.Router();
const { createConnection, executeQuery, executeTransactionWithCallback } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const { ERROR_CODES } = require('../utils/constants');
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

// Validaciones específicas para actualizaciones (solo campos presentes)
const validateUpdateData = (data) => {
  const errors = [];
  
  // Validar formato de email solo si está presente
  if (data.EMAIL) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.EMAIL)) {
      errors.push({ 
        field: 'EMAIL', 
        message: 'Formato de email inválido' 
      });
    }
  }
  
  // Validar teléfono solo si está presente
  if (data.TELEF1) {
    const phoneCleaned = String(data.TELEF1).replace(/\D/g, '');
    if (phoneCleaned.length < 7) {
      errors.push({ 
        field: 'TELEF1', 
        message: 'El teléfono debe tener al menos 7 dígitos' 
      });
    }
  }
  
  return errors;
};

// Validaciones específicas para registro móvil
const validateMobileRegistration = (data) => {
  const errors = [];
  
  // Campos obligatorios para registro móvil
  const requiredFields = ['NIT', 'NOMBRE', 'DIRECC1', 'CIUDAD', 'TELEF1', 'EMAIL'];
  
  requiredFields.forEach(field => {
    if (!data[field] || String(data[field]).trim() === '') {
      errors.push({ 
        field, 
        message: `${field} es obligatorio para el registro móvil` 
      });
    }
  });
  
  // Validar formato de email específicamente
  if (data.EMAIL) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.EMAIL)) {
      errors.push({ 
        field: 'EMAIL', 
        message: 'Formato de email inválido' 
      });
    }
  }
  
  // Validar NIT (documento)
  if (data.NIT) {
    const nitCleaned = String(data.NIT).replace(/\D/g, '');
    if (nitCleaned.length < 6) {
      errors.push({ 
        field: 'NIT', 
        message: 'El documento debe tener al menos 6 dígitos' 
      });
    }
  }
  
  // Validar teléfono
  if (data.TELEF1) {
    const phoneCleaned = String(data.TELEF1).replace(/\D/g, '');
    if (phoneCleaned.length < 7) {
      errors.push({ 
        field: 'TELEF1', 
        message: 'El teléfono debe tener al menos 7 dígitos' 
      });
    }
  }
  
  return errors;
};

// Controlador para registro móvil completo
const registerMobileUser = asyncHandler(async (req, res) => {
  // Normalizar datos de entrada
  const data = normalizeTerceroData(req.body);
  
  // Forzar configuraciones específicas para usuarios móviles
  data.CLIENTE = 'S';  // Siempre cliente
  data.VENDED = 'N';   // Nunca vendedor
  data.PROVEED = 'N';  // Nunca proveedor
  data.NATJURIDICA = 'N'; // Siempre persona natural para móvil
  // Normalizar TIPODOCIDEN - convertir 'CC' a 'C' para compatibilidad con BD
  data.TIPODOCIDEN = data.TIPODOCIDEN === 'CC' ? 'C' : (data.TIPODOCIDEN || 'C');
  
  // Validar datos específicos para móvil
  const mobileErrors = validateMobileRegistration(data);
  if (mobileErrors.length > 0) {
    throw createError(
      'Datos de registro móvil inválidos', 
      400, 
      ERROR_CODES.BAD_REQUEST, 
      mobileErrors
    );
  }
  
  // Validar datos generales
  const validationErrors = validateTerceroData(data);
  if (validationErrors.length > 0) {
    throw createError(
      'Validación fallida', 
      400, 
      ERROR_CODES.BAD_REQUEST, 
      validationErrors
    );
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
      const duplicate = await executeQueryInTransaction(
        transaction, 
        'SELECT TERID FROM TERCEROS WHERE TRIM(NIT) = ?', 
        [data.NIT]
      );
      
      if (duplicate?.length > 0) {
        throw createError(
          `Ya existe un usuario registrado con este documento: ${data.NIT}`, 
          409, 
          'NIT_DUPLICADO'
        );
      }
      
      // Si el EMAIL ya existe, setearlo a NULL para permitir inserción
      if(data.EMAIL){
        const emailExists = await executeQueryInTransaction(
          transaction, 
          'SELECT TERID FROM TERCEROS WHERE TRIM(UPPER(EMAIL)) = TRIM(UPPER(?))', 
          [data.EMAIL]
        );
        if(emailExists?.length > 0){
          data.EMAIL = null;
        }
      }
      
      // Campos para inserción - Incluye migración TNS
      const fields = [
        'NIT', 'NITTRI', 'TIPODOCIDEN', 'NOMBRE', 'DIRECC1', 'DIRECC2', 
        'CIUDAD', 'CIUDANEID', 'CIUDANEID1', 'DEPARTAMENTO', 'TELEF1', 'TELEF2', 'EMAIL', 
        'CLIENTE', 'PROVEED', 'VENDED', 'VRULTCOM', 'ETERRITORIAL', 
        'FACTELECT', 'NOREPORCIR', 'SINCRONIZADO', 'FECHCREAC', 
        'NATJURIDICA', 'RESPONSABILIDADES', 'LISTAPRECIOID', 'MAXCREDCXC', 
        'MAXCREDDIAS', 'ZONA1', 'CLASIFICAID', 'CODPOSTAL',
        // Campos migración TNS
        'COBRA', 'PORRETEN', 'CONDUCTOR', 'TOMADOR', 'PROPIETARIO', 
        'EMPLEADO', 'FIADOR', 'NOMREGTRI', 'OTRO', 'MOSTRADOR', 'MESA'
      ];
      
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
        await executeQueryInTransaction(
          transaction, 
          `INSERT INTO TERCEROS (${fields.join(', ')}) VALUES (${fields.map(() => '?').join(', ')})`, 
          values
        );
      } catch (error) {
        if (error?.gdscode === 335544665 || String(error?.message).toLowerCase().includes('unique')) {
          throw createError(
            `Ya existe un usuario con este documento: ${data.NIT}`, 
            409, 
            'NIT_DUPLICADO'
          );
        }
        if (error?.gdscode === 335544466 || /FOREIGN KEY/i.test(String(error?.message))) {
          throw createError(
            'Datos de ubicación inválidos', 
            400, 
            ERROR_CODES.FK_VIOLATION
          );
        }
        throw error;
      }
      
      // Obtener TERID generado
      const teridResult = await executeQueryInTransaction(
        transaction, 
        'SELECT TERID FROM TERCEROS WHERE TRIM(NIT) = ?', 
        [data.NIT]
      );
      
      if (!teridResult?.[0]?.TERID) {
        throw createError(
          'No se pudo completar el registro', 
          500, 
          'TERID_NOT_GENERATED'
        );
      }
      
      return Number(teridResult[0].TERID);
    });
    
    // Obtener datos completos del tercero registrado
    const tercero = await executeQuery(
      `SELECT t.*, 
              c.NOMBRE as CIUDAD_NOMBRE,
              z.NOMBRE as ZONA_NOMBRE
       FROM TERCEROS t
       LEFT JOIN CIUDANE c ON t.CIUDANEID = c.CIUDANEID  
       LEFT JOIN ZONAS z ON t.ZONA1 = z.ZONAID
       WHERE t.TERID = ?`, 
      [nuevoId]
    );
    
    // Log de auditoría
    writeAuditLog({ 
      action: 'mobile_register', 
      entity: 'TERCEROS', 
      id: nuevoId, 
      route: '/api/mobile/register', 
      method: 'POST', 
      before: null, 
      after: tercero[0] 
    });
    
    // Respuesta exitosa con datos relevantes para la app móvil
    res.status(201).json({ 
      success: true, 
      message: 'Usuario registrado exitosamente',
      data: {
        tercero_id: tercero[0].TERID,
        nit: tercero[0].NIT,
        nombre: tercero[0].NOMBRE,
        email: tercero[0].EMAIL,
        telefono: tercero[0].TELEF1,
        direccion: tercero[0].DIRECC1,
        ciudad: tercero[0].CIUDAD_NOMBRE || tercero[0].CIUDAD,
        departamento: tercero[0].DEPARTAMENTO,
        fecha_registro: tercero[0].FECHCREAC,
        // Datos mínimos necesarios para la app
        perfil: {
          completo: true,
          tipo: 'usuario_movil',
          cliente_activo: tercero[0].CLIENTE === 'S'
        }
      }
    });
    
  } finally {
    connection?.detach?.();
  }
});

// Controlador para obtener datos del tercero por ID
const getTerceroById = asyncHandler(async (req, res) => {
  const { tercero_id } = req.params;
  
  if (!tercero_id || isNaN(tercero_id)) {
    throw createError(
      'ID de tercero inválido',
      400,
      ERROR_CODES.BAD_REQUEST,
      [{ field: 'tercero_id', message: 'ID debe ser un número válido' }]
    );
  }
  
  const tercero = await executeQuery(
    `SELECT t.*,
            c.NOMBRE as CIUDAD_NOMBRE,
            z.NOMBRE as ZONA_NOMBRE
     FROM TERCEROS t
     LEFT JOIN CIUDANE c ON t.CIUDANEID = c.CIUDANEID  
     LEFT JOIN ZONAS z ON t.ZONA1 = z.ZONAID
     WHERE t.TERID = ? AND t.CLIENTE = 'S'`,
    [tercero_id]
  );
  
  if (tercero.length === 0) {
    throw createError(
      'Usuario no encontrado',
      404,
      ERROR_CODES.NOT_FOUND
    );
  }
  
  // Formatear respuesta para la app móvil
  const terceroData = tercero[0];
  
  res.json({
    success: true,
    message: 'Datos del usuario obtenidos exitosamente',
    data: {
      tercero_id: terceroData.TERID,
      nit: terceroData.NIT,
      tipo_documento: terceroData.TIPODOCIDEN,
      nombre: terceroData.NOMBRE,
      email: terceroData.EMAIL,
      telefono1: terceroData.TELEF1,
      telefono2: terceroData.TELEF2,
      direccion1: terceroData.DIRECC1,
      direccion2: terceroData.DIRECC2,
      ciudad: terceroData.CIUDAD_NOMBRE || terceroData.CIUDAD,
      departamento: terceroData.DEPARTAMENTO,
      zona: terceroData.ZONA_NOMBRE,
      naturaleza_juridica: terceroData.NATJURIDICA,
      responsabilidades: terceroData.RESPONSABILIDADES,
      fecha_creacion: terceroData.FECHCREAC,
      activo: terceroData.CLIENTE === 'S',
      perfil: {
        completo: !!(terceroData.EMAIL && terceroData.TELEF1 && terceroData.DIRECC1),
        tipo: 'usuario_movil',
        es_cliente: terceroData.CLIENTE === 'S',
        es_vendedor: terceroData.VENDED === 'S',
        es_proveedor: terceroData.PROVEED === 'S'
      }
    }
  });
});

// Controlador para actualizar datos del tercero
const updateTerceroById = asyncHandler(async (req, res) => {
  const { tercero_id } = req.params;
  
  if (!tercero_id || isNaN(tercero_id)) {
    throw createError(
      'ID de tercero inválido',
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }
  
  // Verificar que el tercero existe
  const existingTercero = await executeQuery(
    'SELECT TERID FROM TERCEROS WHERE TERID = ? AND CLIENTE = ?',
    [tercero_id, 'S']
  );
  
  if (existingTercero.length === 0) {
    throw createError(
      'Usuario no encontrado',
      404,
      ERROR_CODES.NOT_FOUND
    );
  }
  
  // Normalizar datos de actualización
  const data = normalizeTerceroData(req.body);
  
  // Campos permitidos para actualización móvil
  const allowedFields = [
    'NOMBRE', 'DIRECC1', 'DIRECC2', 'CIUDAD', 'CIUDANEID', 
    'DEPARTAMENTO', 'TELEF1', 'TELEF2', 'EMAIL'
  ];
  
  const updateFields = [];
  const updateValues = [];
  
  allowedFields.forEach(field => {
    if (data[field] !== undefined && data[field] !== null) {
      updateFields.push(`${field} = ?`);
      updateValues.push(field === 'CIUDAD' ? data.CIUDANAME : data[field]);
    }
  });
  
  if (updateFields.length === 0) {
    throw createError(
      'No se proporcionaron campos válidos para actualizar',
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }
  
  // Validar datos antes de actualizar (solo campos presentes)
  const validationErrors = validateUpdateData(data);
  if (validationErrors.length > 0) {
    throw createError(
      'Datos de actualización inválidos',
      400,
      ERROR_CODES.BAD_REQUEST,
      validationErrors
    );
  }
  
  updateValues.push(tercero_id);
  
  const connection = await createConnection();
  
  try {
    await executeTransactionWithCallback(connection, async (transaction) => {
      // Actualizar tercero
      await executeQueryInTransaction(
        transaction,
        `UPDATE TERCEROS SET ${updateFields.join(', ')} WHERE TERID = ?`,
        updateValues
      );
    });
    
    // Obtener datos actualizados
    const updatedTercero = await executeQuery(
      `SELECT t.*,
              c.NOMBRE as CIUDAD_NOMBRE,
              z.NOMBRE as ZONA_NOMBRE
       FROM TERCEROS t
       LEFT JOIN CIUDANE c ON t.CIUDANEID = c.CIUDANEID  
       LEFT JOIN ZONAS z ON t.ZONA1 = z.ZONAID
       WHERE t.TERID = ?`,
      [tercero_id]
    );
    
    // Log de auditoría
    writeAuditLog({ 
      action: 'mobile_update', 
      entity: 'TERCEROS', 
      id: tercero_id, 
      route: `/api/mobile/tercero/${tercero_id}`, 
      method: 'PUT', 
      before: existingTercero[0], 
      after: updatedTercero[0] 
    });
    
    res.json({
      success: true,
      message: 'Datos del usuario actualizados exitosamente',
      data: {
        tercero_id: updatedTercero[0].TERID,
        nit: updatedTercero[0].NIT,
        nombre: updatedTercero[0].NOMBRE,
        email: updatedTercero[0].EMAIL,
        telefono: updatedTercero[0].TELEF1,
        direccion: updatedTercero[0].DIRECC1,
        ciudad: updatedTercero[0].CIUDAD_NOMBRE || updatedTercero[0].CIUDAD,
        departamento: updatedTercero[0].DEPARTAMENTO,
        fecha_actualizacion: new Date().toISOString()
      }
    });
    
  } finally {
    connection?.detach?.();
  }
});

module.exports = {
  registerMobileUser,
  getTerceroById,
  updateTerceroById
};

