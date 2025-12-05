-- Migration 017: Eliminar tablas etiquetas y productos_etiquetas
-- Date: 2025-01-XX
-- Purpose: Eliminar tablas de etiquetas que no se están usando
-- Nota: Las etiquetas se almacenan como JSON en la columna productos.etiquetas

USE TiendaMovil;

-- ============================================
-- ELIMINAR TABLA productos_etiquetas (relación N:M)
-- ============================================
-- Esta tabla no se está usando en el código de producción.
-- Solo se usó en un script de migración de una sola vez.

-- Eliminar índices primero (si existen)
DROP INDEX IF EXISTS idx_producto ON productos_etiquetas;
DROP INDEX IF EXISTS idx_etiqueta ON productos_etiquetas;
DROP INDEX IF EXISTS unique_producto_etiqueta ON productos_etiquetas;

-- Eliminar foreign keys (si existen)
SET @fk_pe_producto = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'productos_etiquetas'
    AND COLUMN_NAME = 'producto_id'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

SET @fk_pe_etiqueta = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'productos_etiquetas'
    AND COLUMN_NAME = 'etiqueta_id'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

-- Eliminar la tabla
DROP TABLE IF EXISTS productos_etiquetas;

-- ============================================
-- ELIMINAR TABLA etiquetas
-- ============================================
-- Esta tabla no se está usando. El sistema almacena las etiquetas
-- directamente como JSON en la columna productos.etiquetas

-- Eliminar índices primero (si existen)
DROP INDEX IF EXISTS idx_nombre ON etiquetas;

-- Eliminar foreign keys (si existen)
SET @fk_etiquetas = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'etiquetas'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

-- Eliminar la tabla
DROP TABLE IF EXISTS etiquetas;

-- ============================================
-- RESUMEN
-- ============================================
SELECT 
    '✅ Tablas eliminadas exitosamente:' as resultado,
    '  - productos_etiquetas (tabla intermedia N:M)' as tabla1,
    '  - etiquetas (tabla de etiquetas)' as tabla2,
    '  Las etiquetas se almacenan como JSON en productos.etiquetas' as nota;

COMMIT;

