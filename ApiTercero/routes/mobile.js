/**
 * Rutas específicas para la aplicación móvil
 * Maneja registro y gestión de datos personales de usuarios móviles
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const {
  registerMobileUser,
  getTerceroById,
  updateTerceroById
} = require('../controllers/mobileRegistrationController');

// ==============================================
// RUTAS PÚBLICAS (sin autenticación obligatoria)
// ==============================================

/**
 * @route   POST /api/mobile/register
 * @desc    Registrar nuevo usuario móvil con datos completos del formulario
 * @access  Public
 * @body    {NIT, NOMBRE, DIRECC1, CIUDAD, TELEF1, EMAIL, ...}
 */
router.post('/register', asyncHandler(registerMobileUser));

// ==============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ==============================================

// Aplicar middleware de autenticación a las rutas siguientes
router.use(authenticate);

/**
 * @route   GET /api/mobile/tercero/:tercero_id
 * @desc    Obtener datos completos del tercero por ID
 * @access  Private
 * @params  tercero_id - ID del tercero
 */
router.get('/tercero/:tercero_id', asyncHandler(getTerceroById));

/**
 * @route   PUT /api/mobile/tercero/:tercero_id
 * @desc    Actualizar datos del tercero
 * @access  Private
 * @params  tercero_id - ID del tercero
 * @body    {campos a actualizar}
 */
router.put('/tercero/:tercero_id', asyncHandler(updateTerceroById));

// ==============================================
// RUTAS DE INFORMACIÓN Y UTILIDADES
// ==============================================

/**
 * @route   GET /api/mobile
 * @desc    Información sobre rutas móviles disponibles
 * @access  Public
 */
router.get('/', (req, res) => {
  res.json({
    message: 'API Tercero - Endpoints Móviles',
    version: '1.0.0',
    description: 'API especializada para el manejo de datos personales desde la aplicación móvil',
    architecture: 'Separada - ApiTercero (datos) + Auth API (credenciales)',
    endpoints: {
      register: {
        method: 'POST',
        path: '/api/mobile/register',
        description: 'Registrar nuevo usuario móvil con datos completos',
        access: 'Public',
        body: {
          required: [
            'NIT (documento)',
            'NOMBRE (nombre completo)',
            'DIRECC1 (dirección)',
            'CIUDAD (ciudad)',
            'TELEF1 (teléfono)',
            'EMAIL (correo electrónico)'
          ],
          optional: [
            'TIPODOCIDEN (tipo documento, default: C)',
            'DIRECC2 (dirección secundaria)',
            'DEPARTAMENTO (departamento)',
            'TELEF2 (teléfono secundario)',
            'CIUDANEID (ID ciudad para referencia)',
            'ZONA1 (zona de ubicación)'
          ]
        },
        response: {
          tercero_id: 'ID generado para el tercero',
          perfil: 'Información del perfil creado'
        }
      },
      getTercero: {
        method: 'GET',
        path: '/api/mobile/tercero/:tercero_id',
        description: 'Obtener datos completos del tercero',
        access: 'Private (requiere autenticación)',
        headers: {
          required: ['Authorization: Bearer <token>']
        },
        response: {
          data: 'Datos completos del tercero formateados para móvil'
        }
      },
      updateTercero: {
        method: 'PUT',
        path: '/api/mobile/tercero/:tercero_id',
        description: 'Actualizar datos del tercero',
        access: 'Private (requiere autenticación)',
        headers: {
          required: ['Authorization: Bearer <token>']
        },
        body: {
          allowed: [
            'NOMBRE', 'DIRECC1', 'DIRECC2', 'CIUDAD', 
            'CIUDANEID', 'DEPARTAMENTO', 'TELEF1', 'TELEF2', 'EMAIL'
          ]
        }
      }
    },
    integration: {
      authAPI: {
        purpose: 'Manejo de credenciales de acceso',
        connection: 'El tercero_id se vincula en el token JWT del Auth API',
        flow: [
          '1. Usuario registra datos personales aquí (/api/mobile/register)',
          '2. Se obtiene tercero_id del registro exitoso',
          '3. Usuario registra credenciales en Auth API con tercero_id',
          '4. O alternativamente vincula tercero_id posteriormente'
        ]
      },
      dataFormat: {
        input: 'Formato de formulario móvil estándar',
        output: 'Datos normalizados para base de datos Firebird',
        validation: 'Validaciones específicas para usuarios móviles'
      }
    },
    dataDefaults: {
      CLIENTE: 'S (siempre cliente)',
      VENDED: 'N (nunca vendedor)',
      PROVEED: 'N (nunca proveedor)',
      NATJURIDICA: 'N (persona natural)',
      TIPODOCIDEN: 'C (cédula de ciudadanía por defecto)'
    },
    validation: {
      NIT: 'Mínimo 6 dígitos',
      EMAIL: 'Formato de email válido',
      TELEF1: 'Mínimo 7 dígitos',
      uniqueFields: ['NIT', 'EMAIL']
    }
  });
});

/**
 * @route   GET /api/mobile/ciudades
 * @desc    Obtener lista de ciudades disponibles
 * @access  Public
 */
router.get('/ciudades', asyncHandler(async (req, res) => {
  const { executeQuery } = require('../config/database');
  
  const ciudades = await executeQuery(
    'SELECT CIUDANEID, NOMBRE, CODDANE FROM CIUDANE ORDER BY NOMBRE'
  );
  
  res.json({
    success: true,
    message: 'Ciudades obtenidas exitosamente',
    total: ciudades.length,
    data: ciudades.map(ciudad => ({
      id: ciudad.CIUDANEID,
      nombre: ciudad.NOMBRE,
      codigo: ciudad.CODDANE
    }))
  });
}));

/**
 * @route   GET /api/mobile/zonas
 * @desc    Obtener lista de zonas disponibles
 * @access  Public
 */
router.get('/zonas', asyncHandler(async (req, res) => {
  const { executeQuery } = require('../config/database');
  
  const zonas = await executeQuery(
    'SELECT ZONAID, NOMBRE FROM ZONAS ORDER BY NOMBRE'
  );
  
  res.json({
    success: true,
    message: 'Zonas obtenidas exitosamente',
    total: zonas.length,
    data: zonas.map(zona => ({
      id: zona.ZONAID,
      nombre: zona.NOMBRE
    }))
  });
}));

module.exports = router;

