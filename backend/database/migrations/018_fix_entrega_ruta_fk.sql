-- Script para corregir la foreign key de entregas.ruta_id
-- Ejecutar este script si la migración 018 no corrige automáticamente la foreign key
-- Date: 2025-01-XX

USE TiendaMovil;

-- Eliminar la foreign key antigua si existe (puede apuntar a rutas_logisticas)
ALTER TABLE entregas DROP FOREIGN KEY IF EXISTS fk_entrega_ruta;

-- Verificar que la columna ruta_id existe
SET @col_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'entregas' 
  AND COLUMN_NAME = 'ruta_id'
);

-- Agregar columna si no existe
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE entregas ADD COLUMN ruta_id CHAR(36) NULL',
  'SELECT "Columna ruta_id ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar que el índice existe
SET @idx_exists = (
  SELECT COUNT(*) 
  FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'entregas' 
  AND INDEX_NAME = 'idx_ruta'
);

-- Agregar índice si no existe
SET @sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_ruta ON entregas(ruta_id)',
  'SELECT "Índice idx_ruta ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear la foreign key que apunta a la tabla rutas
ALTER TABLE entregas 
ADD CONSTRAINT fk_entrega_ruta 
FOREIGN KEY (ruta_id) 
REFERENCES rutas(id) 
ON DELETE SET NULL;

COMMIT;










