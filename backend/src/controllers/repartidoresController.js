const repartidoresService = require('../services/repartidoresService');

/**
 * Obtener lista de repartidores con filtros y paginación
 */
const obtenerRepartidores = async (req, res) => {
  try {
    const {
      search,
      activo,
      page = 1,
      limit = 25,
      sortBy = 'nombre',
      sortOrder = 'ASC',
    } = req.query;

    const resultado = await repartidoresService.obtenerRepartidores({
      search,
      activo,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      message: 'Repartidores obtenidos correctamente',
      data: resultado,
    });
  } catch (error) {
    console.error('Error al obtener repartidores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener repartidores',
      error: error.message,
    });
  }
};

/**
 * Obtener un repartidor por ID
 */
const obtenerRepartidorPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const repartidor = await repartidoresService.obtenerRepartidorPorId(id);

    if (!repartidor) {
      return res.status(404).json({
        success: false,
        message: 'Repartidor no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Repartidor obtenido correctamente',
      data: repartidor,
    });
  } catch (error) {
    console.error('Error al obtener repartidor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener repartidor',
      error: error.message,
    });
  }
};

/**
 * Obtener estadísticas de repartidores
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    const estadisticas = await repartidoresService.obtenerEstadisticasRepartidores();

    res.json({
      success: true,
      message: 'Estadísticas obtenidas correctamente',
      data: estadisticas,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message,
    });
  }
};

/**
 * Obtener historial de pedidos asignados por repartidor
 */
const obtenerHistorialPedidos = async (req, res) => {
  try {
    const {
      repartidorId,
      estadoEntrega,
      estadoOrden,
      fechaDesde,
      fechaHasta,
      page = 1,
      limit = 50,
      sortBy = 'fecha_asignacion',
      sortOrder = 'DESC',
    } = req.query;

    if (!repartidorId) {
      return res.status(400).json({
        success: false,
        message: 'repartidorId es requerido',
      });
    }

    const resultado = await repartidoresService.obtenerHistorialPedidosPorRepartidor({
      repartidorId,
      estadoEntrega,
      estadoOrden,
      fechaDesde,
      fechaHasta,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      message: 'Historial de pedidos obtenido correctamente',
      data: resultado,
    });
  } catch (error) {
    console.error('Error al obtener historial de pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de pedidos',
      error: error.message,
    });
  }
};

module.exports = {
  obtenerRepartidores,
  obtenerRepartidorPorId,
  obtenerEstadisticas,
  obtenerHistorialPedidos,
};















