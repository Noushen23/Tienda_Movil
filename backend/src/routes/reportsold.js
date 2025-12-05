const express = require('express');
const reportsController = require('../controllers/reportsController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Rutas de reportes (solo admin y moderator)
router.get('/entregas', authorize('admin', 'moderator'), reportsController.generarReporteEntregas);
router.get('/trazabilidad/:ordenId', authorize('admin', 'moderator'), reportsController.generarReporteTrazabilidad);

module.exports = router;


