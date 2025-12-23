const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const ReviewController = require('../controllers/reviewController');
const { authenticateToken, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

// Validaciones
const validateCreateReview = [
  param('id').isUUID().withMessage('ID de producto inválido'),
  body('calificacion')
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser un número entero entre 1 y 5'),
  body('comentario')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('El comentario no puede exceder los 1000 caracteres'),
  body('ordenId')
    .optional()
    .isUUID()
    .withMessage('ID de orden inválido'),
  handleValidationErrors,
];

const validateUpdateReview = [
  param('reviewId').isUUID().withMessage('ID de reseña inválido'),
  body('calificacion')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser un número entero entre 1 y 5'),
  body('comentario')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('El comentario no puede exceder los 1000 caracteres'),

  handleValidationErrors,
];

// Rutas públicas
// Obtener reseñas de un producto
router.get('/product/:id', param('id').isUUID(), handleValidationErrors, ReviewController.getReviewsByProduct);
// Obtener estadísticas de reseñas de un producto
router.get('/product/:id/stats', param('id').isUUID(), handleValidationErrors, ReviewController.getProductReviewStats);
// Obtener una reseña específica
router.get('/:reviewId', param('reviewId').isUUID(), handleValidationErrors, ReviewController.getReview);

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Crear una nueva reseña para un producto
router.post('/product/:id', validateCreateReview, ReviewController.createReview);

// Obtener las reseñas de un usuario
router.get('/my-reviews', ReviewController.getReviewsByUser);

// Verificar si un usuario puede reseñar un producto
router.get('/can-review/product/:id', param('id').isUUID(), handleValidationErrors, ReviewController.canUserReviewProduct);

// Actualizar una reseña
router.put('/:reviewId', validateUpdateReview, ReviewController.updateReview);

// Eliminar una reseña
router.delete('/:reviewId', param('reviewId').isUUID(), handleValidationErrors, ReviewController.deleteReview);

module.exports = router;
