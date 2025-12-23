-- Migration 012: Eliminar tabla rutas_automaticas_pedidos
-- Date: 2025-01-XX
-- Purpose: Eliminar tabla que relacionaba pedidos con rutas automáticas
--          La información ahora se almacena en ordenes_logistica.ruta_automatica_id

USE TiendaMovil;

-- ============================================
-- ELIMINAR TABLA rutas_automaticas_pedidos
-- ============================================
-- Esta tabla se usaba para almacenar la relación entre rutas automáticas y pedidos,
-- pero ahora esta información se almacena en ordenes_logistica.ruta_automatica_id

-- Eliminar índices primero
DROP INDEX IF EXISTS idx_ruta ON rutas_automaticas_pedidos;
DROP INDEX IF EXISTS idx_orden ON rutas_automaticas_pedidos;
DROP INDEX IF EXISTS idx_secuencia ON rutas_automaticas_pedidos;

-- Eliminar foreign keys
-- MySQL no permite DROP FOREIGN KEY directamente, así que usamos ALTER TABLE
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'rutas_automaticas_pedidos'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

-- Eliminar la tabla
DROP TABLE IF EXISTS rutas_automaticas_pedidos;

-- ============================================
-- RESUMEN
-- ============================================
SELECT 
    '✅ Tabla eliminada exitosamente:' as resultado,
    '  - rutas_automaticas_pedidos' as tabla,
    '  La información de pedidos en rutas ahora se gestiona desde ordenes_logistica.ruta_automatica_id' as nota;

COMMIT;

