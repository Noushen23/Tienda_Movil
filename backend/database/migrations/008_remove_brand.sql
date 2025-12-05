-- Migración: Eliminar soporte de marcas
-- Fecha: 2025-10-30

USE tienda_online;

-- 1) Quitar índice en productos.marca si existe
SET @idx_exists = (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND INDEX_NAME = 'idx_marca'
);
SET @drop_idx_sql = IF(@idx_exists > 0, 'DROP INDEX idx_marca ON productos', 'SELECT 1');
PREPARE stmt FROM @drop_idx_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Quitar columna marca de productos si existe
SET @col_exists = (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos' AND COLUMN_NAME = 'marca'
);
SET @drop_col_sql = IF(@col_exists > 0, 'ALTER TABLE productos DROP COLUMN marca', 'SELECT 1');
PREPARE stmt FROM @drop_col_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Eliminar tabla marcas si existe
SET @tbl_exists = (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'marcas'
);
SET @drop_tbl_sql = IF(@tbl_exists > 0, 'DROP TABLE marcas', 'SELECT 1');
PREPARE stmt FROM @drop_tbl_sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Fin


