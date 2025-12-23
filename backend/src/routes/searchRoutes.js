const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');

/**
 * Rutas para búsqueda avanzada y filtros
 * Base: /api/v1/search
 */

// Obtener rango de precios (público)
router.get('/price-range', searchController.getPriceRange);

// Obtener sugerencias de búsqueda (público)
router.get('/suggestions', searchController.getSearchSuggestions);

// Obtener historial de búsquedas del usuario (requiere autenticación)
router.get('/history', authenticateToken, searchController.getSearchHistory);

module.exports = router;

