-- Migration 013: Eliminar tabla rutas_automaticas y referencias relacionadas
-- Date: 2025-01-XX
-- Purpose: Eliminar sistema de rutas automáticas completamente

USE TiendaMovil;

-- ============================================
-- 1. ELIMINAR COLUMNA ruta_automatica_id DE ordenes_logistica
-- ============================================
-- Primero eliminar foreign key si existe
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'ordenes_logistica'
    AND COLUMN_NAME = 'ruta_automatica_id'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

-- Eliminar índice si existe
DROP INDEX IF EXISTS idx_ruta_automatica ON ordenes_logistica;

-- Eliminar la columna
SET @column_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'ordenes_logistica' 
    AND COLUMN_NAME = 'ruta_automatica_id'
);

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE ordenes_logistica DROP COLUMN ruta_automatica_id',
    'SELECT "Columna ruta_automatica_id no existe, omitiendo..." AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. ELIMINAR COLUMNA ruta_id DE entregas (si hace referencia a rutas_automaticas)
-- ============================================
-- Nota: Esta columna puede referirse a rutas_logisticas, no a rutas_automaticas
-- Solo la eliminamos si existe y no hay otras referencias
-- Por ahora, la dejamos intacta

-- ============================================
-- 3. ELIMINAR TABLA rutas_automaticas
-- ============================================
-- Eliminar índices primero
DROP INDEX IF EXISTS idx_repartidor ON rutas_automaticas;
DROP INDEX IF EXISTS idx_estado ON rutas_automaticas;
DROP INDEX IF EXISTS idx_fecha_creacion ON rutas_automaticas;

-- Eliminar foreign keys
SET @fk_rutas_automaticas = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'rutas_automaticas'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

-- Eliminar la tabla
DROP TABLE IF EXISTS rutas_automaticas;

-- ============================================
-- RESUMEN
-- ============================================
SELECT 
    '✅ Sistema de rutas automáticas eliminado exitosamente:' as resultado,
    '  - Columna ruta_automatica_id eliminada de ordenes_logistica' as paso1,
    '  - Tabla rutas_automaticas eliminada' as paso2,
    '  - Todas las referencias en código eliminadas' as paso3;

COMMIT;

