-- Migration 015: Eliminar tabla reasignaciones
-- Date: 2025-01-XX
-- Purpose: Eliminar sistema de registro de reasignaciones de entregas

USE TiendaMovil;

-- ============================================
-- ELIMINAR TABLA reasignaciones
-- ============================================
-- Esta tabla se usaba para registrar el historial de reasignaciones de entregas,
-- pero ahora esta funcionalidad ha sido eliminada

-- Eliminar índices primero
DROP INDEX IF EXISTS idx_orden ON reasignaciones;
DROP INDEX IF EXISTS idx_repartidor_anterior ON reasignaciones;
DROP INDEX IF EXISTS idx_repartidor_nuevo ON reasignaciones;
DROP INDEX IF EXISTS idx_fecha ON reasignaciones;

-- Eliminar foreign keys
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'reasignaciones'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

-- Eliminar la tabla
DROP TABLE IF EXISTS reasignaciones;

-- ============================================
-- RESUMEN
-- ============================================
SELECT 
    '✅ Tabla eliminada exitosamente:' as resultado,
    '  - reasignaciones' as tabla,
    '  El sistema de reasignaciones ha sido eliminado' as nota;

COMMIT;

