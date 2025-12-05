-- Migration 014: Eliminar tabla reportes_entregas
-- Date: 2025-01-XX
-- Purpose: Eliminar sistema de reportes guardados de entregas

USE TiendaMovil;

-- ============================================
-- ELIMINAR TABLA reportes_entregas
-- ============================================
-- Esta tabla se usaba para almacenar reportes de entregas generados,
-- pero ahora los reportes se generan bajo demanda sin almacenamiento

-- Eliminar índices primero
DROP INDEX IF EXISTS idx_tipo ON reportes_entregas;
DROP INDEX IF EXISTS idx_fecha_inicio ON reportes_entregas;
DROP INDEX IF EXISTS idx_fecha_fin ON reportes_entregas;
DROP INDEX IF EXISTS idx_repartidor ON reportes_entregas;
DROP INDEX IF EXISTS idx_ruta ON reportes_entregas;

-- Eliminar foreign keys
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'reportes_entregas'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

-- Eliminar la tabla
DROP TABLE IF EXISTS reportes_entregas;

-- ============================================
-- RESUMEN
-- ============================================
SELECT 
    '✅ Tabla eliminada exitosamente:' as resultado,
    '  - reportes_entregas' as tabla,
    '  Los reportes ahora se generan bajo demanda sin almacenamiento' as nota;

COMMIT;

