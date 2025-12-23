const axios = require('axios');
const config = require('../config/env');

/**
 * Servicio de integración con APIs de mapas
 * Soporta Google Maps y Mapbox
 */

const MAPS_PROVIDER = process.env.MAPS_PROVIDER || 'google'; // 'google' o 'mapbox'
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';

/**
 * Calcular distancia entre dos puntos usando fórmula de Haversine
 */
function calcularDistanciaHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Obtener direcciones desde coordenadas (Geocoding inverso)
 */
async function obtenerDireccionDesdeCoordenadas(latitud, longitud) {
  try {
    if (MAPS_PROVIDER === 'google') {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${latitud},${longitud}`,
            key: GOOGLE_MAPS_API_KEY,
            language: 'es',
          },
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }
    } else if (MAPS_PROVIDER === 'mapbox') {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitud},${latitud}.json`,
        {
          params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            language: 'es',
          },
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        return response.data.features[0].place_name;
      }
    }

    return null;
  } catch (error) {
    console.error('Error al obtener dirección desde coordenadas:', error);
    return null;
  }
}

/**
 * Obtener coordenadas desde una dirección (Geocoding)
 */
async function obtenerCoordenadasDesdeDireccion(direccion) {
  try {
    if (MAPS_PROVIDER === 'google') {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            address: direccion,
            key: GOOGLE_MAPS_API_KEY,
            language: 'es',
          },
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          latitud: location.lat,
          longitud: location.lng,
        };
      }
    } else if (MAPS_PROVIDER === 'mapbox') {
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(direccion)}.json`,
        {
          params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            language: 'es',
          },
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        const coordinates = response.data.features[0].center;
        return {
          latitud: coordinates[1],
          longitud: coordinates[0],
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error al obtener coordenadas desde dirección:', error);
    return null;
  }
}

/**
 * Calcular ruta entre dos puntos
 */
async function calcularRuta(origen, destino, waypoints = []) {
  try {
    if (MAPS_PROVIDER === 'google') {
      const waypointsParam = waypoints.length > 0
        ? `&waypoints=${waypoints.map(wp => `${wp.latitud},${wp.longitud}`).join('|')}`
        : '';

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${origen.latitud},${origen.longitud}`,
            destination: `${destino.latitud},${destino.longitud}`,
            waypoints: waypointsParam,
            key: GOOGLE_MAPS_API_KEY,
            language: 'es',
            units: 'metric',
          },
        }
      );

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];

        return {
          distancia_km: leg.distance.value / 1000, // Convertir de metros a km
          tiempo_minutos: Math.round(leg.duration.value / 60), // Convertir de segundos a minutos
          polilinea: route.overview_polyline.points,
          pasos: route.legs.map((leg) => ({
            distancia_km: leg.distance.value / 1000,
            tiempo_minutos: Math.round(leg.duration.value / 60),
            instrucciones: leg.steps.map((step) => step.html_instructions),
          })),
        };
      }
    } else if (MAPS_PROVIDER === 'mapbox') {
      const waypointsCoords = [
        [origen.longitud, origen.latitud],
        ...waypoints.map(wp => [wp.longitud, wp.latitud]),
        [destino.longitud, destino.latitud],
      ].join(';');

      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${waypointsCoords}`,
        {
          params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            geometries: 'polyline',
            overview: 'simplified',
            steps: true,
            language: 'es',
          },
        }
      );

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];

        return {
          distancia_km: route.distance / 1000, // Convertir de metros a km
          tiempo_minutos: Math.round(route.duration / 60), // Convertir de segundos a minutos
          polilinea: route.geometry,
          pasos: route.legs.flatMap((leg) =>
            leg.steps.map((step) => ({
              distancia_km: step.distance / 1000,
              tiempo_minutos: Math.round(step.duration / 60),
              instrucciones: step.maneuver.instruction,
            }))
          ),
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error al calcular ruta:', error);
    return null;
  }
}

/**
 * Optimizar ruta con múltiples paradas (TSP simplificado)
 */
async function optimizarRuta(origen, destinos) {
  try {
    if (destinos.length === 0) {
      return { ruta: [], distancia_total_km: 0, tiempo_total_minutos: 0 };
    }

    if (destinos.length === 1) {
      const ruta = await calcularRuta(origen, destinos[0]);
      return {
        ruta: [destinos[0]],
        distancia_total_km: ruta?.distancia_km || 0,
        tiempo_total_minutos: ruta?.tiempo_minutos || 0,
      };
    }

    // Algoritmo Nearest Neighbor para TSP simplificado
    const rutaOptimizada = [];
    const destinosRestantes = [...destinos];
    let puntoActual = origen;
    let distanciaTotal = 0;
    let tiempoTotal = 0;

    while (destinosRestantes.length > 0) {
      let puntoMasCercano = null;
      let distanciaMinima = Infinity;
      let indiceMasCercano = -1;

      // Encontrar el punto más cercano
      for (let i = 0; i < destinosRestantes.length; i++) {
        const distancia = calcularDistanciaHaversine(
          puntoActual.latitud,
          puntoActual.longitud,
          destinosRestantes[i].latitud,
          destinosRestantes[i].longitud
        );

        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          puntoMasCercano = destinosRestantes[i];
          indiceMasCercano = i;
        }
      }

      if (puntoMasCercano) {
        // Calcular ruta detallada
        const rutaDetalle = await calcularRuta(puntoActual, puntoMasCercano);
        if (rutaDetalle) {
          distanciaTotal += rutaDetalle.distancia_km;
          tiempoTotal += rutaDetalle.tiempo_minutos;
        } else {
          distanciaTotal += distanciaMinima;
          tiempoTotal += Math.round((distanciaMinima / 50) * 60); // Estimación: 50 km/h
        }

        rutaOptimizada.push({
          ...puntoMasCercano,
          distancia_desde_anterior_km: distanciaMinima,
          tiempo_desde_anterior_minutos: rutaDetalle?.tiempo_minutos || Math.round((distanciaMinima / 50) * 60),
        });

        puntoActual = puntoMasCercano;
        destinosRestantes.splice(indiceMasCercano, 1);
      }
    }

    return {
      ruta: rutaOptimizada,
      distancia_total_km: distanciaTotal,
      tiempo_total_minutos: tiempoTotal,
    };
  } catch (error) {
    console.error('Error al optimizar ruta:', error);
    return { ruta: destinos, distancia_total_km: 0, tiempo_total_minutos: 0 };
  }
}

/**
 * Generar ruta automática para un repartidor
 */
async function generarRutaAutomatica(repartidorId, pedidos, origen = null) {
  try {
    if (!pedidos || pedidos.length === 0) {
      return null;
    }

    // Si no se proporciona origen, usar la ubicación actual del repartidor o un punto por defecto
    if (!origen) {
      // Tracking de ubicaciones eliminado
      origen = {
        latitud: 4.6097, // Bogotá por defecto
        longitud: -74.0817,
      };
    }

    // Extraer coordenadas de los pedidos
    const destinos = pedidos.map((pedido) => ({
      orden_id: pedido.orden_id || pedido.id,
      latitud: pedido.latitud || pedido.coordenadasEntrega?.latitud,
      longitud: pedido.longitud || pedido.coordenadasEntrega?.longitud,
      direccion: pedido.direccion,
      nombre_cliente: pedido.cliente_nombre || pedido.nombreCliente,
    })).filter((d) => d.latitud && d.longitud);

    if (destinos.length === 0) {
      return null;
    }

    // Optimizar ruta
    const rutaOptimizada = await optimizarRuta(origen, destinos);

    // Calcular ruta completa con polilinea
    let polilinea = null;
    if (destinos.length > 0) {
      const waypoints = rutaOptimizada.ruta.slice(0, -1).map((p) => ({
        latitud: p.latitud,
        longitud: p.longitud,
      }));
      const destinoFinal = rutaOptimizada.ruta[rutaOptimizada.ruta.length - 1];
      const rutaCompleta = await calcularRuta(origen, destinoFinal, waypoints);
      polilinea = rutaCompleta?.polilinea || null;
    }

    return {
      repartidor_id: repartidorId,
      origen,
      destinos: rutaOptimizada.ruta,
      distancia_total_km: rutaOptimizada.distancia_total_km,
      tiempo_total_minutos: rutaOptimizada.tiempo_total_minutos,
      polilinea,
      pedidos: rutaOptimizada.ruta.map((p, index) => ({
        orden_id: p.orden_id,
        orden_secuencia: index + 1,
        distancia_desde_anterior_km: p.distancia_desde_anterior_km || 0,
        tiempo_desde_anterior_minutos: p.tiempo_desde_anterior_minutos || 0,
      })),
    };
  } catch (error) {
    console.error('Error al generar ruta automática:', error);
    throw error;
  }
}

module.exports = {
  calcularDistanciaHaversine,
  obtenerDireccionDesdeCoordenadas,
  obtenerCoordenadasDesdeDireccion,
  calcularRuta,
  optimizarRuta,
  generarRutaAutomatica,
  MAPS_PROVIDER,
};


