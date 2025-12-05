const { query } = require('../config/database');

/**
 * Obtener todos los repartidores con filtros y estadísticas
 */
const obtenerRepartidores = async (filtros = {}) => {
  try {
    const {
      search,
      activo,
      page = 1,
      limit = 25,
      sortBy = 'nombre_completo',
      sortOrder = 'ASC',
    } = filtros;

    let sql = `
      SELECT 
        u.id,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.direccion,
        u.rol,
        u.activo,
        u.email_verificado,
        u.fecha_creacion,
        u.ultimo_acceso,
        COALESCE(COUNT(DISTINCT e.id), 0) as total_entregas,
        COALESCE(COUNT(DISTINCT CASE WHEN e.estado IN ('asignada', 'en_camino', 'llegada') THEN e.id END), 0) as entregas_en_curso,
        COALESCE(COUNT(DISTINCT CASE WHEN e.estado = 'entregada' THEN e.id END), 0) as entregas_completadas,
        COALESCE(COUNT(DISTINCT CASE WHEN e.estado = 'cancelada' THEN e.id END), 0) as entregas_canceladas,
        NULL as ultima_latitud,
        NULL as ultima_longitud,
        NULL as ultima_ubicacion_fecha
      FROM usuarios u
      LEFT JOIN entregas e ON e.repartidor_id = u.id
      WHERE (
        LOWER(TRIM(u.rol)) = 'repartidor' 
        OR LOWER(TRIM(u.rol)) LIKE '%repartidor%'
        OR LOWER(TRIM(u.rol)) = 'delivery'
        OR LOWER(TRIM(u.rol)) LIKE '%delivery%'
        OR LOWER(TRIM(u.rol)) = 'conductor'
        OR LOWER(TRIM(u.rol)) LIKE '%conductor%'
      )
    `;

    const params = [];

    // Filtro de búsqueda
    if (search) {
      sql += ' AND (u.nombre_completo LIKE ? OR u.email LIKE ? OR u.telefono LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Filtro por estado activo
    if (activo !== undefined && activo !== '') {
      sql += ' AND u.activo = ?';
      params.push(activo === 'true' ? 1 : 0);
    }

    sql += ' GROUP BY u.id, u.nombre_completo, u.email, u.telefono, u.direccion, u.rol, u.activo, u.email_verificado, u.fecha_creacion, u.ultimo_acceso';

    // Ordenamiento
    const validSortFields = {
      nombre: 'u.nombre_completo',
      email: 'u.email',
      fecha_creacion: 'u.fecha_creacion',
      entregas: 'total_entregas',
      entregas_en_curso: 'entregas_en_curso',
    };

    const sortField = validSortFields[sortBy] || 'u.nombre_completo';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${sortField} ${order}`;

    // Contar total - construir consulta de conteo separada
    let countSql = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM usuarios u
      WHERE (
        LOWER(TRIM(u.rol)) = 'repartidor' 
        OR LOWER(TRIM(u.rol)) LIKE '%repartidor%'
        OR LOWER(TRIM(u.rol)) = 'delivery'
        OR LOWER(TRIM(u.rol)) LIKE '%delivery%'
        OR LOWER(TRIM(u.rol)) = 'conductor'
        OR LOWER(TRIM(u.rol)) LIKE '%conductor%'
      )
    `;
    
    // Aplicar los mismos filtros que en la consulta principal
    const countParams = [];
    if (search) {
      countSql += ' AND (u.nombre_completo LIKE ? OR u.email LIKE ? OR u.telefono LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (activo !== undefined && activo !== '') {
      countSql += ' AND u.activo = ?';
      countParams.push(activo === 'true' ? 1 : 0);
    }
    
    const [countResult] = await query(countSql, countParams);
    const total = countResult?.total || 0;

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const repartidores = await query(sql, params);

    return {
      repartidores: repartidores || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    console.error('Error al obtener repartidores:', error);
    throw error;
  }
};

/**
 * Obtener un repartidor por ID con estadísticas detalladas
 */
const obtenerRepartidorPorId = async (repartidorId) => {
  try {
    const repartidor = await query(
      `SELECT 
        u.id,
        u.nombre_completo,
        u.email,
        u.telefono,
        u.direccion,
        u.rol,
        u.activo,
        u.email_verificado,
        u.fecha_creacion,
        u.ultimo_acceso,
        u.tipo_identificacion,
        u.numero_identificacion
      FROM usuarios u
      WHERE u.id = ? 
        AND (
          LOWER(TRIM(u.rol)) = 'repartidor' 
          OR LOWER(TRIM(u.rol)) LIKE '%repartidor%'
          OR LOWER(TRIM(u.rol)) = 'delivery'
          OR LOWER(TRIM(u.rol)) LIKE '%delivery%'
          OR LOWER(TRIM(u.rol)) = 'conductor'
          OR LOWER(TRIM(u.rol)) LIKE '%conductor%'
        )`,
      [repartidorId]
    );

    if (!repartidor || repartidor.length === 0) {
      return null;
    }

    const datosRepartidor = repartidor[0];

    // Obtener estadísticas
    const estadisticas = await query(
      `SELECT 
        COUNT(*) as total_entregas,
        COUNT(CASE WHEN estado IN ('asignada', 'en_camino', 'llegada') THEN 1 END) as entregas_en_curso,
        COUNT(CASE WHEN estado = 'entregada' THEN 1 END) as entregas_completadas,
        COUNT(CASE WHEN estado = 'cancelada' THEN 1 END) as entregas_canceladas,
        COUNT(CASE WHEN estado = 'fallida' THEN 1 END) as entregas_fallidas
      FROM entregas
      WHERE repartidor_id = ?`,
      [repartidorId]
    );

    // Tracking de ubicaciones eliminado - retornar null
    return {
      ...datosRepartidor,
      estadisticas: estadisticas[0] || {
        total_entregas: 0,
        entregas_en_curso: 0,
        entregas_completadas: 0,
        entregas_canceladas: 0,
        entregas_fallidas: 0,
      },
      ultima_ubicacion: null,
    };
  } catch (error) {
    console.error('Error al obtener repartidor por ID:', error);
    throw error;
  }
};

/**
 * Obtener estadísticas generales de repartidores
 */
const obtenerEstadisticasRepartidores = async () => {
  try {
    const stats = await query(
      `SELECT 
        COUNT(DISTINCT u.id) as total_repartidores,
        COUNT(DISTINCT CASE WHEN u.activo = 1 THEN u.id END) as repartidores_activos,
        COUNT(DISTINCT CASE WHEN u.activo = 0 THEN u.id END) as repartidores_inactivos,
        COUNT(DISTINCT e.id) as total_entregas,
        COUNT(DISTINCT CASE WHEN e.estado IN ('asignada', 'en_camino', 'llegada') THEN e.id END) as entregas_en_curso,
        COUNT(DISTINCT CASE WHEN e.estado = 'entregada' THEN e.id END) as entregas_completadas,
        0 as repartidores_con_ubicacion
      FROM usuarios u
      LEFT JOIN entregas e ON e.repartidor_id = u.id
      WHERE (
        LOWER(TRIM(u.rol)) = 'repartidor' 
        OR LOWER(TRIM(u.rol)) LIKE '%repartidor%'
        OR LOWER(TRIM(u.rol)) = 'delivery'
        OR LOWER(TRIM(u.rol)) LIKE '%delivery%'
        OR LOWER(TRIM(u.rol)) = 'conductor'
        OR LOWER(TRIM(u.rol)) LIKE '%conductor%'
      )`,
      []
    );

    return stats[0] || {
      total_repartidores: 0,
      repartidores_activos: 0,
      repartidores_inactivos: 0,
      total_entregas: 0,
      entregas_en_curso: 0,
      entregas_completadas: 0,
      repartidores_con_ubicacion: 0,
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de repartidores:', error);
    throw error;
  }
};

/**
 * Obtener historial de pedidos asignados por repartidor
 */
const obtenerHistorialPedidosPorRepartidor = async (filtros = {}) => {
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
    } = filtros;

    let sql = `
      SELECT 
        e.id as entrega_id,
        e.orden_id,
        e.estado as entrega_estado,
        e.fecha_asignacion,
        e.fecha_salida,
        e.fecha_llegada,
        e.fecha_entrega,
        e.distancia_km,
        e.tiempo_minutos,
        o.id as orden_id,
        o.numero_orden,
        o.estado as orden_estado,
        o.total,
        o.subtotal,
        o.costo_envio,
        o.fecha_creacion as orden_fecha_creacion,
        o.fecha_entrega_estimada,
        o.fecha_entrega_real,
        u.id as usuario_id,
        u.nombre_completo as usuario_nombre,
        u.email as usuario_email,
        de.id as direccion_id,
        de.nombre_destinatario,
        de.telefono,
        de.direccion,
        de.ciudad,
        de.departamento,
        de.codigo_postal,
        r.id as repartidor_id,
        r.nombre_completo as repartidor_nombre,
        r.email as repartidor_email,
        r.telefono as repartidor_telefono,
        (SELECT ruta.nombre FROM ruta_pedidos rp 
         INNER JOIN rutas ruta ON ruta.id = rp.ruta_id 
         WHERE rp.orden_id = o.id 
         ORDER BY ruta.fecha_creacion DESC LIMIT 1) as ruta_nombre,
        (SELECT ruta.estado FROM ruta_pedidos rp 
         INNER JOIN rutas ruta ON ruta.id = rp.ruta_id 
         WHERE rp.orden_id = o.id 
         ORDER BY ruta.fecha_creacion DESC LIMIT 1) as ruta_estado
      FROM entregas e
      INNER JOIN ordenes o ON o.id = e.orden_id
      INNER JOIN usuarios r ON r.id = e.repartidor_id
      LEFT JOIN usuarios u ON u.id = o.usuario_id
      LEFT JOIN direcciones_envio de ON de.id = o.direccion_envio_id
      WHERE 1=1
    `;

    const params = [];

    // Filtro por repartidor (requerido)
    if (repartidorId) {
      sql += ' AND e.repartidor_id = ?';
      params.push(repartidorId);
    }

    // Filtro por estado de entrega
    if (estadoEntrega) {
      sql += ' AND e.estado = ?';
      params.push(estadoEntrega);
    }

    // Filtro por estado de orden
    if (estadoOrden) {
      sql += ' AND o.estado = ?';
      params.push(estadoOrden);
    }

    // Filtro por fecha desde
    if (fechaDesde) {
      sql += ' AND DATE(e.fecha_asignacion) >= ?';
      params.push(fechaDesde);
    }

    // Filtro por fecha hasta
    if (fechaHasta) {
      sql += ' AND DATE(e.fecha_asignacion) <= ?';
      params.push(fechaHasta);
    }

    // Ordenamiento
    const validSortFields = {
      fecha_asignacion: 'e.fecha_asignacion',
      fecha_entrega: 'e.fecha_entrega',
      numero_orden: 'o.numero_orden',
      total: 'o.total',
      estado_entrega: 'e.estado',
      estado_orden: 'o.estado',
    };

    const sortField = validSortFields[sortBy] || 'e.fecha_asignacion';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    sql += ` ORDER BY ${sortField} ${order}`;

    // Contar total
    let countSql = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM entregas e
      INNER JOIN ordenes o ON o.id = e.orden_id
      WHERE 1=1
    `;
    const countParams = [];

    if (repartidorId) {
      countSql += ' AND e.repartidor_id = ?';
      countParams.push(repartidorId);
    }
    if (estadoEntrega) {
      countSql += ' AND e.estado = ?';
      countParams.push(estadoEntrega);
    }
    if (estadoOrden) {
      countSql += ' AND o.estado = ?';
      countParams.push(estadoOrden);
    }
    if (fechaDesde) {
      countSql += ' AND DATE(e.fecha_asignacion) >= ?';
      countParams.push(fechaDesde);
    }
    if (fechaHasta) {
      countSql += ' AND DATE(e.fecha_asignacion) <= ?';
      countParams.push(fechaHasta);
    }

    const [countResult] = await query(countSql, countParams);
    const total = countResult?.total || 0;

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const pedidos = await query(sql, params);

    // Obtener estadísticas agregadas
    let statsSql = `
      SELECT 
        COUNT(*) as total_pedidos,
        COUNT(CASE WHEN e.estado = 'entregada' THEN 1 END) as entregados,
        COUNT(CASE WHEN e.estado = 'cancelada' THEN 1 END) as cancelados,
        COUNT(CASE WHEN e.estado = 'fallida' THEN 1 END) as fallidos,
        COUNT(CASE WHEN e.estado IN ('asignada', 'en_camino', 'llegada') THEN 1 END) as en_curso,
        COALESCE(SUM(CASE WHEN e.estado = 'entregada' THEN o.total END), 0) as total_entregado
      FROM entregas e
      INNER JOIN ordenes o ON o.id = e.orden_id
      WHERE 1=1
    `;
    const statsParams = [];

    if (repartidorId) {
      statsSql += ' AND e.repartidor_id = ?';
      statsParams.push(repartidorId);
    }
    if (estadoEntrega) {
      statsSql += ' AND e.estado = ?';
      statsParams.push(estadoEntrega);
    }
    if (estadoOrden) {
      statsSql += ' AND o.estado = ?';
      statsParams.push(estadoOrden);
    }
    if (fechaDesde) {
      statsSql += ' AND DATE(e.fecha_asignacion) >= ?';
      statsParams.push(fechaDesde);
    }
    if (fechaHasta) {
      statsSql += ' AND DATE(e.fecha_asignacion) <= ?';
      statsParams.push(fechaHasta);
    }

    const [statsResult] = await query(statsSql, statsParams);
    const estadisticas = statsResult || {
      total_pedidos: 0,
      entregados: 0,
      cancelados: 0,
      fallidos: 0,
      en_curso: 0,
      total_entregado: 0,
    };

    return {
      pedidos: pedidos || [],
      estadisticas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (error) {
    console.error('Error al obtener historial de pedidos por repartidor:', error);
    throw error;
  }
};

module.exports = {
  obtenerRepartidores,
  obtenerRepartidorPorId,
  obtenerEstadisticasRepartidores,
  obtenerHistorialPedidosPorRepartidor,
};






