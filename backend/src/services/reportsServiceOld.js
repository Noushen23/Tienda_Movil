const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

/**
 * Servicio de generación de reportes
 * Genera reportes de entregas y trazabilidad
 */

/**
 * Generar reporte de entregas
 */
const generarReporteEntregas = async (filtros = {}) => {
  try {
    const {
      fechaInicio,
      fechaFin,
      repartidorId = null,
      rutaId = null,
      zona = null,
      tipoReporte = 'personalizado',
    } = filtros;

    let sql = `
      SELECT 
        e.id,
        e.orden_id,
        e.repartidor_id,
        e.ruta_id,
        e.estado,
        e.fecha_asignacion,
        e.fecha_salida,
        e.fecha_llegada,
        e.fecha_entrega,
        e.distancia_km,
        e.tiempo_minutos,
        o.numero_orden,
        o.estado as orden_estado,
        o.total,
        u.nombre_completo as repartidor_nombre,
        rl.nombre as ruta_nombre,
        rl.zona,
        de.ciudad,
        de.nombre_destinatario
      FROM entregas e
      INNER JOIN ordenes o ON o.id = e.orden_id
      INNER JOIN usuarios u ON u.id = e.repartidor_id
      LEFT JOIN rutas_logisticas rl ON rl.id = e.ruta_id
      LEFT JOIN direcciones_envio de ON de.id = o.direccion_envio_id
      WHERE 1=1
    `;
    const params = [];

    if (fechaInicio) {
      sql += ` AND e.fecha_asignacion >= ?`;
      params.push(fechaInicio);
    }

    if (fechaFin) {
      sql += ` AND e.fecha_asignacion <= ?`;
      params.push(fechaFin);
    }

    if (repartidorId) {
      sql += ` AND e.repartidor_id = ?`;
      params.push(repartidorId);
    }

    if (rutaId) {
      sql += ` AND e.ruta_id = ?`;
      params.push(rutaId);
    }

    if (zona) {
      sql += ` AND rl.zona = ?`;
      params.push(zona);
    }

    sql += ` GROUP BY e.id, e.orden_id, e.repartidor_id, e.ruta_id, e.estado, 
                     e.fecha_asignacion, e.fecha_salida, e.fecha_llegada, e.fecha_entrega,
                     e.distancia_km, e.tiempo_minutos, o.numero_orden, o.estado, o.total,
                     u.nombre_completo, rl.nombre, rl.zona, de.ciudad, de.nombre_destinatario
             ORDER BY e.fecha_asignacion DESC`;

    const entregas = await query(sql, params);

    // Calcular estadísticas
    const totalEntregas = entregas.length;
    const entregasExitosas = entregas.filter((e) => e.estado === 'entregada').length;
    const entregasFallidas = entregas.filter((e) => e.estado === 'fallida').length;
    const entregasCanceladas = entregas.filter((e) => e.estado === 'cancelada').length;
    const entregasEnCurso = entregas.filter((e) => ['asignada', 'en_camino', 'llegada'].includes(e.estado)).length;

    const tiempos = entregas
      .filter((e) => e.tiempo_minutos !== null)
      .map((e) => e.tiempo_minutos);
    const tiempoPromedio = tiempos.length > 0
      ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length
      : 0;

    const distancias = entregas
      .filter((e) => e.distancia_km !== null)
      .map((e) => e.distancia_km);
    const distanciaTotal = distancias.reduce((a, b) => a + b, 0);

    // Reasignaciones eliminadas - retornar 0
    const reasignacionesTotales = 0;

    return {
      tipo_reporte: tipoReporte,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      filtros: {
        repartidor_id: repartidorId,
        ruta_id: rutaId,
        zona,
      },
      estadisticas: {
        total_entregas: totalEntregas,
        entregas_exitosas,
        entregas_fallidas,
        entregas_canceladas,
        entregas_en_curso,
        tiempo_promedio_minutos: Math.round(tiempoPromedio * 100) / 100,
        distancia_total_km: Math.round(distanciaTotal * 100) / 100,
        reasignaciones_totales: reasignacionesTotales,
      },
      entregas: entregas.map((e) => ({
        id: e.id,
        orden_id: e.orden_id,
        numero_orden: e.numero_orden,
        repartidor: {
          id: e.repartidor_id,
          nombre: e.repartidor_nombre,
        },
        ruta: e.ruta_nombre ? {
          id: e.ruta_id,
          nombre: e.ruta_nombre,
          zona: e.zona,
        } : null,
        estado: e.estado,
        fechas: {
          asignacion: e.fecha_asignacion,
          salida: e.fecha_salida,
          llegada: e.fecha_llegada,
          entrega: e.fecha_entrega,
        },
        metricas: {
          distancia_km: e.distancia_km,
          tiempo_minutos: e.tiempo_minutos,
        },
        cliente: {
          nombre: e.nombre_destinatario,
          ciudad: e.ciudad,
        },
        orden: {
          estado: e.orden_estado,
          total: e.total,
        },
      })),
    };
  } catch (error) {
    console.error('Error al generar reporte de entregas:', error);
    throw error;
  }
};

