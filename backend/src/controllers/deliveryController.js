const deliveryService = require('../services/deliveryService');
const mapsService = require('../services/mapsService');



/**
 * Obtener entregas del repartidor
 */
const obtenerMisEntregas = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado correctamente',
      });
    }

    const repartidorId = req.user.id;
    const { estado } = req.query;

    const entregas = await deliveryService.obtenerEntregasRepartidor(repartidorId, estado);

    res.json({
      success: true,
      message: 'Entregas obtenidas correctamente',
      data: entregas,
    });
  } catch (error) {
    console.error('Error al obtener entregas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener entregas',
      error: error.message,
    });
  }
};

/**
 * Obtener entrega por ID
 */
const obtenerEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const repartidorId = req.user.id;

    const entrega = await deliveryService.obtenerEntregaPorId(id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    // Verificar que la entrega pertenezca al repartidor
    if (entrega.repartidor_id !== repartidorId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para acceder a esta entrega',
      });
    }

    res.json({
      success: true,
      message: 'Entrega obtenida correctamente',
      data: entrega,
    });
  } catch (error) {
    console.error('Error al obtener entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener entrega',
      error: error.message,
    });
  }
};

/**
 * Iniciar entrega (marcar como en camino)
 */
const iniciarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const repartidorId = req.user.id;

    const entrega = await deliveryService.obtenerEntregaPorId(id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    if (entrega.repartidor_id !== repartidorId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta entrega',
      });
    }

    const entregaActualizada = await deliveryService.actualizarEstadoEntrega(
      id,
      deliveryService.DELIVERY_STATE_IN_TRANSIT
    );

    res.json({
      success: true,
      message: 'Entrega iniciada correctamente',
      data: entregaActualizada,
    });
  } catch (error) {
    console.error('Error al iniciar entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar entrega',
      error: error.message,
    });
  }
};

/**
 * Registrar llegada a destino
 */
const registrarLlegada = async (req, res) => {
  try {
    const { id } = req.params;
    const repartidorId = req.user.id;
    const { latitud, longitud } = req.body;

    if (!latitud || !longitud) {
      return res.status(400).json({
        success: false,
        message: 'Latitud y longitud son requeridas',
      });
    }

    const entrega = await deliveryService.obtenerEntregaPorId(id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    if (entrega.repartidor_id !== repartidorId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta entrega',
      });
    }

    const entregaActualizada = await deliveryService.registrarLlegada(id, latitud, longitud);

    res.json({
      success: true,
      message: 'Llegada registrada correctamente',
      data: entregaActualizada,
    });
  } catch (error) {
    console.error('Error al registrar llegada:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar llegada',
      error: error.message,
    });
  }
};

/**
 * Completar entrega
 */
const completarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const repartidorId = req.user.id;
    const { firma_cliente, foto_entrega, observaciones } = req.body;

    const entrega = await deliveryService.obtenerEntregaPorId(id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    if (entrega.repartidor_id !== repartidorId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta entrega',
      });
    }

    // Calcular distancia y tiempo si es posible
    let distancia_km = null;
    let tiempo_minutos = null;

    if (entrega.fecha_salida && entrega.fecha_llegada) {
      const tiempoMs = new Date(entrega.fecha_llegada) - new Date(entrega.fecha_salida);
      tiempo_minutos = Math.round(tiempoMs / 60000);

      // Calcular distancia si hay coordenadas
      if (entrega.latitud_llegada && entrega.longitud_llegada) {
        // Tracking de ubicaciones eliminado - distancia no disponible
        distancia_km = null;
      }
    }

    const entregaActualizada = await deliveryService.registrarEntregaCompletada(id, {
      firma_cliente,
      foto_entrega,
      observaciones,
      distancia_km,
      tiempo_minutos,
    });

    res.json({
      success: true,
      message: 'Entrega completada correctamente',
      data: entregaActualizada,
    });
  } catch (error) {
    console.error('Error al completar entrega:', error);
    res.status(500).json({
      success: false,
      message: 'Error al completar entrega',
      error: error.message,
    });
  }
};

/**
 * Cancelar entrega
 */
const cancelarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const repartidorId = req.user.id;
    const { motivo, motivo_detalle } = req.body;

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'El motivo de cancelación es requerido',
      });
    }

    const entrega = await deliveryService.obtenerEntregaPorId(id);

    if (!entrega) {
      return res.status(404).json({
        success: false,
        message: 'Entrega no encontrada',
      });
    }

    if (entrega.repartidor_id !== repartidorId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para cancelar esta entrega',
      });
    }

    const resultado = await deliveryService.cancelarEntregaYReasignar(
      id,
      motivo,
      motivo_detalle,
      repartidorId
    );

    res.json({
      success: true,
      message: resultado.reasignado
        ? 'Entrega cancelada y reasignada correctamente'
        : 'Entrega cancelada. El pedido quedó pendiente de reasignación',
      data: resultado,
    });
  } catch (error) {
    console.error('Error al cancelar entrega:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al cancelar entrega',
      error: error.message,
    });
  }
};

/**
 * Obtener coordenadas desde dirección
 */
const obtenerCoordenadas = async (req, res) => {
  try {
    const { direccion } = req.query;

    if (!direccion) {
      return res.status(400).json({
        success: false,
        message: 'La dirección es requerida',
      });
    }

    const coordenadas = await mapsService.obtenerCoordenadasDesdeDireccion(direccion);

    if (!coordenadas) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo obtener las coordenadas de la dirección',
      });
    }

    res.json({
      success: true,
      message: 'Coordenadas obtenidas correctamente',
      data: coordenadas,
    });
  } catch (error) {
    console.error('Error al obtener coordenadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener coordenadas',
      error: error.message,
    });
  }
};

