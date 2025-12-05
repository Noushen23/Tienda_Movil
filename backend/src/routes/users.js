const express = require('express');
const router = express.Router();
const UsersController = require('../controllers/usersController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Middleware de autenticación y autorización para todas las rutas
router.use(authenticateToken);
router.use(authorize('admin'));

// Obtener todos los usuarios con filtros y paginación
router.get('/', UsersController.getAllUsers);

// Obtener estadísticas de usuarios
router.get('/stats', UsersController.getUserStats);

// Obtener un usuario por ID
router.get('/:id', UsersController.getUserById);

// Actualizar un usuario
router.put('/:id', UsersController.updateUser);

// Eliminar/desactivar un usuario
router.delete('/:id', UsersController.deleteUser);

module.exports = router;

