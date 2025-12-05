const express = require('express');
const rutasController = require('../controllers/rutasController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// ============================================
// RUTAS DE GESTIÓN DE RUTAS
// ============================================

// Rutas para repartidores (su propia ruta)
router.get('/mi-ruta', authorize('repartidor'), rutasController.obtenerMiRuta);

// Rutas para cambiar orden y toggle alternativa (repartidores y admins)
router.post('/cambiar-orden', authorize('repartidor', 'admin', 'moderator'), rutasController.cambiarOrdenRuta);
router.post('/toggle-alternativa', authorize('repartidor', 'admin', 'moderator'), rutasController.toggleRutaAlternativa);

// Rutas para iniciar y finalizar (repartidores y admins)
router.post('/iniciar', authorize('repartidor', 'admin', 'moderator'), rutasController.iniciarRuta);
router.post('/finalizar', authorize('repartidor', 'admin', 'moderator'), rutasController.finalizarRuta);

// Rutas para admin/moderator (gestión completa)
router.post('/crear', authorize('admin', 'moderator'), rutasController.crearRuta);
router.get('/', authorize('admin', 'moderator'), rutasController.obtenerTodasRutas);

module.exports = router;






