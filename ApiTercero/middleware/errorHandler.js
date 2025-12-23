/**
 * Middleware centralizado para manejo de errores
 */

const { ERROR_CODES } = require('../utils/constants');

/**
 * Crea un error personalizado con código y status
 */
const createError = (message, status = 500, code = ERROR_CODES.INTERNAL_SERVER_ERROR, details = null) => {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  error.details = details;
  return error;
};

/**
 * Maneja errores específicos de base de datos
 */
const handleDatabaseError = (error) => {
  // Error de conversión de datos (como 'SIN CIUDAD')
  if (error.gdscode === 335544334 || /conversion error/i.test(String(error.message || ''))) {
    return createError(
      'Error de conversión de datos: algunos valores no son compatibles con el tipo de dato esperado',
      400,
      ERROR_CODES.BAD_REQUEST
    );
  }
  
  // Error de columna desconocida
  if (error.gdscode === 335544569 || /column unknown/i.test(String(error.message || ''))) {
    return createError(
      'Error de estructura de base de datos: campo no encontrado',
      500,
      ERROR_CODES.INTERNAL_SERVER_ERROR
    );
  }
  
  // Error de clave duplicada
  if (error.gdscode === 335544665 || 
      (String(error.message || '').toLowerCase().includes('unique key') || 
       String(error.message || '').toLowerCase().includes('primary key'))) {
    return createError(
      'Ya existe un registro con esos datos únicos',
      409,
      ERROR_CODES.CONFLICT
    );
  }
  
  // Error de clave foránea
  if (error.gdscode === 335544466 || /FOREIGN KEY/i.test(String(error.message || ''))) {
    return createError(
      'Referencia inválida: uno o más campos referencian datos que no existen',
      400,
      ERROR_CODES.FK_VIOLATION
    );
  }
  
  // Error genérico de base de datos
  return createError(
    'Error en la base de datos',
    500,
    ERROR_CODES.INTERNAL_SERVER_ERROR
  );
};

/**
 * Middleware principal de manejo de errores
 */
const errorHandler = (error, req, res, next) => {
  console.error('Error en la aplicación:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  // Si ya tiene status, es un error controlado
  if (error.status) {
    return res.status(error.status).json({
      success: false,
      error: error.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: error.message,
      details: error.details || null
    });
  }
  
  // Errores de base de datos
  if (error.gdscode || /database|sql|connection/i.test(error.message)) {
    const dbError = handleDatabaseError(error);
    return res.status(dbError.status).json({
      success: false,
      error: dbError.code,
      message: dbError.message,
      details: dbError.details
    });
  }
  
  // Error genérico del servidor
  res.status(500).json({
    success: false,
    error: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : null
  });
};

/**
 * Wrapper para funciones async que maneja errores automáticamente
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validador de errores de validación
 */
const handleValidationErrors = (errors) => {
  if (errors.length > 0) {
    throw createError(
      'Validación fallida',
      400,
      ERROR_CODES.BAD_REQUEST,
      errors
    );
  }
};

module.exports = {
  createError,
  handleDatabaseError,
  errorHandler,
  asyncHandler,
  handleValidationErrors
};