/**
 * Generar reporte de trazabilidad
 */
const generarReporteTrazabilidad = async (ordenId) => {
  try {
    // Obtener información de la orden
    const orden = await query(
      `SELECT 
        o.*,
        u.email as usuario_email,
        u.nombre_completo as usuario_nombre,
        de.*
      FROM ordenes o
      INNER JOIN usuarios u ON u.id = o.usuario_id
      LEFT JOIN direcciones_envio de ON de.id = o.direccion_envio_id
      WHERE o.id = ?`,
      [ordenId]
    );

    if (!orden || orden.length === 0) {
      return null;
    }

    const datosOrden = orden[0];

    // Obtener información logística
    const logistica = await query(
      `SELECT * FROM ordenes_logistica WHERE orden_id = ?`,
      [ordenId]
    );

    // Obtener entregas
    const entregas = await query(
      `SELECT 
        e.*,
        u.nombre_completo as repartidor_nombre,
        rl.nombre as ruta_nombre
      FROM entregas e
      INNER JOIN usuarios u ON u.id = e.repartidor_id
      LEFT JOIN rutas_logisticas rl ON rl.id = e.ruta_id
      WHERE e.orden_id = ?
      ORDER BY e.fecha_asignacion ASC`,
      [ordenId]
    );

    // Reasignaciones eliminadas - retornar array vacío
    const reasignaciones = [];

    // Tracking de ubicaciones eliminado - retornar array vacío
    const ubicaciones = [];

    return {
      orden: {
        id: datosOrden.id,
        numero_orden: datosOrden.numero_orden,
        estado: datosOrden.estado,
        fecha_creacion: datosOrden.fecha_creacion,
        fecha_entrega_estimada: datosOrden.fecha_entrega_estimada,
        fecha_entrega_real: datosOrden.fecha_entrega_real,
        cliente: {
          nombre: datosOrden.usuario_nombre,
          email: datosOrden.usuario_email,
        },
        direccion: datosOrden.direccion ? {
          direccion: datosOrden.direccion,
          ciudad: datosOrden.ciudad,
          departamento: datosOrden.departamento,
          nombre_destinatario: datosOrden.nombre_destinatario,
          telefono: datosOrden.telefono,
        } : null,
      },
      logistica: logistica && logistica.length > 0 ? {
        estado_logistico: logistica[0].estado_logistico,
        ruta_id: logistica[0].ruta_id,
        ruta_asignada_por: logistica[0].ruta_asignada_por_nombre,
        fecha_ruta_asignada: logistica[0].fecha_ruta_asignada,
        confirmado_por: logistica[0].confirmado_por_nombre,
        fecha_confirmacion: logistica[0].fecha_confirmacion,
        coordenadas: logistica[0].latitud && logistica[0].longitud ? {
          latitud: logistica[0].latitud,
          longitud: logistica[0].longitud,
        } : null,
      } : null,
      entregas: entregas.map((e) => ({
        id: e.id,
        estado: e.estado,
        repartidor: {
          id: e.repartidor_id,
          nombre: e.repartidor_nombre,
        },
        ruta: e.ruta_nombre ? {
          id: e.ruta_id,
          nombre: e.ruta_nombre,
        } : null,
        fechas: {
          asignacion: e.fecha_asignacion,
          salida: e.fecha_salida,
          llegada: e.fecha_llegada,
          entrega: e.fecha_entrega,
          cancelacion: e.fecha_cancelacion,
        },
        metricas: {
          distancia_km: e.distancia_km,
          tiempo_minutos: e.tiempo_minutos,
        },
        ubicacion_llegada: e.latitud_llegada && e.longitud_llegada ? {
          latitud: e.latitud_llegada,
          longitud: e.longitud_llegada,
        } : null,
      })),
      reasignaciones: reasignaciones.map((r) => ({
        id: r.id,
        motivo: r.motivo,
        motivo_detalle: r.motivo_detalle,
        repartidor_anterior: {
          id: r.repartidor_anterior_id,
          nombre: r.repartidor_anterior_nombre,
        },
        repartidor_nuevo: {
          id: r.repartidor_nuevo_id,
          nombre: r.repartidor_nuevo_nombre,
        },
        reasignado_por: r.reasignado_por_nombre,
        fecha_reasignacion: r.fecha_reasignacion,
      })),
      ubicaciones: ubicaciones.map((u) => ({
        latitud: u.latitud,
        longitud: u.longitud,
        fecha: u.fecha_creacion,
        velocidad: u.velocidad_kmh,
      })),
    };
  } catch (error) {
    console.error('Error al generar reporte de trazabilidad:', error);
    throw error;
  }
};

module.exports = {
  generarReporteEntregas,
  generarReporteTrazabilidad,
};


