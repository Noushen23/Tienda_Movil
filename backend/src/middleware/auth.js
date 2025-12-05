const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Middleware de autenticación JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      console.error('❌ Error al verificar token JWT:', err.message);
      return res.status(403).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Validar que el token decodificado tenga el id
    if (!user || !user.id) {
      console.error('❌ Error: Token decodificado no contiene id');
      console.error('Token payload:', JSON.stringify(user, null, 2));
      return res.status(403).json({
        success: false,
        message: 'Token inválido: falta información del usuario'
      });
    }

    // Log para depuración (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Usuario autenticado:', {
        id: user.id,
        email: user.email,
        rol: user.rol
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Middleware para verificar roles de usuario
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth
};
