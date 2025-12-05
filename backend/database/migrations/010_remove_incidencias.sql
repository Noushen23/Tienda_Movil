-- Migration 010: Eliminar sistema de incidencias
-- Date: 2025-01-XX
-- Purpose: Eliminar tabla de incidencias y columna relacionada en reportes

USE TiendaMovil;

-- Eliminar foreign keys que referencian incidencias_entrega (si existen)
-- Primero verificamos y eliminamos las constraints
SET @constraint_exists = (
    SELECT COUNT(*) 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'incidencias_entrega'
);

-- Eliminar tabla de incidencias si existe
DROP TABLE IF EXISTS incidencias_entrega;

-- Eliminar columna incidencias_totales de reportes_entregas si existe
SET @column_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'reportes_entregas' 
    AND COLUMN_NAME = 'incidencias_totales'
);

SET @sql = IF(@column_exists > 0,
    'ALTER TABLE reportes_entregas DROP COLUMN incidencias_totales',
    'SELECT "Columna incidencias_totales no existe, omitiendo..." AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar ENUM de motivo en reasignaciones para eliminar 'incidencia' si existe
-- Nota: MySQL no permite eliminar valores de ENUM directamente, 
-- necesitamos recrear la columna sin 'incidencia'
SET @enum_has_incidencia = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = 'TiendaMovil' 
    AND TABLE_NAME = 'reasignaciones' 
    AND COLUMN_NAME = 'motivo'
    AND COLUMN_TYPE LIKE '%incidencia%'
);

-- Si el ENUM tiene 'incidencia', actualizamos los registros que lo usan a 'otro'
UPDATE reasignaciones 
SET motivo = 'otro' 
WHERE motivo = 'incidencia';

-- Recrear la columna motivo sin 'incidencia' en el ENUM
-- Primero eliminamos la foreign key si existe (puede depender de la columna)
ALTER TABLE reasignaciones 
MODIFY COLUMN motivo ENUM(
    'cancelacion_repartidor', 
    'reasignacion_manual', 
    'repartidor_no_disponible', 
    'optimizacion_ruta', 
    'otro'
) NOT NULL;

COMMIT;

