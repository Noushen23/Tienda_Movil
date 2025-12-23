const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const FavoriteController = require('../controllers/favoriteController');
const { authenticateToken } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Validaciones
const validateAddFavorite = [
  body('producto_id')
    .isUUID()
    .withMessage('El ID del producto es requerido y debe ser un UUID válido'),
  handleValidationErrors,
];

const validateProductIdParam = [
  param('productId')
    .isUUID()
    .withMessage('El ID del producto en la URL debe ser un UUID válido'),
  handleValidationErrors,
];

// Todas las rutas de favoritos requieren autenticación
router.use(authenticateToken);

// Obtener la lista de favoritos del usuario
router.get('/', FavoriteController.getFavorites);

// Añadir un producto a favoritos
router.post('/', validateAddFavorite, FavoriteController.addFavorite);

// Eliminar un producto de favoritos
router.delete('/:productId', validateProductIdParam, FavoriteController.removeFavorite);

// Verificar si un producto está en favoritos
router.get('/check/:productId', validateProductIdParam, FavoriteController.checkFavorite);

module.exports = router;
