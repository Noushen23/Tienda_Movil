-- Migration 016: Eliminar tabla historial_busquedas
-- Date: 2025-01-XX
-- Purpose: Eliminar sistema de historial de búsquedas

USE TiendaMovil;

-- ============================================
-- ELIMINAR TABLA historial_busquedas
-- ============================================
-- Esta tabla se usaba para almacenar el historial de búsquedas de usuarios,
-- pero esta funcionalidad ha sido eliminada

-- Eliminar índices primero
DROP INDEX IF EXISTS idx_usuario_fecha ON historial_busquedas;
DROP INDEX IF EXISTS idx_termino ON historial_busquedas;
DROP INDEX IF EXISTS idx_fecha ON historial_busquedas;

-- Eliminar foreign keys
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'historial_busquedas'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

-- Eliminar la tabla
DROP TABLE IF EXISTS historial_busquedas;

-- ============================================
-- RESUMEN
-- ============================================
SELECT 
    '✅ Tabla eliminada exitosamente:' as resultado,
    '  - historial_busquedas' as tabla,
    '  El sistema de historial de búsquedas ha sido eliminado' as nota;

COMMIT;

