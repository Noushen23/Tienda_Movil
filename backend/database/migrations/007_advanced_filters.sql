-- Migración: Filtros Avanzados y Ordenamiento
-- Fecha: 2025-01-08
-- Descripción: Agrega soporte para filtros avanzados, ordenamiento y búsquedas

USE tienda_online;

-- 1. Agregar campos de marca y estadísticas a productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS marca VARCHAR(100) NULL AFTER categoria_id,
ADD COLUMN IF NOT EXISTS ventas_totales INT DEFAULT 0 COMMENT 'Total de unidades vendidas',
ADD COLUMN IF NOT EXISTS calificacion_promedio DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Promedio de calificaciones',
ADD COLUMN IF NOT EXISTS total_resenas INT DEFAULT 0 COMMENT 'Total de reseñas',
ADD INDEX IF NOT EXISTS idx_marca (marca),
ADD INDEX IF NOT EXISTS idx_ventas_totales (ventas_totales),
ADD INDEX IF NOT EXISTS idx_calificacion (calificacion_promedio),
ADD INDEX IF NOT EXISTS idx_precio (precio),
ADD INDEX IF NOT EXISTS idx_fecha_creacion (fecha_creacion);

-- 2. Tabla de historial de búsquedas
CREATE TABLE IF NOT EXISTS historial_busquedas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    usuario_id CHAR(36) NOT NULL,
    termino_busqueda VARCHAR(255) NOT NULL,
    filtros_aplicados JSON NULL COMMENT 'Filtros que se usaron (categoría, precio, etc.)',
    resultados_encontrados INT DEFAULT 0,
    fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario_fecha (usuario_id, fecha_busqueda),
    INDEX idx_termino (termino_busqueda),
    INDEX idx_fecha (fecha_busqueda)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de marcas (opcional, para autocompletar)
CREATE TABLE IF NOT EXISTS marcas (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT NULL,
    logo_url VARCHAR(500) NULL,
    activa BOOLEAN DEFAULT TRUE,
    total_productos INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre),
    INDEX idx_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Trigger para actualizar estadísticas de productos cuando se crea un pedido
DELIMITER //

CREATE TRIGGER IF NOT EXISTS trg_actualizar_ventas_producto
AFTER INSERT ON pedido_items
FOR EACH ROW
BEGIN
    UPDATE productos
    SET ventas_totales = ventas_totales + NEW.cantidad
    WHERE id = NEW.producto_id;
END//

DELIMITER ;

-- 5. Trigger para actualizar calificación promedio cuando se agrega una reseña
DELIMITER //

CREATE TRIGGER IF NOT EXISTS trg_actualizar_calificacion_insert
AFTER INSERT ON resenas
FOR EACH ROW
BEGIN
    UPDATE productos p
    SET 
        calificacion_promedio = (
            SELECT AVG(calificacion) 
            FROM resenas 
            WHERE producto_id = NEW.producto_id AND aprobada = TRUE
        ),
        total_resenas = (
            SELECT COUNT(*) 
            FROM resenas 
            WHERE producto_id = NEW.producto_id AND aprobada = TRUE
        )
    WHERE p.id = NEW.producto_id;
END//

CREATE TRIGGER IF NOT EXISTS trg_actualizar_calificacion_update
AFTER UPDATE ON resenas
FOR EACH ROW
BEGIN
    UPDATE productos p
    SET 
        calificacion_promedio = (
            SELECT AVG(calificacion) 
            FROM resenas 
            WHERE producto_id = NEW.producto_id AND aprobada = TRUE
        ),
        total_resenas = (
            SELECT COUNT(*) 
            FROM resenas 
            WHERE producto_id = NEW.producto_id AND aprobada = TRUE
        )
    WHERE p.id = NEW.producto_id;
END//

CREATE TRIGGER IF NOT EXISTS trg_actualizar_calificacion_delete
AFTER DELETE ON resenas
FOR EACH ROW
BEGIN
    UPDATE productos p
    SET 
        calificacion_promedio = (
            SELECT COALESCE(AVG(calificacion), 0) 
            FROM resenas 
            WHERE producto_id = OLD.producto_id AND aprobada = TRUE
        ),
        total_resenas = (
            SELECT COUNT(*) 
            FROM resenas 
            WHERE producto_id = OLD.producto_id AND aprobada = TRUE
        )
    WHERE p.id = OLD.producto_id;
END//

DELIMITER ;

-- 6. Actualizar estadísticas existentes (una vez)
UPDATE productos p
SET 
    ventas_totales = COALESCE((
        SELECT SUM(pi.cantidad)
        FROM pedido_items pi
        INNER JOIN pedidos ped ON pi.pedido_id = ped.id
        WHERE pi.producto_id = p.id
          AND ped.estado IN ('confirmada', 'en_proceso', 'enviada', 'entregada')
    ), 0),
    calificacion_promedio = COALESCE((
        SELECT AVG(r.calificacion)
        FROM resenas r
        WHERE r.producto_id = p.id AND r.aprobada = TRUE
    ), 0),
    total_resenas = COALESCE((
        SELECT COUNT(*)
        FROM resenas r
        WHERE r.producto_id = p.id AND r.aprobada = TRUE
    ), 0);

-- 7. Insertar algunas marcas de ejemplo (opcional)
INSERT IGNORE INTO marcas (id, nombre, descripcion, activa) VALUES
(UUID(), 'Generico', 'Productos sin marca específica', TRUE),
(UUID(), 'Premium', 'Productos de alta calidad', TRUE),
(UUID(), 'Económico', 'Productos de bajo costo', TRUE);

-- 8. Vista optimizada para búsqueda de productos
CREATE OR REPLACE VIEW v_productos_busqueda AS
SELECT 
    p.id,
    p.nombre,
    p.slug,
    p.descripcion,
    p.precio,
    p.precio_oferta,
    p.en_oferta,
    p.categoria_id,
    c.nombre as categoria_nombre,
    p.marca,
    p.stock,
    p.activo,
    p.destacado,
    p.ventas_totales,
    p.calificacion_promedio,
    p.total_resenas,
    p.fecha_creacion,
    (SELECT ip.url FROM imagenes_producto ip WHERE ip.producto_id = p.id ORDER BY ip.orden LIMIT 1) as imagen_principal,
    p.etiquetas
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.activo = TRUE;

-- Comentarios para documentación
ALTER TABLE historial_busquedas COMMENT = 'Registro de búsquedas de usuarios para análisis y sugerencias';
ALTER TABLE marcas COMMENT = 'Catálogo de marcas de productos';

SELECT '✅ Migración 007: Filtros avanzados y ordenamiento creado exitosamente' as status;

