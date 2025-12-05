-- Migration 011: Eliminar tablas no utilizadas
-- Date: 2025-01-XX
-- Purpose: Eliminar tablas que no se están usando en el sistema

USE TiendaMovil;

-- ============================================
-- 1. ELIMINAR TABLA DE TRACKING DE REPARTIDORES
-- ============================================
-- Esta tabla se usaba para tracking GPS de repartidores, pero ya no se utiliza
-- después de eliminar el sistema de monitoreo

-- Eliminar foreign keys primero
SET @fk_exists = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'repartidor_ubicaciones'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

-- Eliminar la tabla
DROP TABLE IF EXISTS repartidor_ubicaciones;

-- ============================================
-- 2. ELIMINAR TABLAS DUPLICADAS (pedidos/pedido_items)
-- ============================================
-- El sistema principal usa 'ordenes' e 'items_orden'
-- Las tablas 'pedidos' y 'pedido_items' son duplicados antiguos
-- NOTA: Verificar que no haya datos importantes antes de eliminar

-- Verificar si hay datos en pedidos
SET @pedidos_count = (SELECT COUNT(*) FROM pedidos);
SET @pedido_items_count = (SELECT COUNT(*) FROM pedido_items);

-- Si hay datos, mostrar advertencia
SELECT 
    CONCAT('⚠️ ADVERTENCIA: Se encontraron ', @pedidos_count, ' pedidos y ', @pedido_items_count, ' items.') as advertencia,
    'Si estos datos son importantes, migra a la tabla ordenes antes de continuar.' as accion;

-- Eliminar foreign keys primero
SET @fk_pedido_items = (
    SELECT COUNT(*) 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'pedido_items'
    AND CONSTRAINT_NAME LIKE 'fk_%'
);

-- Eliminar índices
DROP INDEX IF EXISTS idx_pedido_id ON pedido_items;
DROP INDEX IF EXISTS idx_producto_id ON pedido_items;
DROP INDEX IF EXISTS idx_user_id ON pedidos;
DROP INDEX IF EXISTS idx_status ON pedidos;
DROP INDEX IF EXISTS idx_fecha_creacion ON pedidos;

-- Eliminar tablas
DROP TABLE IF EXISTS pedido_items;
DROP TABLE IF EXISTS pedidos;

-- ============================================
-- 3. VERIFICAR Y ELIMINAR TABLA DE MARCAS (si existe)
-- ============================================
-- Ya hay una migración 008_remove_brand.sql, pero por si acaso:
DROP TABLE IF EXISTS marcas;

-- ============================================
-- 4. ELIMINAR TABLA DE TOKENS DE AUTENTICACIÓN
-- ============================================
-- Esta tabla se usaba para almacenar tokens en BD, pero el sistema actual
-- usa JWT stateless (no requiere almacenamiento en BD)
-- El sistema genera tokens con jwt.sign() y los verifica con jwt.verify()

-- Eliminar índices primero
DROP INDEX IF EXISTS idx_tokens_usuario ON tokens_autenticacion;
DROP INDEX IF EXISTS idx_tokens_activo ON tokens_autenticacion;

-- Eliminar la tabla
DROP TABLE IF EXISTS tokens_autenticacion;

-- ============================================
-- RESUMEN
-- ============================================
SELECT 
    '✅ Tablas eliminadas exitosamente:' as resultado,
    '  - repartidor_ubicaciones (tracking GPS eliminado)' as tabla1,
    '  - pedidos (duplicado de ordenes)' as tabla2,
    '  - pedido_items (duplicado de items_orden)' as tabla3,
    '  - marcas (si existía)' as tabla4,
    '  - tokens_autenticacion (JWT stateless, no requiere BD)' as tabla5;

COMMIT;

