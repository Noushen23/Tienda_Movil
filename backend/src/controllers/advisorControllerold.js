// ============================================
// CONTROLADOR DE ASESOR - COMENTADO (NO EN USO)
// ============================================

// const advisorService = require('../services/advisorService');

/* COMENTADO - MÓDULO DE ASESOR NO EN USO
const parseFilters = (queryParams = {}) => ({
  fechaDesde: queryParams.fechaDesde || null,
  fechaHasta: queryParams.fechaHasta || null,
  cliente: queryParams.cliente || null,
  zona: queryParams.zona || null,
  ruta: queryParams.ruta || null,
  estado: queryParams.estado || null,
  busqueda: queryParams.busqueda || null,
  prioridad: queryParams.prioridad || null,
  limit: queryParams.limit ? Number(queryParams.limit) : undefined,
  offset: queryParams.offset ? Number(queryParams.offset) : undefined,
  ordenarPor: queryParams.ordenarPor || undefined,
  direccionOrden: queryParams.direccionOrden || undefined,
});

const getPendingOrders = async (req, res) => {
  try {
    const filtros = parseFilters(req.query);
    const data = await advisorService.getPendingOrders(filtros);

    res.json({
      success: true,
      message: 'Pedidos obtenidos correctamente',
      data,
    });
  } catch (error) {
    console.error('Error al obtener pedidos del asesor:', error);
    res.status(500).json({
      success: false,
      message: 'No fue posible obtener los pedidos pendientes',
      error: error.message,
    });
  }
};

const getIndicators = async (req, res) => {
  try {
    const data = await advisorService.getIndicators();
    res.json({
      success: true,
      message: 'Indicadores obtenidos correctamente',
      data,
    });
  } catch (error) {
    console.error('Error al obtener indicadores del asesor:', error);
    res.status(500).json({
      success: false,
      message: 'No fue posible obtener los indicadores',
      error: error.message,
    });
  }
};

const confirmOrder = async (req, res) => {
  try {
    const { fechaProgramada, observaciones } = req.body;
    const orderId = req.params.id;
    const userId = req.user.id;
    const userName = req.user.nombreCompleto || req.user.email || 'Usuario';

    const data = await advisorService.confirmOrder({
      orderId,
      fechaProgramada,
      observaciones,
      userId,
      userName,
    });

    res.json({
      success: true,
      message: 'Pedido confirmado correctamente',
      data,
    });
  } catch (error) {
    console.error('Error al confirmar pedido del asesor:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'No fue posible confirmar el pedido',
    });
  }
};

const rejectOrder = async (req, res) => {
  try {
    const { motivo, observaciones } = req.body;
    const orderId = req.params.id;

    const data = await advisorService.rejectOrder({ orderId, motivo, observaciones });

    res.json({
      success: true,
      message: 'Pedido rechazado correctamente',
      data,
    });
  } catch (error) {
    console.error('Error al rechazar pedido del asesor:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'No fue posible rechazar el pedido',
    });
  }
};

module.exports = {
  getPendingOrders,
  getIndicators,
  confirmOrder,
  rejectOrder,
};
*/






