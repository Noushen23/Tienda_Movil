const reportsService = require('../services/reportsService');

/**
 * Generar reporte de entregas
 */
const generarReporteEntregas = async (req, res) => {
  try {
    const {
      fechaInicio,
      fechaFin,
      repartidorId,
      rutaId,
      zona,
      tipoReporte = 'personalizado',
    } = req.query;

    const filtros = {
      fechaInicio: fechaInicio || null,
      fechaFin: fechaFin || null,
      repartidorId: repartidorId || null,
      rutaId: rutaId || null,
      zona: zona || null,
      tipoReporte,
    };

    const reporte = await reportsService.generarReporteEntregas(filtros);

    res.json({
      success: true,
      message: 'Reporte generado correctamente',
      data: reporte,
    });
  } catch (error) {
    console.error('Error al generar reporte de entregas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte de entregas',
      error: error.message,
    });
  }
};

/**
 * Generar reporte de trazabilidad
 */
const generarReporteTrazabilidad = async (req, res) => {
  try {
    const { ordenId } = req.params;

    const reporte = await reportsService.generarReporteTrazabilidad(ordenId);

    if (!reporte) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Reporte de trazabilidad generado correctamente',
      data: reporte,
    });
  } catch (error) {
    console.error('Error al generar reporte de trazabilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte de trazabilidad',
      error: error.message,
    });
  }
};


module.exports = {
  generarReporteEntregas,
  generarReporteTrazabilidad,
};


