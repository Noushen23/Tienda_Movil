/**
 * Servidor Principal de la API TNS
 * Plataforma Web de Pedidos de Venta
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config/app.config');

// Importar rutas

const pedidosRoutes = require('./routes/pedidos');
const pedidosLineasRoutes = require('./routes/pedidos-lineas');
const pedidosUpdateRoutes = require('./routes/pedidos-update');
const pedidosCierreRoutes = require('./routes/pedidos-cierre');
const pedidosDeleteRoutes = require('./routes/pedidos-delete');

// Rutas de migración de órdenes
const orderMigrationRoutes = require('./routes/orderMigration');

const app = express();

// Middleware de seguridad
app.use(helmet(config.security.helmet));

// Configuración de CORS
app.use(cors(config.security.cors));

// Rate limiting
const limiter = rateLimit(config.security.rateLimit);
app.use('/api/', limiter);

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Ruta de salud
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: config.app.name,
        version: config.app.version
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: `Bienvenido a ${config.app.name}`,
        version: config.app.version,
        description: config.app.description,
        endpoints: {
            pedidos: '/api/pedidos',
            pedidosLineas: '/api/pedidos-lineas',
            pedidosCierre: '/api/pedidos-cierre',
            pedidosDelete: '/api/pedidos-delete',
            orderMigration: '/api/orders'
        }
    });
});

// Servir UI estática
app.use('/ui', express.static('public'));

// Rutas de la API
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/pedidos-lineas', pedidosLineasRoutes);
app.use('/api/pedidos-update', pedidosUpdateRoutes);
app.use('/api/pedidos-cierre', pedidosCierreRoutes);
app.use('/api/pedidos-delete', pedidosDeleteRoutes);

// Rutas de migración de órdenes
app.use('/api/orders', orderMigrationRoutes);

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Error interno del servidor',
            status: err.status || 500,
            timestamp: new Date().toISOString()
        }
    });
});

// Ruta 404 para endpoints no encontrados
app.use('*', (req, res) => {
    res.status(404).json({
        error: {
            message: 'Endpoint no encontrado',
            path: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString()
        }
    });
});

// Iniciar servidor
const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
    console.log('🚀 API TNS iniciada exitosamente!');
    console.log(`📡 Servidor ejecutándose en: http://${HOST}:${PORT}`);
    console.log(`🔗 Documentación: http://${HOST}:${PORT}`);
    console.log(`💚 Estado: http://${HOST}:${PORT}/health`);
    console.log(`📊 Entorno: ${config.server.environment}`);
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
});

module.exports = app;
