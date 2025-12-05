/**
 * Middleware de autenticación centralizado
 */

const { createError } = require('./errorHandler');
const { ERROR_CODES } = require('../utils/constants');

// Token de autenticación
const API_TOKEN = process.env.API_BEARER_TOKEN || 'angeldavidcapa2025';

/**
 * Middleware de autenticación principal
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError(
      'Token requerido',
      401,
      'UNAUTHORIZED'
    );
  }
  
  const token = authHeader.split(' ')[1];
  if (token !== API_TOKEN) {
    throw createError(
      'Token inválido',
      401,
      'UNAUTHORIZED'
    );
  }
  
  next();
};

/**
 * Middleware de autenticación opcional
 * No bloquea si no hay token, pero valida si existe
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    if (!authHeader.startsWith('Bearer ')) {
      throw createError(
        'Formato de token inválido',
        401,
        'UNAUTHORIZED'
      );
    }
    
    const token = authHeader.split(' ')[1];
    if (token !== API_TOKEN) {
      throw createError(
        'Token inválido',
        401,
        'UNAUTHORIZED'
      );
    }
  }
  
  next();
};

module.exports = {
  authenticate,
  optionalAuth,
  API_TOKEN
};