/**
 * Calcular ruta entre dos puntos
 */
const calcularRuta = async (req, res) => {
  try {
    const { origen, destino, waypoints } = req.body;

    if (!origen || !destino) {
      return res.status(400).json({
        success: false,
        message: 'Origen y destino son requeridos',
      });
    }

    const ruta = await mapsService.calcularRuta(origen, destino, waypoints || []);

    if (!ruta) {
      return res.status(404).json({
        success: false,
        message: 'No se pudo calcular la ruta',
      });
    }

    res.json({
      success: true,
      message: 'Ruta calculada correctamente',
      data: ruta,
    });
  } catch (error) {
    console.error('Error al calcular ruta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calcular ruta',
      error: error.message,
    });
  }
};

/**
 * Obtener repartidores disponibles
 */
const obtenerRepartidoresDisponibles = async (req, res) => {
  try {
    const { orden_id } = req.query;
    
    // Log para depuración
    const repartidores = await deliveryService.obtenerRepartidoresDisponibles(orden_id || null);

    res.json({
      success: true,
      message: 'Repartidores obtenidos correctamente',
      data: repartidores || [],
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
 * Asignar pedido a repartidor
 */
const asignarPedidoARepartidor = async (req, res) => {
  try {
    const { orden_id, repartidor_id, motivo_reasignacion } = req.body;

    // Validación de parámetros requeridos
    if (!orden_id || !repartidor_id) {
      return res.status(400).json({
        success: false,
        message: 'orden_id y repartidor_id son requeridos',
        errors: {
          orden_id: orden_id ? null : 'El ID del pedido es requerido',
          repartidor_id: repartidor_id ? null : 'El ID del repartidor es requerido',
        },
      });
    }

    // Validación de formato UUID (si aplica)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orden_id)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del orden_id no es válido',
      });
    }

    if (!uuidRegex.test(repartidor_id)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del repartidor_id no es válido',
      });
    }

    const resultado = await deliveryService.asignarPedidoARepartidor(
      orden_id,
      repartidor_id,
      motivo_reasignacion || null
    );

    // Si ya estaba asignado, retornar código 200 pero con mensaje informativo
    const statusCode = resultado.ya_asignado ? 200 : 201;

    res.status(statusCode).json({
      success: true,
      message: resultado.mensaje || 'Pedido asignado al repartidor correctamente',
      data: resultado,
    });
  } catch (error) {
    console.error('Error al asignar pedido a repartidor:', error);
    
    // Determinar código de estado apropiado según el tipo de error
    let statusCode = 500;
    if (error.message.includes('no encontrado')) {
      statusCode = 404;
    } else if (error.message.includes('no puede ser asignado') || error.message.includes('estado') || error.message.includes('motivo')) {
      statusCode = 400;
    } else if (error.message.includes('no está activo') || error.message.includes('rol')) {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al asignar pedido a repartidor',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};


/**
 * Obtener todos los pedidos asignados a repartidores (vista administrativa)
 */
const obtenerTodosPedidosAsignados = async (req, res) => {
  try {
    const { estado, repartidor_id, fecha_desde, fecha_hasta, orden_estado, limit, offset } = req.query;

    const filtros = {
      estadoEntrega: estado || null,
      repartidorId: repartidor_id || null,
      fechaDesde: fecha_desde || null,
      fechaHasta: fecha_hasta || null,
      ordenEstado: orden_estado || null,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    };

    const resultado = await deliveryService.obtenerTodosPedidosAsignados(filtros);

    res.json({
      success: true,
      message: 'Pedidos asignados obtenidos correctamente',
      data: resultado,
    });
  } catch (error) {
    console.error('Error al obtener todos los pedidos asignados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos asignados',
      error: error.message,
    });
  }
};

/**
 * Marcar pedido como montado al carro
 */
const marcarPedidoMontadoAlCarro = async (req, res) => {
  try {
    const { orden_id } = req.body;

    if (!orden_id) {
      return res.status(400).json({
        success: false,
        message: 'orden_id es requerido',
      });
    }

    const resultado = await deliveryService.marcarPedidoMontadoAlCarro(orden_id);

    res.json({
      success: true,
      message: resultado.mensaje,
      data: resultado,
    });
  } catch (error) {
    console.error('Error al marcar pedido como montado al carro:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al marcar pedido como montado al carro',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Verificar y actualizar estado a en_proceso
 */
const verificarYActualizarEstadoEnProceso = async (req, res) => {
  try {
    const { orden_id } = req.body;

    if (!orden_id) {
      return res.status(400).json({
        success: false,
        message: 'orden_id es requerido',
      });
    }

    const resultado = await deliveryService.verificarYActualizarEstadoEnProceso(orden_id);

    res.json({
      success: true,
      message: resultado.actualizado 
        ? 'Estado actualizado a en_proceso correctamente'
        : 'El pedido aún no cumple todas las condiciones para estar en proceso',
      data: resultado,
    });
  } catch (error) {
    console.error('Error al verificar estado en proceso:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al verificar estado en proceso',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

module.exports = {
  obtenerMisEntregas,
  obtenerEntrega,
  iniciarEntrega,
  registrarLlegada,
  completarEntrega,
  cancelarEntrega,
  obtenerCoordenadas,
  calcularRuta,
  obtenerRepartidoresDisponibles,
  asignarPedidoARepartidor,
  obtenerTodosPedidosAsignados,
  marcarPedidoMontadoAlCarro,
  verificarYActualizarEstadoEnProceso,
};


